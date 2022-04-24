"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoCompletionItemProvider = void 0;
const fs = require("fs");
const vscode = require("vscode");
const InformationWorkSpace_1 = require("./InformationWorkSpace");
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
        this.info = InformationWorkSpace_1.InformationWorkSpace.getInstance();
        //タグスニペットファイル読み込み
        this.tyranoTagSnippets = JSON.parse(fs.readFileSync(__dirname + "/./../snippet/tyrano.snippet.json", "utf8"));
    }
    /**
     *
     * @param document
     * @param position
     * @param token
     * @param context
     * @returns
     */
    provideCompletionItems(document, position, token, context) {
        const leftBracketPosition = document.lineAt(position).text.lastIndexOf("\[");
        const atSignPosition = document.lineAt(position).text.indexOf("@");
        //"["がないならスキップ。処理高速化のため。 
        if (leftBracketPosition !== -1 || atSignPosition !== -1) {
            return this.completionParameter(document, position, token, context, leftBracketPosition);
        }
        else {
            return this.completionTag(); //FIXME:同じ行に2つ以上タグを置くとタグ名の候補が正しく表示されない(↑のif文に入っている）
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
     */
    completionVariable() {
        // comp.kind = vscode.CompletionItemKind.Variable;
    }
    //TODO:[1].storageとかならプロジェクト内のファイルパスを取得
    /**
     * ファイルの予測変換
     *
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
    completionParameter(document, position, token, context, leftBracketPosition) {
        const linePrefix = document.lineAt(position).text.substring(leftBracketPosition, position.character); //最も後ろのタグを取得。//FIXME:パラメータの値に配列使ってる時に引っかからない 
        let tagName = ""; //正規表現で検索かけるタグ名。jumpとかpとかimageとか。
        let completions = new Array();
        //item:{}で囲ったタグの番号。0,1,2,3...
        //name:そのまんま。middle.jsonを見て。
        //item2:タグのパラメータ。0,1,2,3...って順に。
        for (const item in this.tyranoTagSnippets) {
            tagName = this.removeBracket(this.tyranoTagSnippets[item]["name"].toString());
            if (linePrefix.indexOf("[" + tagName) !== -1 || linePrefix.indexOf("@" + tagName) !== -1) { //タグ名があるならパラメータ検索をする  //FIXME:bgとbg2が区別できていないため、両方に存在するパラメータが重複する。
                for (const item2 in this.tyranoTagSnippets[item]["parameters"]) {
                    if (document.lineAt(position).text.lastIndexOf(this.tyranoTagSnippets[item]["parameters"][item2]["name"]) === -1) { //その行にパラメータの名前が含まれていないなら //FIXME: 一行に複数個タグがある時、一つのタグで使ったパラメータが他のタグで予測候補として表示されない
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
    completionTag() {
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