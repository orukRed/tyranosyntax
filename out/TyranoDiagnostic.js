"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoDiagnostic = void 0;
const vscode = require("vscode");
const InformationWorkSpace_1 = require("./InformationWorkSpace");
const InformationProjectData_1 = require("./InformationProjectData");
class TyranoDiagnostic {
    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('tyranoDiagnostic');
        //ティラノスクリプトに関する情報
        this.informationProjectData = InformationProjectData_1.InformationProjectData.getInstance();
        //ファイルパス取得用
        this.informationWorkSpace = InformationWorkSpace_1.InformationWorkSpace.getInstance();
        //パーサー
        this.loadModule = require('./lib/module-loader.js').loadModule;
        this.parser = this.loadModule(__dirname + '/lib/tyrano_parser.js');
        this.JUMP_TAG = ["jump", "call", "link", "button", "glink", "clickable"];
        this.tyranoDefaultTag = this.informationProjectData.getDefaultTag();
    }
    ;
    async createDiagnostics() {
        console.log("createDiagnostics");
        let variables = new Map(); //プロジェクトで定義された変数を格納<variableName,value>
        const scenarioFiles = this.informationWorkSpace.getProjectFiles(this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY + this.informationWorkSpace.DATA_SCENARIO);
        //マクロ未定義の検出(過去バージョン)
        // this.__detectionNotDefineMacro("test_diagnostic.ks");
        //シナリオからマクロ定義を読み込む
        let tyranoTag = await this.loadDefinedMacroByScenarios(await this.tyranoDefaultTag.slice());
        //未定義のマクロを使用しているか検出
        this.detectionNotDefineMacro(tyranoTag, scenarioFiles);
        // //シナリオ名とラベルを読み込む <scenarioName, labels>
        let scenarioAndLabels = await this.loadDefinedScenarioAndLabels();
        console.log(scenarioAndLabels);
        //存在しないシナリオファイル、未定義のラベルを検出
        // await this.detectionNotExistScenarioAndLabels(scenarioAndLabels, scenarioFiles);
    }
    /**
     * シナリオで定義されているタグを返却します。
     * @param 現在定義されているティラノスクリプトのタグのリスト
     * @return ティラノ公式タグ+読み込んだ定義済みマクロの名前の配列
     */
    async loadDefinedMacroByScenarios(tyranoTag) {
        console.log("loadDefinedMacroByScenarios");
        const scenarioFiles = this.informationWorkSpace.getProjectFiles(this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY + this.informationWorkSpace.DATA_SCENARIO);
        for (const scenario of scenarioFiles) {
            const scenarioFileAbsolutePath = this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY + this.informationWorkSpace.DATA_SCENARIO + "/" + scenario; //シナリオファイルの絶対パス取得
            const scenarioDocument = this.getScenarioDocument(scenarioFileAbsolutePath); //引数のパスのシナリオ全文取得
            const parsedData = this.parser.tyranoParser.parseScenario((await scenarioDocument).getText()); //構文解析
            const array_s = parsedData["array_s"];
            console.log(array_s);
            for (let data in array_s) {
                //タグがマクロなら
                if (array_s[data]["name"] === "macro") {
                    //マクロの名前をリストかなんかに保存しておく。
                    tyranoTag.push(await array_s[data]["pm"]["name"]);
                }
            }
        }
        return tyranoTag;
    }
    /**
     * 未定義のマクロを使用しているか検出します。
     * @param tyranoTag 現在プロジェクトに定義しているティラノスクリプトのタグ
     */
    async detectionNotDefineMacro(tyranoTag, scenarioFiles) {
        console.log("loadDefinedMacroByScenarios");
        for (const scenario of scenarioFiles) {
            const scenarioFileAbsolutePath = this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY + this.informationWorkSpace.DATA_SCENARIO + "/" + scenario; //シナリオファイルの絶対パス取得
            const scenarioDocument = this.getScenarioDocument(scenarioFileAbsolutePath); //引数のパスのシナリオ全文取得
            const parsedData = this.parser.tyranoParser.parseScenario((await scenarioDocument).getText()); //構文解析
            const array_s = parsedData["array_s"];
            let diagnostics = [];
            for (let data in array_s) {
                //タグが定義されていない場合
                if (!tyranoTag.includes(array_s[data]["name"])) {
                    let tagFirstIndex = (await scenarioDocument).lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["name"]); // 該当行からタグの定義場所(開始位置)探す
                    let tagLastIndex = (await scenarioDocument).lineAt(array_s[data]["line"]).text.lastIndexOf(array_s[data]["name"]); // 該当行からタグの定義場所(終了位置)探す
                    let range = new vscode.Range(array_s[data]["line"], tagFirstIndex, array_s[data]["line"], tagLastIndex);
                    let diag = new vscode.Diagnostic(range, "タグ" + array_s[data]["name"] + "は未定義の可能性があります。", vscode.DiagnosticSeverity.Warning);
                    diagnostics.push(diag);
                }
            }
            this.diagnosticCollection.set((await scenarioDocument).uri, diagnostics);
        }
    }
    /**
     *
     * @returns
     */
    async loadDefinedScenarioAndLabels() {
        let scenarioAndLabels = new Map();
        const scenarioFiles = this.informationWorkSpace.getProjectFiles(this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY + this.informationWorkSpace.DATA_SCENARIO);
        for (const scenario of scenarioFiles) {
            const scenarioFileAbsolutePath = this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY + this.informationWorkSpace.DATA_SCENARIO + "/" + scenario; //シナリオファイルの絶対パス取得
            const scenarioDocument = this.getScenarioDocument(scenarioFileAbsolutePath); //引数のパスのシナリオ全文取得
            const parsedData = this.parser.tyranoParser.parseScenario((await scenarioDocument).getText()); //構文解析
            const array_s = parsedData["array_s"];
            let labels = [];
            for (let data in array_s) {
                //ラベルなら
                if (array_s[data]["name"] === "label") {
                    labels.push("*" + array_s[data]["pm"]["label_name"]);
                }
            }
            //シナリオ名とラベルを保存
            (await scenarioAndLabels).set(scenario, labels);
        }
        return scenarioAndLabels;
    }
    async detectionNotExistScenarioAndLabels(scenarioAndLabels, scenarioFiles) {
        var _a;
        for (const scenario of scenarioFiles) {
            const scenarioFileAbsolutePath = this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY + this.informationWorkSpace.DATA_SCENARIO + "/" + scenario; //シナリオファイルの絶対パス取得
            const scenarioDocument = this.getScenarioDocument(scenarioFileAbsolutePath); //引数のパスのシナリオ全文取得
            const parsedData = this.parser.tyranoParser.parseScenario((await scenarioDocument).getText()); //構文解析
            const array_s = parsedData["array_s"];
            let diagnostics = [];
            for (let data in array_s) {
                //ジャンプ系タグなら
                if (this.JUMP_TAG.includes(array_s[data]["name"])) {
                    //プロジェクトに存在しないファイルなら [...hoge]でスプレッド構文 Array.prototype.concat()相当のことが簡潔書ける
                    if (![...scenarioAndLabels.keys()].includes(array_s[data]["pm"]["storage"] && array_s[data]["pm"]["storage"] !== undefined && array_s[data]["pm"]["storage"] !== undefined)) {
                        let tagFirstIndex = (await scenarioDocument).lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["name"]); // 該当行からタグの定義場所(開始位置)探す
                        let tagLastIndex = (await scenarioDocument).lineAt(array_s[data]["line"]).text.lastIndexOf(array_s[data]["name"]); // 該当行からタグの定義場所(終了位置)探す
                        let range = new vscode.Range(array_s[data]["line"], tagFirstIndex, array_s[data]["line"], tagLastIndex);
                        let diag = new vscode.Diagnostic(range, array_s[data]["pm"]["storage"] + "は存在しないファイルです。", vscode.DiagnosticSeverity.Error);
                        diagnostics.push(diag);
                    }
                    //プロジェクト登録されていないラベルなら
                    if (!((_a = scenarioAndLabels.get(scenario)) === null || _a === void 0 ? void 0 : _a.includes(array_s[data]["pm"]["target"] && array_s[data]["pm"]["target"] !== undefined && array_s[data]["pm"]["target"] !== undefined))) {
                        let tagFirstIndex = (await scenarioDocument).lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["name"]); // 該当行からタグの定義場所(開始位置)探す
                        let tagLastIndex = (await scenarioDocument).lineAt(array_s[data]["line"]).text.lastIndexOf(array_s[data]["name"]); // 該当行からタグの定義場所(終了位置)探す
                        let range = new vscode.Range(array_s[data]["line"], tagFirstIndex, array_s[data]["line"], tagLastIndex); //ここでエラー起きてる？
                        let diag = new vscode.Diagnostic(range, array_s[data]["pm"]["target"] + "は存在しないラベルです。", vscode.DiagnosticSeverity.Error);
                        diagnostics.push(diag);
                        //sotarageやtargetが変数の場合の処理がかけてない
                    }
                }
            }
            this.diagnosticCollection.set((await scenarioDocument).uri, diagnostics);
        }
    }
    /**
     * 未定義のマクロを使用しているか検出します。(時系列考慮バージョン)
     * 引数で入れた値から、jump,callなどのタグを再帰的に呼び出し診断します。
     * @param scenarioFile 診断するファイル。呼び出し時にはエントリポイント（指定したスクリプトファイルから診断開始）
     * @param scenarioFileLabel シナリオファイルのラベル名。指定しない場合ファイルの最初から読み込む
     */
    async __detectionNotDefineMacro(scenarioFile, scenarioFileLabel = "") {
        {
            // let diagnostics: vscode.Diagnostic[] = [];
            //first.ksから順番にファイルを読み込んでいく処理
            //流れとしては以下で実装可能なはず
            // first.ksからjump,call,link,button,glink,clickableタグのある先へどんどん飛んでいく。
            // このとき、呼び出し順序もリストかなんかに保存しておくと後々なにかに使えそう。（jumpによる無限ループは避ける、とか。)
            // ファイルごとに全て処理をパーサーに与える
            // 各linterで必要な処理を実装
            // ※以下の処理は検出しないこと
            // ユーザー入力による変数の値の変更
            //	iscriptタグに埋め込まれた処理
            //if,elseif,else,iscript,htmlで定義された中身はスキップする(終了タグがあるまでifで分岐して処理させない)
            //array_s[data]["pm"]["cond"]がある場合はスキップする
            //ティラノスクリプトのタグ
            //初期値は公式で提供されているもの
        }
        let tyranoTag = this.tyranoDefaultTag.slice(); //公式タグの定義
        const scenarioFileAbsolutePath = this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY + this.informationWorkSpace.DATA_SCENARIO + "/" + scenarioFile; //シナリオファイルの絶対パス取得
        const scenarioDocument = await this.getScenarioDocument(scenarioFileAbsolutePath); //引数のパスのシナリオ全文取得
        const parsedData = this.parser.tyranoParser.parseScenario(scenarioDocument.getText()); //構文解析
        const array_s = parsedData["array_s"];
        console.log(array_s);
        let diagnostics = [];
        let isLabelStart = false; //引数で指定したラベルにたどり着いたかどうか
        for (let data in array_s) {
            //一度ラベルにたどり着いてるなら二度とfalseにしない(ティラノの仕様としてスクリプト読み込み中にラベルに到達した場合jumpタグがなくてもそのラベルに移動するため。)
            // if (!isLabelStart) {
            // 	isLabelStart = await this.checkLoadingScriptIsDefinedLabel(scenarioFileLabel, array_s[data]["pm"]["label_name"]);
            // 	//ジャンプタグで指定したtargetに到達していないならcontinue
            // 	if (!isLabelStart) {
            // 		continue;
            // 	}
            // }
            //タグが定義済みのもの場合 ここらへんの処理を関数ワケできそう？
            if (!tyranoTag.includes(array_s[data]["name"])) {
                let tagFirstIndex = scenarioDocument.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["name"]); // 該当行からタグの定義場所(開始位置)探す
                let tagLastIndex = scenarioDocument.lineAt(array_s[data]["line"]).text.lastIndexOf(array_s[data]["name"]); // 該当行からタグの定義場所(終了位置)探す
                let range = new vscode.Range(array_s[data]["line"], tagFirstIndex, array_s[data]["line"], tagLastIndex);
                let diag = new vscode.Diagnostic(range, "タグ" + array_s[data]["name"] + "は未定義の可能性があります。", vscode.DiagnosticSeverity.Warning);
                diagnostics.push(diag);
            }
            else {
                //タグがマクロなら
                if (array_s[data]["name"] === "macro") {
                    //マクロの名前をリストかなんかに保存しておく。
                    tyranoTag.push(array_s[data]["pm"]["name"]);
                }
                //タグがジャンプ系のタグなら
                if (this.JUMP_TAG.includes(array_s[data]["name"])) {
                    //ファイル名とターゲット名をjsonとかリストかなんかに保存
                    //同じファイルかつ同じターゲットには二度と入らないようにする
                    //hoge.push({"scenario":"foo.ks","label":"*bar"},)
                    let nextScenarioFile = (array_s[data]["pm"]["storage"] === undefined ? scenarioFile : array_s[data]["pm"]["storage"]);
                    //再帰関数で同じ関数を呼び出す
                    this.__detectionNotDefineMacro(nextScenarioFile, array_s[data]["pm"]["target"]);
                }
            }
        }
        console.log("----------------");
        this.diagnosticCollection.set(scenarioDocument.uri, diagnostics);
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
 * 引数で指定したシナリオファイルの全文を取得します。
 * @param scenarioFilePath シナリオファイルの絶対パス
 * @returns
 */
    async getScenarioDocument(scenarioFilePath) {
        return await vscode.workspace.openTextDocument(scenarioFilePath)
            .then(value => {
            return value;
        }, err => {
        });
    }
}
exports.TyranoDiagnostic = TyranoDiagnostic;
//# sourceMappingURL=TyranoDiagnostic.js.map