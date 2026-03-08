import * as vscode from "vscode";
import { DefineMacroData } from "./defineData/DefineMacroData";
import { TyranoLogger } from "./TyranoLogger";
import { VariableData } from "./defineData/VariableData";
import { MacroParameterData } from "./defineData/MacroParameterData";
import { ProjectPathResolver } from "./ProjectPathResolver";
import { MapCacheManager } from "./MapCacheManager";

import * as babel from "@babel/parser";
import traverse from "@babel/traverse";
import * as crypto from "crypto";

/**
 * .jsファイルの解析・マクロデータ抽出を担当するクラス。
 */
export class ScriptFileParser {
  private pathResolver: ProjectPathResolver;
  private cacheManager: MapCacheManager;
  private scriptFileMap: Map<string, string>;

  constructor(
    pathResolver: ProjectPathResolver,
    cacheManager: MapCacheManager,
    scriptFileMap: Map<string, string>,
  ) {
    this.pathResolver = pathResolver;
    this.cacheManager = cacheManager;
    this.scriptFileMap = scriptFileMap;
  }

  /**
   * JSファイルからマクロデータを解析して登録する
   */
  public async updateMacroDataMapByJs(absoluteScenarioFilePath: string) {
    TyranoLogger.print(
      `ScriptFileParser.updateMacroDataMapByJs(${absoluteScenarioFilePath})`,
    );
    const reg2 = /TYRANO\.kag\.ftag\.master_tag\.[a-zA-Z0-9_$]/g;
    const reg3 = /tyrano\.plugin\.kag\.tag\.[a-zA-Z0-9_$]/g;
    const parsedData = babel.parse(
      this.scriptFileMap.get(absoluteScenarioFilePath)!,
      {
        allowAwaitOutsideFunction: true,
        allowUndeclaredExports: true,
        errorRecovery: true,
        allowSuperOutsideMethod: true,
      },
    );
    const projectPath: string = this.pathResolver.getProjectPathByFilePath(
      absoluteScenarioFilePath,
    );

    if (this.pathResolver.isSkipParse(absoluteScenarioFilePath, projectPath)) {
      return;
    }
    const deleteTagList = await this.cacheManager.spliceMacroDataMapByFilePath(
      absoluteScenarioFilePath,
    );
    await this.cacheManager.spliceSuggestionsByFilePath(
      projectPath,
      deleteTagList,
    );
    try {
      traverse(parsedData, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        enter: (path: any) => {
          try {
            if (
              path != null &&
              path.parentPath != null &&
              path.parentPath.type === "AssignmentExpression" &&
              (reg2.test(path.parentPath.toString()) ||
                reg3.test(path.parentPath.toString()))
            ) {
              const macroName: string = path.toString().split(".")[4];
              if (macroName != undefined && macroName != null) {
                let description = path.parentPath.parentPath
                  .toString()
                  .replace(";", "")
                  .replace(path.parentPath.toString(), "");
                description = description
                  .replaceAll("/", "")
                  .replaceAll("*", "")
                  .replaceAll(" ", "")
                  .replaceAll("\t", "");

                const macroData: DefineMacroData = new DefineMacroData(
                  macroName,
                  new vscode.Location(
                    vscode.Uri.file(absoluteScenarioFilePath),
                    new vscode.Position(
                      path.node?.loc?.start?.line ?? 0,
                      path.node?.loc?.start?.column ?? 0,
                    ),
                  ),
                  absoluteScenarioFilePath,
                  description,
                );
                macroData.parameter.push(
                  new MacroParameterData("parameter", false, "description"),
                ); //TODO:パーサーでパラメータの情報読み込んで追加する

                const uuid = crypto.randomUUID();
                this.cacheManager.registerMacro(
                  projectPath,
                  absoluteScenarioFilePath,
                  uuid,
                  macroData,
                );
              }
            }
          } catch (error) {
            TyranoLogger.printStackTrace(error);
          }
        },
      });
    } catch (error) {
      TyranoLogger.printStackTrace(error);
    }
  }

  /**
   * Babel ASTのtypeをわかりやすい文言に変換する
   */
  public typeConverter(type: string): string {
    switch (type) {
      case "ArrayExpression":
        return "array";
      case "ObjectExpression":
        return "object";
      case "Identifier":
        return "";
      default:
        return type;
    }
  }

  /**
   * ネストされたオブジェクトプロパティからVariableDataを再帰的に抽出する
   */
  public getNestedObject(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    property: any,
    absoluteScenarioFilePath: string,
  ): VariableData[] {
    const nestedObjects: VariableData[] = [];
    if (property?.type === "ObjectExpression") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      property.properties?.forEach((prop: any) => {
        if (prop?.key && prop.key.type === "Identifier") {
          const name = prop.key.name;
          const value =
            prop.value?.type === "ObjectExpression"
              ? undefined
              : prop.value?.value;
          const type = this.typeConverter(prop.value?.type ?? "");
          const variableData = new VariableData(name, value, undefined, type);
          const location = new vscode.Location(
            vscode.Uri.file(absoluteScenarioFilePath),
            new vscode.Position(
              property?.loc?.start?.column ?? 0,
              property?.loc?.start?.column ?? 0,
            ),
          );
          variableData.addLocation(location);
          if (prop?.value?.type === "ObjectExpression") {
            variableData.nestVariableData = this.getNestedObject(
              prop.value,
              absoluteScenarioFilePath,
            );
          }
          nestedObjects.push(variableData);
        }
      });
    }
    return nestedObjects;
  }
}
