"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoDiagnostic = void 0;
const vscode = require("vscode");
const InformationWorkSpace_1 = require("./InformationWorkSpace");
const InformationProjectData_1 = require("./InformationProjectData");
class TyranoDiagnostic {
    constructor() {
        this.collection = vscode.languages.createDiagnosticCollection('tyranoDiagnostic');
        //ティラノスクリプトに関する情報
        this.informationTyranoScript = InformationProjectData_1.InformationProjectData.getInstance();
        //ファイルパス取得用
        this.informationWorkSpace = InformationWorkSpace_1.InformationWorkSpace.getInstance();
        //パーサー
        this.loadModule = require('./lib/module-loader.js').loadModule;
        this.parser = this.loadModule(__dirname + '/lib/tyrano_parser.js');
        this.JUMP_TAG = ["jump", "call", "link", "button", "glink", "clickable"];
        this.tyranoDefaultTag = this.informationTyranoScript.getDefaultTag();
    }
    ;
    /**
     * 診断機能を作成する
     * @param document
     * @param commandDiagnostics
     */
    async createDiagnostics(document, commandDiagnostics) {
        console.log("createDiagnostics");
        let diagnostics = [];
        //マクロが定義されているかどうかのチェック
        // this.detectionNotDefineMacro("test_diagnostic.ks", document, diagnostics);
        diagnostics = diagnostics.concat(await this.detectionNotDefineMacro("test_diagnostic.ks"));
        //WARNINGやらERRORのテスト
        {
            let docText = document.getText();
            // // [Optional] コメント行を除く
            // // 行コメントも取り除きたい
            // docText = docText.replace(/\/\*(.*?)\*\//g, "");
            let index1 = docText.indexOf("WARNING");
            let pos1 = [index1, index1 + 5];
            let startPos1 = document.positionAt(pos1[0]);
            let endPos1 = document.positionAt(pos1[1]);
            let range1 = new vscode.Range(startPos1, endPos1);
            let diag1 = new vscode.Diagnostic(range1, "WARNING!!!", vscode.DiagnosticSeverity.Warning);
            diagnostics.push(diag1);
            let index2 = docText.indexOf("ERROR");
            let pos2 = [index2, index2 + 5];
            let startPos2 = document.positionAt(pos2[0]);
            let endPos2 = document.positionAt(pos2[1]);
            let range2 = new vscode.Range(startPos2, endPos2);
            let diag2 = new vscode.Diagnostic(range2, "ERROR!!!", vscode.DiagnosticSeverity.Error);
            diagnostics.push(diag2);
            let index3 = docText.indexOf("HINT");
            let pos3 = [index3, index3 + 5];
            let startPos3 = document.positionAt(pos3[0]);
            let endPos3 = document.positionAt(pos3[1]);
            let range3 = new vscode.Range(startPos3, endPos3);
            let diag3 = new vscode.Diagnostic(range3, "HINT!!!", vscode.DiagnosticSeverity.Hint);
            diagnostics.push(diag3);
            let index4 = docText.indexOf("INFO");
            let pos4 = [index4, index4 + 5];
            let startPos4 = document.positionAt(pos4[0]);
            let endPos4 = document.positionAt(pos4[1]);
            let range4 = new vscode.Range(startPos4, endPos4);
            let diag4 = new vscode.Diagnostic(range4, "INFO!!!!", vscode.DiagnosticSeverity.Information);
            diagnostics.push(diag4);
        }
        commandDiagnostics.set(document.uri, diagnostics);
    }
    /**
     * 引数で指定したファイルから、ファイル自身とファイルから呼ばれるシナリオファイル内に
     * 定義されていないマクロがあるかどうか検出します。
     * 再帰処理で呼んでいます。
     * @param scenarioFile シナリオファイル名。(first.ks)
     * @returns Promise<vscode.Diagnostic[]>
     */
    /**
ァイル内に
     * 定義されていないマクロがあるかどうか検出します。
     * そのファイル内のジャンプ先に関しても再帰処理で呼んでいます。
     * @param scenarioFile 検出の起点となるシナリオファイル名。(first.ks)
     * @param document
     * @param diagnostics
     */
    async detectionNotDefineMacro(scenarioFile) {
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
        let tyranoTag = this.tyranoDefaultTag.slice();
        const document = await this.getScenarioDocument(this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY + this.informationWorkSpace.DATA_SCENARIO + "/" + scenarioFile); //引数のパスのシナリオ全文取得
        const parsedData = this.parser.tyranoParser.parseScenario(document.getText()); //構文解析
        const array_s = parsedData["array_s"];
        console.log(array_s);
        let diagnostics = [];
        for (let data in array_s) {
            //タグが公式や定義済みのもの場合
            if (!tyranoTag.includes(array_s[data]["name"])) {
                console.log(array_s[data]["name"] + "は定義されていないよ");
                let tagFirstIndex = document.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["name"]); // 該当行からタグの定義場所(開始位置)探す
                let tagLastIndex = document.lineAt(array_s[data]["line"]).text.lastIndexOf(array_s[data]["name"]); // 該当行からタグの定義場所(終了位置)探す
                let range = new vscode.Range(array_s[data]["line"], tagFirstIndex, array_s[data]["line"], tagLastIndex);
                let diag = new vscode.Diagnostic(range, "タグ" + array_s[data]["name"] + "は未定義の可能性があります。", vscode.DiagnosticSeverity.Warning);
                diagnostics.push(diag);
            }
            else {
                console.log(array_s[data]["name"] + "は定義済だよ");
                //タグがマクロなら
                if (array_s[data]["name"] === "macro") {
                    //マクロの名前をリストかなんかに保存しておく。
                    tyranoTag.push(array_s[data]["pm"]["name"]);
                }
                //タグがジャンプ系のタグなら
                if (this.JUMP_TAG.includes(data["name"])) {
                    //ファイル名とターゲット名をjsonとかリストかなんかに保存
                    //同じファイルかつ同じターゲットには二度と入らないようにする
                    //hoge.push({"scenario":"foo.ks","label":"*bar"},)
                    //再帰関数で同じ関数を呼び出す
                    //this.detectionNotDefineMacro(data["pm"]["storage"]);
                }
            }
        }
        console.log("----------------");
        return diagnostics;
        //first.ks（最初のファイル）なら処理終わり
        //それ以外のファイルなら再帰関数の呼び出しもとに戻る
        // if (scenarioFile === "first.ks") {
        // 	return diagnostics;
        // } else {
        // 	return diagnostics;
        // }
    }
    hoge() {
    }
    /**
 * 引数で指定したシナリオファイルの全文を取得します。
 * @param scenarioFilePath シナリオファイルのパス
 * @returns
 */
    async getScenarioDocument(scenarioFilePath) {
        return vscode.workspace.openTextDocument(scenarioFilePath)
            .then(value => {
            return value;
        }, err => {
        });
    }
}
exports.TyranoDiagnostic = TyranoDiagnostic;
//# sourceMappingURL=TyranoDiagnostic.js.map