import * as vscode from "vscode";
import * as path from "path";
import express from "express";
import open from "open";
import { type Server } from "http";

import { InformationWorkSpace } from "../InformationWorkSpace";
import { InformationExtension } from "../InformationExtension";
import { TyranoLogger } from "../TyranoLogger";

export class TyranoFlowchart {
  private static serverInstance: Server | undefined = undefined;

  public static async openFlowchart() {
    const createServer = async () => {
      try {
        TyranoLogger.print("port 3200 server start");
        const app = express();
        console.log("flowchart");
        const filePath = InformationExtension.path + path.sep + "flowchart";
        app.use(express.static(filePath));

        //ルートの設定

        //特定のルートに対するGETリクエストを処理するためのメソッド
        app.get("/get-transition-data", (req, res) => {
          TyranoLogger.print("get-transition-data start");
          const infoWs = InformationWorkSpace.getInstance();
          //scenario=FILE_PATHの形で指定したファイルのデータを取得
          const scenarioFilePath = (() => {
            switch (typeof req.query["scenario"]) {
              case "string":
                return req.query.scenario; // クエリパラメータからキーを取得
              default:
                return;
            }
          })();
          if (!scenarioFilePath) {
            return;
          }
          const normalizedFilePath = scenarioFilePath.replace(/\\\\/g, "\\");
          const TransitionData = infoWs.transitionMap.get(normalizedFilePath);
          infoWs
            .getProjectPathByFilePath(normalizedFilePath)
            .then((projectPath) => {
              // Promise が解決された後、このブロック内で projectPath を使用
              const projectName = projectPath.split("\\").pop(); // プロジェクトパスからプロジェクト名を取得
              if (TransitionData) {
                console.log(TransitionData);
                res.json({
                  TransitionData: TransitionData,
                  projectName: projectName,
                }); // 値が見つかった場合、JSONとして返す
              } else {
                console.log("Key not found");
                res.status(404).send("Key not found"); // 値が見つからない場合、404エラーを返す
              }
            })
            .catch((error) => {
              // エラー処理
              console.error("プロジェクトパスの取得に失敗しました:", error);
              TyranoLogger.printStackTrace(error);
            });
          TyranoLogger.print("get-transition-data end");
        });

        app.get("/get-scenario-list", (_req, res) => {
          //シナリオファイルのリストと、プロジェクトパスのリストから、{PROJECT_NAME: [SCENARIO_FILE_PATH, ...]}の形式のオブジェクトを作成する
          const organizeData = (
            scenarioList: string[],
            rootPathList: string[],
          ) => {
            const data: {
              [key: string]: { fullPath: string; scenarioName: string }[];
            } = {};

            // rootPathList をループして、プロジェクト名をキーとした空の配列を data に追加
            rootPathList.forEach((rootPath) => {
              const projectName = rootPath.split("\\").pop(); // パスからプロジェクト名を取得
              if (projectName) {
                data[projectName] = [];
              }
            });

            // scenarioList をループして、各シナリオファイルがどのプロジェクトに属するかを判断し、data に追加
            scenarioList.forEach((scenarioPath) => {
              rootPathList.forEach((rootPath) => {
                const projectName = rootPath.split("\\").pop();
                if (scenarioPath.includes(rootPath) && projectName) {
                  const relativePath = scenarioPath.replace(
                    rootPath + path.sep,
                    "",
                  );
                  data[projectName].push({
                    fullPath: scenarioPath,
                    scenarioName: relativePath,
                  });
                }
              });
            });

            return data;
          };
          const infoWs = InformationWorkSpace.getInstance();
          const scenarioList = Array.from(infoWs.transitionMap.keys());
          const rootPathList = infoWs.getTyranoScriptProjectRootPaths();
          const organizedData = organizeData(scenarioList, rootPathList);
          res.json({ scenarioList: organizedData });
        });

        TyranoFlowchart.serverInstance = app.listen(3200, () => {
          open(`http://localhost:3200/flowchart-list.html`);
        });
        TyranoLogger.print("port 3200 server initialized");
      } catch (error) {
        TyranoLogger.printStackTrace(error);
      }
    };
    if (TyranoFlowchart.serverInstance) {
      TyranoFlowchart.serverInstance.close(() => {
        console.log("port 3200 server closed");
      });
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
