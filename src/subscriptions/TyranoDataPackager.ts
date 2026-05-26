import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

import { InformationWorkSpace } from "../InformationWorkSpace";
import { InformationExtension } from "../InformationExtension";
import { TyranoLogger } from "../TyranoLogger";

/**
 * data フォルダを単一の暗号化パッケージ(data.pak)に束ねる「パッケージング機能」。
 *
 * - 選択された TyranoScript プロジェクトを出力フォルダにコピーし、コピー側の
 *   data/ の中身(除外ファイルを除く)を 1 つの data.pak に束ねて AES-256-CBC で暗号化する。
 *   束ねたファイルはビルドの data/ から削除し、除外ファイル(KeyConfig.js 等)だけ平文で残す。
 * - ゲームバンドル(tyrano/ + index.html)に実行時復号スクリプト(decryptor.js)を
 *   自動注入する。復号は TyranoErectron(Electron) のレンダラーで行われる。
 *
 * 重要: 復号鍵はビルドに同梱されるため、これは「カジュアルな抽出を防ぐ難読化」であり
 * 解析を完全に防ぐ DRM ではない。
 *
 * data.pak フォーマット:
 *   [ magic 4B = "TYPK" ][ version 1B ][ salt 16B ][ indexIv 16B ][ indexLen 4B(LE) ]
 *   [ 暗号化索引(JSON) ][ DATAセクション(各blobを連結) ]
 *   各 blob = [ iv 16B ][ ciphertext ]。索引 = { "<dataからの相対パス>": {o,l} }。
 */
export class TyranoDataPackager {
  private static readonly PAK_MAGIC = Buffer.from("TYPK");
  private static readonly PAK_VERSION = 1;
  private static readonly PAK_NAME = "data.pak";
  // magic(4) + version(1) + salt(16) + indexIv(16) + indexLen(4)
  private static readonly PAK_HEADER_LENGTH = 4 + 1 + 16 + 16 + 4;
  private static readonly ALGORITHM = "aes-256-cbc";
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TOKEN = "__INJECTED_KEY_HEX__";
  private static readonly SENTINEL = "TYRANO_DECRYPTOR";

  /**
   * data フォルダを data.pak に束ねて暗号化したビルドフォルダを生成する。
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
        "data フォルダを単一パッケージ(data.pak)に束ねて暗号化します。復号鍵はゲームに同梱されるため、これは解析を完全に防ぐものではなく『カジュアルな抽出を防ぐ難読化』です。続行しますか？",
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

      const salt = crypto.randomBytes(TyranoDataPackager.IV_LENGTH);
      const key = TyranoDataPackager.deriveKey(passphrase, salt);

      let packedCount = 0;
      let excludedCount = 0;
      const failures: string[] = [];

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "data フォルダをパッケージング中...",
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

          // 収録対象を読み込み、除外ファイルは平文のまま残す
          progress.report({ message: "ファイルを収集中..." });
          const entries: { key: string; data: Buffer }[] = [];
          const packedAbsPaths: string[] = [];
          for (const file of files) {
            const relFromData = path
              .relative(dataDir, file)
              .split(path.sep)
              .join("/");
            const relFromRoot = "data/" + relFromData;
            if (TyranoDataPackager.isExcluded(relFromRoot, excludeGlobs)) {
              excludedCount++;
              continue;
            }
            try {
              entries.push({ key: relFromData, data: fs.readFileSync(file) });
              packedAbsPaths.push(file);
            } catch (error) {
              TyranoLogger.printStackTrace(error);
              failures.push(relFromRoot);
            }
          }

          // data.pak を構築して書き出す
          progress.report({ message: "data.pak を構築中..." });
          const pak = TyranoDataPackager.buildPak(entries, key, salt);
          fs.writeFileSync(path.join(buildDir, TyranoDataPackager.PAK_NAME), pak);
          packedCount = entries.length;

          // 束ねた平文ファイルをビルドの data/ から削除し、空ディレクトリを整理する
          progress.report({ message: "平文ファイルを削除中..." });
          for (const abs of packedAbsPaths) {
            try {
              fs.rmSync(abs);
            } catch (error) {
              TyranoLogger.printStackTrace(error);
            }
          }
          TyranoDataPackager.pruneEmptyDirs(dataDir);

          progress.report({ message: "復号スクリプトを注入中..." });
          TyranoDataPackager.injectDecryptor(buildDir, key);
          TyranoDataPackager.injectIndexHtml(buildDir);
        },
      );

      let message = `パッケージング完了: ${packedCount} ファイルを data.pak に束ねて暗号化、${excludedCount} ファイルを除外。出力: ${buildDir}`;
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
        "パッケージング中にエラーが発生しました: " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  /**
   * data.pak を復号して data_decrypted フォルダに書き戻す(復旧用)。
   */
  public static async unpackageData(): Promise<void> {
    try {
      const buildDir = await TyranoDataPackager.pickProjectFolder(
        "暗号化を解除するビルドフォルダを選択",
      );
      if (!buildDir) {
        return;
      }

      const pakPath = path.join(buildDir, TyranoDataPackager.PAK_NAME);
      if (!fs.existsSync(pakPath)) {
        vscode.window.showErrorMessage(
          "data.pak が見つかりません。パッケージング済みのビルドフォルダを選択してください。",
        );
        return;
      }

      const passphrase = await TyranoDataPackager.askPassphrase(
        "データ暗号化の解除",
        "暗号化時のパスフレーズを入力してください。",
      );
      if (!passphrase) {
        return;
      }

      const pak = fs.readFileSync(pakPath);
      const salt = TyranoDataPackager.readPakSalt(pak);
      if (!salt) {
        vscode.window.showErrorMessage(
          "data.pak のフォーマットが不正です。",
        );
        return;
      }
      const key = TyranoDataPackager.deriveKey(passphrase, salt);

      let index: Record<string, { o: number; l: number }>;
      try {
        index = TyranoDataPackager.readPakIndex(pak, key);
      } catch (error) {
        TyranoLogger.printStackTrace(error);
        vscode.window.showErrorMessage(
          "索引の復号に失敗しました。パスフレーズが間違っている可能性があります。",
        );
        return;
      }

      const dataStart =
        TyranoDataPackager.PAK_HEADER_LENGTH + pak.readUInt32LE(37);
      const outDir = path.join(path.dirname(buildDir), "data_decrypted");
      const keys = Object.keys(index);

      let okCount = 0;
      const failures: string[] = [];
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "data.pak を解除中...",
          cancellable: false,
        },
        async (progress) => {
          let done = 0;
          for (const rel of keys) {
            done++;
            if (done % 20 === 0) {
              progress.report({ message: `${done}/${keys.length}` });
            }
            try {
              const { o, l } = index[rel];
              const blob = pak.subarray(dataStart + o, dataStart + o + l);
              const dec = TyranoDataPackager.decryptBlob(blob, key);
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
        message += ` / 失敗 ${failures.length} 件（ログ参照）`;
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
  // 暗号コア / pak 組立・分解 (decryptor.js と完全に一致させること)
  // ------------------------------------------------------------------

  public static deriveKey(passphrase: string, salt: Buffer): Buffer {
    return crypto.scryptSync(passphrase, salt, TyranoDataPackager.KEY_LENGTH);
  }

  /** 1 ファイル分を [iv][ciphertext] に暗号化する。 */
  public static encryptBlob(plain: Buffer, key: Buffer): Buffer {
    const iv = crypto.randomBytes(TyranoDataPackager.IV_LENGTH);
    const cipher = crypto.createCipheriv(TyranoDataPackager.ALGORITHM, key, iv);
    const ct = Buffer.concat([cipher.update(plain), cipher.final()]);
    return Buffer.concat([iv, ct]);
  }

  /** [iv][ciphertext] を復号する。 */
  public static decryptBlob(blob: Buffer, key: Buffer): Buffer {
    const iv = blob.subarray(0, TyranoDataPackager.IV_LENGTH);
    const ct = blob.subarray(TyranoDataPackager.IV_LENGTH);
    const decipher = crypto.createDecipheriv(
      TyranoDataPackager.ALGORITHM,
      key,
      iv,
    );
    return Buffer.concat([decipher.update(ct), decipher.final()]);
  }

  /** entries を 1 つの data.pak バッファに束ねる。 */
  public static buildPak(
    entries: { key: string; data: Buffer }[],
    key: Buffer,
    salt: Buffer,
  ): Buffer {
    const index: Record<string, { o: number; l: number }> = {};
    const dataParts: Buffer[] = [];
    let offset = 0;
    for (const entry of entries) {
      const blob = TyranoDataPackager.encryptBlob(entry.data, key);
      index[entry.key] = { o: offset, l: blob.length };
      dataParts.push(blob);
      offset += blob.length;
    }

    const indexIv = crypto.randomBytes(TyranoDataPackager.IV_LENGTH);
    const indexCipher = crypto.createCipheriv(
      TyranoDataPackager.ALGORITHM,
      key,
      indexIv,
    );
    const encIndex = Buffer.concat([
      indexCipher.update(Buffer.from(JSON.stringify(index), "utf8")),
      indexCipher.final(),
    ]);

    const indexLen = Buffer.alloc(4);
    indexLen.writeUInt32LE(encIndex.length, 0);

    return Buffer.concat([
      TyranoDataPackager.PAK_MAGIC,
      Buffer.from([TyranoDataPackager.PAK_VERSION]),
      salt,
      indexIv,
      indexLen,
      encIndex,
      ...dataParts,
    ]);
  }

  /** pak ヘッダから salt を取り出す(フォーマット不正なら undefined)。 */
  public static readPakSalt(pak: Buffer): Buffer | undefined {
    if (
      pak.length < TyranoDataPackager.PAK_HEADER_LENGTH ||
      !pak.subarray(0, 4).equals(TyranoDataPackager.PAK_MAGIC) ||
      pak[4] !== TyranoDataPackager.PAK_VERSION
    ) {
      return undefined;
    }
    return pak.subarray(5, 21);
  }

  /** pak の暗号化索引を復号して返す。 */
  public static readPakIndex(
    pak: Buffer,
    key: Buffer,
  ): Record<string, { o: number; l: number }> {
    const indexIv = pak.subarray(21, 37);
    const indexLen = pak.readUInt32LE(37);
    const encIndex = pak.subarray(
      TyranoDataPackager.PAK_HEADER_LENGTH,
      TyranoDataPackager.PAK_HEADER_LENGTH + indexLen,
    );
    const decipher = crypto.createDecipheriv(
      TyranoDataPackager.ALGORITHM,
      key,
      indexIv,
    );
    const json = Buffer.concat([
      decipher.update(encIndex),
      decipher.final(),
    ]).toString("utf8");
    return JSON.parse(json);
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

  /** dir 配下の空ディレクトリを再帰的に削除する(dir 自身は残す)。 */
  private static pruneEmptyDirs(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_error) {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const child = path.join(dir, entry.name);
        TyranoDataPackager.pruneEmptyDirs(child);
        try {
          if (fs.readdirSync(child).length === 0) {
            fs.rmdirSync(child);
          }
        } catch (_error) {
          // 空でない/削除不可なら無視
        }
      }
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
