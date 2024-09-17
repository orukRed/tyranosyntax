/* eslint-disable @typescript-eslint/no-this-alias */
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

import * as babel from "@babel/parser";
import traverse from "@babel/traverse";
import { CharacterData } from "./defineData/CharacterData";
import { CharacterFaceData } from "./defineData/CharacterFaceData";
import { CharacterLayerData } from "./defineData/CharacterLayerData";

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

  private readonly _resourceExtensions: object = vscode.workspace
    .getConfiguration()
    .get("TyranoScript syntax.resource.extension")!;
  private readonly _resourceExtensionsArrays = Object.keys(
    this.resourceExtensions,
  )
    .map((key) => this.resourceExtensions[key])
    .flat(); //resourceExtensionsをオブジェクトからstring型の一次配列にする
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

    //最初のキーをプロジェクト名で初期化
    for (const projectPath of this.getTyranoScriptProjectRootPaths()) {
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
        this.defaultTagList.push(...Object.keys(this.pluginTags)); //pluginTagsをdefaultTagListに追加
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
      //スクリプトファイルパスを初期化
      TyranoLogger.print(`${projectPath}'s scripts is loading...`);
      const absoluteScriptFilePaths = this.getProjectFiles(
        projectPath + this.DATA_DIRECTORY,
        [".js"],
        true,
      ); //dataディレクトリ内の.jsファイルを取得
      for (const i of absoluteScriptFilePaths) {
        await this.updateScriptFileMap(i);
        await this.updateMacroDataMapByJs(i);
        await this.updateVariableMapByJS(i);
      }
      //シナリオファイルを初期化
      TyranoLogger.print(`${projectPath}'s scenarios is loading...`);
      const absoluteScenarioFilePaths = await this.getProjectFiles(
        projectPath + this.DATA_DIRECTORY,
        [".ks"],
        true,
      ); //dataディレクトリ内の.ksファイルを取得
      for (const i of absoluteScenarioFilePaths) {
        await this.updateScenarioFileMap(i);
        await this.updateMacroLabelVariableDataMapByKs(i);
      }
      //リソースファイルを取得
      TyranoLogger.print(`${projectPath}'s resource file is loading...`);
      const absoluteResourceFilePaths = this.getProjectFiles(
        projectPath + this.DATA_DIRECTORY,
        this.resourceExtensionsArrays,
        true,
      ); //dataディレクトリのファイル取得
      for (const i of absoluteResourceFilePaths) {
        await this.addResourceFileMap(i);
      }
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
    const listFiles = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((dirent) =>
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
    //vscodeAPIを使うとESLintも起動してしまうため、fsモジュールで読み込む。
    //fsモジュールによる読み込みが不要になったら以下二行の処理に戻すこと。
    // let textDocument = await vscode.workspace.openTextDocument(filePath);
    // this._scriptFileMap.set(textDocument.fileName, textDocument.getText());
    this._scriptFileMap.set(filePath, fs.readFileSync(filePath, "utf-8"));
  }
  public async updateScenarioFileMap(filePath: string) {
    //.ks拡張子以外ならシナリオではないのでreturn
    if (path.extname(filePath) !== ".ks") {
      return;
    }
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

    if (this.isSkipParse(absoluteScenarioFilePath, projectPath)) {
      return;
    }
    const deleteTagList = await this.spliceMacroDataMapByFilePath(
      absoluteScenarioFilePath,
    );
    await this.spliceSuggestionsByFilePath(projectPath, deleteTagList);

    traverse(parsedData, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enter: (path: any) => {
        try {
          //path.parentPathの値がTYRANO.kag.ftag.master_tag.MacroNameの形なら
          if (
            path != null &&
            path.parentPath != null &&
            path.parentPath.type === "AssignmentExpression" &&
            (reg2.test(path.parentPath.toString()) ||
              reg3.test(path.parentPath.toString()))
          ) {
            const macroName: string = path.toString().split(".")[4]; //MacroNameの部分を抽出
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
                    path.node.loc.start.line,
                    path.node.loc.start.column,
                  ),
                ),
                absoluteScenarioFilePath,
                description,
              );
              macroData.parameter.push(
                new MacroParameterData("parameter", false, "description"),
              ); //TODO:パーサーでパラメータの情報読み込んで追加する
              this.defineMacroMap.get(projectPath)?.set(macroName, macroData);
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
        } catch (_error) {
          //例外発生するのは許容？
          // console.log(error);
        }
      },
    });
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
    if (property.type === "ObjectExpression") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      property.properties.forEach((prop: any) => {
        if (prop.key && prop.key.type === "Identifier") {
          const name = prop.key.name;
          const value =
            prop.value.type === "ObjectExpression"
              ? undefined
              : prop.value.value;
          const type = this.typeConverter(prop.value.type);
          const variableData = new VariableData(name, value, undefined, type);
          const location = new vscode.Location(
            vscode.Uri.file(absoluteScenarioFilePath),
            new vscode.Position(
              property.loc.start.column!,
              property.loc.start.column!,
            ),
          );
          variableData.addLocation(location);
          if (prop.value.type === "ObjectExpression") {
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

  /**
   * jsやiscript-endscript間で定義した変数を取得する
   * sentenceがundefined出ない場合、指定した値の範囲内で定義されている変数を取得する
   * @param absoluteScenarioFilePath
   * @param sentence
   */
  public async updateVariableMapByJS(
    absoluteScenarioFilePath: string,
    sentence: string | undefined = undefined,
  ) {
    await this.spliceVariableMapByFilePath(absoluteScenarioFilePath);
    const projectPath: string = await this.getProjectPathByFilePath(
      absoluteScenarioFilePath,
    );
    //others/pluginの中に入っているファイルならreturn
    if (this.isSkipParse(absoluteScenarioFilePath, projectPath)) {
      return;
    }
    if (sentence === undefined) {
      sentence = this.scriptFileMap.get(absoluteScenarioFilePath)!;
    }

    const variablePrefixList = ["f", "sf", "tf", "mp"];

    const ast = babel.parse(sentence, {
      allowAwaitOutsideFunction: true,
      allowUndeclaredExports: true,
      errorRecovery: true,
      allowSuperOutsideMethod: true,
    });

    const that = this; // この行を追加
    const typeConverter = this.typeConverter;
    let keyName = "";
    traverse(ast, {
      enter: (_path) => {},
      MemberExpression(path) {
        const left = path.node;
        if (
          left.object.type === "Identifier" &&
          variablePrefixList.includes(left.object.name)
        ) {
          if (left.property.type === "Identifier") {
            // 'f.' をキー名の先頭に追加してプロパティ名を取得
            const variableName = left.property.name;
            const type = typeConverter(left.property.type);
            const variableData = new VariableData(
              variableName,
              undefined,
              left.object.name,
              type,
            );
            if (path.node.loc?.start) {
              const location = new vscode.Location(
                vscode.Uri.file(absoluteScenarioFilePath),
                new vscode.Position(
                  path.node.loc.start.line,
                  path.node.loc.start.column,
                ),
              );
              variableData.addLocation(location);
              keyName = variableName;
              that.variableMap
                .get(projectPath)
                ?.set(variableName, variableData);
            }
          }
        }
      },
      ObjectExpression: (path) => {
        const nowObject: VariableData | undefined = that.variableMap
          .get(projectPath)
          ?.get(keyName);
        if (nowObject) {
          path.node.properties.forEach((property) => {
            if (
              property.type === "ObjectMethod" ||
              property.type === "ObjectProperty"
            ) {
              if (property.key.type === "Identifier") {
                const nestedObjects: VariableData[] = this.getNestedObject(
                  path.node,
                  absoluteScenarioFilePath,
                );
                if (nowObject.nestVariableData.length <= 0) {
                  nowObject.nestVariableData = nestedObjects;
                  that.variableMap.get(projectPath)?.set(keyName, nowObject);
                }
              }
            } else {
              // SpreadElementの場合の処理
              console.log("SpreadElementはkeyプロパティを持ちません。");
            }
          });
        }
      },
    });
  }

  public async updateMacroLabelVariableDataMapByKs(
    absoluteScenarioFilePath: string,
  ) {
    //ここに構文解析してマクロ名とURI.file,positionを取得する
    const scenarioData = this.scenarioFileMap.get(absoluteScenarioFilePath);
    const projectPath = await this.getProjectPathByFilePath(
      absoluteScenarioFilePath,
    );
    //others/pluginの中に入っているファイルならreturn
    if (this.isSkipParse(absoluteScenarioFilePath, projectPath)) {
      return;
    }
    if (scenarioData != undefined) {
      const parsedData = this.parser.parseText(scenarioData.getText()); //構文解析
      this.labelMap.set(absoluteScenarioFilePath, new Array<LabelData>());
      this.transitionMap.set(
        absoluteScenarioFilePath,
        new Array<TransitionData>(),
      );
      let isIscript = false;
      let iscriptSentence: string = "";
      let description = "";

      //該当ファイルに登録されているマクロ、変数、タグ、nameを一度リセット
      const deleteTagList = await this.spliceMacroDataMapByFilePath(
        absoluteScenarioFilePath,
      );
      await this.spliceVariableMapByFilePath(absoluteScenarioFilePath);
      await this.spliceCharacterMapByFilePath(absoluteScenarioFilePath);
      await this.spliceSuggestionsByFilePath(projectPath, deleteTagList);
      let currentLabel = "NONE";
      for (const data of parsedData) {
        //iscript-endscript間のテキストを取得。
        if (isIscript && data["name"] === "text") {
          iscriptSentence +=
            this.scenarioFileMap
              .get(absoluteScenarioFilePath)
              ?.lineAt(data["line"]).text + "\n";
        }

        //各種タグの場合
        if ((await data["name"]) === "macro") {
          const macroData: DefineMacroData = new DefineMacroData(
            await data["pm"]["name"],
            new vscode.Location(
              scenarioData.uri,
              new vscode.Position(await data["line"], await data["column"]),
            ),
            absoluteScenarioFilePath,
            description,
          );
          const macroName: string = await data["pm"]["name"];
          this.defineMacroMap.get(projectPath)?.set(macroName, macroData);
          //suggetionsに登録されてない場合のみ追加
          if (
            !Object.prototype.hasOwnProperty.call(
              this._suggestions.get(projectPath)!,
              macroName,
            )
          ) {
            this._suggestions.get(projectPath)![await data["pm"]["name"]] =
              macroData.parseToJsonObject();
          }
        } else if ((await data["name"]) === "label") {
          //複数コメントの場合「*/」がラベルとして登録されてしまうので、それを除外する
          if ((await data["pm"]["label_name"]) !== "/") {
            currentLabel = await data["pm"]["label_name"];
            if (!currentLabel.startsWith("*")) {
              currentLabel = "*" + currentLabel;
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
              ),
            );
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
        } else if ((await data["name"]) === "iscript") {
          isIscript = true; //endscriptが見つかるまで行を保存するモードに入る
        } else if ((await data["name"]) === "endscript") {
          isIscript = false; //行を保存するモード終わり
          this.updateVariableMapByJS(absoluteScenarioFilePath, iscriptSentence);
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

    this.defineMacroMap.get(projectPath)?.forEach((value, _key) => {
      if (value.filePath == filePath) {
        this.defineMacroMap.get(projectPath)?.delete(value.macroName);
        deleteTagList.push(value.macroName);
      }
    });

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
  public async spliceVariableMapByFilePath(fsPath: string) {
    const projectPath: string = await this.getProjectPathByFilePath(fsPath);
    this.variableMap
      .get(projectPath)
      ?.forEach((value: VariableData, key: string) => {
        value.locations.forEach((location: vscode.Location) => {
          if (location.uri.fsPath === fsPath) {
            this.variableMap.get(projectPath)?.delete(key);
          }
        });
      });
  }

  /**
   *  引数で指定したファイルパス（Mapのキー）のCharacterDataをマップから削除
   * @param fsPath
   */
  public async spliceCharacterMapByFilePath(fsPath: string) {
    const projectPath: string = await this.getProjectPathByFilePath(fsPath);

    // chara_faceの定義削除
    this.characterMap.get(projectPath)?.forEach((value: CharacterData) => {
      value.deleteFaceByFilePath(fsPath);
    });

    // chara_layerの定義削除
    this.characterMap.get(projectPath)?.forEach((value: CharacterData) => {
      value.deleteLayerByFilePath(fsPath);
    });

    // chara_newの定義削除
    const updatedCharacterData = this.characterMap
      .get(projectPath)
      ?.filter((value: CharacterData) => {
        return value.location.uri.fsPath !== fsPath;
      });

    if (updatedCharacterData) {
      this.characterMap.set(projectPath, updatedCharacterData);
    }
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
    const listFiles = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((dirent) =>
        dirent.name === ".git"
          ? [] // .git ディレクトリを無視
          : dirent.isFile()
            ? [`${dir}${this.pathDelimiter}${dirent.name}`].filter((file) => {
                if (permissionExtension.length <= 0) {
                  return file;
                }
                return permissionExtension.includes(path.extname(file));
              })
            : listFiles(`${dir}${this.pathDelimiter}${dirent.name}`),
      );
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
      searchDir = fs.readdirSync(filePath, "utf-8");
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

  private isSkipParse(filePath: string, directory: string): boolean {
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
}

