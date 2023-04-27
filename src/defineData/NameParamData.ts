/**
 * chara_new:name
 * chara_face:face,name
 * anim:name
 * chara_layer:part,id
 * layermode
 * keyframe
 * html
 * plugin
 * 3d_model_new 
 * 3d_sphere_new
 * 3d_sprite_new
 * [3d_event]
 * 3d_box_new
 * 3d_image_new
 **/

import * as vscode from 'vscode';

/**
 * 各タグのname,faceパラメータなどで登録した値を保存する。name,face,part,idのいずれかがあればもう登録しちゃっていいかも？
 */
export class NameParamData {
	private _name: string = "";//name,face,partに入れた値
	private _filePath: string = "";
	private _location: vscode.Location | null = null;//定義ジャンプに使う位置情報
	private _resourceFilePath: string;//faceなどの場合、参照する画像ファイルへのパス
	private _defineTag: string;//どのタグで定義されたか

	public get name(): string {
		return this._name;
	}
	public get filePath(): string {
		return this._filePath;
	}
	public get location(): vscode.Location | null {
		return this._location;
	}
	public get resourceFilePath(): string {
		return this._resourceFilePath;
	}
	public get defineTag(): string {
		return this._defineTag;
	}

	public constructor(name: string, location: vscode.Location, filePath: string, defineTag: string, resourceFilePath: string) {
		this._name = name;
		this._location = location;
		this._filePath = filePath;
		this._defineTag = defineTag;
		this._resourceFilePath = resourceFilePath;
	}
}