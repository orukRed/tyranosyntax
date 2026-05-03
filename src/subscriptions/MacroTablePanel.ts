import * as vscode from "vscode";
import * as path from "path";
import express from "express";
import open from "open";
import { type Server } from "http";

import { InformationWorkSpace } from "../InformationWorkSpace";
import { InformationExtension } from "../InformationExtension";
import { ErrorLevel, TyranoLogger } from "../TyranoLogger";

export class MacroTablePanel {
  private static serverInstance: Server | undefined = undefined;

  public static async openMacroTable() {
    const createServer = async () => {
      try {
        TyranoLogger.print("port 3400 server start");
        const app = express();
        const filePath = InformationExtension.path + path.sep + "macro-table";
        app.use(express.static(filePath));

        app.get("/get-macro-list", (_req, res) => {
          try {
            const infoWs = InformationWorkSpace.getInstance();
            const projectPaths = infoWs.getTyranoScriptProjectRootPaths();

            // プロジェクトごとにマクロを集約し、同名マクロは1エントリにまとめる
            type MacroEntry = {
              name: string;
              comment: string;
              definitions: { file: string; line: number; fullPath: string }[];
              projectName: string;
            };
            const result: MacroEntry[] = [];

            for (const projectPath of projectPaths) {
              const macroMap = infoWs.defineMacroMap.get(projectPath);
              if (!macroMap) {
                continue;
              }
              const projectName =
                projectPath.split(path.sep).pop() ?? projectPath;

              // 同名マクロをグループ化
              const groups = new Map<
                string,
                {
                  comment: string;
                  defs: { file: string; line: number; fullPath: string }[];
                }
              >();
              for (const macro of macroMap.values()) {
                if (!macro.macroName) {
                  continue;
                }
                const existing = groups.get(macro.macroName);
                const comment = macro.description?.trim() ?? "";
                if (!existing) {
                  const defs = macro.location
                    ? [
                        {
                          file: path.basename(macro.filePath),
                          line: macro.location.range.start.line + 1,
                          fullPath: macro.filePath,
                        },
                      ]
                    : [];
                  groups.set(macro.macroName, { comment, defs });
                } else {
                  if (!existing.comment && comment) {
                    existing.comment = comment;
                  }
                  if (macro.location) {
                    existing.defs.push({
                      file: path.basename(macro.filePath),
                      line: macro.location.range.start.line + 1,
                      fullPath: macro.filePath,
                    });
                  }
                }
              }

              for (const [name, { comment, defs }] of groups) {
                result.push({ name, comment, definitions: defs, projectName });
              }
            }

            result.sort((a, b) => a.name.localeCompare(b.name));
            const projectNames = projectPaths
              .map((p) => p.split(path.sep).pop() ?? p)
              .filter(Boolean);
            res.json({ macros: result, projects: projectNames });
          } catch (error) {
            TyranoLogger.printStackTrace(error);
            res.status(500).send("internal error");
          }
        });

        // ファイルをVS Codeで開くエンドポイント
        app.get("/open-file", async (req, res) => {
          const filePath =
            typeof req.query["path"] === "string" ? req.query.path : undefined;
          const lineStr =
            typeof req.query["line"] === "string" ? req.query.line : "1";
          const line = Math.max(1, parseInt(lineStr, 10) || 1) - 1;

          if (!filePath) {
            res.status(400).send("path is required");
            return;
          }
          try {
            const doc = await vscode.workspace.openTextDocument(
              vscode.Uri.file(filePath),
            );
            const position = new vscode.Position(line, 0);
            await vscode.window.showTextDocument(doc, {
              selection: new vscode.Range(position, position),
              preserveFocus: false,
            });
            res.json({ ok: true });
          } catch (error) {
            TyranoLogger.print(
              `MacroTablePanel open-file failed for ${filePath}`,
              ErrorLevel.WARN,
            );
            res.status(500).send("failed to open file");
          }
        });

        MacroTablePanel.serverInstance = app.listen(3400, () => {
          open("http://localhost:3400/index.html");
        });
        TyranoLogger.print("port 3400 server initialized");
      } catch (error) {
        TyranoLogger.printStackTrace(error);
      }
    };

    if (MacroTablePanel.serverInstance) {
      MacroTablePanel.serverInstance.close(() => {
        console.log("port 3300 server closed");
      });
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "マクロ一覧を作成中...",
        cancellable: true,
      },
      async () => {
        createServer();
      },
    );
  }
}
