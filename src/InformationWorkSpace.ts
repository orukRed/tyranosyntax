import * as fs from 'fs';
import * as vscode from 'vscode';

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
	public getProjectRootPath(): string {
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
	 * @returns プロジェクトのルートパスが存在するなら存在するファイルパスを文字列型の配列で返却。
	 */
	public getProjectFiles(projectRootPath: string): string[] {
		//ルートパスが存在していない場合
		if (projectRootPath === undefined || projectRootPath === "") {
			return [];
		}

		const listFiles = (dir: string): string[] =>
			fs.readdirSync(dir, { withFileTypes: true }).flatMap(dirent =>
				dirent.isFile() ? [`${dir}/${dirent.name}`] : listFiles(`${dir}/${dirent.name}`))

		try {
			let ret = listFiles(projectRootPath);//絶対パスで取得
			ret = ret.map(e => {//相対パスに変換
				return e.replace(projectRootPath + "/", '');

			});
			return ret
		} catch (error) {
			console.log(error);
			return [];
		}
	}
}