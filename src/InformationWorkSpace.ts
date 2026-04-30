import * as fs from "fs";
import * as vscode from "vscode";
import * as path from "path";
import { ResourceFileData } from "./defineData/ResourceFileData";
import { DefineMacroData } from "./defineData/DefineMacroData";
import { ErrorLevel, TyranoLogger } from "./TyranoLogger";
import { VariableData } from "./defineData/VariableData";
import { LabelData } from "./defineData/LabelData";
import { MacroParameterData } from "./defineData/MacroParameterData";
import { Parser } from "./Parser";
import { InformationExtension } from "./InformationExtension";
import { TransitionData } from "./defineData/TransitionData";
import { MacroParameterExtractor } from "./MacroParameterExtractor";

import * as babel from "@babel/parser";
import traverse from "@babel/traverse";
import { CharacterData } from "./defineData/CharacterData";
import { CharacterFaceData } from "./defineData/CharacterFaceData";
import { CharacterLayerData } from "./defineData/CharacterLayerData";
import * as crypto from "crypto";

/**
 * ワークスペースディレクトリとか、data/フォルダの中にある素材情報とか。
 * シングルトン。
 */
export class InformationWorkSpace {
  private static instance: InformationWorkSpace = new InformationWorkSpace();
  private parser: Parser = Parser.getInstance();
  public pathDelimiter = process.platform === "win32" ? "\\" : "/";
  public readonly DATA_DIRECTORY: string = this.pathDelimiter + "data"; //projectRootPath/data
  public readonly TYRANO_DIRECTORY: string = this.pathDelimiter + "tyrano"; //projectRootPath/tyrano
  public readonly DATA_BGIMAGE: string = this.pathDelimiter + "bgimage";
  public readonly DATA_BGM: string = this.pathDelimiter + "bgm";
  public readonly DATA_FGIMAGE: string = this.pathDelimiter + "fgimage";
  public readonly DATA_IMAGE: string = this.pathDelimiter + "image";
  public readonly DATA_OTHERS: string = this.pathDelimiter + "others";
  public readonly DATA_SCENARIO: string = this.pathDelimiter + "scenario";
  public readonly DATA_SOUND: string = this.pathDelimiter + "sound";
  public readonly DATA_SYSTEM: string = this.pathDelimiter + "system";
  public readonly DATA_VIDEO: string = this.pathDelimiter + "video";

  private _scriptFileMap: Map<string, string> = new Map<string, string>(); //ファイルパスと、中身(全文)
  private _scenarioFileMap: Map<string, vscode.TextDocument> = new Map<
    string,
    vscode.TextDocument
  >(); //ファイルパスと、中身(全文)
  private _defineMacroMap: Map<string, Map<string, DefineMacroData>> = new Map<
    string,
    Map<string, DefineMacroData>
  >(); //マクロ名と、マクロデータ defineMacroMapの値をもとに生成して保持するやつ <projectPath, <macroName,macroData>>

  // マクロ検索最適化用の逆引きMap (ファイルパス -> マクロUUIDのSet)
  private _macroByFilePath: Map<string, Set<string>> = new Map<string, Set<string>>();

  private _resourceFileMap: Map<string, ResourceFileData[]> = new Map<
    string,
    ResourceFileData[]
  >(); //pngとかmp3とかのプロジェクトにあるリソースファイル
  private _variableMap: Map<string, Map<string, VariableData>> = new Map<
    string,
    Map<string, VariableData>
  >(); //projectpath,変数名と、定義情報
  private _labelMap: Map<string, LabelData[]> = new Map<string, LabelData[]>(); //ファイルパス、LabelDataの配列
  private _suggestions: Map<string, object> = new Map<string, object>(); //projectPath,入力候補のオブジェクト
  private _characterMap: Map<string, CharacterData[]> = new Map<
    string,
    CharacterData[]
  >(); //プロジェクトパスと、キャラクターデータ
  private _transitionMap: Map<string, TransitionData[]> = new Map<
    string,
    TransitionData[]
  >(); //ファイル名、TransitionDataの配列
  private defaultTagList: string[] = [];

  private _resourceExtensions: object = vscode.workspace
    .getConfiguration()
    .get("TyranoScript syntax.resource.extension")!;
  private _resourceExtensionsArrays: string[] = Object.keys(
    this.resourceExtensions,
  )
    .map((key) => this.resourceExtensions[key])
    .flat(); //resourceExtensionsをオブジェクトからstring型の一次配列にする

  /**
   * `TyranoScript syntax.resource.extension` 設定を読み直して
   * `_resourceExtensions` / `_resourceExtensionsArrays` を再構築する。
   * 設定変更時に呼び出す。
   */
  public reloadResourceExtensions(): void {
    this._resourceExtensions =
      vscode.workspace
        .getConfiguration()
        .get("TyranoScript syntax.resource.extension") ?? {};
    this._resourceExtensionsArrays = Object.keys(this._resourceExtensions)
      .map((key) => this._resourceExtensions[key])
      .flat();
  }
  private readonly pluginTags: object = JSON.parse(
    JSON.stringify(
      vscode.workspace
        .getConfiguration()
        .get("TyranoScript syntax.plugin.parameter")!,
    ),
  );
  private readonly isParsePluginFolder: boolean = vscode.workspace
    .getConfiguration()
    .get("TyranoScript syntax.parser.read_plugin")!;
  private readonly autoLoadPluginTags: boolean =
    vscode.workspace
      .getConfiguration()
      .get<boolean>("TyranoScript syntax.parser.autoLoadPluginTags") ?? true;

  // <projectPath, <pluginName, Set<paramName>>> プラグインフォルダのinit.ksから抽出したmp.*パラメータ
  private _pluginParameterMap: Map<string, Map<string, Set<string>>> = new Map<
    string,
    Map<string, Set<string>>
  >();

  private _extensionPath: string = "";

  private constructor() {}
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

  /**
   * マップファイルの初期化。
   * 本当はコンストラクタに書きたいのですがコンストラクタはasync使えないのでここに。await initializeMaps();の形でコンストラクタの直後に呼んで下さい。
   */
  public async initializeMaps() {
    TyranoLogger.print(`InformationWorkSpace.initializeMaps()`);
    vscode.workspace.workspaceFolders?.forEach((value) => {
      TyranoLogger.print(`Opening workspace is ${value.uri.fsPath}`);
    });

    this._macroByFilePath.clear();
    for (const projectPath of this.getTyranoScriptProjectRootPaths()) {
      await this.addProject(projectPath);
    }
  }

  /**
   * 単一プロジェクトのキャッシュを初期化し、data/配下のファイルをロードする。
   * すでに初期化済み（resourceFileMapにキーが存在）であれば何もしない。
   * ワークスペースフォルダ追加時のキャッチアップに用いる。
   */
  public async addProject(projectPath: string): Promise<void> {
    if (this._resourceFileMap.has(projectPath)) {
      return;
    }
    TyranoLogger.print(`${projectPath} variable initialzie start`);
    this.defineMacroMap.set(projectPath, new Map<string, DefineMacroData>());
    this._resourceFileMap.set(projectPath, []);
    this.variableMap.set(projectPath, new Map<string, VariableData>());
    try {
      const passJoined = this.getSnippetPath();
      const jsonData = fs.readFileSync(passJoined, "utf8");
      const parsedJson = JSON.parse(jsonData);
      const combinedObject = { ...parsedJson, ...this.pluginTags };

      this.defaultTagList = Object.keys(parsedJson);
      this.defaultTagList.push(...Object.keys(this.pluginTags));
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
    this._pluginParameterMap.set(projectPath, new Map<string, Set<string>>());
    TyranoLogger.print(`${projectPath} variable initialzie end`);

    TyranoLogger.print(`${projectPath} is loading...`);
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
    TyranoLogger.print(`${projectPath}'s scenarios is loading...`);
    const absoluteScenarioFilePaths = await this.getProjectFiles(
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
    TyranoLogger.print(`${projectPath}'s plugin init.ks is loading...`);
    const pluginInitKsPaths = absoluteScenarioFilePaths.filter(
      (p) =>
        this.isPluginFile(p, projectPath) && path.basename(p) === "init.ks",
    );
    await Promise.all(
      pluginInitKsPaths.map(async (p) => {
        await this.updatePluginParamsFromInitKs(p);
      }),
    );
    TyranoLogger.print(`${projectPath}'s resource file is loading...`);
    const absoluteResourceFilePaths = this.getProjectFiles(
      projectPath + this.DATA_DIRECTORY,
      this.resourceExtensionsArrays,
      true,
    );
    await Promise.all(
      absoluteResourceFilePaths.map(
        async (i) => await this.addResourceFileMap(i),
      ),
    );
    TyranoLogger.print(`${projectPath} is loaded.`);
  }

  /**
   * プロジェクトに紐づくキャッシュを全て削除する。
   * ワークスペースフォルダから外されたプロジェクトのクリーンアップに用いる。
   */
  public removeProject(projectPath: string): void {
    if (!projectPath) return;
    TyranoLogger.print(`removeProject: ${projectPath}`);

    this.defineMacroMap.delete(projectPath);
    this._resourceFileMap.delete(projectPath);
    this.variableMap.delete(projectPath);
    this.characterMap.delete(projectPath);
    this._pluginParameterMap.delete(projectPath);
    this.suggestions.delete(projectPath);

    const projectPrefix = projectPath + this.pathDelimiter;
    const isUnderProject = (key: string) =>
      key === projectPath || key.startsWith(projectPrefix);

    for (const key of [...this._scenarioFileMap.keys()]) {
      if (isUnderProject(key)) this._scenarioFileMap.delete(key);
    }
    for (const key of [...this._scriptFileMap.keys()]) {
      if (isUnderProject(key)) this._scriptFileMap.delete(key);
    }
    for (const key of [...this._labelMap.keys()]) {
      if (isUnderProject(key)) this._labelMap.delete(key);
    }
    for (const key of [...this._transitionMap.keys()]) {
      if (isUnderProject(key)) this._transitionMap.delete(key);
    }
    for (const key of [...this._macroByFilePath.keys()]) {
      if (isUnderProject(key)) this._macroByFilePath.delete(key);
    }
  }

  /**
   * フォルダを開いてるなら、vscodeで開いているルートパスのディレクトリを取得します。
   * フォルダを開いてない場合、undefined.
   * @returns プロジェクトのルートパス。フォルダを開いていないならundefined.
   */
  public getWorkspaceRootPath(): string {
    //フォルダ開いてない場合、相対パスたどってプロジェクトのルートパス取ろうと思ったけど万が一Cドライブ直下とかにアクセスすると大惨事なのでNG.
    if (vscode.workspace.workspaceFolders === undefined) {
      return "";
    }
    return vscode.workspace.workspaceFolders[0].uri.fsPath;
  }

  /**
   * vscodeで開いたフォルダ内に存在するティラノスクリプトのプロジェクトのパスを取得します。
   * @returns
   */
  public getTyranoScriptProjectRootPaths(): string[] {
    //フォルダ開いてないなら早期リターン
    if (this.getWorkspaceRootPath() === undefined) {
      return [];
    }

    // 指定したファイルパスの中のファイルのうち、index.htmlがあるディレクトリを返却。
    const listFiles = (dir: string): string[] => {
      try {
        return fs.readdirSync(dir, { withFileTypes: true }).flatMap((dirent) =>
          dirent.name === ".git"
            ? [] // .git ディレクトリを無視
            : dirent.isFile()
              ? [`${dir}${this.pathDelimiter}${dirent.name}`]
                  .filter((_file) => dirent.name === "index.html")
                  .map((str) =>
                    str.replace(this.pathDelimiter + "index.html", ""),
                  )
              : listFiles(`${dir}${this.pathDelimiter}${dirent.name}`),
        );
      } catch (_error) {
        // ディレクトリアクセスに失敗した場合は空配列を返す
        return [];
      }
    };

    const ret = listFiles(this.getWorkspaceRootPath());

    return ret;
  }

  /**
   * スクリプトファイルパスとその中身のMapを更新
   * @param filePath
   */
  public async updateScriptFileMap(filePath: string) {
    if (path.extname(filePath) !== ".js") {
      return;
    }
    // vscodeAPIを使うとESLintも起動してしまうため、fsモジュールで読み込む。
    // fsモジュールによる読み込みが不要になったら以下二行の処理に戻すこと。
    // let textDocument = await vscode.workspace.openTextDocument(filePath);
    // this._scriptFileMap.set(textDocument.fileName, textDocument.getText());

    try {
      // fs.readFileSyncは常にディスクから最新の内容を読み込むため、
      // キャッシュの無効化処理は不要（updateScenarioFileMapとは異なる）
      this._scriptFileMap.set(filePath, fs.readFileSync(filePath, "utf-8"));
    } catch (error) {
      // ファイルが存在しない場合はキャッシュから削除
      this._scriptFileMap.delete(filePath);
      TyranoLogger.print(
        `Script file read failed for ${filePath}, removed from cache`,
        ErrorLevel.WARN,
      );
      throw error;
    }
  }
  public async updateScenarioFileMap(filePath: string) {
    //.ks拡張子以外ならシナリオではないのでreturn
    if (path.extname(filePath) !== ".ks") {
      return;
    }

    // 外部ファイルの変更後に最新のコンテンツを確実に取得するために、ドキュメントを強制的にリロードします。
    // ドキュメントがすでにキャッシュにあるかどうかを確認します
    const existingDoc = this._scenarioFileMap.get(filePath);
    if (existingDoc) {
      // If the document exists in cache, verify it's up to date by reading from disk
      try {
        const diskContent = fs.readFileSync(filePath, "utf-8");
        const cachedContent = existingDoc.getText();

        // コンテンツが異なる場合、ドキュメントは古いため、キャッシュから削除します
        if (diskContent !== cachedContent) {
          this._scenarioFileMap.delete(filePath);
          TyranoLogger.print(
            `Document cache invalidated for ${filePath} due to external changes`,
          );
        }
      } catch (error) {
        // If we can't read the file, remove it from cache
        console.log(error);
        this._scenarioFileMap.delete(filePath);
        TyranoLogger.print(
          `Document cache invalidated for ${filePath} due to read error`,
          ErrorLevel.WARN,
        );
      }
    }

    // Open (or reopen) the document to get the latest version
    const textDocument = await vscode.workspace.openTextDocument(filePath);
    this._scenarioFileMap.set(textDocument.fileName, textDocument);
  }

  public async updateMacroDataMapByJs(absoluteScenarioFilePath: string) {
    TyranoLogger.print(
      `InformationWorkSpace.updateMacroDataMapByJs(${absoluteScenarioFilePath})`,
    );
    // const reg = /[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\uFF00-\uFF9F\uFF65-\uFF9F_]/g; //日本語も許容したいときはこっち.でも動作テストしてないからとりあえずは半角英数のみで
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
    const projectPath: string = await this.getProjectPathByFilePath(
      absoluteScenarioFilePath,
    );

    // プラグインフォルダ配下の.jsは、isSkipParseで早期returnせずに
    // タグ定義抽出のみを行う（read_pluginが既定falseでもタグを発見するため）。
    const isPluginFile =
      this.autoLoadPluginTags &&
      !!projectPath &&
      this.isPluginFile(absoluteScenarioFilePath, projectPath);

    if (
      !isPluginFile &&
      this.isSkipParse(absoluteScenarioFilePath, projectPath)
    ) {
      return;
    }
    const deleteTagList = await this.spliceMacroDataMapByFilePath(
      absoluteScenarioFilePath,
    );
    await this.spliceSuggestionsByFilePath(projectPath, deleteTagList);
    try {
      traverse(parsedData, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        enter: (path: any) => {
          try {
            //path.parentPathの値がTYRANO.kag.ftag.master_tag.MacroNameの形なら
            const dotMatch =
              path != null &&
              path.parentPath != null &&
              path.parentPath.type === "AssignmentExpression" &&
              (reg2.test(path.parentPath.toString()) ||
                reg3.test(path.parentPath.toString()));

            // tag["NAME"] 形式（computed string key）の代入も検出する
            let computedTagName: string | undefined;
            if (
              !dotMatch &&
              path != null &&
              path.parentPath != null &&
              path.parentPath.type === "AssignmentExpression" &&
              path.node?.type === "MemberExpression" &&
              path.node?.computed === true &&
              (path.node?.property?.type === "StringLiteral" ||
                path.node?.property?.type === "Literal")
            ) {
              const objectStr = this.babelNodeToSource(path.node.object);
              if (
                objectStr === "tyrano.plugin.kag.tag" ||
                objectStr === "TYRANO.kag.ftag.master_tag"
              ) {
                computedTagName = String(
                  path.node.property.value ?? path.node.property.name ?? "",
                );
              }
            }

            if (dotMatch || computedTagName) {
              const macroName: string =
                computedTagName ?? path.toString().split(".")[4]; //MacroNameの部分を抽出
              if (macroName) {
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
                // プラグインフォルダ配下のJSなら、代入式の右辺ObjectExpressionから
                // pm（パラメータ）とvital（必須パラメータ）を抽出する。
                const extracted = isPluginFile
                  ? this.extractPmAndVitalFromAssignment(
                      path.parentPath?.node,
                    )
                  : null;
                if (extracted && extracted.params.length > 0) {
                  for (const p of extracted.params) {
                    macroData.parameter.push(p);
                  }
                } else {
                  macroData.parameter.push(
                    new MacroParameterData("parameter", false, "description"),
                  ); //TODO:パーサーでパラメータの情報読み込んで追加する
                }

                const uuid = crypto.randomUUID();
                this.defineMacroMap.get(projectPath)?.set(uuid, macroData);

                // 逆引きMapに登録
                if (!this._macroByFilePath.has(absoluteScenarioFilePath)) {
                  this._macroByFilePath.set(absoluteScenarioFilePath, new Set<string>());
                }
                this._macroByFilePath.get(absoluteScenarioFilePath)!.add(uuid);

                //suggetionsに登録されてない場合のみ追加
                if (
                  !Object.prototype.hasOwnProperty.call(
                    this._suggestions.get(projectPath)!,
                    macroName,
                  )
                ) {
                  this._suggestions.get(projectPath)![macroName] =
                    macroData.parseToJsonObject();
                }
              }
            }
          } catch (error) {
            TyranoLogger.printStackTrace(error);
            // エラーを記録するだけで処理は続行
          }
        },
      });
    } catch (error) {
      TyranoLogger.printStackTrace(error);
      // traverseでエラーが発生しても処理を続行
    }
  }

  /**
   * Babel ASTのMemberExpression/Identifierをドット区切り文字列に変換する。
   * 例: tyrano.plugin.kag.tag のASTノードを "tyrano.plugin.kag.tag" にする。
   * 認識できないノードは空文字を返す。
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private babelNodeToSource(node: any): string {
    if (!node) return "";
    if (node.type === "Identifier") return node.name;
    if (node.type === "MemberExpression" && !node.computed) {
      const obj = this.babelNodeToSource(node.object);
      const prop = node.property?.name ?? "";
      return obj && prop ? `${obj}.${prop}` : "";
    }
    return "";
  }

  /**
   * tyrano.plugin.kag.tag["NAME"] = { pm: {...}, vital: [...] } のような代入式の
   * 右辺ObjectExpressionから、pmのキー・vitalの要素を抽出してパラメータ配列を返す。
   * 認識できないシェイプは黙ってスキップする。
   */
  private extractPmAndVitalFromAssignment(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assignmentNode: any,
  ): { params: MacroParameterData[] } | null {
    if (!assignmentNode) return null;
    const right = assignmentNode.right;
    if (!right || right.type !== "ObjectExpression") return null;

    const vitalSet = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pmObject: any = null;

    for (const prop of right.properties ?? []) {
      try {
        if (!prop || prop.type !== "ObjectProperty") continue;
        const keyName =
          prop.key?.name ??
          (prop.key?.type === "StringLiteral" ? prop.key.value : undefined);
        if (keyName === "vital" && prop.value?.type === "ArrayExpression") {
          for (const el of prop.value.elements ?? []) {
            if (el && (el.type === "StringLiteral" || el.type === "Literal")) {
              const v = el.value;
              if (typeof v === "string" && v.length > 0) {
                vitalSet.add(v);
              }
            }
          }
        } else if (
          keyName === "pm" &&
          prop.value?.type === "ObjectExpression"
        ) {
          pmObject = prop.value;
        }
      } catch (_e) {
        // 1キーの失敗で他キーが落ちないようスキップ
      }
    }

    const params: MacroParameterData[] = [];
    const seen = new Set<string>();

    if (pmObject?.type === "ObjectExpression") {
      for (const prop of pmObject.properties ?? []) {
        try {
          if (!prop || prop.type !== "ObjectProperty") continue;
          const paramName =
            prop.key?.name ??
            (prop.key?.type === "StringLiteral" ? prop.key.value : undefined);
          if (typeof paramName !== "string" || paramName.length === 0) continue;
          if (seen.has(paramName)) continue;
          seen.add(paramName);

          let defaultValue: string | undefined;
          if (
            prop.value?.type === "StringLiteral" ||
            prop.value?.type === "NumericLiteral" ||
            prop.value?.type === "BooleanLiteral"
          ) {
            defaultValue = String(prop.value.value);
          }

          const required = vitalSet.has(paramName);
          const description = required
            ? `プラグインタグの必須パラメータ: ${paramName}`
            : defaultValue !== undefined
              ? `プラグインタグのパラメータ: ${paramName}（デフォルト値: ${defaultValue}）`
              : `プラグインタグのパラメータ: ${paramName}`;
          params.push(new MacroParameterData(paramName, required, description));
        } catch (_e) {
          // 1キーの失敗で他キーが落ちないようスキップ
        }
      }
    }

    // pmに列挙されていなくてもvitalに書かれているパラメータは追加する
    for (const v of vitalSet) {
      if (!seen.has(v)) {
        params.push(
          new MacroParameterData(
            v,
            true,
            `プラグインタグの必須パラメータ: ${v}`,
          ),
        );
        seen.add(v);
      }
    }

    return { params };
  }

  /**
   * パーサーで取得したtypeをわかりやすい文言に変換する
   * @param type
   * @returns
   */
  private typeConverter(type: string): string {
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
  private getNestedObject(
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
          // オプショナルチェインとデフォルト値を使用
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


  public async updateMacroLabelVariableDataMapByKs(
    absoluteScenarioFilePath: string,
  ) {
    //ここに構文解析してマクロ名とURI.file,positionを取得する
    const scenarioData = this.scenarioFileMap.get(absoluteScenarioFilePath);
    const projectPath = await this.getProjectPathByFilePath(
      absoluteScenarioFilePath,
    );

    if (scenarioData != undefined) {
      const parsedData = this.parser.parseText(scenarioData.getText()); //構文解析
      this.labelMap.set(absoluteScenarioFilePath, new Array<LabelData>());
      this.transitionMap.set(
        absoluteScenarioFilePath,
        new Array<TransitionData>(),
      );
      let description = "";

      //該当ファイルに登録されているマクロ、変数、タグ、nameを一度リセット
      const deleteTagList = await this.spliceMacroDataMapByFilePath(
        absoluteScenarioFilePath,
      );

      this.spliceVariableMapByFilePath(absoluteScenarioFilePath);
      this.spliceCharacterMapByFilePath(absoluteScenarioFilePath);
      await this.spliceSuggestionsByFilePath(projectPath, deleteTagList);
      let currentLabel = "NONE";
      let isMacro: boolean = false; //macrio-endmacro間であるかを判定
      let macroData: DefineMacroData | null = null; // 現在処理中のマクロデータ
      for (const data of parsedData) {
        //iscript-endscript間のテキストを取得。

        if (isMacro) {
          // マクロ内でパラメータを検索
          const extractor: MacroParameterExtractor =
            new MacroParameterExtractor();
          extractor.extractMacroParameters(
            data,
            macroData,
            this.scenarioFileMap,
            this.suggestions,
            projectPath,
          );
        }

        //各種タグの場合
        if ((await data["name"]) === "macro") {
          const macroName: string = await data["pm"]["name"];

          //TyranoScript syntax.plugin.parameterに存在しない名前の場合のみ実行
          if (!this.pluginTags[macroName]) {
            isMacro = true; //macro-endmacro間であることを判定
            macroData = new DefineMacroData(
              macroName,
              new vscode.Location(
                scenarioData.uri,
                new vscode.Position(await data["line"], await data["column"]),
              ),
              absoluteScenarioFilePath,
              description,
            );
          }
        } else if ((await data["name"]) === "label") {
          // *label_name 記法は pm.label_name、[label name="..."] 記法は pm.name に入る
          const labelName =
            (await data["pm"]["label_name"]) ?? (await data["pm"]["name"]);
          //複数コメントの場合「*/」がラベルとして登録されてしまうので、それを除外する
          if (labelName !== undefined && labelName !== "/") {
            currentLabel = labelName;
            if (!currentLabel.startsWith("*")) {
              currentLabel = "*" + currentLabel;
            }
            this.labelMap
              .get(absoluteScenarioFilePath)
              ?.push(
                new LabelData(
                  labelName,
                  new vscode.Location(
                    scenarioData.uri,
                    new vscode.Position(
                      await data["line"],
                      await data["column"],
                    ),
                  ),
                  "" + description + "\n",
                ),
              );
          }
        } else if ((await data["name"]) === "eval") {
          const [variableBase, variableValue] = data["pm"]["exp"]
            .split("=")
            .map((str: string) => str.trim()); //vriableBaseにf.hogeの形
          const [variableType, variableName] = variableBase.split(".");
          //mapに未登録の場合のみ追加
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
          this.variableMap
            .get(projectPath)
            ?.get(variableName)
            ?.addLocation(location); //変数の定義箇所を追加
        } else if (data["name"] === "chara_new") {
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
        } else if (data["name"] === "chara_face") {
          const characterData = this.characterMap
            .get(projectPath)
            ?.find((value) => value.name === data["pm"]["name"]);
          const faceName: string | undefined = data["pm"]["name"];
          const face: string | undefined = data["pm"]["face"];
          //nameパラメータで指定したnameのキャラクターが存在する場合
          if (characterData && faceName && face) {
            const updateCharacterFaceData: CharacterFaceData =
              new CharacterFaceData(
                faceName,
                face,
                new vscode.Location(
                  scenarioData.uri,
                  new vscode.Position(await data["line"], await data["column"]),
                ),
              );
            characterData.addFace(updateCharacterFaceData);
            // characterMapを更新する
            const index = this.characterMap
              .get(projectPath)
              ?.findIndex((value) => value.name === data["pm"]["name"]);
            if (index !== undefined) {
              this.characterMap
                .get(projectPath)
                ?.splice(index, 1, characterData);
            }
          }
        } else if (data["name"] === "chara_layer") {
          const updateCharacterData = this.characterMap
            .get(projectPath)
            ?.find((value) => value.name === data["pm"]["name"]);
          const layerName = data["pm"]["name"];
          const part = data["pm"]["part"];
          const id = data["pm"]["id"];

          //nameパラメータで指定したnameのキャラクターが存在する場合
          if (updateCharacterData && layerName && part && id) {
            const characterLayerData: CharacterLayerData =
              new CharacterLayerData(
                layerName,
                part,
                id,
                new vscode.Location(
                  scenarioData.uri,
                  new vscode.Position(await data["line"], await data["column"]),
                ),
              );
            updateCharacterData.addLayer(part, characterLayerData);

            // characterMapを更新する
            const index = this.characterMap
              .get(projectPath)
              ?.findIndex((value) => value.name === data["pm"]["name"]);
            if (index !== undefined) {
              this.characterMap
                .get(projectPath)
                ?.splice(index, 1, updateCharacterData);
            }
          }
        } else if ((await data["name"]) === "endmacro") {
          if (isMacro) {
            // マクロデータをdefineMacroMapに登録
            const uuid = crypto.randomUUID();
            this.defineMacroMap.get(projectPath)?.set(uuid, macroData);

            // 逆引きMapに登録
            if (!this._macroByFilePath.has(absoluteScenarioFilePath)) {
              this._macroByFilePath.set(
                absoluteScenarioFilePath,
                new Set<string>(),
              );
            }
            this._macroByFilePath.get(absoluteScenarioFilePath)!.add(uuid);

            //suggetionsに登録されてない場合のみ追加
            if (
              !Object.prototype.hasOwnProperty.call(
                this._suggestions.get(projectPath)!,
                macroData.macroName,
              )
            ) {
              this._suggestions.get(projectPath)![macroData.macroName] =
                macroData.parseToJsonObject();
            }
          }
          isMacro = false; //macro-endmacro間であることを判定
          macroData = null; // マクロデータをリセット
        }

        //マクロ定義のdescription挿入
        if ((await data["name"]) === "comment") {
          if (await data["val"]) {
            description += (await data["val"]) + "\n";
          }
        } else {
          description = "";
        }

        //transitionデータの登録処理
        //複数行コメントの場合
        if (
          TransitionData.jumpTags.includes(await data["name"]) &&
          currentLabel !== "/"
        ) {
          //_transitionMapへの登録処理
          const range = new vscode.Range(
            new vscode.Position(await data["line"], 0),
            new vscode.Position(await data["line"], 0),
          );
          const uri = vscode.Uri.file(absoluteScenarioFilePath);
          const tagName = await data["name"];
          const storage = (await data["pm"]["storage"])
            ? await data["pm"]["storage"]
            : undefined;
          let target = (await data["pm"]["target"])
            ? await data["pm"]["target"]
            : undefined;
          if (target && !target.startsWith("*")) {
            target = "*" + target;
          }
          const condition = (await data["pm"]["cond"])
            ? await data["pm"]["cond"]
            : undefined;
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
    }
  }

  /**
   * リソースファイルのマップに値を追加
   * @param filePath ファイルパス
   */
  public async addResourceFileMap(filePath: string) {
    const absoluteProjectPath = await this.getProjectPathByFilePath(filePath);
    const resourceType: string | undefined = Object.keys(
      this.resourceExtensions,
    )
      .filter((key) =>
        this.resourceExtensions[key].includes(path.extname(filePath)),
      )
      .toString(); //プロジェクトパスの拡張子からどのリソースタイプなのかを取得
    this._resourceFileMap
      .get(absoluteProjectPath)
      ?.push(new ResourceFileData(filePath, resourceType));
  }

  /**
   * 引数で指定したファイルパスを、リソースファイルのマップから削除
   * @param absoluteProjectPath
   * @param filePath
   */
  public async spliceResourceFileMapByFilePath(filePath: string) {
    const absoluteProjectPath = await this.getProjectPathByFilePath(filePath);
    const insertValue: ResourceFileData[] | undefined = this.resourceFileMap
      .get(absoluteProjectPath)
      ?.filter((obj) => obj.filePath !== filePath);
    this.resourceFileMap.set(absoluteProjectPath, insertValue!);
  }

  /**
   *  引数で指定したファイルパスを、シナリオファイルのマップから削除
   * @param filePath
   */
  public async spliceScenarioFileMapByFilePath(filePath: string) {
    this.scenarioFileMap.delete(filePath);
  }

  /**
   *  引数で指定したファイルパスを、スクリプトファイルのマップから削除
   * @param filePath
   */
  public async spliceScriptFileMapByFilePath(filePath: string) {
    this.scriptFileMap.delete(filePath);
  }

  /**
   *  引数で指定したファイルパスを、マクロデータのマップから削除
   * @param filePath
   */
  public async spliceMacroDataMapByFilePath(filePath: string) {
    const deleteTagList: string[] = [];
    const projectPath = await this.getProjectPathByFilePath(filePath);

    // 逆引きMapを使ってO(1)で該当マクロのUUIDを取得
    const macroUuids = this._macroByFilePath.get(filePath);
    if (!macroUuids || macroUuids.size === 0) {
      return deleteTagList;
    }

    const projectMacroMap = this.defineMacroMap.get(projectPath);
    if (!projectMacroMap) {
      this._macroByFilePath.delete(filePath);
      return deleteTagList;
    }

    // UUIDを使って直接削除
    for (const uuid of macroUuids) {
      const macroData = projectMacroMap.get(uuid);
      if (macroData) {
        deleteTagList.push(macroData.macroName);
        projectMacroMap.delete(uuid);
      }
    }

    // 逆引きMapからも削除
    this._macroByFilePath.delete(filePath);

    return deleteTagList;
  }

  /**
   * 引数で指定したファイルパス（キー）のラベルデータマップを削除
   * @param fsPath
   */
  public async spliceLabelMapByFilePath(fsPath: string) {
    this.labelMap.delete(fsPath);
  }

  /**
   * 引数で指定したファイルパス（キー)の変数データマップを削除
   * @param fsPath
   */
  public spliceVariableMapByFilePath(fsPath: string) {
    const projectPath: string = this.getProjectPathByFilePathSync(fsPath);
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

  /**
   * 引数で指定したファイルパス（キー）のトランジションデータマップを削除
   * @param fsPath
   */
  public async spliceTransitionMapByFilePath(fsPath: string) {
    this.transitionMap.delete(fsPath);
  }

  /**
   *  引数で指定したファイルパス（Mapのキー）のCharacterDataをマップから削除
   * @param fsPath
   */
  public spliceCharacterMapByFilePath(fsPath: string) {
    const projectPath: string = this.getProjectPathByFilePathSync(fsPath);
    const characterMap = this.characterMap.get(projectPath);
    if (!characterMap) return;

    // chara_faceの定義削除
    for (const characterData of characterMap) {
      characterData.deleteFaceByFilePath(fsPath);
    }

    // chara_layerの定義削除
    for (const characterData of characterMap) {
      characterData.deleteLayerByFilePath(fsPath);
    }

    // chara_newの定義削除
    const updatedCharacterData = characterMap.filter((value: CharacterData) => {
      return value.location.uri.fsPath !== fsPath;
    });

    this.characterMap.set(projectPath, updatedCharacterData);
  }

  /**
   * 引数で指定したファイルパスを、タグ補完に使う変数のリストから削除
   * @param absoluteScenarioFilePath
   */
  public async spliceSuggestionsByFilePath(
    projectPath: string,
    deleteTagList: string[],
  ) {
    // デフォのタグに存在しないタグだけを取得
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
   * プロジェクトに存在するファイルパスを取得します。
   * 使用例:
   * @param projectRootPath プロジェクトのルートパス
   * @param permissionExtension 取得するファイルパスの拡張子。無指定ですべてのファイル取得。
   * @param isAbsolute 絶対パスで返すかどうか。trueなら絶対パス。falseで相対パス。
   * @returns プロジェクトのルートパスが存在するなら存在するファイルパスを文字列型の配列で返却。
   */
  public getProjectFiles(
    projectRootPath: string,
    permissionExtension: string[] = [],
    isAbsolute: boolean = false,
  ): string[] {
    //ルートパスが存在していない場合
    if (
      projectRootPath === undefined ||
      projectRootPath === "" ||
      !fs.existsSync(projectRootPath)
    ) {
      return [];
    }

    //指定したファイルパスの中のファイルのうち、permissionExtensionの中に入ってる拡張子のファイルパスのみを取得
    // スタックベースの実装で再帰を回避し高速化
    const listFiles = (dir: string): string[] => {
      const results: string[] = [];
      const stack = [dir];

      while (stack.length > 0) {
        const currentDir = stack.pop()!;
        try {
          const entries = fs.readdirSync(currentDir, { withFileTypes: true });

          for (const entry of entries) {
            // .gitディレクトリを無視
            if (entry.name === ".git") continue;

            const fullPath = `${currentDir}${this.pathDelimiter}${entry.name}`;

            if (entry.isDirectory()) {
              stack.push(fullPath);
            } else if (entry.isFile()) {
              // 拡張子フィルタリング
              if (
                permissionExtension.length === 0 ||
                permissionExtension.includes(path.extname(fullPath))
              ) {
                results.push(fullPath);
              }
            }
          }
        } catch (_error) {
          // ディレクトリアクセスに失敗した場合はスキップ
        }
      }
      return results;
    };
    let ret = listFiles(projectRootPath); //絶対パスで取得

    //相対パスに変換
    if (!isAbsolute) {
      ret = ret.map((e) => {
        return e.replace(projectRootPath + this.pathDelimiter, "");
      });
    }

    return ret;
  }

  /**
   * 引数で指定したファイルパスからプロジェクトパス（index.htmlのあるフォルダパス）を取得します。
   * @param filePath
   * @returns
   */
  public async getProjectPathByFilePath(filePath: string): Promise<string> {
    let searchDir;
    do {
      const delimiterIndex = filePath.lastIndexOf(this.pathDelimiter);
      if (delimiterIndex === -1) {
        return "";
      }

      //filePathに存在するpathDelimiiter以降の文字列を削除
      filePath = filePath.substring(0, delimiterIndex);
      //フォルダ検索
      try {
        searchDir = fs.readdirSync(filePath, "utf-8");
      } catch (_error) {
        // ディレクトリが存在しない場合は空文字を返す
        return "";
      }
      //index.htmlが見つからないならループ
    } while (searchDir.filter((e) => e === "index.html").length <= 0);
    return filePath;
  }

  /**
   * 引数で指定したファイルパスからプロジェクトパス（index.htmlのあるフォルダパス）を同期的に取得します。
   * @param filePath
   * @returns
   */
  private getProjectPathByFilePathSync(filePath: string): string {
    let searchDir;
    do {
      const delimiterIndex = filePath.lastIndexOf(this.pathDelimiter);
      if (delimiterIndex === -1) {
        return "";
      }

      //filePathに存在するpathDelimiiter以降の文字列を削除
      filePath = filePath.substring(0, delimiterIndex);
      //フォルダ検索
      try {
        searchDir = fs.readdirSync(filePath, "utf-8");
      } catch (_error) {
        // ディレクトリが存在しない場合は空文字を返す
        return "";
      }
      //index.htmlが見つからないならループ
    } while (searchDir.filter((e) => e === "index.html").length <= 0);
    return filePath;
  }

  public isSamePath(path1: string, path2: string) {
    if (path1 === undefined || path2 === undefined) {
      return false;
    }

    return path.resolve(path1) === path.resolve(path2);
  }

  /**
   * 引数で与えたファイルの相対パスから、絶対パスを返します。
   * @param relativePath
   */
  public convertToAbsolutePathFromRelativePath(relativePath: string): string {
    return path.resolve(relativePath);
  }

  /**
   * others/pluginフォルダ内のファイルパスならtrueを返す。
   * @param filePath
   * @param directory
   * @returns boolean
   */
  public isSkipParse(filePath: string, directory: string): boolean {
    if (this.isParsePluginFolder) {
      return false;
    }
    const pluginFolder = path.resolve(directory + "/data/others/plugin");

    const normalizedFilePath = path.resolve(filePath);
    const normalizedFolderPath = path.resolve(pluginFolder);

    // ファイルパスがフォルダパスで始まっているかを判定
    const ret = normalizedFilePath.startsWith(normalizedFolderPath + path.sep);
    return ret;
  }

  /**
   * 引数のファイルパスが、プロジェクトの data/others/plugin/ 配下にあるかを判定する。
   * isSkipParse が「診断・パース全般をスキップするか」を表すのに対し、
   * こちらは「プラグインの自動タグ抽出のためにパース対象としてOKか」を表す。
   * read_plugin の値には影響されない。
   * @param filePath
   * @param directory プロジェクトルート
   * @returns プラグインフォルダ配下ならtrue
   */
  public isPluginFile(filePath: string, directory: string): boolean {
    const pluginFolder = path.resolve(directory + "/data/others/plugin");
    const normalizedFilePath = path.resolve(filePath);
    const normalizedFolderPath = path.resolve(pluginFolder);
    return normalizedFilePath.startsWith(normalizedFolderPath + path.sep);
  }

  /**
   * data/others/plugin/<pluginName>/init.ks 形式のファイルパスから pluginName を抽出する。
   * 形式に合致しない場合は undefined を返す。
   * @param filePath
   * @param directory プロジェクトルート
   */
  public extractPluginNameFromInitKs(
    filePath: string,
    directory: string,
  ): string | undefined {
    const normalizedFilePath = path.resolve(filePath);
    const pluginFolder = path.resolve(directory + "/data/others/plugin");
    if (!normalizedFilePath.startsWith(pluginFolder + path.sep)) {
      return undefined;
    }
    if (path.basename(normalizedFilePath) !== "init.ks") {
      return undefined;
    }
    const relative = normalizedFilePath.substring(pluginFolder.length + 1);
    // <pluginName>/init.ks の形のみ受理（さらに深い階層は対象外）
    const segments = relative.split(path.sep);
    if (segments.length !== 2) {
      return undefined;
    }
    return segments[0];
  }

  /**
   * プラグインフォルダの init.ks をスキャンして mp.<param> 参照を _pluginParameterMap に登録する。
   * 形式に合致しないファイルは何もしない。
   * @param filePath
   */
  public async updatePluginParamsFromInitKs(filePath: string): Promise<void> {
    if (!this.autoLoadPluginTags) {
      return;
    }
    if (path.extname(filePath) !== ".ks") {
      return;
    }
    const projectPath = await this.getProjectPathByFilePath(filePath);
    if (!projectPath) {
      return;
    }
    const pluginName = this.extractPluginNameFromInitKs(filePath, projectPath);
    if (!pluginName) {
      return;
    }
    let text: string;
    try {
      text = fs.readFileSync(filePath, "utf-8");
    } catch (_error) {
      // ファイルが読めない場合は登録を解除
      this._pluginParameterMap.get(projectPath)?.delete(pluginName);
      return;
    }

    const params = new Set<string>();
    const regex = /mp\.([a-zA-Z0-9_]+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      params.add(match[1]);
    }

    if (!this._pluginParameterMap.has(projectPath)) {
      this._pluginParameterMap.set(projectPath, new Map<string, Set<string>>());
    }
    this._pluginParameterMap.get(projectPath)!.set(pluginName, params);
  }

  /**
   * 指定した init.ks ファイルパスに対応するプラグインのパラメータ登録を削除する。
   * @param filePath
   */
  public async splicePluginParamsByInitKsPath(filePath: string): Promise<void> {
    const projectPath = await this.getProjectPathByFilePath(filePath);
    if (!projectPath) return;
    const pluginName = this.extractPluginNameFromInitKs(filePath, projectPath);
    if (!pluginName) return;
    this._pluginParameterMap.get(projectPath)?.delete(pluginName);
  }

  public get scriptFileMap(): Map<string, string> {
    return this._scriptFileMap;
  }
  public get scenarioFileMap(): Map<string, vscode.TextDocument> {
    return this._scenarioFileMap;
  }
  public get resourceFileMap(): Map<string, ResourceFileData[]> {
    return this._resourceFileMap;
  }
  public get defineMacroMap(): Map<string, Map<string, DefineMacroData>> {
    return this._defineMacroMap;
  }
  public get resourceExtensions(): object {
    return this._resourceExtensions;
  }
  public get resourceExtensionsArrays() {
    return this._resourceExtensionsArrays;
  }
  public get variableMap(): Map<string, Map<string, VariableData>> {
    return this._variableMap;
  }
  public get labelMap(): Map<string, LabelData[]> {
    return this._labelMap;
  }
  public get suggestions(): Map<string, object> {
    return this._suggestions;
  }
  public set suggestions(value: Map<string, object>) {
    this._suggestions = value;
  }
  public get extensionPath() {
    return this._extensionPath;
  }
  public set extensionPath(value) {
    this._extensionPath = value;
  }
  public get transitionMap(): Map<string, TransitionData[]> {
    return this._transitionMap;
  }
  public set transitionMap(value: Map<string, TransitionData[]>) {
    this._transitionMap = value;
  }
  public get characterMap(): Map<string, CharacterData[]> {
    return this._characterMap;
  }
  public set characterMap(value: Map<string, CharacterData[]>) {
    this._characterMap = value;
  }
  public get pluginParameterMap(): Map<string, Map<string, Set<string>>> {
    return this._pluginParameterMap;
  }
}
