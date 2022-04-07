import * as fs from 'fs';
import * as vscode from 'vscode';
import { InformationWorkSpace } from './InformationWorkSpace';


/**
 * [1]プロジェクト中に存在する素材（画像、音声、シナリオ、外部JSを読み込みスニペット登録
 * →おそらくワークスペースに変更が加わるたびにワークスペースに更新掛ける必要がある。
 * →理想はタグごとのパラメータによってscenarioディレクトリだけのスニペットが出るとかbgディレクトリだけのスニペットが出るとか。
 * [2]シナリオ中で定義した変数とマクロを読み込んでスニペット登録
 * →テキストエディタに変更加わるたびにワークスペースに更新掛ける必要がある。
 * [3]公式で提供されているマクロのスニペット登録
 * 
 * 実装順は312
 */
export class TyranoCompletionItemProvider implements vscode.CompletionItemProvider{

	private tyranoTagSnippets:Object; //公式タグのスニペット定義
	private info:InformationWorkSpace = InformationWorkSpace.getInstance();
	public constructor(){
		//タグスニペットファイル読み込み
		this.tyranoTagSnippets = JSON.parse(fs.readFileSync(__dirname+"/./../snippet/tyrano.snippet.json","utf8"))["array"];

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

		
		const leftBracketPosition:number = document.lineAt(position).text.lastIndexOf("\[");

		//"["がないならスキップ。処理高速化のため。 
		if(leftBracketPosition !== -1){
			return this.completionParameter(document, position, token, context, leftBracketPosition);
		}else{
			return this.completionTag();	//FIXME:同じ行に2つ以上タグを置くとタグ名の候補が正しく表示されない(↑のif文に入っている）
		}
		
	}


	/**
	 * TODO:変数の予測変換
	 * f. sf. tf. のいずれかから始まった時予測変換を出す。
	 */
	private completionVariable(){

	}


	//TODO:[1].storageとかならプロジェクト内のファイルパスを取得
	//TODO:[2].targetとかならラベルの一覧を取得
	/**
	 * パラメータの値の予測変換
	 * 
	 */
	private completionValue(){
		//メモ
		//storageパラメータとかでは、必要なフォルダのファイルだけを候補に出したい。例：bgのstorageならbgimageフォルダだけとか。
		// storageパラメータのdescriptionに書いてある文字列によって分岐させる？背景、bgimageって単語があるならbgimage,音楽、BGM,があるならbgmフォルダとか。


	

	}


	//TODO:CompletionItemListを編集して必須のパラメータがわかるようにする
	/**
	 * タグ内のパラメータの予測変換
	 * 
	 * 
	 */
	private completionParameter(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext, leftBracketPosition:number):vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>>{
		const linePrefix = document.lineAt(position).text.substring(leftBracketPosition, position.character);//最も後ろのタグを取得。//FIXME:パラメータの値に配列使ってる時に引っかからない 
		let tagName:String ="";//正規表現で検索かけるタグ名。jumpとかpとかimageとか。
		let completions:vscode.CompletionItem[] = new Array();

		//item:{}で囲ったタグの番号。0,1,2,3...
		//name:そのまんま。middle.jsonを見て。
		//item2:タグのパラメータ。0,1,2,3...って順に。
		for(const item in this.tyranoTagSnippets){
			tagName = this.tyranoTagSnippets[item]["name"].toString().replace("[","").replace("]","");//スニペットのnameに"[]"が付いてるので取り除く
				if(linePrefix.indexOf("["+tagName)!==-1){//タグ名があるならパラメータ検索をする  //FIXME:bgとbg2が区別できていないため、両方に存在するパラメータが重複する。
					for(const item2 in this.tyranoTagSnippets[item]["parameters"]){
						if(document.lineAt(position).text.lastIndexOf(this.tyranoTagSnippets[item]["parameters"][item2]["name"]) === -1){	//その行にパラメータの名前が含まれていないなら //FIXME: 一行に複数個タグがある時、一つのタグで使ったパラメータが他のタグで予測候補として表示されない
							let comp = new vscode.CompletionItem(this.tyranoTagSnippets[item]["parameters"][item2]["name"]);
							comp.insertText =  new vscode.SnippetString(this.tyranoTagSnippets[item]["parameters"][item2]["name"]+"=\"$0\" ");								
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
	private completionTag():vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>>{
		let completions:vscode.CompletionItem[] = new Array();
		for(let item in this.tyranoTagSnippets){
			let tmpJsonData = this.tyranoTagSnippets[item];
			let textLabel:string = tmpJsonData["name"].toString().replace("[","").replace("]","");//"[]"が付いてるので取り除く
			
			let comp = new vscode.CompletionItem(textLabel);
			comp.insertText =  new vscode.SnippetString("["+textLabel+" $0]");
			comp.documentation = new vscode.MarkdownString(tmpJsonData["description"]);
			comp.kind = vscode.CompletionItemKind.Class;
			comp.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };//ここに、サンプル2のような予測候補を出すコマンド
			completions.push(comp);
		};	

		return completions;
	}
}