import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';
import { ResourceFileData } from './defineData/ResourceFileData';
import { DefineMacroData } from './defineData/DefineMacroData';
import { TyranoLogger } from './TyranoLogger';
const babel = require("@babel/parser");
const babelTraverse = require("@babel/traverse").default;


/**
 * ワークスペースディレクトリとか、data/フォルダの中にある素材情報とか。
 * シングルトン。
 */
export class InformationWorkSpace {
	private static instance: InformationWorkSpace = new InformationWorkSpace();
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
	private _resourceFileMap: Map<string, ResourceFileData[]> = new Map<string, ResourceFileData[]>();


	private readonly resourceExtensions: Object = vscode.workspace.getConfiguration().get('TyranoScript syntax.resource.extension')!;
	private readonly _resourceExtensionsArrays = Object.keys(this.resourceExtensions).map(key => this.resourceExtensions[key]).flat();//resourceExtensionsをオブジェクトからstring型の一次配列にする


	//パーサー
	private loadModule = require('./lib/module-loader.js').loadModule;
	public parser = this.loadModule(__dirname + '/lib/tyrano_parser.js');
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

		//最初のキーをプロジェクト名で初期化
		for (let projectPath of this.getTyranoScriptProjectRootPaths()) {
			this.defineMacroMap.set(projectPath, new Map<string, DefineMacroData>());
			this._resourceFileMap.set(projectPath, []);
		}

		for (let projectPath of this.getTyranoScriptProjectRootPaths()) {
			TyranoLogger.print(`${projectPath} is loading...`);
			//スクリプトファイルパスを初期化
			TyranoLogger.print(`${projectPath}'s scripts is loading...`);
			let absoluteScriptFilePaths = this.getProjectFiles(projectPath + this.DATA_DIRECTORY, [".js"], true);//dataディレクトリ内の.jsファイルを取得
			for (let i of absoluteScriptFilePaths) {
				await this.updateScriptFileMap(i);
				await this.updateMacroDataMapByJs(i);
			}
			//シナリオファイルを初期化
			TyranoLogger.print(`${projectPath}'s scenarios is loading...`);
			let absoluteScenarioFilePaths = await this.getProjectFiles(projectPath + this.DATA_DIRECTORY, [".ks"], true);//dataディレクトリ内の.ksファイルを取得
			for (let i of absoluteScenarioFilePaths) {
				await this.updateScenarioFileMap(i);
				await this.updateMacroDataMapByKs(i);
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
		const parsedData: object = babel.parse(this.scriptFileMap.get(absoluteScenarioFilePath));
		const projectPath = await this.getProjectPathByFilePath(absoluteScenarioFilePath);


		babelTraverse(parsedData, {
			enter: (path: any) => {
				try {
					//path.parentPathの値がTYRANO.kag.ftag.master_tag_MacroNameの形なら
					if (path != null && path.parentPath != null && path.parentPath.type === "AssignmentExpression" && reg2.test(path.parentPath.toString())) {
						let str = path.toString().split(".")[4];//MacroNameの部分を抽出
						if (str != undefined && str != null) {
							this.defineMacroMap.get(projectPath)?.set(
								str, new DefineMacroData(str, new vscode.Location(vscode.Uri.file(absoluteScenarioFilePath), new vscode.Position(path.node.loc.start.line, path.node.loc.start.column))));
						}
					}
				} catch (error) {
					//例外発生するのは許容？
					// console.log(error);
				}

			},
		});
	}

	public async updateMacroDataMapByKs(absoluteScenarioFilePath: string) {
		//ここに構文解析してマクロ名とURI.file,positionを取得する
		const scenarioData = this.scenarioFileMap.get(absoluteScenarioFilePath);
		if (scenarioData != undefined) {
			const parsedData: object = this.parser.tyranoParser.parseScenario(scenarioData.getText()); //構文解析
			const array_s = parsedData["array_s"];
			for (let data in array_s) {
				if (array_s[data]["name"] === "macro") {
					this.defineMacroMap.get(await this.getProjectPathByFilePath(absoluteScenarioFilePath))?.set(await array_s[data]["pm"]["name"], new DefineMacroData(await array_s[data]["pm"]["name"], new vscode.Location(scenarioData.uri, new vscode.Position(await array_s[data]["line"], await array_s[data]["column"]))));
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
		this._resourceFileMap.get(absoluteProjectPath)?.filter(obj => obj.filePath !== filePath);
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
		try {
			let ret = listFiles(projectRootPath);//絶対パスで取得

			//相対パスに変換
			if (!isAbsolute) {
				ret = ret.map(e => {
					return e.replace(projectRootPath + this.pathDelimiter, '');
				});
			}

			return ret
		} catch (error) {
			console.log(error);
			return [];
		}
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
	public get resourceExtensionsArrays() {
		return this._resourceExtensionsArrays;
	}

}