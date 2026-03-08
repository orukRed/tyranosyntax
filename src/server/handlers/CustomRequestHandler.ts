/* eslint-disable @typescript-eslint/no-explicit-any */
import { URI } from "vscode-uri";
import * as fs from "fs";
import * as path from "path";

import {
  TyranoRequests,
  ResolveJumpTargetParams,
  ResolveJumpTargetResult,
} from "../../shared/protocol";
import { ServerContext } from "../ServerContext";
import { getLineText } from "../ServerUtilities";
import { TyranoLogger, ErrorLevel } from "../TyranoLogger";

export function register(ctx: ServerContext): void {
  const { connection, documents, infoWs, parser } = ctx;

  // ── ResolveJumpTarget ──
  connection.onRequest(
    TyranoRequests.ResolveJumpTarget,
    async (
      params: ResolveJumpTargetParams,
    ): Promise<ResolveJumpTargetResult | null> => {
      try {
        const serverConfig = ctx.getServerConfig();
        const fsPath = URI.parse(params.uri).fsPath;
        const projectPath = infoWs.getProjectPathByFilePath(fsPath);

        // Get the document (from open docs or scenario map)
        const doc =
          documents.get(params.uri) || infoWs.scenarioFileMap.get(fsPath);
        if (!doc) return null;

        const lineText = getLineText(doc, params.line);
        const parsedData = parser.parseText(lineText);
        const tagIndex = parser.getIndex(parsedData, params.character);
        if (tagIndex < 0) return null;

        const tagData = parsedData[tagIndex];
        const storage = tagData["pm"]["storage"] || tagData["pm"]["file"];
        const target = tagData["pm"]["target"];

        // Determine file to jump to
        let targetFsPath: string;
        if (storage) {
          const tagParams = serverConfig.tagParameter || {};
          const tagName = tagData["name"];
          let basePath = "";

          if (tagParams[tagName]) {
            for (const param of Object.values(tagParams[tagName])) {
              if (param.path) {
                basePath = param.path;
                break;
              }
            }
          }
          if (!basePath) basePath = "data/scenario";
          targetFsPath = path.join(projectPath, basePath, storage);
        } else {
          targetFsPath = fsPath;
        }

        // Find target label line
        let targetLine = 0;
        if (target) {
          const targetLabel = target.replace("*", "");
          try {
            const targetContent = fs.readFileSync(targetFsPath, "utf-8");
            const targetParsedData = parser.parseText(targetContent);
            for (const data of targetParsedData) {
              if (
                data["name"] === "label" &&
                data["pm"]["label_name"] === targetLabel
              ) {
                targetLine = data["pm"]["line"];
                break;
              }
            }
          } catch {
            /* file not found, default to line 0 */
          }
        }

        return {
          targetUri: URI.file(targetFsPath).toString(),
          targetLine: targetLine,
          targetCharacter: 0,
        };
      } catch (error) {
        TyranoLogger.print("ResolveJumpTarget failed", ErrorLevel.ERROR);
        TyranoLogger.printStackTrace(error);
        return null;
      }
    },
  );

  // ── GetTransitionData ──
  connection.onRequest(
    TyranoRequests.GetTransitionData,
    (params: { scenarioFilePath: string }) => {
      const normalizedFilePath = params.scenarioFilePath.replace(
        /\\\\/g,
        "\\",
      );
      const transitionData = infoWs.transitionMap.get(normalizedFilePath);
      if (!transitionData) {
        return null;
      }
      const projectPath =
        infoWs.getProjectPathByFilePath(normalizedFilePath);
      const projectName = projectPath.split(/[\\/]/).pop() || "";
      return { transitionData, projectName };
    },
  );

  // ── GetScenarioList ──
  connection.onRequest(TyranoRequests.GetScenarioList, () => {
    const scenarioList = Array.from(infoWs.transitionMap.keys());
    const rootPathList = infoWs.getTyranoScriptProjectRootPaths();

    const data: {
      [key: string]: { fullPath: string; scenarioName: string }[];
    } = {};
    for (const rootPath of rootPathList) {
      const projectName = rootPath.split(/[\\/]/).pop();
      if (projectName) {
        data[projectName] = [];
      }
    }
    for (const scenarioPath of scenarioList) {
      for (const rootPath of rootPathList) {
        const projectName = rootPath.split(/[\\/]/).pop();
        if (scenarioPath.includes(rootPath) && projectName) {
          const sep = rootPath.includes("/") ? "/" : "\\";
          const relativePath = scenarioPath.replace(rootPath + sep, "");
          data[projectName].push({
            fullPath: scenarioPath,
            scenarioName: relativePath,
          });
        }
      }
    }
    return { scenarioList: data };
  });
}
