import * as fs from 'fs';
import * as vscode from 'vscode';
import { InformationWorkSpace } from '../InformationWorkSpace';
import { ResourceFileData } from '../defineData/ResourceFileData';
import path = require('path');

/**
 * OK.[1]プロジェクト中に存在する素材（画像、音声、シナリオ、外部JSを読み込みスニペット登録
 * →おそらくワークスペースに変更が加わるたびにワークスペースに更新掛ける必要がある。
 * →理想はタグごとのパラメータによってscenarioディレクトリだけのスニペットが出るとかbgディレクトリだけのスニペットが出るとか。
 * [2]シナリオ中で定義した変数とマクロとラベルを読み込んでスニペット登録
 * →テキストエディタに変更加わるたびにワークスペースに更新掛ける必要がある。
 * OK.[3]公式で提供されているタグの予測変換登録
 * 
 * 実装順は312
 */
export class TyranoCompletionItemProvider implements vscode.CompletionItemProvider {
	private infoWs = InformationWorkSpace.getInstance();
	private tyranoTagSnippets: Object; //公式タグのスニペット定義
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

		let tagParams: Object = await vscode.workspace.getConfiguration().get('TyranoScript syntax.tag.parameter')!;
		const leftSideText = array_s[tagNumber] !== undefined ? lineText.substring(array_s[tagNumber]["column"], cursor) : undefined;
		const lineTagName = array_s[tagNumber] !== undefined ? array_s[tagNumber]["name"] : undefined;//今見てるタグの名前
		const regExp2 = new RegExp('(\\S)+="(?![\\s\\S]*")', "g");//今見てるタグの値を取得
		const variableRegExp = /&?(f\.|sf\.|tf\.|mp\.).*/;//変数の正規表現
		let regExpResult = leftSideText?.match(regExp2);//「hoge="」を取得できる
		let lineParamName = undefined;
		if (regExpResult) {
			lineParamName = regExpResult[0].replace("\"", "").replace("=", "").trim();//今見てるパラメータの名前
		}
		const paramInfo = lineTagName !== undefined && tagParams[lineTagName] !== undefined ? tagParams[lineTagName][lineParamName] : undefined;//今見てるタグのパラメータ情報  paramsInfo.path paramsInfo.type
		const variableValue: string[] | null = variableRegExp.exec(leftSideText!);

		//leftSideTextの最後の文字がf.sf.tf.mp.のいずれかなら変数の予測変換を出す
		if (variableValue) {
			const variableType: string = variableValue[0].split(".")[0].replace("&", "");
			return this.completionVariable(projectPath, variableType);
		}
		else if (array_s[tagNumber] !== undefined && lineTagName !== undefined && lineParamName === "target") {	//leftSideTextの最後の文字が*ならラベルの予測変換を出す　//FIXME:「参照paramがtargetなら」の方がよさそう
			return this.completionLabel(projectPath, array_s[tagNumber]["pm"]["storage"]);
		}
		//リソースの予測変換
		else if (array_s[tagNumber] !== undefined && lineTagName !== undefined && lineParamName !== undefined && paramInfo !== undefined) {
			return await this.completionResource(projectPath, paramInfo.type, projectPath + this.infoWs.pathDelimiter + paramInfo.path);
		}
		else if (array_s === undefined || array_s[tagNumber] === undefined) {		//空行orテキストならタグの予測変換を出す
			return this.completionTag();
		} else {//タグの中ならタグのパラメータの予測変換を出す 
			let isTagSentence = lineTagName === "text" || lineTagName === undefined ? false : true;
			if (isTagSentence) {
				return this.completionParameter(lineTagName, array_s[tagNumber]["pm"]);
			} else {
				return this.completionTag();
			}
		}
	}


	/**
	 * ラベルへのインテリセンス
	 * @param projectPath
	 * @param storage storageパラメータで指定した値
	 */
	private async completionLabel(projectPath: string, storage: string): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined> {
		//タグ内のstorage先参照して、そのstorage先にのみ存在するラベルを出力するようにする
		let completions: vscode.CompletionItem[] = new Array();
		this.infoWs.labelMap.forEach(async (label, key) => {
			const labelProjectPath = await this.infoWs.getProjectPathByFilePath(key);
			if (projectPath === labelProjectPath) {
				label.forEach((value, key2) => {
					// storageで指定したファイルに存在するラベルのみ候補に出す
					// storageがundefinedなら今開いているファイルを指定
					const storagePath = (storage === undefined) ?
						vscode.window.activeTextEditor?.document.uri.fsPath :
						projectPath + this.infoWs.DATA_DIRECTORY + this.infoWs.DATA_SCENARIO + this.infoWs.pathDelimiter + storage;
					if (value.location.uri.fsPath === storagePath) {
						let comp = new vscode.CompletionItem(value.name);
						comp.kind = vscode.CompletionItemKind.Interface;
						comp.insertText = "*" + value.name;
						completions.push(comp);
					}
				});
			}
		});
		return completions;
	}

	/**
	 * 変数の予測変換
	 */
	private async completionVariable(projectPath: string, variableType: string): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined> {

		let completions: vscode.CompletionItem[] = new Array();
		this.infoWs.variableMap.forEach((variable, key) => {
			if (key === projectPath) {
				this.infoWs.variableMap.get(key)?.forEach((value, key2) => {
					if (value.type == variableType) {
						let comp = new vscode.CompletionItem(value.type + "." + value.name);
						comp.kind = vscode.CompletionItemKind.Variable;
						comp.insertText = new vscode.SnippetString(value.name);
						completions.push(comp);
					}
				});
			}
		});

		return completions;

	}


	/**
	 * ファイルの予測変換
	 * @param projectPath 
	 * @param requireResourceType 
	 * @param referencePath そのタグの参照するディレクトリのパス。例えば、bgタグならbgimageフォルダのパス
	 * @returns 
	 */
	private async completionResource(projectPath: string, requireResourceType: string[], referencePath: string): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined> {
		let completions: vscode.CompletionItem[] = new Array();

		this.infoWs.resourceFileMap.forEach((resourcesMap, key) => {
			if (projectPath === key) {
				resourcesMap.forEach((resource, key2) => {
					// if (resource.resourceType === requireResourceType) {
					if (requireResourceType.includes(resource.resourceType)) {
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
						comp.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
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