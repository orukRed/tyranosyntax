import * as fs from 'fs';
import * as vscode from 'vscode';
import { InformationWorkSpace } from '../InformationWorkSpace';
import { ResourceFileData } from '../defineData/ResourceFileData';
import path = require('path');
import { Parser } from '../Parser';
import { ErrorLevel, TyranoLogger } from '../TyranoLogger';

export class TyranoCompletionItemProvider implements vscode.CompletionItemProvider {
	private infoWs = InformationWorkSpace.getInstance();
	private parser: Parser = Parser.getInstance();
	public constructor() {
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
		try {
			const projectPath: string = await this.infoWs.getProjectPathByFilePath(document.fileName);
			const cursor: number = vscode.window.activeTextEditor?.selection.active.character!;
			//カーソル付近のタグデータを取得
			const lineText = document.lineAt(position.line).text;
			const parsedData = this.parser.parseText(lineText);
			const tagIndex: number = this.parser.getIndex(parsedData, position.character);

			const tagParams: Object = await vscode.workspace.getConfiguration().get('TyranoScript syntax.tag.parameter')!;
			const leftSideText: string | undefined = parsedData[tagIndex] !== undefined ? lineText.substring(parsedData[tagIndex]["column"], cursor) : undefined;
			const lineTagName = parsedData[tagIndex] !== undefined ? parsedData[tagIndex]["name"] : undefined;//今見てるタグの名前
			const regExp2 = new RegExp('(\\S)+="(?![\\s\\S]*")', "g");//今見てるタグの値を取得
			const variableRegExp = /&?(f\.|sf\.|tf\.|mp\.)(\S)*$/;//変数の正規表現
			const regExpResult = leftSideText?.match(regExp2);//「hoge="」を取得できる
			let lineParamName: string | undefined = undefined;
			if (regExpResult) {
				lineParamName = regExpResult[0].replace("\"", "").replace("=", "").trim();//今見てるパラメータの名前
			}
			const paramInfo = lineTagName !== undefined && tagParams[lineTagName] !== undefined ? tagParams[lineTagName][lineParamName] : undefined;//今見てるタグのパラメータ情報  paramsInfo.path paramsInfo.type
			const variableValue: string[] | null = variableRegExp.exec(leftSideText!);
			const nameType: string[] = ["name", "face", "part", "id", "jname"];
			//カーソルの左隣の文字取得
			if ((typeof leftSideText === "string") && leftSideText?.charAt(leftSideText.length - 1) === "#") {
				return await this.completionJName(projectPath);
			}
			//leftSideTextの最後の文字がf.sf.tf.mp.のいずれかなら変数の予測変換を出す
			else if (variableValue) {
				const variableType: string = variableValue[0].split(".")[0].replace("&", "");
				return this.completionVariable(projectPath, variableType);
			}
			//targetへのインテリセンス
			else if (parsedData[tagIndex] !== undefined && lineTagName !== undefined && lineParamName === "target") {	//leftSideTextの最後の文字が*ならラベルの予測変換を出す　//FIXME:「参照paramがtargetなら」の方がよさそう
				return this.completionLabel(projectPath, parsedData[tagIndex]["pm"]["storage"]);
			}
			//nameやfaceへのインテリセンス
			else if (parsedData[tagIndex] !== undefined && lineTagName !== undefined && lineParamName !== undefined && nameType.includes(lineParamName!)) {
				return this.completionNameParameter(projectPath, lineParamName!);
			}
			//リソースの予測変換
			else if (parsedData[tagIndex] !== undefined && lineTagName !== undefined && lineParamName !== undefined && paramInfo !== undefined) {
				return await this.completionResource(projectPath, paramInfo.type, projectPath + this.infoWs.pathDelimiter + paramInfo.path);
			}
			else if (parsedData === undefined || parsedData[tagIndex] === undefined) {		//空行orテキストならタグの予測変換を出す
				return this.completionTag(projectPath);
			} else {//タグの中ならタグのパラメータの予測変換を出す 
				let isTagSentence = lineTagName === "text" || lineTagName === undefined ? false : true;
				if (isTagSentence) {
					return this.completionParameter(lineTagName, parsedData[tagIndex]["pm"], projectPath);
				} else {
					return this.completionTag(projectPath);
				}
			}
		} catch (error) {
			TyranoLogger.print("provideCompletionItems failed", ErrorLevel.ERROR);
			TyranoLogger.printStackTrace(error);
		}
	}
	private async completionJName(projectPath: string): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined> {
		let completions: vscode.CompletionItem[] = new Array();
		this.infoWs.nameMap.forEach(async (nameParamData, key) => {
			if (projectPath === key) {
				nameParamData.forEach((value, key) => {
					if ("jname" === value.type) {
						let comp = new vscode.CompletionItem(value.name);
						comp.kind = vscode.CompletionItemKind.Variable;
						comp.insertText = value.name;
						completions.push(comp);
					}
				});
			}
		});
		return completions;
	}


	private async completionNameParameter(projectPath: string, lineParamName: string): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined> {
		let completions: vscode.CompletionItem[] = new Array();
		this.infoWs.nameMap.forEach(async (nameParamData, key) => {
			if (projectPath === key) {
				nameParamData.forEach((value, key) => {
					if (lineParamName === value.type) {
						let comp = new vscode.CompletionItem(value.name);
						comp.kind = vscode.CompletionItemKind.Variable;
						comp.insertText = value.name;
						completions.push(comp);
					}
				});
			}
		});
		return completions;
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
						comp.insertText = new vscode.SnippetString(value.type + "." + value.name);
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
						const referenceFilePath = path.relative(referencePath, resource.filePath).replace(/\\/g, "/");//基準パスからの相対パス
						comp.documentation = new vscode.MarkdownString(`${referenceFilePath}<br>`);
						comp.documentation.appendMarkdown(`<img src="${referenceFilePath}" width=350>`);
						comp.documentation.supportHtml = true;
						comp.documentation.isTrusted = true;
						comp.documentation.supportThemeIcons = true;
						comp.documentation.baseUri = vscode.Uri.file(path.join(referencePath, path.sep));
						comp.insertText = new vscode.SnippetString(referenceFilePath);//基準パスからの相対パス
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
	private async completionParameter(selectedTag: string, parameters: object, projectPath: string): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined> {

		let completions: vscode.CompletionItem[] = new Array();
		const suggestions = this.infoWs.suggestions.get(projectPath);

		//item:{}で囲ったタグの番号。0,1,2,3...
		//name:そのまんま。middle.jsonを見て。
		//item2:タグのパラメータ。0,1,2,3...って順に。
		for (const item in suggestions) {
			const tagName = suggestions[item]["name"].toString();//タグ名。jumpとかpとかimageとか。
			if (selectedTag === tagName) {
				for (const item2 of suggestions[item]["parameters"]) {
					if (!(item2["name"] in parameters)) {//タグにないparameterのみインテリセンスに出す
						const detailText = item2["required"] ? "（必須）" : "";
						const comp = new vscode.CompletionItem({
							label: item2["name"],
							description: "",
							detail: detailText
						});
						comp.insertText = new vscode.SnippetString(item2["name"] + "=\"$0\" ");
						comp.documentation = new vscode.MarkdownString(item2["description"]);
						comp.kind = vscode.CompletionItemKind.Function;
						comp.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
						completions.push(comp);
					}
				}
			}
		}
		return completions;
	}

	/**
	 * タグの予測変換
	 * 
	 */
	private async completionTag(projectPath: string): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined> {
		let completions: vscode.CompletionItem[] = new Array();
		const suggestions = this.infoWs.suggestions.get(projectPath);

		for (const item in suggestions) {
			let tmpJsonData = suggestions[item];
			try {
				let textLabel: string = tmpJsonData["name"].toString();
				let comp = new vscode.CompletionItem(textLabel);
				const inputType = vscode.workspace.getConfiguration().get('TyranoScript syntax.completionTag.inputType');
				inputType === "@" ? comp.insertText = new vscode.SnippetString("@" + textLabel + " $0") : comp.insertText = new vscode.SnippetString("[" + textLabel + " $0]");
				comp.documentation = new vscode.MarkdownString(tmpJsonData["description"]);
				comp.kind = vscode.CompletionItemKind.Class;
				comp.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };//ここに、サンプル2のような予測候補を出すコマンド
				completions.push(comp);
			} catch (error) {
				console.log(error);
			}

		};
		return completions;
	}

}