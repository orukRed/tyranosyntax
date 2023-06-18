import * as vscode from 'vscode';

/**
 * evalタグやjsからの変数定義で宣言された変数情報を格納するためのクラス
 */
export class VariableData {

	private _name: string;//変数名
	private _value: string | undefined;//変数の値 現在未使用だけど今後使うかもなので一応定義だけしておく
	private _description: string | undefined;//変数の説明

	//宣言したファイルパスのSet
	private _filePathList: Set<string> = new Set<string>();//TODO:そのうち独自クラス作って、filePathとLocationを持たせるようにした方がよい。Locationを使った機能がまだないのでこのままで。
	private _type: string;//変数の種類 f sf tf mpのいずれか

	public get name(): string | undefined {
		return this._name;
	}
	public get filePathList(): Set<string> {
		return this._filePathList;
	}
	public addFilePathList(filePath: string) {
		this.filePathList.add(filePath);
	}
	public deleteFilePathList(filePath: string) {
		this.filePathList.delete(filePath);
	}
	public set filePathList(value: Set<string>) {
		this._filePathList = value;
	}
	public get type(): string {
		return this._type;
	}
	public get description(): string | undefined {
		return this._description;
	}

	public constructor(_name: string, _value: string | undefined, type: string, description: string = "") {
		this._name = _name;
		this._value = _value;
		this._type = type;
		this._description = description;
	}
}