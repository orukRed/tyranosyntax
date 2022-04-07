import * as fs from 'fs';
import * as vscode from 'vscode';


/**
 * ワークスペースディレクトリとか、data/フォルダの中にある素材情報とか。
 * シングルトン。
 */
export class InformationWorkSpace {

	private static instance:InformationWorkSpace = new InformationWorkSpace();
	private readonly DATA_DIRECTORY:string = "/data";				//projectRootPath/data
	private readonly TYRANO_DIRECTORY:string = "/tyrano";		//projectRootPath/tyrano

	private dataPathList:string[] = [];											//projectRootPath/data の中に入っているファイルのパス
	private projectRootPath:string|null = null;							//プロジェクトのルートパス。index.htmlがあるディレクトリが対象。

	public static getInstance():InformationWorkSpace{
		return this.instance;
	}

	private constructor(){

		//今開いてるプロジェクトのルートパスを読み込む。
		this.projectRootPath = this.getProjectRootPath();

		//ファイルを再帰的に取得する
		this.dataPathList = this.getProjectFiles(this.projectRootPath);
			
	}



	/**
	 * フォルダ開いてるなら、開いてるフォルダ(index.htmlのあるフォルダ)のルートパスを取得します。
	 * フォルダ開いてない場合、undefined.
	 * @returns プロジェクトのルートパス。フォルダを開いていないならundefined.
	 */
	 private getProjectRootPath():string{
		//フォルダ開いてない場合、相対パスたどってプロジェクトのルートパス取ろうと思ったけど万が一Cドライブ直下とかにアクセスすると大惨事なのでNG.
		if(vscode.workspace.workspaceFolders === undefined){
			return "";
		}

		return  vscode.workspace.workspaceFolders[0].uri.fsPath;
	}

	/**
	 * プロジェクトに存在するファイルパスを取得します。
	 * @param projectRootPath プロジェクトのルートパス
	 * @returns プロジェクトのルートパスが存在するなら存在するファイルパスを文字列型の配列で返却。
	 */
	private getProjectFiles(projectRootPath:string):string[]{
		//ルートパスが存在していない場合
		if(projectRootPath === undefined){
			return [];
		}

		const listFiles = (dir: string): string[] =>
			fs.readdirSync(dir, { withFileTypes: true }).flatMap(dirent =>
				dirent.isFile() ? [`${dir}/${dirent.name}`] : listFiles(`${dir}/${dirent.name}`))

		return listFiles(projectRootPath);
	}



}