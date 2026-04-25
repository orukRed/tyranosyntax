import * as vscode from "vscode";
import * as path from "path";
import express from "express";
import open from "open";
import { type Server } from "http";

import { InformationWorkSpace } from "../InformationWorkSpace";
import { InformationExtension } from "../InformationExtension";
import { TyranoLogger } from "../TyranoLogger";

type ProjectScenarioFile = {
  filePath: string;
  relativePath: string;
};

export class TyranoFlowchart {
  private static serverInstance: Server | undefined = undefined;

  private static collectProjectScenarioFiles(
    infoWs: InformationWorkSpace,
    projectPath: string,
  ): ProjectScenarioFile[] {
    const scenarioDirPath =
      projectPath +
      path.sep +
      "data" +
      path.sep +
      "scenario" +
      path.sep;
    const result: ProjectScenarioFile[] = [];
    for (const filePath of infoWs.transitionMap.keys()) {
      if (!filePath.startsWith(scenarioDirPath)) {
        continue;
      }
      result.push({
        filePath,
        relativePath: filePath.substring(scenarioDirPath.length),
      });
    }
    // labelMapにしか存在しない（遷移0だがラベルあり）ケースも拾う
    for (const filePath of infoWs.labelMap.keys()) {
      if (!filePath.startsWith(scenarioDirPath)) continue;
      if (result.some((f) => f.filePath === filePath)) continue;
      result.push({
        filePath,
        relativePath: filePath.substring(scenarioDirPath.length),
      });
    }
    return result;
  }

  private static buildStorageResolution(
    files: ProjectScenarioFile[],
  ): { [storage: string]: string } {
    // scenarioDirPath以下のファイルから "storage属性で書かれうる相対パス" → 絶対パス のマップを作る。
    // 通常 storage="foo.ks" や storage="sub/foo.ks" のように書かれる。
    const resolution: { [storage: string]: string } = {};
    for (const f of files) {
      const normalized = f.relativePath.replace(/\\/g, "/");
      // 1) data/scenario/ 直下からの相対パス（"sub/foo.ks"）
      resolution[normalized] = f.filePath;
      // 2) ファイル名のみ（"foo.ks"）。衝突時は data/scenario/ 直下のものを優先
      const baseName = normalized.split("/").pop();
      if (baseName && resolution[baseName] === undefined) {
        resolution[baseName] = f.filePath;
      }
    }
    return resolution;
  }

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
        app.get("/get-transition-data", async (req, res) => {
          TyranoLogger.print("get-transition-data start");
          const infoWs = InformationWorkSpace.getInstance();

          const scope =
            typeof req.query["scope"] === "string"
              ? req.query.scope
              : undefined;

          try {
            if (scope === "project") {
              const projectName =
                typeof req.query["project"] === "string"
                  ? req.query.project
                  : undefined;
              const projectPathParam =
                typeof req.query["projectPath"] === "string"
                  ? req.query.projectPath
                  : undefined;

              const rootPaths = infoWs.getTyranoScriptProjectRootPaths();
              const projectPath = projectPathParam
                ? rootPaths.find((p) => p === projectPathParam)
                : rootPaths.find((p) => p.split(path.sep).pop() === projectName);

              if (!projectPath) {
                res.status(404).send("project not found");
                TyranoLogger.print("get-transition-data end (project not found)");
                return;
              }

              const scenarioFiles = TyranoFlowchart.collectProjectScenarioFiles(
                infoWs,
                projectPath,
              );
              const storageResolution =
                TyranoFlowchart.buildStorageResolution(scenarioFiles);

              const files = scenarioFiles.map((f) => {
                const transitions = infoWs.transitionMap.get(f.filePath) ?? [];
                const labelObjs = infoWs.labelMap.get(f.filePath) ?? [];
                const labels = labelObjs.map((l) =>
                  l.name.startsWith("*") ? l.name : "*" + l.name,
                );
                return {
                  filePath: f.filePath,
                  relativePath: f.relativePath.replace(/\\/g, "/"),
                  transitions,
                  labels,
                };
              });

              const totalNodes = files.reduce(
                (acc, f) => acc + f.transitions.length + f.labels.length,
                0,
              );

              res.json({
                scope: "project",
                projectName: projectPath.split(path.sep).pop(),
                projectPath,
                files,
                storageResolution,
                totalNodes,
              });
              TyranoLogger.print("get-transition-data end (project)");
              return;
            }

            // 単一ファイルモード（既存挙動 + storageResolution 同梱）
            const scenarioFilePath =
              typeof req.query["scenario"] === "string"
                ? req.query.scenario
                : undefined;
            if (!scenarioFilePath) {
              res.status(400).send("scenario is required");
              return;
            }
            const normalizedFilePath = scenarioFilePath.replace(/\\\\/g, "\\");
            const TransitionData =
              infoWs.transitionMap.get(normalizedFilePath);
            const labels = infoWs.labelMap.get(normalizedFilePath) ?? [];
            const LabelData = labels.map((label) =>
              label.name.startsWith("*") ? label.name : "*" + label.name,
            );

            const projectPath = await infoWs.getProjectPathByFilePath(
              normalizedFilePath,
            );
            const projectName = projectPath.split(path.sep).pop();
            const scenarioFiles = TyranoFlowchart.collectProjectScenarioFiles(
              infoWs,
              projectPath,
            );
            const storageResolution =
              TyranoFlowchart.buildStorageResolution(scenarioFiles);

            if (TransitionData) {
              res.json({
                TransitionData: TransitionData,
                projectName: projectName,
                LabelData: LabelData,
                storageResolution,
              });
            } else {
              res.json({
                TransitionData: [],
                projectName: projectName,
                LabelData: LabelData,
                storageResolution,
              });
            }
            TyranoLogger.print("get-transition-data end");
          } catch (error) {
            TyranoLogger.printStackTrace(error);
            res.status(500).send("internal error");
          }
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
              const projectName = rootPath.split(path.sep).pop(); // パスからプロジェクト名を取得
              if (projectName) {
                data[projectName] = [];
              }
            });

            // scenarioList をループして、各シナリオファイルがどのプロジェクトに属するかを判断し、data に追加
            // data/scenario/ 配下のファイルのみを対象とし、data/scenario/ より後ろの相対パスで表示する
            scenarioList.forEach((scenarioPath) => {
              rootPathList.forEach((rootPath) => {
                const projectName = rootPath.split(path.sep).pop();
                if (scenarioPath.includes(rootPath) && projectName) {
                  const scenarioDirPath =
                    rootPath +
                    path.sep +
                    "data" +
                    path.sep +
                    "scenario" +
                    path.sep;
                  if (!scenarioPath.startsWith(scenarioDirPath)) {
                    return; // data/scenario/ 配下でないファイル (data/others/plugin 等) は除外
                  }
                  const relativePath = scenarioPath.substring(
                    scenarioDirPath.length,
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

          // プロジェクト名 → ルートパスの対応表（マルチルート時の一意化用）
          const projectPaths: { [projectName: string]: string } = {};
          rootPathList.forEach((rootPath) => {
            const projectName = rootPath.split(path.sep).pop();
            if (projectName && projectPaths[projectName] === undefined) {
              projectPaths[projectName] = rootPath;
            }
          });

          res.json({ scenarioList: organizedData, projectPaths });
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
