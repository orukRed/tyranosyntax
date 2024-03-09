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
exports.TyranoDiagnostic = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const InformationWorkSpace_1 = require("../InformationWorkSpace");
const TyranoLogger_1 = require("../TyranoLogger");
const Parser_1 = require("../Parser");
class TyranoDiagnostic {
    static diagnosticCollection = vscode.languages.createDiagnosticCollection('tyranoDiagnostic');
    //ファイルパス取得用
    infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
    parser = Parser_1.Parser.getInstance();
    //ティラノスクリプトのプロジェクトのルートパス
    tyranoProjectPaths = this.infoWs.getTyranoScriptProjectRootPaths();
    //パーサー
    JUMP_TAG = ["jump", "call", "link", "button", "glink", "clickable"];
    //基本タグを取得
    _isDiagnosing = false;
    get isDiagnosing() {
        return this._isDiagnosing;
    }
    set isDiagnosing(value) {
        this._isDiagnosing = value;
    }
    constructor() {
        this.tyranoProjectPaths.forEach(element => {
            TyranoLogger_1.TyranoLogger.print(element + "をプロジェクトとして読み込みました。");
        });
    }
    /**
     *
     * @param changedTextDocumentPath 変更されたテキストドキュメント、もしくは現在のアクティブテキストエディタのパス
     * @returns
     */
    async createDiagnostics(changedTextDocumentPath) {
        //変更されたテキストエディタが無いなら診断しない
        if (changedTextDocumentPath === undefined) {
            return;
        }
        //ログへの変更なら診断しない
        if (changedTextDocumentPath === "extension-output-orukred-tyranosyntax.tyranosyntax-#1-TyranoScript syntax") {
            return;
        }
        const diagnosticProjectPath = await this.infoWs.getProjectPathByFilePath(changedTextDocumentPath);
        TyranoLogger_1.TyranoLogger.print(`diagnostic start.`);
        const diagnosticArray = [];
        TyranoLogger_1.TyranoLogger.print(`[${diagnosticProjectPath}] parsing start.`);
        let tyranoTag = Object.keys(this.infoWs.suggestions.get(diagnosticProjectPath));
        tyranoTag = tyranoTag.concat(Array.from(this.infoWs.defineMacroMap.get(diagnosticProjectPath).keys()));
        //commentはパーサーに独自で追加したもの、labelとtextはティラノスクリプト側で既に定義されているもの。
        tyranoTag.push("comment");
        tyranoTag.push("label");
        tyranoTag.push("text");
        //FIXME:各関数でfor回すんじゃなくて、for回してから各関数を呼び出す処理にしたい
        //未定義のマクロを使用しているか検出
        await this.detectionNotDefineMacro(tyranoTag, this.infoWs.scenarioFileMap, diagnosticArray, diagnosticProjectPath);
        TyranoLogger_1.TyranoLogger.print(`[${diagnosticProjectPath}] macro detection finished.`);
        //存在しないシナリオファイル、未定義のラベルを検出
        await this.detectionNotExistScenarioAndLabels(this.infoWs.scenarioFileMap, diagnosticArray, diagnosticProjectPath);
        TyranoLogger_1.TyranoLogger.print(`[${diagnosticProjectPath}] scenario and label detection finished.`);
        //if文の中でjump,callタグを使用しているか検出
        await this.detectJumpAndCallInIfStatement(this.infoWs.scenarioFileMap, diagnosticArray, diagnosticProjectPath);
        TyranoLogger_1.TyranoLogger.print(`[${diagnosticProjectPath}] Detect if the 'jump' or 'call' tags are being used within an 'if' statement.`);
        //診断結果をセット
        TyranoLogger_1.TyranoLogger.print(`diagnostic set`);
        TyranoDiagnostic.diagnosticCollection.set(diagnosticArray);
        TyranoLogger_1.TyranoLogger.print("diagnostic end");
    }
    /**
     * 未定義のマクロを使用しているか検出します。
     * @param tyranoTag 現在プロジェクトに定義しているティラノスクリプトのタグ
     */
    async detectionNotDefineMacro(tyranoTag, absoluteScenarioFilePathMap, diagnosticArray, projectPath) {
        for (const [filePath, scenarioDocument] of absoluteScenarioFilePathMap) {
            const projectPathOfDiagFile = await this.infoWs.getProjectPathByFilePath(scenarioDocument.fileName);
            //診断中のプロジェクトフォルダと、診断対象のファイルのプロジェクトが一致しないならcontinue
            if (projectPath !== projectPathOfDiagFile) {
                continue;
            }
            const parsedData = this.parser.parseText(scenarioDocument.getText()); //構文解析
            let diagnostics = [];
            for (let data of parsedData) {
                //early return
                if (data["name"] === "comment") {
                    continue;
                }
                //タグが定義されていない場合
                if (!tyranoTag.includes(data["name"])) {
                    let tagFirstIndex = scenarioDocument.lineAt(data["line"]).text.indexOf(data["name"]); // 該当行からタグの定義場所(開始位置)探す
                    let tagLastIndex = tagFirstIndex + this.sumStringLengthsInObject(data["pm"]); // 該当行からタグの定義場所(終了位置)探す
                    let range = new vscode.Range(data["line"], tagFirstIndex, data["line"], tagLastIndex);
                    let diag = new vscode.Diagnostic(range, "タグ" + data["name"] + "は未定義です。", vscode.DiagnosticSeverity.Error);
                    diagnostics.push(diag);
                }
            }
            diagnosticArray.push([scenarioDocument.uri, diagnostics]);
        }
    }
    /**
     * jump系タグで指定したstorageやtargetに付いての診断を行います。
     * @param scenarioFiles 診断するシナリオファイルの絶対パスのリスト
     * @param diagnosticArray 参照渡しで更新する診断結果
     * @param projectPath 診断するプロジェクトの絶対パス
     */
    async detectionNotExistScenarioAndLabels(absoluteScenarioFilePathMap, diagnosticArray, projectPath) {
        for (const [filePath, scenarioDocument] of absoluteScenarioFilePathMap) {
            const projectPathOfDiagFile = await this.infoWs.getProjectPathByFilePath(scenarioDocument.fileName);
            //診断中のプロジェクトフォルダと、診断対象のファイルのプロジェクトが一致しないならcontinue
            if (projectPath !== projectPathOfDiagFile) {
                continue;
            }
            const parsedData = this.parser.parseText(scenarioDocument.getText()); //構文解析
            let diagnostics = [];
            for (let data of parsedData) {
                if (data["name"] === "comment") {
                    continue;
                }
                //storageに付いての処理(指定したファイルが有るかどうか)
                if (this.JUMP_TAG.includes(data["name"])) {
                    if (data["pm"]["storage"] !== undefined) {
                        let tagFirstIndex = scenarioDocument.lineAt(data["line"]).text.indexOf(data["pm"]["storage"]); // 該当行からタグの定義場所(開始位置)探す
                        let tagLastIndex = tagFirstIndex + this.sumStringLengthsInObject(data["pm"]); // 該当行からタグの定義場所(終了位置)探す
                        let range = new vscode.Range(data["line"], tagFirstIndex, data["line"], tagLastIndex);
                        //頭文字が%ならエラーとしては扱わない
                        if (this.isExistPercentAtBeginning(data["pm"]["storage"])) {
                            continue;
                        }
                        if (this.isValueIsIncludeVariable(data["pm"]["storage"])) {
                            if (!this.isExistAmpersandAtBeginning(data["pm"]["storage"])) {
                                let diag = new vscode.Diagnostic(range, "パラメータに変数を使う場合は先頭に'&'が必要です。", vscode.DiagnosticSeverity.Error);
                                diagnostics.push(diag);
                                continue;
                            }
                        }
                        else {
                            if (!data["pm"]["storage"].endsWith(".ks")) {
                                let diag = new vscode.Diagnostic(range, "storageパラメータは末尾が'.ks'である必要があります。", vscode.DiagnosticSeverity.Error);
                                diagnostics.push(diag);
                                continue;
                            }
                            if (!fs.existsSync(projectPath + this.infoWs.DATA_DIRECTORY + this.infoWs.DATA_SCENARIO + this.infoWs.pathDelimiter + data["pm"]["storage"])) {
                                let diag = new vscode.Diagnostic(range, data["pm"]["storage"] + "は存在しないファイルです。", vscode.DiagnosticSeverity.Error);
                                diagnostics.push(diag);
                                continue;
                            }
                        }
                    }
                    // targetについての処理
                    if (data["pm"]["target"] !== undefined) {
                        let tagFirstIndex = scenarioDocument.lineAt(data["line"]).text.indexOf(data["pm"]["target"]); // 該当行からタグの定義場所(開始位置)探す
                        let tagLastIndex = tagFirstIndex + this.sumStringLengthsInObject(data["pm"]); // 該当行からタグの定義場所(終了位置)探す
                        let range = new vscode.Range(data["line"], tagFirstIndex, data["line"], tagLastIndex);
                        //頭文字が%ならエラーとしては扱わない
                        if (this.isExistPercentAtBeginning(data["pm"]["target"])) {
                            continue;
                        }
                        if (this.isValueIsIncludeVariable(data["pm"]["target"])) {
                            if (!this.isExistAmpersandAtBeginning(data["pm"]["target"])) {
                                let diag = new vscode.Diagnostic(range, "パラメータに変数を使う場合は先頭に'&'が必要です。", vscode.DiagnosticSeverity.Error);
                                diagnostics.push(diag);
                                continue;
                            }
                        }
                        else if (!this.isValueIsIncludeVariable(data["pm"]["storage"])) { //targetがundefinedじゃない &&storageがundefinedじゃない && storageが変数でもない
                            //targetから*を外して表記ゆれ防ぐ
                            data["pm"]["target"] = data["pm"]["target"].replace("*", "");
                            //ファイル探索して、該当のラベルがあればisLabelExsitをtrueにして操作打ち切る
                            //storageが指定されてない(undefined)ならscenarioに入ってるパス（自分自身のシナリオファイル）を入れる
                            //storageが指定されてるなら指定先を取得
                            let storageScenarioDocument = (data["pm"]["storage"] === undefined) ?
                                scenarioDocument :
                                this.infoWs.scenarioFileMap.get(this.infoWs.convertToAbsolutePathFromRelativePath(projectPath + this.infoWs.DATA_DIRECTORY + this.infoWs.DATA_SCENARIO + this.infoWs.pathDelimiter + data["pm"]["storage"]));
                            if (storageScenarioDocument === undefined) {
                                let diag = new vscode.Diagnostic(range, data["pm"]["target"] + "ファイル解析中に下線の箇所でエラーが発生しました。開発者への報告をお願いします。", vscode.DiagnosticSeverity.Error);
                                diagnostics.push(diag);
                                continue;
                            }
                            const storageParsedData = this.parser.parseText(storageScenarioDocument.getText()); //構文解析
                            let isLabelExsit = false; //targetで指定したラベルが存在しているかどうか
                            for (let storageData in storageParsedData) {
                                if ((storageParsedData[storageData]["pm"]["label_name"] === data["pm"]["target"])) {
                                    isLabelExsit = true;
                                    break;
                                }
                            }
                            if (!isLabelExsit) {
                                let diag = new vscode.Diagnostic(range, data["pm"]["target"] + "は存在しないラベルです。", vscode.DiagnosticSeverity.Error);
                                diagnostics.push(diag);
                                continue;
                            }
                        }
                    }
                }
            }
            diagnosticArray.push([scenarioDocument.uri, diagnostics]);
        }
    }
    /**
     * 引数に入れた値の先頭に&記号があるかを判断します。
     * @returns trueなら&がある、 falseなら&がない
     */
    isExistAmpersandAtBeginning(value) {
        return value.indexOf("&") === 0 ? true : false;
    }
    /**
   * 引数に入れた値の先頭に%記号があるかを判断します。
   * @returns trueなら&がある、 falseなら&がない
   */
    isExistPercentAtBeginning(value) {
        return value.indexOf("%") === 0 ? true : false;
    }
    /**
     * 引数に入れた値が変数を含むかどうかを判断します。
     * @returns trueなら値は変数 falseなら値は変数でない
     */
    isValueIsIncludeVariable(value) {
        if (value === undefined) {
            return false;
        }
        //いずれの変数ともマッチしないならvalueに変数は含まれていない
        if (value.match(/f\.[a-zA-Z_]\w*/) === null &&
            value.match(/sf\.[a-zA-Z_]\w*/) === null &&
            value.match(/tf\.[a-zA-Z_]\w*/) === null &&
            value.match(/mp\.[a-zA-Z_]\w*/) === null) {
            return false;
        }
        return true;
    }
    /**
     * 読み込んだスクリプトの現在位置がラベルで定義済みかを判断します。
     * @param scenarioFileLabel  ジャンプ系タグで指定されたtargetの値
     * @param loadingScriptLabel 現在読み込んでいるシナリオの現在のラベル
     * @returns
     */
    async checkLoadingScriptIsDefinedLabel(scenarioFileLabel, loadingScriptLabel) {
        //ターゲットが未指定、もしくはターゲットとラベルが一致する
        if (scenarioFileLabel === undefined || scenarioFileLabel === "" || loadingScriptLabel === scenarioFileLabel) {
            return true;
        }
        return false;
    }
    /**
     * if,ifelse,else文の中でjump,callタグを使用しているか検出します。
     */
    async detectJumpAndCallInIfStatement(absoluteScenarioFilePathMap, diagnosticArray, projectPath) {
        for (const [filePath, scenarioDocument] of absoluteScenarioFilePathMap) {
            const projectPathOfDiagFile = await this.infoWs.getProjectPathByFilePath(scenarioDocument.fileName);
            //診断中のプロジェクトフォルダと、診断対象のファイルのプロジェクトが一致しないならcontinue
            if (projectPath !== projectPathOfDiagFile) {
                continue;
            }
            let isInIf = false; //if文の中にいるかどうか
            const parsedData = this.parser.parseText(scenarioDocument.getText()); //構文解析
            let diagnostics = [];
            for (let data of parsedData) {
                //early return
                if (data["name"] === "comment") {
                    continue;
                }
                if (data["name"] === "if") {
                    isInIf = true;
                }
                if (data["name"] === "endif") {
                    isInIf = false;
                }
                //条件式
                if (isInIf && (data["name"] === "jump" || isInIf && data["name"] === "call")) {
                    let tagFirstIndex = scenarioDocument.lineAt(data["line"]).text.indexOf(data["name"]); // 該当行からタグの定義場所(開始位置)探す
                    let tagLastIndex = tagFirstIndex + this.sumStringLengthsInObject(data["pm"]); // 該当行からタグの定義場所(終了位置)探す
                    const range = new vscode.Range(data["line"], tagFirstIndex, data["line"], tagLastIndex);
                    const diag = new vscode.Diagnostic(range, `ifの中での${data["name"]}は正常に動作しない可能性があります。[${data["name"]} cond="条件式"]に置き換えることを推奨します。`, vscode.DiagnosticSeverity.Warning);
                    diagnostics.push(diag);
                }
            }
            diagnosticArray.push([scenarioDocument.uri, diagnostics]);
        }
    }
    sumStringLengthsInObject(obj) {
        let totalLength = 0;
        const value = 4; //ダブルクォート*2とイコールと半角スペースの分
        const firstValue = 2; //アットマークor[]と、最初の半角スペース分
        totalLength += firstValue;
        for (let key in obj) {
            if (typeof key === 'string') {
                totalLength += key.length;
            }
            if (typeof obj[key] === 'string') {
                totalLength += obj[key].length;
            }
            totalLength += value;
        }
        return totalLength;
    }
}
exports.TyranoDiagnostic = TyranoDiagnostic;
//# sourceMappingURL=TyranoDiagnostic.js.map