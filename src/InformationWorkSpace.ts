import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';

export class TyranoResourceType {
	public static readonly BGIMAGE: string = "bgimage";
	public static readonly BGM: string = "bgm";
	public static readonly FGIMAGE: string = "fgimage";
	public static readonly IMAGE: string = "image";
	public static readonly OTHERS: string = "others";
	public static readonly SCENARIO: string = "scenario";
	public static readonly SOUND: string = "sound";
	public static readonly SYSTEM: string = "system";
	public static readonly VIDEO: string = "video";
}


/**
 * ワークスペースディレクトリとか、data/フォルダの中にある素材情報とか。
 * シングルトン。
 */
export class InformationWorkSpace {
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



	//プロジェクト内の素材リソースのMap
	//keyはbgimage,bgm,fgimage.image.others,scenario,sound,system,videoとする。
	//valueは各フォルダに入っている素材のファイル名のリスト。
	//追加するときはresourceFileMap.set("bgimage",resourceMap.get("bgimage").concat["foo.png"]);
	//削除するときはresourceFileMap.set("bgimage",resourceMap.get("bgimage").splice["foo.png"]);
	private _resourceFilePathMap: Map<string, Map<string, string[]>> = new Map<string, Map<string, string[]>>();//string,string,string[] の順にプロジェクトパス、bgimageとかのフォルダ、絶対パスのリスト



	private static instance: InformationWorkSpace = new InformationWorkSpace();

	public static getInstance(): InformationWorkSpace {
		return this.instance;
	}

	private constructor() { }

	/**
	 * マップファイルの初期化。
	 * 本当はコンストラクタに書きたいのですがコンストラクタはasync使えないのでここに。await initializeMaps();の形でコンストラクタの直後に呼んで下さい。
	 */
	public async initializeMaps() {
		for (let projectPath of this.getTyranoScriptProjectRootPaths()) {
			//スクリプトファイルパスを初期化
			let absoluteScriptFilePaths = this.getProjectFiles(projectPath + this.DATA_DIRECTORY, [".js"], true);//dataディレクトリ内の.jsファイルを取得
			for (let i of absoluteScriptFilePaths) {
				await this.updateScriptFileMap(i);
			}
			//シナリオファイルを初期化
			let absoluteScenarioFilePaths = await this.getProjectFiles(projectPath + this.DATA_DIRECTORY, [".ks"], true);//dataディレクトリ内の.ksファイルを取得
			for (let i of await absoluteScenarioFilePaths) {
				await this.updateScenarioFileMap(i);
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



	/**
	 * プロジェクトごとのリソースファイルパスを更新
	 * @param projectRootPath 
	 */
	public async updateResourceFilePathMap(projectRootPath: string) {
		// this._resourceFilePathMap.set(projectRootPath, new Map<string, string[]>());
		// this._resourceFilePathMap.get(projectRootPath)?.set("", ["", ""]);
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
	public get resourceFilePathMap(): Map<string, Map<string, string[]>> {
		return this._resourceFilePathMap;
	}
	public get scenarioFileMap(): Map<string, vscode.TextDocument> {
		return this._scenarioFileMap;
	}
}