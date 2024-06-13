"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InformationWorkSpace = void 0;
const fs = __importStar(require("fs"));
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const ResourceFileData_1 = require("./defineData/ResourceFileData");
const DefineMacroData_1 = require("./defineData/DefineMacroData");
const TyranoLogger_1 = require("./TyranoLogger");
const VariableData_1 = require("./defineData/VariableData");
const LabelData_1 = require("./defineData/LabelData");
const MacroParameterData_1 = require("./defineData/MacroParameterData");
const NameParamData_1 = require("./defineData/NameParamData");
const Parser_1 = require("./Parser");
const InformationExtension_1 = require("./InformationExtension");
const TransitionData_1 = require("./defineData/TransitionData");
const babel = require("@babel/parser");
const babelTraverse = require("@babel/traverse").default;
/**
 * ワークスペースディレクトリとか、data/フォルダの中にある素材情報とか。
 * シングルトン。
 */
class InformationWorkSpace {
    static instance = new InformationWorkSpace();
    parser = Parser_1.Parser.getInstance();
    pathDelimiter = (process.platform === "win32") ? "\\" : "/";
    DATA_DIRECTORY = this.pathDelimiter + "data"; //projectRootPath/data
    TYRANO_DIRECTORY = this.pathDelimiter + "tyrano"; //projectRootPath/tyrano
    DATA_BGIMAGE = this.pathDelimiter + "bgimage";
    DATA_BGM = this.pathDelimiter + "bgm";
    DATA_FGIMAGE = this.pathDelimiter + "fgimage";
    DATA_IMAGE = this.pathDelimiter + "image";
    DATA_OTHERS = this.pathDelimiter + "others";
    DATA_SCENARIO = this.pathDelimiter + "scenario";
    DATA_SOUND = this.pathDelimiter + "sound";
    DATA_SYSTEM = this.pathDelimiter + "system";
    DATA_VIDEO = this.pathDelimiter + "video";
    _scriptFileMap = new Map(); //ファイルパスと、中身(全文)
    _scenarioFileMap = new Map(); //ファイルパスと、中身(全文)
    _defineMacroMap = new Map(); //マクロ名と、マクロデータ defineMacroMapの値をもとに生成して保持するやつ <projectPath, <macroName,macroData>>
    _resourceFileMap = new Map(); //pngとかmp3とかのプロジェクトにあるリソースファイル
    _variableMap = new Map(); //projectpath,変数名と、定義情報
    _labelMap = new Map(); //ファイルパス、LabelDataの配列
    _suggestions = new Map(); //projectPath,入力候補のオブジェクト
    _nameMap = new Map(); //プロジェクトパスと、nameやidの定義
    _transitionMap = new Map(); //ファイル名、TransitionDataの配列
    defaultTagList = [];
    _resourceExtensions = vscode.workspace.getConfiguration().get('TyranoScript syntax.resource.extension');
    _resourceExtensionsArrays = Object.keys(this.resourceExtensions).map(key => this.resourceExtensions[key]).flat(); //resourceExtensionsをオブジェクトからstring型の一次配列にする
    _tagNameParams = vscode.workspace.getConfiguration().get('TyranoScript syntax.tag.name.parameters');
    _extensionPath = "";
    constructor() { }
    static getInstance() {
        return this.instance;
    }
    /**
     * マップファイルの初期化。
     * 本当はコンストラクタに書きたいのですがコンストラクタはasync使えないのでここに。await initializeMaps();の形でコンストラクタの直後に呼んで下さい。
     */
    async initializeMaps() {
        TyranoLogger_1.TyranoLogger.print(`InformationWorkSpace.initializeMaps()`);
        vscode.workspace.workspaceFolders?.forEach((value) => {
            TyranoLogger_1.TyranoLogger.print(`Opening workspace is ${value.uri.fsPath}`);
        });
        //最初のキーをプロジェクト名で初期化
        for (let projectPath of this.getTyranoScriptProjectRootPaths()) {
            TyranoLogger_1.TyranoLogger.print(`${projectPath} variable initialzie start`);
            this.defineMacroMap.set(projectPath, new Map());
            this._resourceFileMap.set(projectPath, []);
            this.variableMap.set(projectPath, new Map());
            try {
                const passJoined = path.join(InformationExtension_1.InformationExtension.path + `${path.sep}snippet${path.sep}tyrano.snippet.json`);
                const jsonData = fs.readFileSync(passJoined, "utf8");
                const parsedJson = JSON.parse(jsonData);
                this.defaultTagList = Object.keys(parsedJson);
                this.suggestions.set(projectPath, parsedJson);
                if (Object.keys(this.suggestions.get(projectPath)).length === 0) {
                    throw new Error("suggestions is empty");
                }
            }
            catch (error) {
                TyranoLogger_1.TyranoLogger.print("passJoin or JSON.parse or readFile Sync failed", TyranoLogger_1.ErrorLevel.ERROR);
                TyranoLogger_1.TyranoLogger.printStackTrace(error);
            }
            this.nameMap.set(projectPath, []);
            TyranoLogger_1.TyranoLogger.print(`${projectPath} variable initialzie end`);
        }
        for (let projectPath of this.getTyranoScriptProjectRootPaths()) {
            TyranoLogger_1.TyranoLogger.print(`${projectPath} is loading...`);
            //スクリプトファイルパスを初期化
            TyranoLogger_1.TyranoLogger.print(`${projectPath}'s scripts is loading...`);
            let absoluteScriptFilePaths = this.getProjectFiles(projectPath + this.DATA_DIRECTORY, [".js"], true); //dataディレクトリ内の.jsファイルを取得
            for (let i of absoluteScriptFilePaths) {
                await this.updateScriptFileMap(i);
                await this.updateMacroDataMapByJs(i);
                await this.updateVariableMapByJS(i);
            }
            //シナリオファイルを初期化
            TyranoLogger_1.TyranoLogger.print(`${projectPath}'s scenarios is loading...`);
            let absoluteScenarioFilePaths = await this.getProjectFiles(projectPath + this.DATA_DIRECTORY, [".ks"], true); //dataディレクトリ内の.ksファイルを取得
            for (let i of absoluteScenarioFilePaths) {
                await this.updateScenarioFileMap(i);
                await this.updateMacroLabelVariableDataMapByKs(i);
            }
            //リソースファイルを取得
            TyranoLogger_1.TyranoLogger.print(`${projectPath}'s resource file is loading...`);
            let absoluteResourceFilePaths = this.getProjectFiles(projectPath + this.DATA_DIRECTORY, this.resourceExtensionsArrays, true); //dataディレクトリのファイル取得
            for (let i of absoluteResourceFilePaths) {
                await this.addResourceFileMap(i);
            }
        }
    }
    /**
     * フォルダを開いてるなら、vscodeで開いているルートパスのディレクトリを取得します。
     * フォルダを開いてない場合、undefined.
     * @returns プロジェクトのルートパス。フォルダを開いていないならundefined.
     */
    getWorkspaceRootPath() {
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
    getTyranoScriptProjectRootPaths() {
        //フォルダ開いてないなら早期リターン
        if (this.getWorkspaceRootPath() === undefined) {
            return [];
        }
        // 指定したファイルパスの中のファイルのうち、index.htmlがあるディレクトリを返却。
        const listFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).
            flatMap(dirent => dirent.isFile() ?
            [`${dir}${this.pathDelimiter}${dirent.name}`].filter((file) => dirent.name === "index.html").map(str => str.replace(this.pathDelimiter + "index.html", "")) :
            listFiles(`${dir}${this.pathDelimiter}${dirent.name}`));
        const ret = listFiles(this.getWorkspaceRootPath());
        return ret;
    }
    /**
     * スクリプトファイルパスとその中身のMapを更新
     * @param filePath
     */
    async updateScriptFileMap(filePath) {
        if (path.extname(filePath) !== ".js") {
            return;
        }
        //vscodeAPIを使うとESLintも起動してしまうため、fsモジュールで読み込む。
        //fsモジュールによる読み込みが不要になったら以下二行の処理に戻すこと。
        // let textDocument = await vscode.workspace.openTextDocument(filePath);
        // this._scriptFileMap.set(textDocument.fileName, textDocument.getText());
        this._scriptFileMap.set(filePath, fs.readFileSync(filePath, "utf-8"));
    }
    async updateScenarioFileMap(filePath) {
        //.ks拡張子以外ならシナリオではないのでreturn
        if (path.extname(filePath) !== ".ks") {
            return;
        }
        let textDocument = await vscode.workspace.openTextDocument(filePath);
        this._scenarioFileMap.set(textDocument.fileName, textDocument);
    }
    async updateMacroDataMapByJs(absoluteScenarioFilePath) {
        TyranoLogger_1.TyranoLogger.print(`InformationWorkSpace.updateMacroDataMapByJs(${absoluteScenarioFilePath})`);
        const reg = /[^a-zA-Z0-9_$]/g;
        // const reg = /[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\uFF00-\uFF9F\uFF65-\uFF9F_]/g; //日本語も許容したいときはこっち.でも動作テストしてないからとりあえずは半角英数のみで
        const reg2 = /TYRANO\.kag\.ftag\.master_tag\.[a-zA-Z0-9_$]/g;
        const reg3 = /tyrano\.plugin\.kag\.tag\.[a-zA-Z0-9_$]/g;
        const parsedData = babel.parse(this.scriptFileMap.get(absoluteScenarioFilePath));
        const projectPath = await this.getProjectPathByFilePath(absoluteScenarioFilePath);
        const deleteTagList = await this.spliceMacroDataMapByFilePath(absoluteScenarioFilePath);
        await this.spliceSuggestionsByFilePath(projectPath, deleteTagList);
        babelTraverse(parsedData, {
            enter: (path) => {
                try {
                    //path.parentPathの値がTYRANO.kag.ftag.master_tag_MacroNameの形なら
                    if (path != null && path.parentPath != null && path.parentPath.type === "AssignmentExpression" && (reg2.test(path.parentPath.toString()) || reg3.test(path.parentPath.toString()))) {
                        let macroName = path.toString().split(".")[4]; //MacroNameの部分を抽出
                        if (macroName != undefined && macroName != null) {
                            let description = path.parentPath.parentPath.toString().replace(";", "").replace(path.parentPath.toString(), "");
                            description = description.replaceAll("/", "").replaceAll("*", "").replaceAll(" ", "").replaceAll("\t", "");
                            const macroData = new DefineMacroData_1.DefineMacroData(macroName, new vscode.Location(vscode.Uri.file(absoluteScenarioFilePath), new vscode.Position(path.node.loc.start.line, path.node.loc.start.column)), absoluteScenarioFilePath, description);
                            macroData.parameter.push(new MacroParameterData_1.MacroParameterData("parameter", false, "description")); //TODO:パーサーでパラメータの情報読み込んで追加する
                            this.defineMacroMap.get(projectPath)?.set(macroName, macroData);
                            this._suggestions.get(projectPath)[macroName] = macroData.parseToJsonObject();
                        }
                    }
                }
                catch (error) {
                    //例外発生するのは許容？
                    // console.log(error);
                }
            },
        });
    }
    /**
     * jsやiscript-endscript間で定義した変数を取得する
     * sentenceがundefined出ない場合、指定した値の範囲内で定義されている変数を取得する
     * @param absoluteScenarioFilePath
     * @param sentence
     */
    async updateVariableMapByJS(absoluteScenarioFilePath, sentence = undefined) {
        await this.spliceVariableMapByFilePath(absoluteScenarioFilePath);
        const projectPath = await this.getProjectPathByFilePath(absoluteScenarioFilePath);
        if (sentence === undefined) {
            sentence = this.scriptFileMap.get(absoluteScenarioFilePath);
        }
        const reg = /\b(f\.|sf\.|tf\.|mp\.)([^0-9０-９])([\.\w]*)/mg;
        const variableList = sentence.match(reg) ?? [];
        for (let variableBase of variableList) {
            //.で区切る
            const [variableType, variableName] = variableBase.split(".");
            this._variableMap.get(projectPath)?.set(variableName, new VariableData_1.VariableData(variableName, undefined, variableType));
            const location = new vscode.Location(vscode.Uri.file(absoluteScenarioFilePath), new vscode.Position(0, 0));
            this.variableMap.get(projectPath)?.get(variableName)?.addLocation(location); //変数の定義箇所を追加
        }
    }
    async updateMacroLabelVariableDataMapByKs(absoluteScenarioFilePath) {
        //ここに構文解析してマクロ名とURI.file,positionを取得する
        const scenarioData = this.scenarioFileMap.get(absoluteScenarioFilePath);
        const projectPath = await this.getProjectPathByFilePath(absoluteScenarioFilePath);
        if (scenarioData != undefined) {
            const parsedData = this.parser.parseText(scenarioData.getText()); //構文解析
            this.labelMap.set(absoluteScenarioFilePath, new Array());
            this.transitionMap.set(absoluteScenarioFilePath, new Array());
            let isIscript = false;
            let iscriptSentence = "";
            let description = "";
            //該当ファイルに登録されているマクロ、変数、タグ、nameを一度リセット
            const deleteTagList = await this.spliceMacroDataMapByFilePath(absoluteScenarioFilePath);
            await this.spliceVariableMapByFilePath(absoluteScenarioFilePath);
            await this.spliceNameMapByFilePath(absoluteScenarioFilePath);
            await this.spliceSuggestionsByFilePath(projectPath, deleteTagList);
            let currentLabel = "NONE";
            for (let data of parsedData) {
                //iscript-endscript間のテキストを取得。
                if (isIscript && data["name"] === "text") {
                    iscriptSentence += this.scenarioFileMap.get(absoluteScenarioFilePath)?.lineAt(data["line"]).text;
                }
                //name系のパラメータ取得
                if (this._tagNameParams.includes(data["name"])) {
                    //一度登録したら重複しないような処理が必要
                    let storage = "";
                    if (data["pm"]["storage"]) {
                        storage = data["pm"]["storage"];
                    }
                    if (data["pm"]["name"]) {
                        const tmpData = new NameParamData_1.NameParamData(data["pm"]["name"], "name", new vscode.Location(scenarioData.uri, new vscode.Position(await data["line"], await data["column"])), storage);
                        if (!this.nameMap.get(projectPath)?.some(item => item.name === tmpData.name && item.type === tmpData.type)) {
                            this.nameMap.get(projectPath)?.push(tmpData);
                        }
                    }
                    if (data["pm"]["face"]) {
                        const tmpData = new NameParamData_1.NameParamData(data["pm"]["face"], "face", new vscode.Location(scenarioData.uri, new vscode.Position(await data["line"], await data["column"])), storage);
                        if (!this.nameMap.get(projectPath)?.some(item => item.name === tmpData.name && item.type === tmpData.type)) {
                            this.nameMap.get(projectPath)?.push(tmpData);
                        }
                    }
                    if (data["pm"]["part"]) {
                        const tmpData = new NameParamData_1.NameParamData(data["pm"]["part"], "part", new vscode.Location(scenarioData.uri, new vscode.Position(await data["line"], await data["column"])), storage);
                        if (!this.nameMap.get(projectPath)?.some(item => item.name === tmpData.name && item.type === tmpData.type)) {
                            this.nameMap.get(projectPath)?.push(tmpData);
                        }
                    }
                    if (data["pm"]["id"]) {
                        const tmpData = new NameParamData_1.NameParamData(data["pm"]["id"], "id", new vscode.Location(scenarioData.uri, new vscode.Position(await data["line"], await data["column"])), storage);
                        if (!this.nameMap.get(projectPath)?.some(item => item.name === tmpData.name && item.type === tmpData.type)) {
                            this.nameMap.get(projectPath)?.push(tmpData);
                        }
                    }
                    if (data["pm"]["jname"]) {
                        const tmpData = new NameParamData_1.NameParamData(data["pm"]["jname"], "jname", new vscode.Location(scenarioData.uri, new vscode.Position(await data["line"], await data["column"])), storage);
                        if (!this.nameMap.get(projectPath)?.some(item => item.name === tmpData.name && item.type === tmpData.type)) {
                            this.nameMap.get(projectPath)?.push(tmpData);
                        }
                    }
                }
                //各種タグの場合
                if (await data["name"] === "macro") {
                    const macroData = new DefineMacroData_1.DefineMacroData(await data["pm"]["name"], new vscode.Location(scenarioData.uri, new vscode.Position(await data["line"], await data["column"])), absoluteScenarioFilePath, description);
                    const macroName = await data["pm"]["name"];
                    this.defineMacroMap.get(projectPath)?.set(macroName, macroData);
                    this._suggestions.get(projectPath)[await data["pm"]["name"]] = macroData.parseToJsonObject();
                }
                else if (await data["name"] === "label") {
                    //複数コメントの場合「*/」がラベルとして登録されてしまうので、それを除外する
                    if (await data["pm"]["label_name"] !== "/") {
                        currentLabel = await data["pm"]["label_name"];
                        if (!currentLabel.startsWith("*")) {
                            currentLabel = "*" + currentLabel;
                        }
                    }
                    this.labelMap.get(absoluteScenarioFilePath)?.push(new LabelData_1.LabelData(await data["pm"]["label_name"], new vscode.Location(scenarioData.uri, new vscode.Position(await data["line"], await data["column"]))));
                }
                else if (await data["name"] === "eval") {
                    const [variableBase, variableValue] = data["pm"]["exp"].split("=").map((str) => str.trim()); //vriableBaseにf.hogeの形
                    const [variableType, variableName] = variableBase.split(".");
                    //mapに未登録の場合のみ追加
                    if (!this.variableMap.get(projectPath)?.get(variableName)) {
                        this.variableMap.get(projectPath)?.set(variableName, new VariableData_1.VariableData(variableName, variableValue, variableType));
                    }
                    const location = new vscode.Location(scenarioData.uri, new vscode.Position(await data["line"], await data["column"]));
                    this.variableMap.get(projectPath)?.get(variableName)?.addLocation(location); //変数の定義箇所を追加
                }
                else if (await data["name"] === "iscript") {
                    isIscript = true; //endscriptが見つかるまで行を保存するモードに入る
                }
                else if (await data["name"] === "endscript") {
                    isIscript = false; //行を保存するモード終わり
                    this.updateVariableMapByJS(absoluteScenarioFilePath, iscriptSentence);
                }
                //マクロ定義のdescription挿入
                if (await data["name"] === "comment") {
                    if (await data["val"]) {
                        description += await data["val"] + "\n";
                    }
                }
                else {
                    description = "";
                }
                //transitionデータの登録処理
                //複数行コメントの場合
                if (TransitionData_1.TransitionData.jumpTags.includes(await data["name"]) && currentLabel !== "/") {
                    //_transitionMapへの登録処理
                    const range = new vscode.Range(new vscode.Position(await data["line"], 0), new vscode.Position(await data["line"], 0));
                    const uri = vscode.Uri.file(absoluteScenarioFilePath);
                    const tagName = await data["name"];
                    const storage = await data["pm"]["storage"] ? await data["pm"]["storage"] : undefined;
                    let target = await data["pm"]["target"] ? await data["pm"]["target"] : undefined;
                    if (target && !target.startsWith("*")) {
                        target = "*" + target;
                    }
                    const condition = await data["pm"]["cond"] ? await data["pm"]["cond"] : undefined;
                    const location = new vscode.Location(uri, range);
                    const transition = new TransitionData_1.TransitionData(tagName, storage, target, currentLabel, condition, location);
                    this.transitionMap.get(absoluteScenarioFilePath)?.push(transition);
                }
            }
        }
    }
    /**
     * リソースファイルのマップに値を追加
     * @param filePath ファイルパス
     */
    async addResourceFileMap(filePath) {
        const absoluteProjectPath = await this.getProjectPathByFilePath(filePath);
        let resourceType = Object.keys(this.resourceExtensions).filter(key => this.resourceExtensions[key].includes(path.extname(filePath))).toString(); //プロジェクトパスの拡張子からどのリソースタイプなのかを取得
        this._resourceFileMap.get(absoluteProjectPath)?.push(new ResourceFileData_1.ResourceFileData(filePath, resourceType));
    }
    /**
     * 引数で指定したファイルパスを、リソースファイルのマップから削除
     * @param absoluteProjectPath
     * @param filePath
     */
    async spliceResourceFileMapByFilePath(filePath) {
        const absoluteProjectPath = await this.getProjectPathByFilePath(filePath);
        const insertValue = this.resourceFileMap.get(absoluteProjectPath)?.filter(obj => obj.filePath !== filePath);
        this.resourceFileMap.set(absoluteProjectPath, insertValue);
    }
    /**
     *  引数で指定したファイルパスを、シナリオファイルのマップから削除
     * @param filePath
     */
    async spliceScenarioFileMapByFilePath(filePath) {
        this.scenarioFileMap.delete(filePath);
    }
    /**
     *  引数で指定したファイルパスを、スクリプトファイルのマップから削除
     * @param filePath
     */
    async spliceScriptFileMapByFilePath(filePath) {
        this.scriptFileMap.delete(filePath);
    }
    /**
     *  引数で指定したファイルパスを、マクロデータのマップから削除
     * @param filePath
     */
    async spliceMacroDataMapByFilePath(filePath) {
        const deleteTagList = [];
        const projectPath = await this.getProjectPathByFilePath(filePath);
        this.defineMacroMap.get(projectPath)?.forEach((value, key) => {
            if (value.filePath == filePath) {
                this.defineMacroMap.get(projectPath)?.delete(value.macroName);
                deleteTagList.push(value.macroName);
            }
        });
        return deleteTagList;
    }
    /**
     * 引数で指定したファイルパスを、ラベルデータのマップから削除
     * @param fsPath
     */
    async spliceLabelMapByFilePath(fsPath) {
        this.labelMap.delete(fsPath);
    }
    /**
     * 引数で指定したファイルパスを、変数データのマップから削除
     * @param fsPath
     */
    async spliceVariableMapByFilePath(fsPath) {
        const projectPath = await this.getProjectPathByFilePath(fsPath);
        this.variableMap.get(projectPath)?.forEach((value, key) => {
            value.locations.forEach((location) => {
                if (location.uri.fsPath === fsPath) {
                    this.variableMap.get(projectPath)?.delete(key);
                }
            });
        });
    }
    /**
     * 引数で指定したファイルパスを、パラメータのNameのMapから削除
     * @param fsPath
     */
    async spliceNameMapByFilePath(fsPath) {
        const projectPath = await this.getProjectPathByFilePath(fsPath);
        const value = this.nameMap.get(projectPath)?.filter(obj => obj.location?.uri.fsPath !== fsPath);
        this.nameMap.set(projectPath, value);
    }
    /**
     * 引数で指定したファイルパスを、タグ補完に使う変数のリストから削除
     * @param absoluteScenarioFilePath
     */
    async spliceSuggestionsByFilePath(projectPath, deleteTagList) {
        // デフォのタグに存在しないタグだけを取得
        const filteredDeleteTagList = deleteTagList.filter(tag => !this.defaultTagList.includes(tag));
        if (0 < filteredDeleteTagList.length) {
            filteredDeleteTagList.forEach(tag => {
                delete this.suggestions.get(projectPath)[tag];
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
    getProjectFiles(projectRootPath, permissionExtension = [], isAbsolute = false) {
        //ルートパスが存在していない場合
        if (projectRootPath === undefined || projectRootPath === "") {
            return [];
        }
        //指定したファイルパスの中のファイルのうち、permissionExtensionの中に入ってる拡張子のファイルパスのみを取得
        const listFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).
            flatMap(dirent => dirent.isFile() ?
            [`${dir}${this.pathDelimiter}${dirent.name}`].filter(file => {
                if (permissionExtension.length <= 0) {
                    return file;
                }
                return permissionExtension.includes(path.extname(file));
            }) :
            listFiles(`${dir}${this.pathDelimiter}${dirent.name}`));
        let ret = listFiles(projectRootPath); //絶対パスで取得
        //相対パスに変換
        if (!isAbsolute) {
            ret = ret.map(e => {
                return e.replace(projectRootPath + this.pathDelimiter, '');
            });
        }
        return ret;
    }
    /**
     * 引数で指定したファイルパスからプロジェクトパス（index.htmlのあるフォルダパス）を取得します。
     * @param filePath
     * @returns
     */
    async getProjectPathByFilePath(filePath) {
        let searchDir;
        do {
            const delimiterIndex = filePath.lastIndexOf(this.pathDelimiter);
            if (delimiterIndex === -1) {
                return "";
            }
            //filePathに存在するpathDelimiiter以降の文字列を削除
            filePath = filePath.substring(0, delimiterIndex);
            //フォルダ検索
            searchDir = fs.readdirSync(filePath, 'utf-8');
            //index.htmlが見つからないならループ
        } while (searchDir.filter(e => e === "index.html").length <= 0);
        return filePath;
    }
    isSamePath(path1, path2) {
        if (path1 === undefined || path2 === undefined) {
            return false;
        }
        return path.resolve(path1) === path.resolve(path2);
    }
    /**
     * 引数で与えたファイルの相対パスから、絶対パスを返します。
     * @param relativePath
     */
    convertToAbsolutePathFromRelativePath(relativePath) {
        return path.resolve(relativePath);
    }
    get scriptFileMap() {
        return this._scriptFileMap;
    }
    get scenarioFileMap() {
        return this._scenarioFileMap;
    }
    get resourceFileMap() {
        return this._resourceFileMap;
    }
    get defineMacroMap() {
        return this._defineMacroMap;
    }
    get resourceExtensions() {
        return this._resourceExtensions;
    }
    get resourceExtensionsArrays() {
        return this._resourceExtensionsArrays;
    }
    get variableMap() {
        return this._variableMap;
    }
    get labelMap() {
        return this._labelMap;
    }
    get suggestions() {
        return this._suggestions;
    }
    set suggestions(value) {
        this._suggestions = value;
    }
    get nameMap() {
        return this._nameMap;
    }
    get tagNameParams() {
        return this._tagNameParams;
    }
    get extensionPath() {
        return this._extensionPath;
    }
    set extensionPath(value) {
        this._extensionPath = value;
    }
    get transitionMap() {
        return this._transitionMap;
    }
    set transitionMap(value) {
        this._transitionMap = value;
    }
}
exports.InformationWorkSpace = InformationWorkSpace;
//# sourceMappingURL=InformationWorkSpace.js.map