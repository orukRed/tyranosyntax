import * as vscode from "vscode";
import * as path from "path";
import express from "express";
import open from "open";
import { type Server } from "http";
import { LanguageClient } from "vscode-languageclient/node";

import {
  TyranoRequests,
  GetTransitionDataParams,
  GetScenarioListResult,
} from "../shared/protocol";

export class TyranoFlowchart {
  private static serverInstance: Server | undefined = undefined;
  /** extension.ts から設定される LSP クライアント */
  static client: LanguageClient;
  /** extension.ts から設定される拡張機能パス */
  static extensionPath: string;

  public static async openFlowchart() {
    const createServer = async () => {
      try {
        const app = express();
        const filePath =
          TyranoFlowchart.extensionPath + path.sep + "flowchart";
        app.use(express.static(filePath));

        // 特定のルートに対するGETリクエストを処理する
        app.get("/get-transition-data", async (req, res) => {
          const scenarioFilePath = (() => {
            switch (typeof req.query["scenario"]) {
              case "string":
                return req.query.scenario;
              default:
                return;
            }
          })();
          if (!scenarioFilePath) {
            return;
          }
          try {
            const params: GetTransitionDataParams = { scenarioFilePath };
            const result = await TyranoFlowchart.client.sendRequest<{
              transitionData: unknown;
              projectName: string;
            } | null>(TyranoRequests.GetTransitionData, params);
            if (result) {
              res.json({
                TransitionData: result.transitionData,
                projectName: result.projectName,
              });
            } else {
              res.status(404).send("Key not found");
            }
          } catch {
            res.status(500).send("Error resolving transition data");
          }
        });

        app.get("/get-scenario-list", async (_req, res) => {
          try {
            const result = await TyranoFlowchart.client.sendRequest<{
              scenarioList: GetScenarioListResult;
            }>(TyranoRequests.GetScenarioList);
            res.json({ scenarioList: result.scenarioList });
          } catch {
            res.status(500).send("Error fetching scenario list");
          }
        });

        TyranoFlowchart.serverInstance = app.listen(3200, () => {
          open(`http://localhost:3200/flowchart-list.html`);
        });
      } catch {
        // ignore
      }
    };
    if (TyranoFlowchart.serverInstance) {
      TyranoFlowchart.serverInstance.close();
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "フローチャート作成中...",
        cancellable: true,
      },
      async (_progress, _token) => {
        createServer();
      },
    );
  }
}
