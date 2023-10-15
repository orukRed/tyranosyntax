import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';
import { ResourceFileData } from './defineData/ResourceFileData';
import { DefineMacroData } from './defineData/DefineMacroData';
import { ErrorLevel, TyranoLogger } from './TyranoLogger';
import { VariableData } from './defineData/VariableData';
import { LabelData } from './defineData/LabelData';
import { MacroParameterData } from './defineData/MacroParameterData';
import { NameParamData } from './defineData/NameParamData';
import { Parser } from './Parser';
import { InformationExtension } from './InformationExtension';
import { json } from 'stream/consumers';

const babel = require("@babel/parser");
const babelTraverse = require("@babel/traverse").default;


/**
 * ワークスペースディレクトリとか、data/フォルダの中にある素材情報とか。
 * シングルトン。
 */
export class InformationWorkSpace {

	private static instance: InformationWorkSpace = new InformationWorkSpace();
	private parser: Parser = Parser.getInstance();
	public pathDelimiter = (process.platform === "win32") ? "\\" : "/";
	public readonly DATA_DIRECTORY: string = this.pathDelimiter + "data";				//projectRootPath/data
	public readonly TYRANO_DIRECTORY: string = this.pathDelimiter + "tyrano";		//projectRootPath/tyrano
	public readonly DATA_BGIMAGE: string = this.pathDelimiter + "bgimage";
	public readonly DATA_BGM: string = this.pathDelimiter + "bgm";
	public readonly DATA_FGIMAGE: string = this.pathDelimiter + "fgimage";
	public readonly DATA_IMAGE: string = this.pathDelimiter + "image";
	public readonly DATA_OTHERS: string = this.pathDelimiter + "others";
	public readonly DATA_SCENARIO: string = this.pathDelimiter + "scenario";
	public readonly DATA_SOUND: string = this.pathDelimiter + "sound";
	public readonly DATA_SYSTEM: string = this.pathDelimiter + "system";
	public readonly DATA_VIDEO: string = this.pathDelimiter + "video";

	private _scriptFileMap: Map<string, string> = new Map<string, string>();//ファイルパスと、中身(全文)
	private _scenarioFileMap: Map<string, vscode.TextDocument> = new Map<string, vscode.TextDocument>();//ファイルパスと、中身(全文)
	private _defineMacroMap: Map<string, Map<string, DefineMacroData>> = new Map<string, Map<string, DefineMacroData>>();//マクロ名と、マクロデータ defineMacroMapの値をもとに生成して保持するやつ <projectPath, <macroName,macroData>>
	private _resourceFileMap: Map<string, ResourceFileData[]> = new Map<string, ResourceFileData[]>();//pngとかmp3とかのプロジェクトにあるリソースファイル
	private _variableMap: Map<string, Map<string, VariableData>> = new Map<string, Map<string, VariableData>>();//projectpath,変数名と、定義情報
	private _labelMap: Map<string, LabelData[]> = new Map<string, LabelData[]>();//ファイルパス、LabelDataの配列
	private _suggestions: Map<string, object> = new Map<string, object>();//projectPath,入力候補のオブジェクト
	private _nameMap: Map<string, NameParamData[]> = new Map<string, NameParamData[]>();//プロジェクトパスと、nameやidの定義

	private readonly _resourceExtensions: Object = vscode.workspace.getConfiguration().get('TyranoScript syntax.resource.extension')!;
	private readonly _resourceExtensionsArrays = Object.keys(this.resourceExtensions).map(key => this.resourceExtensions[key]).flat();//resourceExtensionsをオブジェクトからstring型の一次配列にする
	private readonly _tagNameParams: String[] = vscode.workspace.getConfiguration().get('TyranoScript syntax.tag.name.parameters')!;

	private _extensionPath: string = "";

	private constructor() { }
	public static getInstance(): InformationWorkSpace {
		return this.instance;
	}
	/**
	 * マップファイルの初期化。
	 * 本当はコンストラクタに書きたいのですがコンストラクタはasync使えないのでここに。await initializeMaps();の形でコンストラクタの直後に呼んで下さい。
	 */
	public async initializeMaps() {
		TyranoLogger.print(`InformationWorkSpace.initializeMaps()`);
		vscode.workspace.workspaceFolders?.forEach((value) => {
			TyranoLogger.print(`Opening workspace is ${value.uri.fsPath}`);
		});

		//最初のキーをプロジェクト名で初期化
		for (let projectPath of this.getTyranoScriptProjectRootPaths()) {
			TyranoLogger.print(`${projectPath} variable initialzie start`);
			this.defineMacroMap.set(projectPath, new Map<string, DefineMacroData>());
			this._resourceFileMap.set(projectPath, []);
			this.variableMap.set(projectPath, new Map<string, VariableData>());
			try {
				const passJoined = path.join(InformationExtension.path + `${path.sep}snippet${path.sep}tyrano.snippet.json`);
				const jsonData = fs.readFileSync(passJoined, "utf8");
				const parsedJson = JSON.parse(jsonData);
				this.suggestions.set(projectPath, parsedJson);
				if (Object.keys(this.suggestions.get(projectPath)!).length === 0) {
					throw new Error("suggestions is empty");
				}
			} catch (error) {
				TyranoLogger.print("passJoin or JSON.parse or readFile Sync failed", ErrorLevel.ERROR);
				TyranoLogger.printStackTrace(error);
			}
			this.nameMap.set(projectPath, []);
			TyranoLogger.print(`${projectPath} variable initialzie end`);
		}

		for (let projectPath of this.getTyranoScriptProjectRootPaths()) {
			TyranoLogger.print(`${projectPath} is loading...`);
			//スクリプトファイルパスを初期化
			TyranoLogger.print(`${projectPath}'s scripts is loading...`);
			let absoluteScriptFilePaths = this.getProjectFiles(projectPath + this.DATA_DIRECTORY, [".js"], true);//dataディレクトリ内の.jsファイルを取得
			for (let i of absoluteScriptFilePaths) {
				await this.updateScriptFileMap(i);
				await this.updateMacroDataMapByJs(i);
				await this.updateVariableMapByJS(i);
			}
			//シナリオファイルを初期化
			TyranoLogger.print(`${projectPath}'s scenarios is loading...`);
			let absoluteScenarioFilePaths = await this.getProjectFiles(projectPath + this.DATA_DIRECTORY, [".ks"], true);//dataディレクトリ内の.ksファイルを取得
			for (let i of absoluteScenarioFilePaths) {
				await this.updateScenarioFileMap(i);
				await this.updateMacroLabelVariableDataMapByKs(i);
			}
			//リソースファイルを取得
			TyranoLogger.print(`${projectPath}'s resource file is loading...`);
			let absoluteResourceFilePaths = this.getProjectFiles(projectPath + this.DATA_DIRECTORY, this.resourceExtensionsArrays, true);//dataディレクトリのファイル取得
			for (let i of absoluteResourceFilePaths) {
				await this.addResourceFileMap(i);
			}
		}
	}

	/**
	 * フォルダを開いてるなら、vscodeで開いているルートパスのディレクトリを取得します。
	 * フォルダを開いてない場合、undefined.
	 * @returns プロジェクトのルートパス。フォルダを開いていないならundefined.
	 */
	public getWorkspaceRootPath(): string {
		//フォルダ開いてない場合、相対パスたどってプロジェクトのルートパス取ろうと思ったけど万が一Cドライブ直下とかにアクセスすると大惨事なのでNG.
		if (vscode.workspace.workspaceFolders === undefined) {
			return "";
		}
		return vscode.workspace.workspaceFolders[0].uri.fsPath;
	}


	/**
	 * vscodeで開いたフォルダ内に存在するティラノスクリプトのプロジェクトのパスを取得します。
	 * @returns 
	 */
	public getTyranoScriptProjectRootPaths(): string[] {
		//フォルダ開いてないなら早期リターン
		if (this.getWorkspaceRootPath() === undefined) {
			return [];
		}

		// 指定したファイルパスの中のファイルのうち、index.htmlがあるディレクトリを返却。
		const listFiles = (dir: string): string[] =>
			fs.readdirSync(dir, { withFileTypes: true }).
				flatMap(dirent =>
					dirent.isFile() ?
						[`${dir}${this.pathDelimiter}${dirent.name}`].filter((file) => dirent.name === "index.html").map(str => str.replace(this.pathDelimiter + "index.html", "")) :
						listFiles(`${dir}${this.pathDelimiter}${dirent.name}`))

		const ret = listFiles(this.getWorkspaceRootPath());

		return ret;
	}


	/**
	 * スクリプトファイルパスとその中身のMapを更新
	 * @param filePath 
	 */
	public async updateScriptFileMap(filePath: string) {
		if (path.extname(filePath) !== ".js") {
			return;
		}
		//vscodeAPIを使うとESLintも起動してしまうため、fsモジュールで読み込む。
		//fsモジュールによる読み込みが不要になったら以下二行の処理に戻すこと。
		// let textDocument = await vscode.workspace.openTextDocument(filePath);
		// this._scriptFileMap.set(textDocument.fileName, textDocument.getText());
		this._scriptFileMap.set(filePath, fs.readFileSync(filePath, "utf-8"));
	}
	public async updateScenarioFileMap(filePath: string) {
		//.ks拡張子以外ならシナリオではないのでreturn
		if (path.extname(filePath) !== ".ks") {
			return;
		}
		let textDocument = await vscode.workspace.openTextDocument(filePath);
		this._scenarioFileMap.set(textDocument.fileName, textDocument);
	}

	public async updateMacroDataMapByJs(absoluteScenarioFilePath: string) {
		const reg = /[^a-zA-Z0-9_$]/g;
		// const reg = /[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\uFF00-\uFF9F\uFF65-\uFF9F_]/g; //日本語も許容したいときはこっち.でも動作テストしてないからとりあえずは半角英数のみで
		const reg2 = /TYRANO\.kag\.ftag\.master_tag\.[a-zA-Z0-9_$]/g;
		const reg3 = /tyrano\.plugin\.kag\.tag\.[a-zA-Z0-9_$]/g;
		const parsedData: object = babel.parse(this.scriptFileMap.get(absoluteScenarioFilePath));
		const projectPath: string = await this.getProjectPathByFilePath(absoluteScenarioFilePath);
		const deleteTagList = await this.spliceMacroDataMapByFilePath(absoluteScenarioFilePath);
		await this.spliceSuggestionsByFilePath(projectPath, deleteTagList);

		babelTraverse(parsedData, {
			enter: (path: any) => {
				try {
					//path.parentPathの値がTYRANO.kag.ftag.master_tag_MacroNameの形なら
					if (path != null && path.parentPath != null && path.parentPath.type === "AssignmentExpression" && (reg2.test(path.parentPath.toString()) || reg3.test(path.parentPath.toString()))) {
						let macroName: string = path.toString().split(".")[4];//MacroNameの部分を抽出
						if (macroName != undefined && macroName != null) {

							let description = path.parentPath.parentPath.toString().replace(";", "").replace(path.parentPath.toString(), "");
							description = description.replaceAll("/", "").replaceAll("*", "").replaceAll(" ", "").replaceAll("\t", "");

							const macroData: DefineMacroData = new DefineMacroData(macroName, new vscode.Location(vscode.Uri.file(absoluteScenarioFilePath), new vscode.Position(path.node.loc.start.line, path.node.loc.start.column)), absoluteScenarioFilePath, description);
							macroData.parameter.push(new MacroParameterData("parameter", false, "description"));//TODO:パーサーでパラメータの情報読み込んで追加する
							this.defineMacroMap.get(projectPath)?.set(macroName, macroData);
							this._suggestions.get(projectPath)![macroName] = macroData.parseToJsonObject();
						}
					}
				} catch (error) {
					//例外発生するのは許容？
					// console.log(error);
				}

			},
		});
	}

	/**
	 * jsやiscript-endscript間で定義した変数を取得する
	 * sentenceがundefined出ない場合、指定した値の範囲内で定義されている変数を取得する
	 * @param absoluteScenarioFilePath 
	 * @param sentence
	 */
	public async updateVariableMapByJS(absoluteScenarioFilePath: string, sentence: string | undefined = undefined) {
		await this.spliceVariableMapByFilePath(absoluteScenarioFilePath);
		const projectPath: string = await this.getProjectPathByFilePath(absoluteScenarioFilePath);
		if (sentence === undefined) {
			sentence = this.scriptFileMap.get(absoluteScenarioFilePath)!;
		}

		const reg: RegExp = /\b(f\.|sf\.|tf\.|mp\.)([^0-9０-９])([\.\w]*)/mg;
		const variableList: string[] = sentence.match(reg) ?? [];

		for (let variableBase of variableList) {
			//.で区切る
			const [variableType, variableName] = variableBase.split(".");
			this._variableMap.get(projectPath)?.set(variableName, new VariableData(variableName, undefined, variableType));
			const location = new vscode.Location(vscode.Uri.file(absoluteScenarioFilePath), new vscode.Position(0, 0));
			this.variableMap.get(projectPath)?.get(variableName)?.addLocation(location);//変数の定義箇所を追加
		}
	}

	public async updateMacroLabelVariableDataMapByKs(absoluteScenarioFilePath: string) {
		//ここに構文解析してマクロ名とURI.file,positionを取得する
		const scenarioData = this.scenarioFileMap.get(absoluteScenarioFilePath);
		const projectPath = await this.getProjectPathByFilePath(absoluteScenarioFilePath);

		if (scenarioData != undefined) {

			const parsedData = this.parser.parseText(scenarioData.getText()); //構文解析
			this.labelMap.set(absoluteScenarioFilePath, new Array<LabelData>());
			let isIscript = false;
			let iscriptSentence: string = "";
			let description = "";

			//該当ファイルに登録されているマクロ、変数、タグ、nameを一度リセット
			const deleteTagList = await this.spliceMacroDataMapByFilePath(absoluteScenarioFilePath);
			await this.spliceVariableMapByFilePath(absoluteScenarioFilePath);
			await this.spliceNameMapByFilePath(absoluteScenarioFilePath);
			await this.spliceSuggestionsByFilePath(projectPath, deleteTagList);
			for (let data of parsedData) {

				//iscript-endscript間のテキストを取得。
				if (isIscript && data["name"] === "text") {
					iscriptSentence += this.scenarioFileMap.get(absoluteScenarioFilePath)?.lineAt(data["line"]).text;
				}


				//name系のパラメータ取得
				if (this._tagNameParams.includes(data["name"])) {

					//一度登録したら重複しないような処理が必要
					let storage: string = "";
					if (data["pm"]["storage"]) {
						storage = data["pm"]["storage"]
					}
					if (data["pm"]["name"]) {
						const tmpData = new NameParamData(data["pm"]["name"], "name", new vscode.Location(scenarioData.uri, new vscode.Position(await data["line"], await data["column"])), storage);
						if (!this.nameMap.get(projectPath)?.some(item => item.name === tmpData.name && item.type === tmpData.type)) {
							this.nameMap.get(projectPath)?.push(tmpData);
						}
					}
					if (data["pm"]["face"]) {
						const tmpData = new NameParamData(data["pm"]["face"], "face", new vscode.Location(scenarioData.uri, new vscode.Position(await data["line"], await data["column"])), storage);
						if (!this.nameMap.get(projectPath)?.some(item => item.name === tmpData.name && item.type === tmpData.type)) {
							this.nameMap.get(projectPath)?.push(tmpData);
						}
					}
					if (data["pm"]["part"]) {
						const tmpData = new NameParamData(data["pm"]["part"], "part", new vscode.Location(scenarioData.uri, new vscode.Position(await data["line"], await data["column"])), storage);
						if (!this.nameMap.get(projectPath)?.some(item => item.name === tmpData.name && item.type === tmpData.type)) {
							this.nameMap.get(projectPath)?.push(tmpData);
						}
					}
					if (data["pm"]["id"]) {
						const tmpData = new NameParamData(data["pm"]["id"], "id", new vscode.Location(scenarioData.uri, new vscode.Position(await data["line"], await data["column"])), storage);
						if (!this.nameMap.get(projectPath)?.some(item => item.name === tmpData.name && item.type === tmpData.type)) {
							this.nameMap.get(projectPath)?.push(tmpData);
						}
					}
					if (data["pm"]["jname"]) {
						const tmpData = new NameParamData(data["pm"]["jname"], "jname", new vscode.Location(scenarioData.uri, new vscode.Position(await data["line"], await data["column"])), storage);
						if (!this.nameMap.get(projectPath)?.some(item => item.name === tmpData.name && item.type === tmpData.type)) {
							this.nameMap.get(projectPath)?.push(tmpData);
						}
					}
				}

				//各種タグの場合
				if (data["name"] === "macro") {
					const macroData: DefineMacroData = new DefineMacroData(await data["pm"]["name"], new vscode.Location(scenarioData.uri, new vscode.Position(await data["line"], await data["column"])), absoluteScenarioFilePath, description);
					const macroName: string = await data["pm"]["name"];
					this.defineMacroMap.get(projectPath)?.set(macroName, macroData);
					this._suggestions.get(projectPath)![await data["pm"]["name"]] = macroData.parseToJsonObject();
				} else if (data["name"] === "label") {
					this.labelMap.get(absoluteScenarioFilePath)?.push(new LabelData(await data["pm"]["label_name"], new vscode.Location(scenarioData.uri, new vscode.Position(await data["line"], await data["column"]))));
				} else if (data["name"] === "eval") {
					const [variableBase, variableValue] = data["pm"]["exp"].split("=").map((str: string) => str.trim());//vriableBaseにf.hogeの形
					const [variableType, variableName] = variableBase.split(".");
					//mapに未登録の場合のみ追加
					if (!this.variableMap.get(projectPath)?.get(variableName)) {
						this.variableMap.get(projectPath)?.set(variableName, new VariableData(variableName, variableValue, variableType));
					}
					const location = new vscode.Location(scenarioData.uri, new vscode.Position(await data["line"], await data["column"]));
					this.variableMap.get(projectPath)?.get(variableName)?.addLocation(location);//変数の定義箇所を追加
				} else if (data["name"] === "iscript") {
					isIscript = true;//endscriptが見つかるまで行を保存するモードに入る
				} else if (data["name"] === "endscript") {
					isIscript = false;//行を保存するモード終わり
					this.updateVariableMapByJS(absoluteScenarioFilePath, iscriptSentence);
				}

				//マクロ定義のdescription挿入
				if (data["name"] === "comment") {
					if (data["val"]) {
						description += data["val"] + "\n";
					}
				} else {
					description = "";
				}

			}
		}
	}

	/**
	 * リソースファイルのマップに値を追加
	 * @param filePath ファイルパス
	 */
	public async addResourceFileMap(filePath: string) {
		const absoluteProjectPath = await this.getProjectPathByFilePath(filePath);
		let resourceType: string | undefined = Object.keys(this.resourceExtensions).filter(key => this.resourceExtensions[key].includes(path.extname(filePath))).toString();//プロジェクトパスの拡張子からどのリソースタイプなのかを取得
		this._resourceFileMap.get(absoluteProjectPath)?.push(new ResourceFileData(filePath, resourceType));
	}

	/**
	 * 引数で指定したファイルパスを、リソースファイルのマップから削除
	 * @param absoluteProjectPath 
	 * @param filePath 
	 */
	public async spliceResourceFileMapByFilePath(filePath: string) {
		const absoluteProjectPath = await this.getProjectPathByFilePath(filePath);
		const insertValue: ResourceFileData[] | undefined = this.resourceFileMap.get(absoluteProjectPath)?.filter(obj => obj.filePath !== filePath);
		this.resourceFileMap.set(absoluteProjectPath, insertValue!);
	}

	/**
	 *  引数で指定したファイルパスを、シナリオファイルのマップから削除
	 * @param filePath 
	 */
	public async spliceScenarioFileMapByFilePath(filePath: string) {
		this.scenarioFileMap.delete(filePath);
	}

	/**
	 *  引数で指定したファイルパスを、スクリプトファイルのマップから削除
	 * @param filePath 
	 */
	public async spliceScriptFileMapByFilePath(filePath: string) {
		this.scriptFileMap.delete(filePath);
	}

	/**
	 *  引数で指定したファイルパスを、マクロデータのマップから削除
	 * @param filePath 
	 */
	public async spliceMacroDataMapByFilePath(filePath: string) {
		const deleteTagList: string[] = [];
		const projectPath = await this.getProjectPathByFilePath(filePath);

		this.defineMacroMap.get(projectPath)?.forEach((value, key) => {
			if (value.filePath == filePath) {
				this.defineMacroMap.get(projectPath)?.delete(value.macroName);
				deleteTagList.push(value.macroName);
			}
		});

		return deleteTagList;
	}

	/**
	 * 引数で指定したファイルパスを、ラベルデータのマップから削除
	 * @param fsPath 
	 */
	public async spliceLabelMapByFilePath(fsPath: string) {
		this.labelMap.delete(fsPath);
	}

	/**
	 * 引数で指定したファイルパスを、変数データのマップから削除
	 * @param fsPath 
	 */
	public async spliceVariableMapByFilePath(fsPath: string) {
		const projectPath: string = await this.getProjectPathByFilePath(fsPath);
		this.variableMap.get(projectPath)?.forEach((value: VariableData, key: string) => {
			value.locations.forEach((location: vscode.Location) => {
				if (location.uri.fsPath === fsPath) {
					this.variableMap.get(projectPath)?.delete(key);
				}
			});
		});
	}

	/**
	 * 引数で指定したファイルパスを、パラメータのNameのMapから削除
	 * @param fsPath 
	 */
	public async spliceNameMapByFilePath(fsPath: string) {
		const projectPath: string = await this.getProjectPathByFilePath(fsPath);
		const value = this.nameMap.get(projectPath)?.filter(obj => obj.location?.uri.fsPath !== fsPath);
		this.nameMap.set(projectPath, value!);
	}

	/**
	 * 引数で指定したファイルパスを、タグ補完に使う変数のリストから削除
	 * @param absoluteScenarioFilePath 
	 */
	public async spliceSuggestionsByFilePath(projectPath: string, deleteTagList: string[]) {
		if (0 < deleteTagList.length) {
			deleteTagList.forEach(tag => {
				delete this.suggestions.get(projectPath)![tag];
			});
		}
	}
	/**
	 * プロジェクトに存在するファイルパスを取得します。
	 * 使用例:
	 * @param projectRootPath プロジェクトのルートパス
	 * @param permissionExtension 取得するファイルパスの拡張子。無指定ですべてのファイル取得。
	 * @param isAbsolute 絶対パスで返すかどうか。trueなら絶対パス。falseで相対パス。
	 * @returns プロジェクトのルートパスが存在するなら存在するファイルパスを文字列型の配列で返却。
	 */
	public getProjectFiles(projectRootPath: string, permissionExtension: string[] = [], isAbsolute: boolean = false): string[] {
		//ルートパスが存在していない場合
		if (projectRootPath === undefined || projectRootPath === "") {
			return [];
		}


		//指定したファイルパスの中のファイルのうち、permissionExtensionの中に入ってる拡張子のファイルパスのみを取得
		const listFiles = (dir: string): string[] =>
			fs.readdirSync(dir, { withFileTypes: true }).
				flatMap(dirent =>
					dirent.isFile() ?
						[`${dir}${this.pathDelimiter}${dirent.name}`].filter(file => {
							if (permissionExtension.length <= 0) {
								return file;
							}
							return permissionExtension.includes(path.extname(file))
						}) :
						listFiles(`${dir}${this.pathDelimiter}${dirent.name}`))
		let ret = listFiles(projectRootPath);//絶対パスで取得

		//相対パスに変換
		if (!isAbsolute) {
			ret = ret.map(e => {
				return e.replace(projectRootPath + this.pathDelimiter, '');
			});
		}

		return ret

	}

	/**
	 * 引数で指定したファイルパスからプロジェクトパス（index.htmlのあるフォルダパス）を取得します。
	 * @param filePath 
	 * @returns 
	 */
	public async getProjectPathByFilePath(filePath: string): Promise<string> {

		let searchDir;
		do {
			const delimiterIndex = filePath.lastIndexOf(this.pathDelimiter);
			if (delimiterIndex === -1) {
				return "";
			}

			//filePathに存在するpathDelimiiter以降の文字列を削除
			filePath = filePath.substring(0, delimiterIndex);
			//フォルダ検索
			searchDir = fs.readdirSync(filePath, 'utf-8');
			//index.htmlが見つからないならループ
		} while (searchDir.filter(e => e === "index.html").length <= 0);
		return filePath;
	}

	/**
	 * 引数で与えたファイルの相対パスから、絶対パスを返します。
	 * @param relativePath 
	 */
	public convertToAbsolutePathFromRelativePath(relativePath: string): string {
		return path.resolve(relativePath);
	}

	public get scriptFileMap(): Map<string, string> {
		return this._scriptFileMap;
	}
	public get scenarioFileMap(): Map<string, vscode.TextDocument> {
		return this._scenarioFileMap;
	}
	public get resourceFileMap(): Map<string, ResourceFileData[]> {
		return this._resourceFileMap;
	}
	public get defineMacroMap(): Map<string, Map<string, DefineMacroData>> {
		return this._defineMacroMap;
	}
	public get resourceExtensions(): Object {
		return this._resourceExtensions;
	}
	public get resourceExtensionsArrays() {
		return this._resourceExtensionsArrays;
	}
	public get variableMap(): Map<string, Map<string, VariableData>> {
		return this._variableMap;
	}
	public get labelMap(): Map<string, LabelData[]> {
		return this._labelMap;
	}
	public get suggestions(): Map<string, object> {
		return this._suggestions;
	}
	public set suggestions(value: Map<string, object>) {
		this._suggestions = value;
	}
	public get nameMap(): Map<string, NameParamData[]> {
		return this._nameMap;
	}
	public get tagNameParams() {
		return this._tagNameParams;
	}
	public get extensionPath() {
		return this._extensionPath;
	}
	public set extensionPath(value) {
		this._extensionPath = value;
	}
}