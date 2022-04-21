import * as fs from 'fs';
import * as vscode from 'vscode';
import { InformationWorkSpace } from './InformationWorkSpace';


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
export class TyranoCompletionItemProvider implements vscode.CompletionItemProvider {

	private tyranoTagSnippets: Object; //公式タグのスニペット定義
	private info: InformationWorkSpace = InformationWorkSpace.getInstance();
	public constructor() {
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
	public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
		const leftBracketPosition: number = document.lineAt(position).text.lastIndexOf("\[");
		const atSignPosition: number = document.lineAt(position).text.indexOf("@");

		//"["がないならスキップ。処理高速化のため。 
		if (leftBracketPosition !== -1 || atSignPosition !== -1) {
			return this.completionParameter(document, position, token, context, leftBracketPosition);
		} else {
			return this.completionTag();	//FIXME:同じ行に2つ以上タグを置くとタグ名の候補が正しく表示されない(↑のif文に入っている）
		}

	}



	/**
	 * //TODO:ラベルの予測変換
	 * *から始まる単語なら予測変換をだす
	 */
	private conpletionLabel() {
		// comp.kind = vscode.CompletionItemKind.Variable;
		//「target="」「target_cancel="」が直前にあるならラベルの一覧を候補表示
	}

	/**
	 * //TODO:変数の予測変換
	 * f. sf. tf. のいずれかから始まった時予測変換を出す。
	 */
	private completionVariable() {

		// comp.kind = vscode.CompletionItemKind.Variable;
	}


	//TODO:[1].storageとかならプロジェクト内のファイルパスを取得
	/**
	 * ファイルの予測変換
	 * 
	 */
	private completionFile() {
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
	private completionParameter(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext, leftBracketPosition: number): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
		const linePrefix = document.lineAt(position).text.substring(leftBracketPosition, position.character);//最も後ろのタグを取得。//FIXME:パラメータの値に配列使ってる時に引っかからない 
		let tagName: String = "";//正規表現で検索かけるタグ名。jumpとかpとかimageとか。
		let completions: vscode.CompletionItem[] = new Array();

		//item:{}で囲ったタグの番号。0,1,2,3...
		//name:そのまんま。middle.jsonを見て。
		//item2:タグのパラメータ。0,1,2,3...って順に。
		for (const item in this.tyranoTagSnippets) {
			tagName = this.removeBracket(this.tyranoTagSnippets[item]["name"].toString());
			if (linePrefix.indexOf("[" + tagName) !== -1 || linePrefix.indexOf("@" + tagName) !== -1) {//タグ名があるならパラメータ検索をする  //FIXME:bgとbg2が区別できていないため、両方に存在するパラメータが重複する。
				for (const item2 in this.tyranoTagSnippets[item]["parameters"]) {
					if (document.lineAt(position).text.lastIndexOf(this.tyranoTagSnippets[item]["parameters"][item2]["name"]) === -1) {	//その行にパラメータの名前が含まれていないなら //FIXME: 一行に複数個タグがある時、一つのタグで使ったパラメータが他のタグで予測候補として表示されない
						let comp = new vscode.CompletionItem(this.tyranoTagSnippets[item]["parameters"][item2]["name"]);
						comp.insertText = new vscode.SnippetString(this.tyranoTagSnippets[item]["parameters"][item2]["name"] + "=\"$0\" ");
						comp.documentation = new vscode.MarkdownString(this.tyranoTagSnippets[item]["parameters"][item2]["description"]);
						comp.kind = vscode.CompletionItemKind.Function;
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
	private completionTag(): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
		let completions: vscode.CompletionItem[] = new Array();
		for (let item in this.tyranoTagSnippets) {
			let tmpJsonData = this.tyranoTagSnippets[item];
			let textLabel: string = this.removeBracket(tmpJsonData["name"].toString());

			let comp = new vscode.CompletionItem(textLabel);
			const inputType = vscode.workspace.getConfiguration().get('TyranoScript syntax.completionTag.inputType');
			inputType === "@" ? comp.insertText = new vscode.SnippetString("@" + textLabel + " $0") : comp.insertText = new vscode.SnippetString("[" + textLabel + " $0]");
			comp.documentation = new vscode.MarkdownString(tmpJsonData["description"]);
			comp.kind = vscode.CompletionItemKind.Class;
			comp.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };//ここに、サンプル2のような予測候補を出すコマンド
			completions.push(comp);
		};

		return completions;
	}


	/**
	 * 引数に入れた文字列からbracket[]を取り除きます。
	 * @param str []を取り除く文字列
	 * @returns []を取り除いた文字列
	 */
	private removeBracket(str: string): string {
		return str.replace(/\[*/g, "").replace(/\]*/g, "");;
	}
}