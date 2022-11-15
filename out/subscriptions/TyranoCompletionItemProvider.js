"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoCompletionItemProvider = void 0;
const fs = require("fs");
const vscode = require("vscode");
const InformationWorkSpace_1 = require("../InformationWorkSpace");
/**
 * [1]プロジェクト中に存在する素材（画像、音声、シナリオ、外部JSを読み込みスニペット登録
 * →おそらくワークスペースに変更が加わるたびにワークスペースに更新掛ける必要がある。
 * →理想はタグごとのパラメータによってscenarioディレクトリだけのスニペットが出るとかbgディレクトリだけのスニペットが出るとか。
 * [2]シナリオ中で定義した変数とマクロを読み込んでスニペット登録
 * →テキストエディタに変更加わるたびにワークスペースに更新掛ける必要がある。
 * OK.[3]公式で提供されているタグの予測変換登録
 *
 * 実装順は312
 */
class TyranoCompletionItemProvider {
    constructor() {
        this.infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
        this.info = InformationWorkSpace_1.InformationWorkSpace.getInstance();
        //タグスニペットファイル読み込み
        this.tyranoTagSnippets = JSON.parse(fs.readFileSync(__dirname + "/./../../snippet/tyrano.snippet.json", "utf8"));
    }
    /**
     *
     * @param document
     * @param position
     * @param token
     * @param context
     * @returns
     */
    async provideCompletionItems(document, position, token, context) {
        //カーソル付近のタグデータを取得
        const parsedData = this.infoWs.parser.tyranoParser.parseScenario(document.lineAt(position.line).text);
        const array_s = parsedData["array_s"];
        let tagNumber = "";
        for (let data in array_s) {
            //マクロの定義column > カーソル位置なら探索不要なのでbreak;
            if (array_s[data]["column"] > position.character) {
                break;
            }
            tagNumber = data;
        }
        //空行orテキストならタグの予測変換を出す
        if (array_s === undefined || array_s[tagNumber] === undefined) {
            return this.completionTag();
        }
        else { //タグの中ならタグのパラメータの予測変換を出す 
            let isTagSentence = array_s[tagNumber]["name"] === "text" || array_s[tagNumber]["name"] === undefined ? false : true;
            if (isTagSentence) {
                return this.completionParameter(array_s[tagNumber]["name"], array_s[tagNumber]["pm"]);
            }
            else {
                return this.completionTag();
            }
        }
    }
    /**
     * //TODO:ラベルの予測変換
     * *から始まる単語なら予測変換をだす
     */
    conpletionLabel() {
        // comp.kind = vscode.CompletionItemKind.Variable;
        //「target="」「target_cancel="」が直前にあるならラベルの一覧を候補表示
    }
    /**
     * //TODO:変数の予測変換
     * f. sf. tf. のいずれかから始まった時予測変換を出す。
     * InformationWorkSpaceに登録済みの変数リストを取得すれば良い
     */
    completionVariable() {
        // comp.kind = vscode.CompletionItemKind.Variable;
    }
    //TODO:[1].storageとかならプロジェクト内のファイルパスを取得
    /**
     * ファイルの予測変換
     * InformationWorkSpaceに登録済みの素材Mapを取得すれば良い
     */
    completionFile() {
        //メモ
        //storageパラメータとかでは、必要なフォルダのファイルだけを候補に出したい。例：bgのstorageならbgimageフォルダだけとか。
        // storageパラメータのdescriptionに書いてある文字列によって分岐させる？背景、bgimageって単語があるならbgimage,音楽、BGM,があるならbgmフォルダとか。
        // comp.kind = vscode.CompletionItemKind.File;
    }
    //TODO:CompletionItemListを編集して必須のパラメータがわかるようにする
    /**
     * タグ内のパラメータの予測変換
     *
     *
     */
    async completionParameter(selectedTag, parameters) {
        let completions = new Array();
        //item:{}で囲ったタグの番号。0,1,2,3...
        //name:そのまんま。middle.jsonを見て。
        //item2:タグのパラメータ。0,1,2,3...って順に。
        for (const item in this.tyranoTagSnippets) {
            const tagName = this.removeBracket(this.tyranoTagSnippets[item]["name"].toString()); //タグ名。jumpとかpとかimageとか。
            if (selectedTag === tagName) {
                for (const item2 in this.tyranoTagSnippets[item]["parameters"]) {
                    if (!(this.tyranoTagSnippets[item]["parameters"][item2]["name"] in parameters)) { //タグにないparameterのみインテリセンスに出す
                        let comp = new vscode.CompletionItem(this.tyranoTagSnippets[item]["parameters"][item2]["name"]);
                        comp.insertText = new vscode.SnippetString(this.tyranoTagSnippets[item]["parameters"][item2]["name"] + "=\"$0\" ");
                        comp.documentation = new vscode.MarkdownString(this.tyranoTagSnippets[item]["parameters"][item2]["description"]);
                        comp.kind = vscode.CompletionItemKind.Function;
                        if (this.tyranoTagSnippets[item]["parameters"][item2]["required"]) {
                            comp.label = this.tyranoTagSnippets[item]["parameters"][item2]["name"] + "(必須)";
                        }
                        completions.push(comp);
                    }
                }
            }
        }
        return completions;
    }
    //TODO:自分で追加したマクロを予測変換表示できるように
    /**
     * タグの予測変換
     *
     */
    async completionTag() {
        let completions = new Array();
        for (let item in this.tyranoTagSnippets) {
            let tmpJsonData = this.tyranoTagSnippets[item];
            let textLabel = this.removeBracket(tmpJsonData["name"].toString());
            let comp = new vscode.CompletionItem(textLabel);
            const inputType = vscode.workspace.getConfiguration().get('TyranoScript syntax.completionTag.inputType');
            inputType === "@" ? comp.insertText = new vscode.SnippetString("@" + textLabel + " $0") : comp.insertText = new vscode.SnippetString("[" + textLabel + " $0]");
            comp.documentation = new vscode.MarkdownString(tmpJsonData["description"]);
            comp.kind = vscode.CompletionItemKind.Class;
            comp.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' }; //ここに、サンプル2のような予測候補を出すコマンド
            completions.push(comp);
        }
        ;
        return completions;
    }
    /**
     * 引数に入れた文字列からbracket[]を取り除きます。
     * @param str []を取り除く文字列
     * @returns []を取り除いた文字列
     */
    removeBracket(str) {
        return str.replace(/\[*/g, "").replace(/\]*/g, "");
        ;
    }
}
exports.TyranoCompletionItemProvider = TyranoCompletionItemProvider;
//# sourceMappingURL=TyranoCompletionItemProvider.js.map