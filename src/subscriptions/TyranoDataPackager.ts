import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

import { InformationWorkSpace } from "../InformationWorkSpace";
import { InformationExtension } from "../InformationExtension";
import { TyranoLogger } from "../TyranoLogger";

/**
 * data フォルダを AES 暗号化して配布用ビルドを作る「パッケージング機能」。
 *
 * - 選択された TyranoScript プロジェクトを出力フォルダにコピーし、コピー側の
 *   data/ を AES-256-CBC で暗号化する。
 * - ゲームバンドル(tyrano/ + index.html)に実行時復号スクリプト(decryptor.js)を
 *   自動注入する。復号は TyranoErectron(Electron) のレンダラーで行われる。
 *
 * 重要: 復号鍵はビルドに同梱されるため、これは「カジュアルな抽出を防ぐ難読化」であり
 * 解析を完全に防ぐ DRM ではない。
 *
 * 暗号化ファイルフォーマット (1ファイル = 1 Buffer):
 *   [ magic 4B = "TYEN" ][ version 1B ][ iv 16B ][ ciphertext ... ]
 * salt はパッケージング単位で1個生成し、鍵は scrypt で導出する。
 */
export class TyranoDataPackager {
  private static readonly MAGIC = Buffer.from("TYEN");
  private static readonly VERSION = 1;
  private static readonly ALGORITHM = "aes-256-cbc";
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly HEADER_LENGTH = 5 + 16; // magic(4) + version(1) + iv(16)
  private static readonly MANIFEST_NAME = ".tyrano_package.json";
  private static readonly TOKEN = "__INJECTED_KEY_HEX__";
  private static readonly SENTINEL = "TYRANO_DECRYPTOR";

  /**
   * data フォルダを暗号化してビルドフォルダを生成する。
   */
  public static async packageData(): Promise<void> {
    try {
      const projectRoot = await TyranoDataPackager.pickProjectFolder(
        "暗号化する TyranoScript プロジェクトを選択",
      );
      if (!projectRoot) {
        return;
      }

      // 任意フォルダ選択に対する TyranoScript プロジェクト検証
      if (!TyranoDataPackager.isTyranoProject(projectRoot)) {
        vscode.window.showErrorMessage(
          "選択したフォルダは TyranoScript プロジェクトではありません（index.html と data フォルダが見つかりません）。",
        );
        return;
      }

      const passphrase = await TyranoDataPackager.askPassphrase(
        "データ暗号化",
        "暗号化パスフレーズを入力してください（ゲームに同梱されます＝難読化目的）。",
      );
      if (!passphrase) {
        return;
      }

      const proceed = await vscode.window.showWarningMessage(
        "data フォルダを暗号化します。復号鍵はゲームに同梱されるため、これは解析を完全に防ぐものではなく『カジュアルな抽出を防ぐ難読化』です。続行しますか？",
        { modal: true },
        "続行",
      );
      if (proceed !== "続行") {
        return;
      }

      const config = vscode.workspace.getConfiguration("TyranoScript syntax");
      const outputFolderName =
        config.get<string>("packaging.outputFolderName") ||
        "data_encrypted_build";
      const excludeGlobs = config.get<string[]>("packaging.excludeGlobs") || [
        "data/system/KeyConfig.js",
      ];

      const buildDir = path.join(projectRoot, outputFolderName);
      if (fs.existsSync(buildDir)) {
        const overwrite = await vscode.window.showWarningMessage(
          `出力先「${outputFolderName}」は既に存在します。中身を作り直しますか？`,
          { modal: true },
          "作り直す",
        );
        if (overwrite !== "作り直す") {
          return;
        }
        fs.rmSync(buildDir, { recursive: true, force: true });
      }

      const salt = crypto.randomBytes(16);
      const key = TyranoDataPackager.deriveKey(passphrase, salt);

      let encryptedCount = 0;
      let excludedCount = 0;
      const encryptedFiles: string[] = [];
      const failures: string[] = [];

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "data フォルダを暗号化中...",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: "プロジェクトをコピー中..." });
          TyranoDataPackager.copyProject(
            projectRoot,
            buildDir,
            outputFolderName,
          );

          const dataDir = path.join(buildDir, "data");
          const infoWs = InformationWorkSpace.getInstance();
          const files = infoWs.getProjectFiles(dataDir, [], true);
          const total = files.length || 1;
          let done = 0;

          for (const file of files) {
            done++;
            if (done % 20 === 0) {
              progress.report({
                message: `暗号化中... (${done}/${total})`,
                increment: (20 / total) * 100,
              });
            }

            const relFromData = path
              .relative(dataDir, file)
              .split(path.sep)
              .join("/");
            if (relFromData === TyranoDataPackager.MANIFEST_NAME) {
              continue;
            }
            const relFromRoot = "data/" + relFromData;

            if (TyranoDataPackager.isExcluded(relFromRoot, excludeGlobs)) {
              excludedCount++;
              continue; // 平文のまま(コピー済み)
            }

            try {
              const buf = fs.readFileSync(file);
              if (TyranoDataPackager.isEncrypted(buf)) {
                continue; // 二重暗号化を防ぐ
              }
              fs.writeFileSync(file, TyranoDataPackager.encryptBuffer(buf, key));
              encryptedFiles.push(relFromRoot);
              encryptedCount++;
            } catch (error) {
              TyranoLogger.printStackTrace(error);
              failures.push(relFromRoot);
            }
          }

          progress.report({ message: "復号スクリプトを注入中..." });
          TyranoDataPackager.injectDecryptor(buildDir, key);
          TyranoDataPackager.injectIndexHtml(buildDir);

          const manifest = {
            scheme: TyranoDataPackager.MAGIC.toString("latin1"),
            version: TyranoDataPackager.VERSION,
            algorithm: TyranoDataPackager.ALGORITHM,
            saltHex: salt.toString("hex"),
            exclude: excludeGlobs,
            encryptedFiles,
          };
          fs.writeFileSync(
            path.join(dataDir, TyranoDataPackager.MANIFEST_NAME),
            JSON.stringify(manifest, null, 2),
            "utf8",
          );
        },
      );

      let message = `暗号化完了: ${encryptedCount} ファイルを暗号化、${excludedCount} ファイルを除外。出力: ${buildDir}`;
      if (failures.length > 0) {
        message += ` / 失敗 ${failures.length} 件（ログ参照）`;
        vscode.window.showWarningMessage(message);
        return;
      }
      const action = await vscode.window.showInformationMessage(
        message,
        "フォルダを開く",
      );
      if (action === "フォルダを開く") {
        vscode.commands.executeCommand(
          "revealFileInOS",
          vscode.Uri.file(buildDir),
        );
      }
    } catch (error) {
      TyranoLogger.printStackTrace(error);
      vscode.window.showErrorMessage(
        "暗号化中にエラーが発生しました: " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  /**
   * 暗号化済みビルドの data/ を復号して data_decrypted フォルダに書き戻す(復旧用)。
   */
  public static async unpackageData(): Promise<void> {
    try {
      const buildDir = await TyranoDataPackager.pickProjectFolder(
        "暗号化を解除するビルドフォルダを選択",
      );
      if (!buildDir) {
        return;
      }

      const manifestPath = path.join(
        buildDir,
        "data",
        TyranoDataPackager.MANIFEST_NAME,
      );
      if (!fs.existsSync(manifestPath)) {
        vscode.window.showErrorMessage(
          "マニフェスト(data/.tyrano_package.json)が見つかりません。暗号化済みのビルドフォルダを選択してください。",
        );
        return;
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      const passphrase = await TyranoDataPackager.askPassphrase(
        "データ暗号化の解除",
        "暗号化時のパスフレーズを入力してください。",
      );
      if (!passphrase) {
        return;
      }

      const salt = Buffer.from(String(manifest.saltHex), "hex");
      const key = TyranoDataPackager.deriveKey(passphrase, salt);
      const outDir = path.join(path.dirname(buildDir), "data_decrypted");
      const files: string[] = Array.isArray(manifest.encryptedFiles)
        ? manifest.encryptedFiles
        : [];

      let okCount = 0;
      const failures: string[] = [];
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "暗号化を解除中...",
          cancellable: false,
        },
        async (progress) => {
          let done = 0;
          for (const rel of files) {
            done++;
            if (done % 20 === 0) {
              progress.report({ message: `${done}/${files.length}` });
            }
            try {
              const buf = fs.readFileSync(path.join(buildDir, rel));
              const dec = TyranoDataPackager.decryptBuffer(buf, key);
              const dest = path.join(outDir, rel);
              fs.mkdirSync(path.dirname(dest), { recursive: true });
              fs.writeFileSync(dest, dec);
              okCount++;
            } catch (error) {
              TyranoLogger.printStackTrace(error);
              failures.push(rel);
            }
          }
        },
      );

      let message = `解除完了: ${okCount} ファイルを ${outDir} に出力しました。`;
      if (failures.length > 0) {
        message += ` / 失敗 ${failures.length} 件（パスフレーズ誤り等、ログ参照）`;
        vscode.window.showWarningMessage(message);
      } else {
        vscode.window.showInformationMessage(message);
      }
    } catch (error) {
      TyranoLogger.printStackTrace(error);
      vscode.window.showErrorMessage(
        "暗号化解除中にエラーが発生しました: " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  // ------------------------------------------------------------------
  // 暗号コア(decryptor.js と完全に一致させること)
  // ------------------------------------------------------------------

  public static deriveKey(passphrase: string, salt: Buffer): Buffer {
    return crypto.scryptSync(passphrase, salt, TyranoDataPackager.KEY_LENGTH);
  }

  public static encryptBuffer(plain: Buffer, key: Buffer): Buffer {
    const iv = crypto.randomBytes(TyranoDataPackager.IV_LENGTH);
    const cipher = crypto.createCipheriv(
      TyranoDataPackager.ALGORITHM,
      key,
      iv,
    );
    const ct = Buffer.concat([cipher.update(plain), cipher.final()]);
    return Buffer.concat([
      TyranoDataPackager.MAGIC,
      Buffer.from([TyranoDataPackager.VERSION]),
      iv,
      ct,
    ]);
  }

  public static decryptBuffer(buf: Buffer, key: Buffer): Buffer {
    if (!TyranoDataPackager.isEncrypted(buf)) {
      return buf;
    }
    const iv = buf.subarray(5, TyranoDataPackager.HEADER_LENGTH);
    const ct = buf.subarray(TyranoDataPackager.HEADER_LENGTH);
    const decipher = crypto.createDecipheriv(
      TyranoDataPackager.ALGORITHM,
      key,
      iv,
    );
    return Buffer.concat([decipher.update(ct), decipher.final()]);
  }

  public static isEncrypted(buf: Buffer): boolean {
    return (
      buf.length >= TyranoDataPackager.HEADER_LENGTH &&
      buf.subarray(0, 4).equals(TyranoDataPackager.MAGIC) &&
      buf[4] === TyranoDataPackager.VERSION
    );
  }

  // ------------------------------------------------------------------
  // ヘルパー
  // ------------------------------------------------------------------

  private static async pickProjectFolder(
    label: string,
  ): Promise<string | undefined> {
    const defaultUri = vscode.workspace.workspaceFolders?.[0]?.uri;
    const picked = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: label,
      defaultUri,
    });
    if (!picked || picked.length === 0) {
      return undefined;
    }
    return picked[0].fsPath;
  }

  private static async askPassphrase(
    title: string,
    prompt: string,
  ): Promise<string | undefined> {
    return vscode.window.showInputBox({
      password: true,
      title,
      prompt,
      ignoreFocusOut: true,
      validateInput: (v) =>
        v && v.length > 0 ? null : "パスフレーズを入力してください。",
    });
  }

  /**
   * 選択フォルダが TyranoScript プロジェクトか判定する。
   * 既存の判定(index.html をプロジェクトルートの目印とする)に揃え、data/ の存在も確認する。
   */
  private static isTyranoProject(dir: string): boolean {
    try {
      const hasIndex = fs.existsSync(path.join(dir, "index.html"));
      const dataPath = path.join(dir, "data");
      const hasData =
        fs.existsSync(dataPath) && fs.statSync(dataPath).isDirectory();
      return hasIndex && hasData;
    } catch (_error) {
      return false;
    }
  }

  /**
   * プロジェクトの中身をビルドフォルダにコピーする。
   * ビルドフォルダ自身・data_decrypted・.git・node_modules はコピーしない。
   * (fs.cpSync はコピー先が元の子ディレクトリだと例外を投げるため、トップレベル要素を個別にコピーする)
   */
  private static copyProject(
    projectRoot: string,
    buildDir: string,
    outputFolderName: string,
  ): void {
    const skipTop = new Set([
      outputFolderName,
      "data_decrypted",
      ".git",
      "node_modules",
    ]);
    fs.mkdirSync(buildDir, { recursive: true });
    for (const entry of fs.readdirSync(projectRoot, { withFileTypes: true })) {
      if (skipTop.has(entry.name)) {
        continue;
      }
      fs.cpSync(
        path.join(projectRoot, entry.name),
        path.join(buildDir, entry.name),
        { recursive: true },
      );
    }
  }

  private static injectDecryptor(buildDir: string, key: Buffer): void {
    const templatePath = path.join(
      InformationExtension.path ?? "",
      "res",
      "runtime",
      "decryptor.js",
    );
    const template = fs
      .readFileSync(templatePath, "utf8")
      .replace(TyranoDataPackager.TOKEN, key.toString("hex"));
    const destDir = path.join(
      buildDir,
      "tyrano",
      "plugins",
      "tyrano_decryptor",
    );
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(path.join(destDir, "decryptor.js"), template, "utf8");
  }

  /**
   * index.html の </head> 直前に decryptor.js の script タグを挿入する(冪等)。
   */
  private static injectIndexHtml(buildDir: string): void {
    const indexPath = path.join(buildDir, "index.html");
    if (!fs.existsSync(indexPath)) {
      return;
    }
    let html = fs.readFileSync(indexPath, "utf8");
    if (html.includes(TyranoDataPackager.SENTINEL)) {
      return; // 既に注入済み
    }
    const snippet =
      `\n        <!-- ${TyranoDataPackager.SENTINEL} -->\n` +
      '        <script src="./tyrano/plugins/tyrano_decryptor/decryptor.js"></script>\n    ';
    html = html.includes("</head>")
      ? html.replace("</head>", snippet + "</head>")
      : snippet + html;
    fs.writeFileSync(indexPath, html, "utf8");
  }

  private static isExcluded(relPath: string, globs: string[]): boolean {
    return globs.some((g) => TyranoDataPackager.matchGlob(relPath, g.trim()));
  }

  /**
   * 簡易 glob マッチ。exact / ディレクトリ前方一致 / `*`(スラッシュ以外) / `**`(任意) に対応。
   */
  private static matchGlob(filePath: string, glob: string): boolean {
    if (!glob) {
      return false;
    }
    const p = filePath.replace(/\\/g, "/").replace(/^\.?\//, "");
    const g = glob.replace(/\\/g, "/").replace(/^\.?\//, "");
    if (p === g) {
      return true;
    }
    if (p.startsWith(g.endsWith("/") ? g : g + "/")) {
      return true; // ディレクトリ指定
    }
    let re = "";
    for (let i = 0; i < g.length; i++) {
      const c = g[i];
      if (c === "*") {
        if (g[i + 1] === "*") {
          re += ".*";
          i++;
        } else {
          re += "[^/]*";
        }
      } else if (c === "?") {
        re += "[^/]";
      } else if ("\\^$.|+()[]{}".includes(c)) {
        re += "\\" + c;
      } else {
        re += c;
      }
    }
    try {
      return new RegExp("^" + re + "$").test(p);
    } catch (_error) {
      return false;
    }
  }
}
