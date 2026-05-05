import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import express from "express";
import open from "open";
import { type Server } from "http";

import { InformationWorkSpace } from "../InformationWorkSpace";
import { InformationExtension } from "../InformationExtension";
import { ErrorLevel, TyranoLogger } from "../TyranoLogger";

type UnusedResourceEntry = {
  filePath: string;
  fileName: string;
  relativePath: string;
  resourceType: string;
  projectName: string;
};

/**
 * シナリオ/スクリプトファイルのテキスト全体から参照されているファイル名を収集する。
 * テキストベースの検索のため、変数による動的参照が偽陰性になる可能性がある。
 * そのため結果は「警告」レベルの扱いとする。
 */
function collectReferencedFileNames(infoWs: InformationWorkSpace): Set<string> {
  const referenced = new Set<string>();

  // .ks ファイルのテキストを検索
  for (const doc of infoWs.scenarioFileMap.values()) {
    const text = doc.getText();
    extractFileNames(text, referenced);
  }

  // .js / .tjs 等のスクリプトファイルを検索
  for (const text of infoWs.scriptFileMap.values()) {
    extractFileNames(text, referenced);
  }

  return referenced;
}

/**
 * テキスト中に現れるファイル名（拡張子付き）を Set に追加する。
 * Windows のファイル名禁止文字（< > : " / \ | ? *）と改行を除く任意の文字を許可する。
 * 日本語・記号（+, ⑧ 等）を含むファイル名にも対応する。
 */
function extractFileNames(text: string, out: Set<string>): void {
  // 拡張子を含むファイル名パターン: Windowsファイル名禁止文字・改行以外 + .拡張子
  const re = /[^\r\n/\\<>:"|?*]+\.[a-zA-Z0-9]{1,10}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    // パスセパレータ以降のファイル名部分のみを取得
    const name = m[0].split(/[/\\]/).pop();
    if (name) {
      out.add(name);
    }
  }
}

/**
 * 指定プロジェクトの未使用リソースを検出して返す。
 */
function detectUnusedResources(
  projectPath: string,
  infoWs: InformationWorkSpace,
  referencedFileNames: Set<string>,
): UnusedResourceEntry[] {
  const resources = infoWs.resourceFileMap.get(projectPath) ?? [];
  const projectName = projectPath.split(path.sep).pop() ?? projectPath;

  const scenarioDirPath = projectPath + path.sep + "data" + path.sep;
  const systemDir = projectPath + path.sep + "data" + path.sep + "system";
  const scenarioDir = projectPath + path.sep + "data" + path.sep + "scenario";

  return resources
    .filter((res) => {
      // data/system フォルダ内のファイルは検出対象外
      if (res.filePath.startsWith(systemDir + path.sep)) return false;
      // data/scenario フォルダ内の make.ks は検出対象外
      if (res.fileName === "make.ks" && res.filePath.startsWith(scenarioDir + path.sep)) return false;
      return !referencedFileNames.has(res.fileName);
    })
    .map((res) => ({
      filePath: res.filePath,
      fileName: res.fileName,
      relativePath: res.filePath.startsWith(scenarioDirPath)
        ? res.filePath.substring(scenarioDirPath.length).replace(/\\/g, "/")
        : res.filePath.replace(/\\/g, "/"),
      resourceType: res.resourceType,
      projectName,
    }));
}

/**
 * 未使用リソースファイルを検出し、一括削除できる WebUI を提供するクラス。
 * MacroTablePanel と同じ Express サーバーパターンを使用。
 * ポート: 3500
 */
export class UnusedResourcePanel {
  private static serverInstance: Server | undefined = undefined;

  public static async openUnusedResources() {
    const createServer = async () => {
      try {
        TyranoLogger.print("port 3500 server start");
        const app = express();
        const staticDir =
          InformationExtension.path + path.sep + "unused-resources";
        app.use(express.static(staticDir));
        app.use(express.json());

        // 未使用リソース一覧を返す
        app.get("/get-unused-resources", (_req, res) => {
          try {
            const infoWs = InformationWorkSpace.getInstance();
            const projectPaths = infoWs.getTyranoScriptProjectRootPaths();

            const referencedFileNames = collectReferencedFileNames(infoWs);
            const result: UnusedResourceEntry[] = [];

            for (const projectPath of projectPaths) {
              const unused = detectUnusedResources(
                projectPath,
                infoWs,
                referencedFileNames,
              );
              result.push(...unused);
            }

            res.json({ resources: result });
          } catch (error) {
            TyranoLogger.printStackTrace(error);
            res.status(500).send("internal error");
          }
        });

        // サムネイル用にファイルをバイナリ配信する（base64 エンコードされたパスを受け取る）
        app.get("/serve-file", (req, res) => {
          try {
            const encodedPath =
              typeof req.query["path"] === "string"
                ? req.query.path
                : undefined;
            if (!encodedPath) {
              res.status(400).send("path is required");
              return;
            }

            let filePath: string;
            try {
              filePath = Buffer.from(encodedPath, "base64").toString("utf-8");
            } catch {
              res.status(400).send("invalid path encoding");
              return;
            }

            // セキュリティ: パスを正規化して、プロジェクト内ファイルのみ許可
            const normalizedPath = path.normalize(filePath);
            const infoWs = InformationWorkSpace.getInstance();
            const projectPaths = infoWs.getTyranoScriptProjectRootPaths();
            const isAllowed = projectPaths.some((projectPath) =>
              normalizedPath.startsWith(path.normalize(projectPath) + path.sep),
            );
            if (!isAllowed) {
              res.status(403).send("forbidden");
              return;
            }

            if (!fs.existsSync(normalizedPath)) {
              res.status(404).send("not found");
              return;
            }

            res.sendFile(normalizedPath);
          } catch (error) {
            TyranoLogger.print(
              `UnusedResourcePanel serve-file failed: ${error}`,
              ErrorLevel.WARN,
            );
            res.status(500).send("internal error");
          }
        });

        // 選択されたファイルをゴミ箱に移動する
        app.post("/delete-files", async (req, res) => {
          try {
            const files: unknown = req.body?.files;
            if (!Array.isArray(files)) {
              res.status(400).send("files must be an array");
              return;
            }

            const infoWs = InformationWorkSpace.getInstance();
            const projectPaths = infoWs.getTyranoScriptProjectRootPaths();

            const errors: string[] = [];
            const deleted: string[] = [];

            for (const filePath of files) {
              if (typeof filePath !== "string") {
                errors.push(`invalid path: ${filePath}`);
                continue;
              }

              // セキュリティ: パスを正規化して、プロジェクト内ファイルのみ削除許可
              const normalizedPath = path.normalize(filePath);
              const isAllowed = projectPaths.some((projectPath) =>
                normalizedPath.startsWith(
                  path.normalize(projectPath) + path.sep,
                ),
              );
              if (!isAllowed) {
                errors.push(`forbidden: ${filePath}`);
                continue;
              }

              try {
                // OS のゴミ箱に移動（取り消し可能）
                await vscode.workspace.fs.delete(
                  vscode.Uri.file(normalizedPath),
                  { useTrash: true },
                );
                // 内部マップからも削除
                await infoWs.spliceResourceFileMapByFilePath(normalizedPath);
                deleted.push(normalizedPath);
              } catch (err) {
                errors.push(`failed to delete ${filePath}: ${err}`);
              }
            }

            if (errors.length > 0) {
              TyranoLogger.print(
                `UnusedResourcePanel delete-files errors: ${errors.join(", ")}`,
                ErrorLevel.WARN,
              );
            }

            res.json({ deleted, errors });
          } catch (error) {
            TyranoLogger.printStackTrace(error);
            res.status(500).send("internal error");
          }
        });

        UnusedResourcePanel.serverInstance = app.listen(3500, () => {
          open("http://localhost:3500/index.html");
        });
        TyranoLogger.print("port 3500 server initialized");
      } catch (error) {
        TyranoLogger.printStackTrace(error);
      }
    };

    if (UnusedResourcePanel.serverInstance) {
      UnusedResourcePanel.serverInstance.close(() => {
        console.log("port 3500 server closed");
      });
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "未使用リソースを検出中...",
        cancellable: true,
      },
      async () => {
        await createServer();
      },
    );
  }
}
