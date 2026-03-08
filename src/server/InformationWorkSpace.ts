import * as fs from "fs";
import * as path from "path";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ResourceFileData } from "./defineData/ResourceFileData";
import { DefineMacroData } from "./defineData/DefineMacroData";
import { ErrorLevel, TyranoLogger } from "./TyranoLogger";
import { VariableData } from "./defineData/VariableData";
import { LabelData } from "./defineData/LabelData";
import { InformationExtension } from "./InformationExtension";
import { TransitionData } from "./defineData/TransitionData";
import { CharacterData } from "./defineData/CharacterData";
import { ProjectPathResolver } from "./ProjectPathResolver";
import { MapCacheManager } from "./MapCacheManager";
import { ScriptFileParser } from "./ScriptFileParser";
import { ScenarioFileParser } from "./ScenarioFileParser";

/**
 * ワークスペースディレクトリとdata/フォルダの中にある素材情報を管理するシングルトン（サーバー側）。
 * vscode API を一切使わず、設定値は initialize() で外部から注入される。
 */
export class InformationWorkSpace {
  private static instance: InformationWorkSpace = new InformationWorkSpace();

  private readonly pathResolver: ProjectPathResolver =
    new ProjectPathResolver();
  private cacheManager!: MapCacheManager;
  private scriptFileParser!: ScriptFileParser;
  private scenarioFileParser!: ScenarioFileParser;

  // パス定数のデリゲーション
  public get pathDelimiter() {
    return this.pathResolver.pathDelimiter;
  }
  public get DATA_DIRECTORY() {
    return this.pathResolver.DATA_DIRECTORY;
  }
  public get TYRANO_DIRECTORY() {
    return this.pathResolver.TYRANO_DIRECTORY;
  }
  public get DATA_BGIMAGE() {
    return this.pathResolver.DATA_BGIMAGE;
  }
  public get DATA_BGM() {
    return this.pathResolver.DATA_BGM;
  }
  public get DATA_FGIMAGE() {
    return this.pathResolver.DATA_FGIMAGE;
  }
  public get DATA_IMAGE() {
    return this.pathResolver.DATA_IMAGE;
  }
  public get DATA_OTHERS() {
    return this.pathResolver.DATA_OTHERS;
  }
  public get DATA_SCENARIO() {
    return this.pathResolver.DATA_SCENARIO;
  }
  public get DATA_SOUND() {
    return this.pathResolver.DATA_SOUND;
  }
  public get DATA_SYSTEM() {
    return this.pathResolver.DATA_SYSTEM;
  }
  public get DATA_VIDEO() {
    return this.pathResolver.DATA_VIDEO;
  }

  // データストレージ（Map群）
  public readonly scriptFileMap: Map<string, string> = new Map<
    string,
    string
  >();
  public readonly scenarioFileMap: Map<string, TextDocument> = new Map<
    string,
    TextDocument
  >();
  public readonly defineMacroMap: Map<string, Map<string, DefineMacroData>> =
    new Map<string, Map<string, DefineMacroData>>();
  private macroByFilePath: Map<string, Set<string>> = new Map<
    string,
    Set<string>
  >();
  public readonly resourceFileMap: Map<string, ResourceFileData[]> = new Map<
    string,
    ResourceFileData[]
  >();
  public readonly variableMap: Map<string, Map<string, VariableData>> = new Map<
    string,
    Map<string, VariableData>
  >();
  public readonly labelMap: Map<string, LabelData[]> = new Map<
    string,
    LabelData[]
  >();
  public suggestions: Map<string, object> = new Map<string, object>();
  public characterMap: Map<string, CharacterData[]> = new Map<
    string,
    CharacterData[]
  >();
  public transitionMap: Map<string, TransitionData[]> = new Map<
    string,
    TransitionData[]
  >();
  private defaultTagList: string[] = [];

  // 設定値（initialize() で注入）
  public resourceExtensions: object = {};
  public resourceExtensionsArrays: string[] = [];
  private pluginTags: object = {};

  public extensionPath: string = "";

  private constructor() {}

  /**
   * サーバー初期化時に呼び出す。設定値をクライアントから受け取る。
   */
  public initialize(config: {
    workspaceRoot: string;
    isParsePluginFolder: boolean;
    resourceExtensions: object;
    pluginTags: object;
  }) {
    this.resourceExtensions = config.resourceExtensions;
    this.resourceExtensionsArrays = Object.keys(this.resourceExtensions)
      .map((key) => this.resourceExtensions[key])
      .flat();
    this.pluginTags = JSON.parse(JSON.stringify(config.pluginTags));

    this.pathResolver.initialize(
      config.workspaceRoot,
      config.isParsePluginFolder,
    );

    this.initSubModules();
  }

  private initSubModules() {
    this.cacheManager = new MapCacheManager(this.pathResolver, {
      scriptFileMap: this.scriptFileMap,
      scenarioFileMap: this.scenarioFileMap,
      defineMacroMap: this.defineMacroMap,
      macroByFilePath: this.macroByFilePath,
      resourceFileMap: this.resourceFileMap,
      variableMap: this.variableMap,
      labelMap: this.labelMap,
      suggestions: this.suggestions,
      characterMap: this.characterMap,
      transitionMap: this.transitionMap,
      defaultTagList: this.defaultTagList,
      resourceExtensions: this.resourceExtensions,
    });
    this.scriptFileParser = new ScriptFileParser(
      this.pathResolver,
      this.cacheManager,
      this.scriptFileMap,
    );
    this.scenarioFileParser = new ScenarioFileParser(
      this.pathResolver,
      this.cacheManager,
      {
        scenarioFileMap: this.scenarioFileMap,
        labelMap: this.labelMap,
        variableMap: this.variableMap,
        characterMap: this.characterMap,
        transitionMap: this.transitionMap,
        suggestions: this.suggestions,
        pluginTags: this.pluginTags,
      },
    );
  }

  public static getInstance(): InformationWorkSpace {
    return this.instance;
  }

  private getSnippetPath(): string {
    return InformationExtension.language === "ja"
      ? path.join(
          InformationExtension.path +
            `${path.sep}snippet${path.sep}tyrano.snippet.json`,
        )
      : path.join(
          InformationExtension.path +
            `${path.sep}snippet${path.sep}en.tyrano.snippet.json`,
        );
  }

  public async initializeMaps() {
    TyranoLogger.print(`InformationWorkSpace.initializeMaps()`);

    for (const projectPath of this.getTyranoScriptProjectRootPaths()) {
      TyranoLogger.print(`${projectPath} variable initialzie start`);
      this.defineMacroMap.set(projectPath, new Map<string, DefineMacroData>());
      this.macroByFilePath.clear();
      this.resourceFileMap.set(projectPath, []);
      this.variableMap.set(projectPath, new Map<string, VariableData>());
      try {
        const passJoined = this.getSnippetPath();
        const jsonData = fs.readFileSync(passJoined, "utf8");
        const parsedJson = JSON.parse(jsonData);
        const combinedObject = { ...parsedJson, ...this.pluginTags };

        this.defaultTagList = Object.keys(parsedJson);
        this.defaultTagList.push(...Object.keys(this.pluginTags));
        this.cacheManager.updateDefaultTagList(this.defaultTagList);
        this.suggestions.set(projectPath, combinedObject);
        if (Object.keys(this.suggestions.get(projectPath)!).length === 0) {
          throw new Error("suggestions is empty");
        }
      } catch (error) {
        TyranoLogger.print(
          "passJoin or JSON.parse or readFile Sync failed",
          ErrorLevel.ERROR,
        );
        TyranoLogger.printStackTrace(error);
      }
      this.characterMap.set(projectPath, []);
      TyranoLogger.print(`${projectPath} variable initialzie end`);
    }

    for (const projectPath of this.getTyranoScriptProjectRootPaths()) {
      TyranoLogger.print(`${projectPath} is loading...`);
      // スクリプトファイル
      TyranoLogger.print(`${projectPath}'s scripts is loading...`);
      const absoluteScriptFilePaths = this.getProjectFiles(
        projectPath + this.DATA_DIRECTORY,
        [".js"],
        true,
      );
      await Promise.all(
        absoluteScriptFilePaths.map(async (i) => {
          await this.updateScriptFileMap(i);
          await this.updateMacroDataMapByJs(i);
        }),
      );
      // シナリオファイル
      TyranoLogger.print(`${projectPath}'s scenarios is loading...`);
      const absoluteScenarioFilePaths = this.getProjectFiles(
        projectPath + this.DATA_DIRECTORY,
        [".ks"],
        true,
      );
      await Promise.all(
        absoluteScenarioFilePaths.map(async (i) => {
          await this.updateScenarioFileMap(i);
          await this.updateMacroLabelVariableDataMapByKs(i);
        }),
      );
      // リソースファイル
      TyranoLogger.print(`${projectPath}'s resource file is loading...`);
      const absoluteResourceFilePaths = this.getProjectFiles(
        projectPath + this.DATA_DIRECTORY,
        this.resourceExtensionsArrays,
        true,
      );
      await Promise.all(
        absoluteResourceFilePaths.map(async (i) => {
          await this.addResourceFileMap(i);
        }),
      );
    }
  }

  // ── ProjectPathResolver デリゲーション ──
  public getWorkspaceRootPath(): string {
    return this.pathResolver.getWorkspaceRootPath();
  }
  public getTyranoScriptProjectRootPaths(): string[] {
    return this.pathResolver.getTyranoScriptProjectRootPaths();
  }
  public getProjectPathByFilePath(filePath: string): string {
    return this.pathResolver.getProjectPathByFilePath(filePath);
  }
  public getProjectFiles(
    projectRootPath: string,
    permissionExtension: string[] = [],
    isAbsolute: boolean = false,
  ): string[] {
    return this.pathResolver.getProjectFiles(
      projectRootPath,
      permissionExtension,
      isAbsolute,
    );
  }
  public isSamePath(path1: string, path2: string) {
    return this.pathResolver.isSamePath(path1, path2);
  }
  public convertToAbsolutePathFromRelativePath(relativePath: string): string {
    return this.pathResolver.convertToAbsolutePathFromRelativePath(
      relativePath,
    );
  }
  public isSkipParse(filePath: string, directory: string): boolean {
    return this.pathResolver.isSkipParse(filePath, directory);
  }

  // ── MapCacheManager デリゲーション ──
  public async updateScriptFileMap(filePath: string) {
    return this.cacheManager.updateScriptFileMap(filePath);
  }
  public async updateScenarioFileMap(filePath: string) {
    return this.cacheManager.updateScenarioFileMap(filePath);
  }
  public async addResourceFileMap(filePath: string) {
    return this.cacheManager.addResourceFileMap(filePath);
  }
  public async spliceResourceFileMapByFilePath(filePath: string) {
    return this.cacheManager.spliceResourceFileMapByFilePath(filePath);
  }
  public async spliceScenarioFileMapByFilePath(filePath: string) {
    return this.cacheManager.spliceScenarioFileMapByFilePath(filePath);
  }
  public async spliceScriptFileMapByFilePath(filePath: string) {
    return this.cacheManager.spliceScriptFileMapByFilePath(filePath);
  }
  public async spliceMacroDataMapByFilePath(filePath: string) {
    return this.cacheManager.spliceMacroDataMapByFilePath(filePath);
  }
  public async spliceLabelMapByFilePath(fsPath: string) {
    return this.cacheManager.spliceLabelMapByFilePath(fsPath);
  }
  public spliceVariableMapByFilePath(fsPath: string) {
    return this.cacheManager.spliceVariableMapByFilePath(fsPath);
  }
  public async spliceTransitionMapByFilePath(fsPath: string) {
    return this.cacheManager.spliceTransitionMapByFilePath(fsPath);
  }
  public spliceCharacterMapByFilePath(fsPath: string) {
    return this.cacheManager.spliceCharacterMapByFilePath(fsPath);
  }
  public async spliceSuggestionsByFilePath(
    projectPath: string,
    deleteTagList: string[],
  ) {
    return this.cacheManager.spliceSuggestionsByFilePath(
      projectPath,
      deleteTagList,
    );
  }

  // ── ScriptFileParser デリゲーション ──
  public async updateMacroDataMapByJs(absoluteScenarioFilePath: string) {
    return this.scriptFileParser.updateMacroDataMapByJs(
      absoluteScenarioFilePath,
    );
  }

  // ── ScenarioFileParser デリゲーション ──
  public async updateMacroLabelVariableDataMapByKs(
    absoluteScenarioFilePath: string,
  ) {
    return this.scenarioFileParser.updateMacroLabelVariableDataMapByKs(
      absoluteScenarioFilePath,
    );
  }
}
