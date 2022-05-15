"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoDiagnostic = void 0;
const vscode = require("vscode");
const fs = require("fs");
const InformationWorkSpace_1 = require("./InformationWorkSpace");
const util_1 = require("util");
const InformationTyranoScript_1 = require("./InformationTyranoScript");
class TyranoDiagnostic {
    constructor() {
        this.collection = vscode.languages.createDiagnosticCollection('tyranoDiagnostic');
        //パーサー
        this.loadModule = require('./lib/module-loader.js').loadModule;
        this.parser = this.loadModule(__dirname + '/lib/tyrano_parser.js');
        this.JUMP_TAG = ["jump", "call", "link", "button", "glink", "clickable"];
        this.informationTyranoScript = InformationTyranoScript_1.InformationTyranoScript.getInstance();
        this.informationWorkSpace = InformationWorkSpace_1.InformationWorkSpace.getInstance();
        this.tyranoTag = this.informationTyranoScript.getDefaultTag();
    }
    /**
     * 診断機能を作成する
     * @param document
     * @param commandDiagnostics
     */
    createDiagnostics(document, commandDiagnostics) {
        console.log("createDiagnostics");
        let diagnostics = [];
        //マクロが定義されているかどうかのチェック
        this.detectionNotDefineMacro("test_diagnostic.ks", document, diagnostics);
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
    detectionNotDefineMacro(scenarioFile, document, diagnostics) {
        //first.ksから順番にファイルを読み込んでいく処理
        //流れとしては以下で実装可能なはず
        // first.ksからjump,call,link,button,glink,clickableタグのある先へどんどん飛んでいく。
        // このとき、呼び出し順序もリストかなんかに保存しておくと後々なにかに使えそう。（jumpによる無限ループは避ける、とか。)
        // ファイルごとに全て処理をパーサーに与える
        // 各linterで必要な処理を実装
        // ※以下の処理は検出しないこと
        // 		ユーザー入力による変数の値の変更
        //		iscriptタグに埋め込まれた処理
        // const scenarioFilePath: Thenable<Uint8Array> = vscode.workspace.fs.readFile(vscode.Uri.file(this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY + this.informationWorkSpace.DATA_SCENARIO + "/" + scenarioFile));//vscode.fsだと戻り地が非同期だからできなさそう？
        const scenarioFilePath = fs.readFileSync(this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY + this.informationWorkSpace.DATA_SCENARIO + "/" + scenarioFile);
        const textData = new util_1.TextDecoder().decode(scenarioFilePath);
        console.log(textData);
        const parsedData = this.parser.tyranoParser.parseScenario(textData);
        const array_s = parsedData["array_s"];
        console.log(array_s);
        for (let data in array_s) {
            //タグが公式や定義済みのもの場合
            if (!this.tyranoTag.includes(array_s[data]["name"])) {
                console.log(array_s[data]["name"] + "は定義されていないよ");
                //マクロの名前がリストに保存されてないならdiagnosticに保存
                let firstIndex = document.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["name"]); // 該当行からタグの定義場所(開始位置)探す
                let lastIndex = document.lineAt(array_s[data]["line"]).text.lastIndexOf(array_s[data]["name"]); // 該当行からタグの定義場所(終了位置)探す
                let range = new vscode.Range(array_s[data]["line"], firstIndex, array_s[data]["line"], lastIndex);
                let diag = new vscode.Diagnostic(range, "タグ" + array_s[data]["name"] + "は未定義の可能性があります。", vscode.DiagnosticSeverity.Warning);
                diagnostics.push(diag);
            }
            else {
                console.log(array_s[data]["name"] + "は定義済だよ");
                //タグがマクロなら
                if (data["name"] === "macro") {
                    //マクロの名前をリストかなんかに保存しておく。
                    this.tyranoTag.push(array_s[data]["pm"]["name"]);
                }
                //タグがジャンプ系のタグなら
                if (this.JUMP_TAG.includes(data["name"])) {
                    //ファイル名とターゲット名をjsonとかリストかなんかに保存
                    //再帰関数で同じ関数を呼び出す
                    //this.detectionNotDefineMacro(data["pm"]["storage"]);
                }
            }
        }
        console.log("----------------");
        //first.ks（最初のファイル）なら処理終わり
        //それ以外のファイルなら再帰関数の呼び出しもとに戻る
        if (scenarioFile === "first.ks") {
        }
        else {
        }
    }
}
exports.TyranoDiagnostic = TyranoDiagnostic;
//# sourceMappingURL=TyranoDiagnostic.js.map