import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { spawn } from "child_process";
import { DataEncryptor } from "./DataEncryptor";
import { ErrorLevel, TyranoLogger } from "../../TyranoLogger";

export interface ExportExeOptions {
  /** index.html があるプロジェクトルート */
  projectRoot: string;
  /** 拡張機能のパス（electron-template の所在） */
  extensionPath: string;
  /** 製品名（ウィンドウタイトル・成果物名）。省略時はプロジェクトフォルダ名。 */
  productName?: string;
  /** electron-builder の win.target。"nsis" | "portable" 等。 */
  winTarget?: string;
  /** 暗号化を除外するトップレベルフォルダ名。省略時は ["video"]。 */
  excludeDirs?: string[];
}

export interface PrepareResult {
  buildDir: string;
  key: Buffer;
  encryptedCount: number;
}

/**
 * TyranoScript プロジェクトを「暗号化済み data + Electron ラッパー」の形に整え、
 * electron-builder で Windows 用 exe を書き出すパッケージャ。
 *
 * - prepareBuildDir(): ネットワーク不要。コピー・暗号化・テンプレート生成まで。
 * - build():           npm install + electron-builder（ネットワーク必須）。
 *
 * テスト容易性のため両者を分離している。
 */
export class ExportExePackager {
  private static readonly TEMPLATE_DIR = "electron-template";
  private static readonly DEFAULT_EXCLUDE_DIRS = ["video"];
  // コピー時に除外するフォルダ／ファイル
  private static readonly COPY_IGNORE_DIRS = new Set([
    ".git",
    "node_modules",
    "dist",
    ".vscode-test",
  ]);
  private static readonly COPY_IGNORE_EXTS = new Set([".sav"]);
  private static readonly COPY_IGNORE_NAMES = new Set([".DS_Store"]);

  private outputChannel: vscode.OutputChannel | undefined;

  /**
   * プロジェクトをビルド用一時ディレクトリへコピーし、data/ を暗号化し、
   * Electron ラッパー（main.js / preload.js / package.json）を生成する。
   * ネットワークアクセスは行わない。
   */
  public async prepareBuildDir(
    options: ExportExeOptions,
  ): Promise<PrepareResult> {
    const productName =
      options.productName || path.basename(options.projectRoot) || "TyranoGame";
    const winTarget = options.winTarget || "nsis";
    const excludeDirs =
      options.excludeDirs || ExportExePackager.DEFAULT_EXCLUDE_DIRS;

    const buildDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "tyrano-export-"),
    );
    TyranoLogger.print(`exe書き出し: ビルドディレクトリ ${buildDir}`);

    // 1. プロジェクトをコピー（.git / node_modules / dist / *.sav 等を除外）
    this.copyProject(options.projectRoot, buildDir);

    // 2. data/ を in-place 暗号化
    const key = DataEncryptor.generateKey();
    const dataDir = path.join(buildDir, "data");
    const encryptedCount = DataEncryptor.encryptDirectory(
      dataDir,
      key,
      excludeDirs,
    );
    TyranoLogger.print(`exe書き出し: ${encryptedCount} 件のファイルを暗号化`);

    // 3. Electron ラッパーをテンプレートから生成
    this.generateWrapperFiles(buildDir, options.extensionPath, {
      key,
      productName,
      winTarget,
      excludeDirs,
    });

    return { buildDir, key, encryptedCount };
  }

  /**
   * buildDir で npm install と electron-builder を実行し、生成された exe のパスを返す。
   * 失敗時やキャンセル時は undefined を返す。
   */
  public async build(
    buildDir: string,
    progress?: vscode.Progress<{ message?: string }>,
    token?: vscode.CancellationToken,
  ): Promise<string | undefined> {
    const channel = this.getOutputChannel();
    channel.show(true);

    progress?.report({ message: "依存パッケージを取得中...（初回は時間がかかります）" });
    const installOk = await this.runCommand(
      "npm",
      ["install"],
      buildDir,
      token,
    );
    if (!installOk || token?.isCancellationRequested) {
      return undefined;
    }

    progress?.report({ message: "exeをビルド中..." });
    const buildOk = await this.runCommand(
      "npx",
      ["electron-builder", "--win"],
      buildDir,
      token,
    );
    if (!buildOk || token?.isCancellationRequested) {
      return undefined;
    }

    return this.findOutputExe(path.join(buildDir, "dist"));
  }

  /**
   * npm / node が利用可能か事前確認する。
   */
  public async checkPrerequisites(): Promise<boolean> {
    return this.runCommand("npm", ["--version"], process.cwd());
  }

  // ---- 内部実装 ----

  private copyProject(src: string, dest: string): void {
    fs.cpSync(src, dest, {
      recursive: true,
      filter: (from: string) => {
        const base = path.basename(from);
        if (ExportExePackager.COPY_IGNORE_DIRS.has(base)) {
          return false;
        }
        if (ExportExePackager.COPY_IGNORE_NAMES.has(base)) {
          return false;
        }
        if (ExportExePackager.COPY_IGNORE_EXTS.has(path.extname(base))) {
          return false;
        }
        return true;
      },
    });
  }

  private generateWrapperFiles(
    buildDir: string,
    extensionPath: string,
    params: {
      key: Buffer;
      productName: string;
      winTarget: string;
      excludeDirs: string[];
    },
  ): void {
    const appName = this.sanitizeAppName(params.productName);
    const appId = `com.tyranoscript.${appName}`;

    const mainJs = this.fillTemplate(extensionPath, "main.js.template", {
      __AES_KEY_HEX__: params.key.toString("hex"),
      __PRODUCT_NAME__: params.productName,
      __ENCRYPT_EXCLUDE__: JSON.stringify(params.excludeDirs),
    });
    fs.writeFileSync(path.join(buildDir, "main.js"), mainJs);

    const preloadJs = this.fillTemplate(
      extensionPath,
      "preload.js.template",
      {},
    );
    fs.writeFileSync(path.join(buildDir, "preload.js"), preloadJs);

    const packageJson = this.fillTemplate(
      extensionPath,
      "package.json.template",
      {
        __APP_NAME__: appName,
        __PRODUCT_NAME__: params.productName,
        __APP_ID__: appId,
        __WIN_TARGET__: params.winTarget,
      },
    );
    fs.writeFileSync(path.join(buildDir, "package.json"), packageJson);
  }

  private fillTemplate(
    extensionPath: string,
    templateName: string,
    replacements: Record<string, string>,
  ): string {
    const templatePath = path.join(
      extensionPath,
      ExportExePackager.TEMPLATE_DIR,
      templateName,
    );
    let content = fs.readFileSync(templatePath, "utf8");
    for (const [placeholder, value] of Object.entries(replacements)) {
      // 正規表現の特殊文字を避けるため split/join で置換
      content = content.split(placeholder).join(value);
    }
    return content;
  }

  /** package.json の name に使える文字列へ正規化（小文字英数とハイフン） */
  private sanitizeAppName(productName: string): string {
    const sanitized = productName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return sanitized || "tyrano-game";
  }

  private findOutputExe(distDir: string): string | undefined {
    if (!fs.existsSync(distDir)) {
      return undefined;
    }
    const exe = fs
      .readdirSync(distDir)
      .find((name) => path.extname(name).toLowerCase() === ".exe");
    return exe ? path.join(distDir, exe) : undefined;
  }

  private getOutputChannel(): vscode.OutputChannel {
    if (!this.outputChannel) {
      this.outputChannel = vscode.window.createOutputChannel(
        "TyranoScript exe書き出し",
      );
    }
    return this.outputChannel;
  }

  /**
   * コマンドを実行し、終了コード 0 なら true を返す。
   * 出力は OutputChannel にストリームする。キャンセル時は子プロセスを kill。
   */
  private runCommand(
    command: string,
    args: string[],
    cwd: string,
    token?: vscode.CancellationToken,
  ): Promise<boolean> {
    const channel = this.getOutputChannel();
    channel.appendLine(`\n$ ${command} ${args.join(" ")}  (cwd: ${cwd})`);

    return new Promise<boolean>((resolve) => {
      // Windows では npm / npx は .cmd のため shell 経由で起動する。
      const child = spawn(command, args, {
        cwd,
        shell: true,
        windowsHide: true,
      });

      const cancelSub = token?.onCancellationRequested(() => {
        channel.appendLine("[キャンセルされました]");
        child.kill();
        resolve(false);
      });

      child.stdout.on("data", (data) => channel.append(data.toString()));
      child.stderr.on("data", (data) => channel.append(data.toString()));
      child.on("error", (err) => {
        TyranoLogger.print(
          `exe書き出し: コマンド実行エラー ${err}`,
          ErrorLevel.ERROR,
        );
        channel.appendLine(`[エラー] ${err}`);
        cancelSub?.dispose();
        resolve(false);
      });
      child.on("close", (code) => {
        cancelSub?.dispose();
        channel.appendLine(`[終了コード ${code}]`);
        resolve(code === 0);
      });
    });
  }
}
