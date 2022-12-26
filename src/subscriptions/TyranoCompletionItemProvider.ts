import * as fs from 'fs';
import * as vscode from 'vscode';
import { InformationWorkSpace } from '../InformationWorkSpace';
import { ResourceFileData } from '../defineData/ResourceFileData';
import path = require('path');

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
	private infoWs = InformationWorkSpace.getInstance();
	private tyranoTagSnippets: Object; //公式タグのスニペット定義
	private info: InformationWorkSpace = InformationWorkSpace.getInstance();
	public constructor() {
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
	public async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined> {
		let projectPath: string = await this.infoWs.getProjectPathByFilePath(document.fileName);
		let cursor: number = vscode.window.activeTextEditor?.selection.active.character!;
		//カーソル付近のタグデータを取得
		const lineText = document.lineAt(position.line).text;
		const parsedData = this.infoWs.parser.tyranoParser.parseScenario(lineText);
		const array_s = parsedData["array_s"];
		let tagNumber: string = "";
		for (let data in array_s) {
			//マクロの定義column > カーソル位置なら探索不要なのでbreak;
			if (array_s[data]["column"] > position.character) {
				break;
			}
			tagNumber = data;
		}



		//BUG:buttonタグのような無限にparamがある場合への対応が不可
		/**
		 * 以下のような書き方で対応可能
		 * 
							"default": {
							"graph": {
								param1:{
									resourceType:"image",
									folderPath:"/data/image"
								}
							},
		 */
		//BUGTODO:mediaの場合に対応できていない（package.jsonのやつとか取得仕方を変えて対応）
		//例として、mediaとimageの両方に.pngがあると、等価演算子が使えない。array.includeを使って、どちらかに定義されてるなら、みたいな書き方へと変更
		//BUG:本来はいらない場合にもisSurroundedJumpParamがtrueになってしまうので注意
		//上記でパラメータを変更したので、ここのアルゴリズムもまるごと変更になる。


		let resourceExtensions: Object = await vscode.workspace.getConfiguration().get('TyranoScript syntax.tag.parameter')!;
		let resourceExtensionsTagArrays = Object.keys(resourceExtensions);//resourceExtensionsをオブジェクトからstring型の一次配列にする



		const tagName = array_s[tagNumber] !== undefined ? array_s[tagNumber]["name"] : undefined;
		const resourceParameterName = tagName !== undefined && array_s[tagNumber]["name"] !== undefined && resourceExtensions[array_s[tagNumber]["name"]] !== undefined ? resourceExtensions[array_s[tagNumber]["name"]].resourceParameterName : undefined;
		const jumpParameterName = tagName !== undefined && resourceExtensions[array_s[tagNumber]["name"]] !== undefined ? resourceExtensions[array_s[tagNumber]["name"]].jumpParameterName : undefined;
		const leftSideText = array_s[tagNumber] !== undefined ? lineText.substring(array_s[tagNumber]["column"], cursor) : undefined;
		const regSurroundedResourceParam = new RegExp(resourceParameterName + '="\\w*(?![\\s\\S]*")', "g");//リソース参照タグが「param="」の形で終わっているかどうか
		const regSurroundedJumpParam = new RegExp(jumpParameterName + '="\\w*(?![\\s\\S]*")', "g");//ジャンプ系タグが「param="」の形で終わっているかどうか
		const isSurroundedResourceParam = leftSideText ? regSurroundedResourceParam.test(leftSideText) : undefined;
		const isSurroundedJumpParam = leftSideText ? regSurroundedJumpParam.test(leftSideText) : undefined;

		//package.jsonのコンフィグで設定したタグ一覧に、今見ているタグがあるなら && カーソルより左側に「./」があるなら
		//さらに、resourceExtensions[array_s[tagNumber]["name"]].resourceParameterNameの中にいるならとか、ジャンプ系タグ(jumpParameterName)の中にいるなら、とかの分岐をしたい
		//resourceParameterNameで検索かけて、ないなら、jumpParameterNameで検索かけて、ないなら、そのタグはリソースのインテリセンス対象外
		if (array_s[tagNumber] !== undefined && resourceExtensionsTagArrays.includes(tagName) && (isSurroundedResourceParam || isSurroundedJumpParam)) {
			if (isSurroundedResourceParam) {
				const resourceType = await resourceExtensions[tagName].resourceType;
				const referencePath = projectPath + this.infoWs.pathDelimiter + await resourceExtensions[tagName].resourceReference;
				return await this.completionResource(projectPath, resourceType, referencePath);
			} else {
				const resourceType = "text";
				const referencePath = projectPath + this.infoWs.pathDelimiter + await resourceExtensions[tagName].jumpToReferenceFolder;
				return await this.completionResource(projectPath, resourceType, referencePath);
			}

		}

		else if (array_s === undefined || array_s[tagNumber] === undefined) {		//空行orテキストならタグの予測変換を出す
			return this.completionTag();
		} else {//タグの中ならタグのパラメータの予測変換を出す 
			let isTagSentence = tagName === "text" || tagName === undefined ? false : true;
			if (isTagSentence) {
				return this.completionParameter(tagName, array_s[tagNumber]["pm"]);
			} else {
				return this.completionTag();
			}
		}
	}


	/**
	 * //TODO:ラベルの予測変換
	 * *から始まる単語なら予測変換をだす
	 */
	private completionLabel() {
		// comp.kind = vscode.CompletionItemKind.Variable;
		// vscode.CompletionItemKind.Module
		//「target="」「target_cancel="」が直前にあるならラベルの一覧を候補表示
	}

	/**
	 * //TODO:変数の予測変換
	 * [\s*(f.|sf.|tf.|mp.)]のいずれかから始まった時予測変換を出す。
	 * InformationWorkSpaceに登録済みの変数リストを取得すれば良い
	 */
	private completionVariable() {

		// comp.kind = vscode.CompletionItemKind.Variable;
	}


	/**
	 * ファイルの予測変換
	 * InformationWorkSpaceに登録済みの素材Mapを取得すれば良い
	 */

	/**
	 * 
	 * @param projectPath 
	 * @param requireResourceType 
	 * @param referencePath そのタグの参照するディレクトリのパス。例えば、bgタグならbgimageフォルダのパス
	 * @returns 
	 */
	private async completionResource(projectPath: string, requireResourceType: string, referencePath: string): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined> {
		let completions: vscode.CompletionItem[] = new Array();

		this.infoWs.resourceFileMap.forEach((resourcesMap, key) => {
			if (projectPath === key) {
				resourcesMap.forEach((resource, key2) => {
					if (resource.resourceType === requireResourceType) {
						let insertLabel = resource.filePath.replace(projectPath + this.infoWs.DATA_DIRECTORY + this.infoWs.pathDelimiter, "");
						insertLabel = insertLabel.replace(/\\/g, "/");//パス区切り文字を/に統一
						let comp = new vscode.CompletionItem({
							label: resource.filePath.replace(projectPath + this.infoWs.DATA_DIRECTORY + this.infoWs.pathDelimiter, "").replace(/\\/g, "/"),
							description: resource.filePath.replace(projectPath + this.infoWs.pathDelimiter, ""),
							detail: ""
						});
						comp.kind = vscode.CompletionItemKind.File;
						comp.insertText = new vscode.SnippetString(path.relative(referencePath, resource.filePath).replace(/\\/g, "/"));//基準パスからの相対パス
						completions.push(comp);
					}
				});
			}

		});

		return completions;

	}


	//TODO:CompletionItemListを編集して必須のパラメータがわかるようにする
	/**
	 * タグ内のパラメータの予測変換
	 * 
	 * 
	 */
	private async completionParameter(selectedTag: string, parameters: object): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined> {

		let completions: vscode.CompletionItem[] = new Array();

		//item:{}で囲ったタグの番号。0,1,2,3...
		//name:そのまんま。middle.jsonを見て。
		//item2:タグのパラメータ。0,1,2,3...って順に。
		for (const item in this.tyranoTagSnippets) {
			const tagName = this.removeBracket(this.tyranoTagSnippets[item]["name"].toString());//タグ名。jumpとかpとかimageとか。
			if (selectedTag === tagName) {
				for (const item2 in this.tyranoTagSnippets[item]["parameters"]) {
					if (!(this.tyranoTagSnippets[item]["parameters"][item2]["name"] in parameters)) {//タグにないparameterのみインテリセンスに出す
						const detailText = this.tyranoTagSnippets[item]["parameters"][item2]["required"] ? "（必須）" : "";
						const comp = new vscode.CompletionItem({
							label: this.tyranoTagSnippets[item]["parameters"][item2]["name"],
							description: "",
							detail: detailText
						});
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
	private async completionTag(): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined> {
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