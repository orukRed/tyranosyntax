import * as fs from "fs";
import * as vscode from "vscode";
import * as path from "path";
import { ResourceFileData } from "./defineData/ResourceFileData";
import { DefineMacroData } from "./defineData/DefineMacroData";
import { ErrorLevel, TyranoLogger } from "./TyranoLogger";
import { VariableData } from "./defineData/VariableData";
import { LabelData } from "./defineData/LabelData";
import { TransitionData } from "./defineData/TransitionData";
import { CharacterData } from "./defineData/CharacterData";
import { ProjectPathResolver } from "./ProjectPathResolver";

/**
 * Map群のCRUD操作を一括管理するクラス。
 * InformationWorkSpaceが保有するMapへの参照を受け取って操作する。
 */
export class MapCacheManager {
  private pathResolver: ProjectPathResolver;

  // InformationWorkSpaceが保有するMapへの参照
  private scriptFileMap: Map<string, string>;
  private scenarioFileMap: Map<string, vscode.TextDocument>;
  private defineMacroMap: Map<string, Map<string, DefineMacroData>>;
  private macroByFilePath: Map<string, Set<string>>;
  private resourceFileMap: Map<string, ResourceFileData[]>;
  private variableMap: Map<string, Map<string, VariableData>>;
  private labelMap: Map<string, LabelData[]>;
  private suggestions: Map<string, object>;
  private characterMap: Map<string, CharacterData[]>;
  private transitionMap: Map<string, TransitionData[]>;
  private defaultTagList: string[];

  private resourceExtensions: object;

  constructor(
    pathResolver: ProjectPathResolver,
    maps: {
      scriptFileMap: Map<string, string>;
      scenarioFileMap: Map<string, vscode.TextDocument>;
      defineMacroMap: Map<string, Map<string, DefineMacroData>>;
      macroByFilePath: Map<string, Set<string>>;
      resourceFileMap: Map<string, ResourceFileData[]>;
      variableMap: Map<string, Map<string, VariableData>>;
      labelMap: Map<string, LabelData[]>;
      suggestions: Map<string, object>;
      characterMap: Map<string, CharacterData[]>;
      transitionMap: Map<string, TransitionData[]>;
      defaultTagList: string[];
      resourceExtensions: object;
    },
  ) {
    this.pathResolver = pathResolver;
    this.scriptFileMap = maps.scriptFileMap;
    this.scenarioFileMap = maps.scenarioFileMap;
    this.defineMacroMap = maps.defineMacroMap;
    this.macroByFilePath = maps.macroByFilePath;
    this.resourceFileMap = maps.resourceFileMap;
    this.variableMap = maps.variableMap;
    this.labelMap = maps.labelMap;
    this.suggestions = maps.suggestions;
    this.characterMap = maps.characterMap;
    this.transitionMap = maps.transitionMap;
    this.defaultTagList = maps.defaultTagList;
    this.resourceExtensions = maps.resourceExtensions;
  }

  /**
   * defaultTagListの参照を更新（initializeMaps後に呼ぶ）
   */
  public updateDefaultTagList(newList: string[]) {
    this.defaultTagList = newList;
  }

  /**
   * スクリプトファイルパスとその中身のMapを更新
   */
  public async updateScriptFileMap(filePath: string) {
    if (path.extname(filePath) !== ".js") {
      return;
    }
    try {
      this.scriptFileMap.set(filePath, fs.readFileSync(filePath, "utf-8"));
    } catch (error) {
      this.scriptFileMap.delete(filePath);
      TyranoLogger.print(
        `Script file read failed for ${filePath}, removed from cache`,
        ErrorLevel.WARN,
      );
      throw error;
    }
  }

  /**
   * シナリオファイルのMapを更新（キャッシュ無効化付き）
   */
  public async updateScenarioFileMap(filePath: string) {
    if (path.extname(filePath) !== ".ks") {
      return;
    }

    const existingDoc = this.scenarioFileMap.get(filePath);
    if (existingDoc) {
      try {
        const diskContent = fs.readFileSync(filePath, "utf-8");
        const cachedContent = existingDoc.getText();
        if (diskContent !== cachedContent) {
          this.scenarioFileMap.delete(filePath);
          TyranoLogger.print(
            `Document cache invalidated for ${filePath} due to external changes`,
          );
        }
      } catch (error) {
        TyranoLogger.printStackTrace(error);
        this.scenarioFileMap.delete(filePath);
        TyranoLogger.print(
          `Document cache invalidated for ${filePath} due to read error`,
          ErrorLevel.WARN,
        );
      }
    }

    const textDocument = await vscode.workspace.openTextDocument(filePath);
    this.scenarioFileMap.set(textDocument.fileName, textDocument);
  }

  /**
   * リソースファイルのマップに値を追加
   */
  public async addResourceFileMap(filePath: string) {
    const absoluteProjectPath =
      this.pathResolver.getProjectPathByFilePath(filePath);
    const resourceType: string | undefined = Object.keys(
      this.resourceExtensions,
    )
      .filter((key) =>
        this.resourceExtensions[key].includes(path.extname(filePath)),
      )
      .toString();
    this.resourceFileMap
      .get(absoluteProjectPath)
      ?.push(new ResourceFileData(filePath, resourceType));
  }

  /**
   * リソースファイルのマップから削除
   */
  public async spliceResourceFileMapByFilePath(filePath: string) {
    const absoluteProjectPath =
      this.pathResolver.getProjectPathByFilePath(filePath);
    const insertValue: ResourceFileData[] | undefined = this.resourceFileMap
      .get(absoluteProjectPath)
      ?.filter((obj) => obj.filePath !== filePath);
    this.resourceFileMap.set(absoluteProjectPath, insertValue!);
  }

  public async spliceScenarioFileMapByFilePath(filePath: string) {
    this.scenarioFileMap.delete(filePath);
  }

  public async spliceScriptFileMapByFilePath(filePath: string) {
    this.scriptFileMap.delete(filePath);
  }

  /**
   * マクロデータのマップから指定ファイルのマクロを削除
   */
  public async spliceMacroDataMapByFilePath(filePath: string) {
    const deleteTagList: string[] = [];
    const projectPath = this.pathResolver.getProjectPathByFilePath(filePath);

    const macroUuids = this.macroByFilePath.get(filePath);
    if (!macroUuids || macroUuids.size === 0) {
      return deleteTagList;
    }

    const projectMacroMap = this.defineMacroMap.get(projectPath);
    if (!projectMacroMap) {
      this.macroByFilePath.delete(filePath);
      return deleteTagList;
    }

    for (const uuid of macroUuids) {
      const macroData = projectMacroMap.get(uuid);
      if (macroData) {
        deleteTagList.push(macroData.macroName);
        projectMacroMap.delete(uuid);
      }
    }

    this.macroByFilePath.delete(filePath);
    return deleteTagList;
  }

  public async spliceLabelMapByFilePath(fsPath: string) {
    this.labelMap.delete(fsPath);
  }

  public spliceVariableMapByFilePath(fsPath: string) {
    const projectPath: string =
      this.pathResolver.getProjectPathByFilePath(fsPath);
    const projectVariableMap = this.variableMap.get(projectPath);
    if (!projectVariableMap) return;

    for (const [key, value] of projectVariableMap) {
      for (const location of value.locations) {
        if (location.uri.fsPath === fsPath) {
          projectVariableMap.delete(key);
          break;
        }
      }
    }
  }

  public async spliceTransitionMapByFilePath(fsPath: string) {
    this.transitionMap.delete(fsPath);
  }

  public spliceCharacterMapByFilePath(fsPath: string) {
    const projectPath: string =
      this.pathResolver.getProjectPathByFilePath(fsPath);
    const characterMap = this.characterMap.get(projectPath);
    if (!characterMap) return;

    for (const characterData of characterMap) {
      characterData.deleteFaceByFilePath(fsPath);
    }
    for (const characterData of characterMap) {
      characterData.deleteLayerByFilePath(fsPath);
    }

    const updatedCharacterData = characterMap.filter((value: CharacterData) => {
      return value.location.uri.fsPath !== fsPath;
    });
    this.characterMap.set(projectPath, updatedCharacterData);
  }

  /**
   * タグ補完用のsuggestionsからマクロタグを削除
   */
  public async spliceSuggestionsByFilePath(
    projectPath: string,
    deleteTagList: string[],
  ) {
    const filteredDeleteTagList = deleteTagList.filter(
      (tag) => !this.defaultTagList.includes(tag),
    );

    if (0 < filteredDeleteTagList.length) {
      filteredDeleteTagList.forEach((tag) => {
        delete this.suggestions.get(projectPath)![tag];
      });
    }
  }

  /**
   * マクロ定義を登録し、逆引きMapとsuggestionsにも追加する
   */
  public registerMacro(
    projectPath: string,
    filePath: string,
    uuid: string,
    macroData: DefineMacroData,
  ) {
    this.defineMacroMap.get(projectPath)?.set(uuid, macroData);

    if (!this.macroByFilePath.has(filePath)) {
      this.macroByFilePath.set(filePath, new Set<string>());
    }
    this.macroByFilePath.get(filePath)!.add(uuid);

    if (
      !Object.prototype.hasOwnProperty.call(
        this.suggestions.get(projectPath)!,
        macroData.macroName,
      )
    ) {
      this.suggestions.get(projectPath)![macroData.macroName] =
        macroData.parseToJsonObject();
    }
  }
}
