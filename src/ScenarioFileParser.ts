import * as vscode from "vscode";
import { DefineMacroData } from "./defineData/DefineMacroData";
import { VariableData } from "./defineData/VariableData";
import { LabelData } from "./defineData/LabelData";
import { Parser } from "./Parser";
import { TransitionData } from "./defineData/TransitionData";
import { MacroParameterExtractor } from "./MacroParameterExtractor";
import { CharacterData } from "./defineData/CharacterData";
import { CharacterFaceData } from "./defineData/CharacterFaceData";
import { CharacterLayerData } from "./defineData/CharacterLayerData";
import { ProjectPathResolver } from "./ProjectPathResolver";
import { MapCacheManager } from "./MapCacheManager";
import * as crypto from "crypto";

/**
 * .ksファイルの解析中に使用するパースコンテキスト。
 */
interface ParseContext {
  currentLabel: string;
  isMacro: boolean;
  macroData: DefineMacroData | null;
  description: string;
}

/**
 * .ksファイルの解析・データ抽出を担当するクラス。
 * updateMacroLabelVariableDataMapByKs をタグ別ハンドラに分割して管理する。
 */
export class ScenarioFileParser {
  private parser: Parser = Parser.getInstance();
  private pathResolver: ProjectPathResolver;
  private cacheManager: MapCacheManager;

  // InformationWorkSpaceが保有するMapへの参照
  private scenarioFileMap: Map<string, vscode.TextDocument>;
  private labelMap: Map<string, LabelData[]>;
  private variableMap: Map<string, Map<string, VariableData>>;
  private characterMap: Map<string, CharacterData[]>;
  private transitionMap: Map<string, TransitionData[]>;
  private suggestions: Map<string, object>;
  private pluginTags: object;

  constructor(
    pathResolver: ProjectPathResolver,
    cacheManager: MapCacheManager,
    maps: {
      scenarioFileMap: Map<string, vscode.TextDocument>;
      labelMap: Map<string, LabelData[]>;
      variableMap: Map<string, Map<string, VariableData>>;
      characterMap: Map<string, CharacterData[]>;
      transitionMap: Map<string, TransitionData[]>;
      suggestions: Map<string, object>;
      pluginTags: object;
    },
  ) {
    this.pathResolver = pathResolver;
    this.cacheManager = cacheManager;
    this.scenarioFileMap = maps.scenarioFileMap;
    this.labelMap = maps.labelMap;
    this.variableMap = maps.variableMap;
    this.characterMap = maps.characterMap;
    this.transitionMap = maps.transitionMap;
    this.suggestions = maps.suggestions;
    this.pluginTags = maps.pluginTags;
  }

  /**
   * .ksファイルを構文解析し、マクロ・ラベル・変数・キャラクター・トランジションデータを登録する。
   */
  public async updateMacroLabelVariableDataMapByKs(
    absoluteScenarioFilePath: string,
  ) {
    const scenarioData = this.scenarioFileMap.get(absoluteScenarioFilePath);
    const projectPath = this.pathResolver.getProjectPathByFilePath(
      absoluteScenarioFilePath,
    );

    if (scenarioData == undefined) {
      return;
    }

    const parsedData = this.parser.parseText(scenarioData.getText());
    this.labelMap.set(absoluteScenarioFilePath, new Array<LabelData>());
    this.transitionMap.set(
      absoluteScenarioFilePath,
      new Array<TransitionData>(),
    );

    // 該当ファイルに登録されているマクロ、変数、タグ、nameを一度リセット
    const deleteTagList = await this.cacheManager.spliceMacroDataMapByFilePath(
      absoluteScenarioFilePath,
    );
    this.cacheManager.spliceVariableMapByFilePath(absoluteScenarioFilePath);
    this.cacheManager.spliceCharacterMapByFilePath(absoluteScenarioFilePath);
    await this.cacheManager.spliceSuggestionsByFilePath(
      projectPath,
      deleteTagList,
    );

    const ctx: ParseContext = {
      currentLabel: "NONE",
      isMacro: false,
      macroData: null,
      description: "",
    };

    for (const data of parsedData) {
      if (ctx.isMacro) {
        const extractor: MacroParameterExtractor =
          new MacroParameterExtractor();
        extractor.extractMacroParameters(
          data,
          ctx.macroData,
          this.scenarioFileMap,
          this.suggestions,
          projectPath,
        );
      }

      const tagName = await data["name"];
      switch (tagName) {
        case "macro":
          this.processMacroTag(
            data,
            scenarioData,
            absoluteScenarioFilePath,
            ctx,
          );
          break;
        case "label":
          await this.processLabelTag(
            data,
            scenarioData,
            absoluteScenarioFilePath,
            ctx,
          );
          break;
        case "eval":
          await this.processEvalTag(data, scenarioData, projectPath);
          break;
        case "chara_new":
          await this.processCharaNewTag(data, scenarioData, projectPath);
          break;
        case "chara_face":
          await this.processCharaFaceTag(data, scenarioData, projectPath);
          break;
        case "chara_layer":
          await this.processCharaLayerTag(data, scenarioData, projectPath);
          break;
        case "endmacro":
          this.processEndMacroTag(projectPath, absoluteScenarioFilePath, ctx);
          break;
      }

      // description管理
      if (tagName === "comment") {
        if (await data["val"]) {
          ctx.description += (await data["val"]) + "\n";
        }
      } else {
        ctx.description = "";
      }

      // transitionデータの登録
      if (
        TransitionData.jumpTags.includes(tagName) &&
        ctx.currentLabel !== "/"
      ) {
        await this.processTransitionTag(
          data,
          absoluteScenarioFilePath,
          ctx.currentLabel,
        );
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processMacroTag(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    scenarioData: vscode.TextDocument,
    absoluteScenarioFilePath: string,
    ctx: ParseContext,
  ) {
    const macroName: string = data["pm"]["name"];
    if (!this.pluginTags[macroName]) {
      ctx.isMacro = true;
      ctx.macroData = new DefineMacroData(
        macroName,
        new vscode.Location(
          scenarioData.uri,
          new vscode.Position(data["line"], data["column"]),
        ),
        absoluteScenarioFilePath,
        ctx.description,
      );
    }
  }

  private async processLabelTag(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    scenarioData: vscode.TextDocument,
    absoluteScenarioFilePath: string,
    ctx: ParseContext,
  ) {
    if ((await data["pm"]["label_name"]) !== "/") {
      ctx.currentLabel = await data["pm"]["label_name"];
      if (!ctx.currentLabel.startsWith("*")) {
        ctx.currentLabel = "*" + ctx.currentLabel;
      }
    }
    this.labelMap
      .get(absoluteScenarioFilePath)
      ?.push(
        new LabelData(
          await data["pm"]["label_name"],
          new vscode.Location(
            scenarioData.uri,
            new vscode.Position(await data["line"], await data["column"]),
          ),
          "" + ctx.description + "\n",
        ),
      );
  }

  private async processEvalTag(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    scenarioData: vscode.TextDocument,
    projectPath: string,
  ) {
    const [variableBase, variableValue] = data["pm"]["exp"]
      .split("=")
      .map((str: string) => str.trim());
    const [variableType, variableName] = variableBase.split(".");
    if (!this.variableMap.get(projectPath)?.get(variableName)) {
      this.variableMap
        .get(projectPath)
        ?.set(
          variableName,
          new VariableData(variableName, variableValue, variableType),
        );
    }
    const location = new vscode.Location(
      scenarioData.uri,
      new vscode.Position(await data["line"], await data["column"]),
    );
    this.variableMap.get(projectPath)?.get(variableName)?.addLocation(location);
  }

  private async processCharaNewTag(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    scenarioData: vscode.TextDocument,
    projectPath: string,
  ) {
    const location = new vscode.Location(
      scenarioData.uri,
      new vscode.Position(await data["line"], await data["column"]),
    );
    const jname = data["pm"]["jname"] || "";
    const characterData = new CharacterData(
      data["pm"]["name"],
      jname,
      location,
    );
    this.characterMap.get(projectPath)?.push(characterData);
  }

  private async processCharaFaceTag(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    scenarioData: vscode.TextDocument,
    projectPath: string,
  ) {
    const characterData = this.characterMap
      .get(projectPath)
      ?.find((value) => value.name === data["pm"]["name"]);
    const faceName: string | undefined = data["pm"]["name"];
    const face: string | undefined = data["pm"]["face"];
    if (characterData && faceName && face) {
      const updateCharacterFaceData: CharacterFaceData = new CharacterFaceData(
        faceName,
        face,
        new vscode.Location(
          scenarioData.uri,
          new vscode.Position(await data["line"], await data["column"]),
        ),
      );
      characterData.addFace(updateCharacterFaceData);
      const index = this.characterMap
        .get(projectPath)
        ?.findIndex((value) => value.name === data["pm"]["name"]);
      if (index !== undefined) {
        this.characterMap.get(projectPath)?.splice(index, 1, characterData);
      }
    }
  }

  private async processCharaLayerTag(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    scenarioData: vscode.TextDocument,
    projectPath: string,
  ) {
    const updateCharacterData = this.characterMap
      .get(projectPath)
      ?.find((value) => value.name === data["pm"]["name"]);
    const layerName = data["pm"]["name"];
    const part = data["pm"]["part"];
    const id = data["pm"]["id"];

    if (updateCharacterData && layerName && part && id) {
      const characterLayerData: CharacterLayerData = new CharacterLayerData(
        layerName,
        part,
        id,
        new vscode.Location(
          scenarioData.uri,
          new vscode.Position(await data["line"], await data["column"]),
        ),
      );
      updateCharacterData.addLayer(part, characterLayerData);
      const index = this.characterMap
        .get(projectPath)
        ?.findIndex((value) => value.name === data["pm"]["name"]);
      if (index !== undefined) {
        this.characterMap
          .get(projectPath)
          ?.splice(index, 1, updateCharacterData);
      }
    }
  }

  private processEndMacroTag(
    projectPath: string,
    absoluteScenarioFilePath: string,
    ctx: ParseContext,
  ) {
    if (ctx.isMacro && ctx.macroData) {
      const uuid = crypto.randomUUID();
      this.cacheManager.registerMacro(
        projectPath,
        absoluteScenarioFilePath,
        uuid,
        ctx.macroData,
      );
    }
    ctx.isMacro = false;
    ctx.macroData = null;
  }

  private async processTransitionTag(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    absoluteScenarioFilePath: string,
    currentLabel: string,
  ) {
    const range = new vscode.Range(
      new vscode.Position(await data["line"], 0),
      new vscode.Position(await data["line"], 0),
    );
    const uri = vscode.Uri.file(absoluteScenarioFilePath);
    const tagName = await data["name"];
    const storage = (await data["pm"]["storage"]) || undefined;
    let target = (await data["pm"]["target"]) || undefined;
    if (target && !target.startsWith("*")) {
      target = "*" + target;
    }
    const condition = (await data["pm"]["cond"]) || undefined;
    const location = new vscode.Location(uri, range);
    const transition: TransitionData = new TransitionData(
      tagName,
      storage,
      target,
      currentLabel,
      condition,
      location,
    );
    this.transitionMap.get(absoluteScenarioFilePath)?.push(transition);
  }
}
