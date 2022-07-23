import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';
import { assert } from 'console';
import { AssertionError } from 'assert';

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

	public readonly DATA_DIRECTORY: string = "/data";				//projectRootPath/data
	public readonly TYRANO_DIRECTORY: string = "/tyrano";		//projectRootPath/tyrano
	public readonly DATA_BGIMAGE: string = "/bgimage";
	public readonly DATA_BGM: string = "/bgm";
	public readonly DATA_FGIMAGE: string = "/fgimage";
	public readonly DATA_IMAGE: string = "/image";
	public readonly DATA_OTHERS: string = "/others";
	public readonly DATA_SCENARIO: string = "/scenario";
	public readonly DATA_SOUND: string = "/sound";
	public readonly DATA_SYSTEM: string = "/system";
	public readonly DATA_VIDEO: string = "/video";


	private _scriptFileMap: Map<string, string> = new Map<string, string>();//ファイルパスと、中身(全文)


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

	private constructor() {
		//スクリプトファイルパスを初期化
		for (let projectPaths of this.getTyranoScriptProjectRootPaths()) {
			let absoluteScenarioFilePaths = this.getProjectFiles(projectPaths + this.DATA_DIRECTORY, [".ks"], true);//dataディレクトリ内の.ksファイルを取得
			absoluteScenarioFilePaths = absoluteScenarioFilePaths.concat(this.getProjectFiles(projectPaths + this.DATA_DIRECTORY, [".ks"], true));//dataディレクトリ内の.jsファイルを取得
			absoluteScenarioFilePaths.forEach(element => {
				this.updateScriptFileMap(element);
			});
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
						[`${dir}/${dirent.name}`].filter((file) => dirent.name === "index.html").map(str => str.replace("/index.html", "")) :
						listFiles(`${dir}/${dirent.name}`))

		const ret = listFiles(this.getWorkspaceRootPath());

		return ret;
	}


	/**
	 * スクリプトファイルパスとその中身のMapを更新
	 * @param filePath 
	 */
	public async updateScriptFileMap(filePath: string) {
		vscode.workspace.fs.readFile(vscode.Uri.file(filePath)).then(async text => {
			this._scriptFileMap.set(filePath, text.toString());
		});
	}

	/**
	 * プロジェクトごとのリソースファイルパスを更新
	 * @param projectRootPath 
	 */
	public async updateResourceFilePathMap(projectRootPath: string) {
		this._resourceFilePathMap.set(projectRootPath, new Map<string, string[]>());
		this._resourceFilePathMap.get(projectRootPath)?.set("", ["", ""]);
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
						[`${dir}/${dirent.name}`].filter(file => {
							if (permissionExtension.length <= 0) {
								return file;
							}
							return permissionExtension.includes(path.extname(file))
						}) :
						listFiles(`${dir}/${dirent.name}`))
		try {
			let ret = listFiles(projectRootPath);//絶対パスで取得

			//相対パスに変換
			if (!isAbsolute) {
				ret = ret.map(e => {
					return e.replace(projectRootPath + "/", '');
				});
			}

			return ret
		} catch (error) {
			console.log(error);
			return [];
		}
	}

	public get scriptFileMap(): Map<string, string> {
		return this._scriptFileMap;
	}
	public get resourceFilePathMap(): Map<string, Map<string, string[]>> {
		return this._resourceFilePathMap;
	}

}