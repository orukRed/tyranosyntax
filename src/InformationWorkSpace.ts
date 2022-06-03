import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';
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

	private static instance: InformationWorkSpace = new InformationWorkSpace();

	public static getInstance(): InformationWorkSpace {
		return this.instance;
	}

	private constructor() {
	}

	/**
	 * フォルダを開いてるなら、開いてるフォルダ(index.htmlのあるフォルダ)のルートパスを取得します。
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
}