
import * as vscode from 'vscode';

/**
 * 各タグのname,face,id,part,jnameパラメータなどで登録した値を保存する。name,face,part,idのいずれかがあればもう登録しちゃっていいかも？
 */
export class NameParamData {
	private _name: string = "";//name,face,partに入れた値 yuko,akaneなど
	private _type: string = "";//name,face,part,id,jnameのいずれか
	private _location: vscode.Location | null = null;//定義ジャンプに使う位置情報？
	private _resourceFilePath: string | undefined;//faceなどの場合、参照する画像ファイルへのパス

	public get name(): string {
		return this._name;
	}
	public get type(): string {
		return this._type;
	}

	public get location(): vscode.Location | null {
		return this._location;
	}
	public get resourceFilePath(): string | undefined {
		return this._resourceFilePath;
	}


	public constructor(name: string, type: string, location: vscode.Location, resourceFilePath: string) {
		this._name = name;
		this._type = type;
		this._location = location;
		this._resourceFilePath = resourceFilePath;
	}
}