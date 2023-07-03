import * as vscode from 'vscode';
import { InformationWorkSpace } from '../InformationWorkSpace';

/**
 * evalタグやjsからの変数定義で宣言された変数情報を格納するためのクラス
 */
export class VariableData {

	private infoWs: InformationWorkSpace = InformationWorkSpace.getInstance();
	private _name: string;//変数名
	private _value: string | undefined;//変数の値 現在未使用だけど今後使うかもなので一応定義だけしておく
	private _description: string | undefined;//変数の説明
	private _locations: vscode.Location[] = [];//定義ジャンプに使う位置情報？ あと今は変数の定義場所取得手段思いつかないので、変数の使用箇所とする。そのため配列で値保持

	private _type: string;//変数の種類 f sf tf mpのいずれか

	public get name(): string | undefined {
		return this._name;
	}

	public get locations(): vscode.Location[] {
		return this._locations;
	}
	public set locations(value: vscode.Location[]) {
		this._locations = value;
	}
	public addLocation(value: vscode.Location) {
		this._locations?.push(value);
	}
	public deleteLocation(deletePath: vscode.Uri) {
		const value = this._locations?.filter((location) => { return location.uri.fsPath !== deletePath.fsPath; });
		this.locations = value!;
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