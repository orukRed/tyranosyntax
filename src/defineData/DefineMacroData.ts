import * as vscode from 'vscode';

export class DefineMacroData {
	private _macroName: string = "";//マクロ名。[hoge]などのhoge部分。
	private _filePath: string = "";
	private _location: vscode.Location | null = null;//定義ジャンプに使う位置情報
	private _parameterMap: Map<string, string> = new Map<string, string>();//パラメータ名と値のマップ 最終的に何らかのクラスに入れるべき？

	public constructor(macroName: string, location: vscode.Location, filePath: string) {
		this._macroName = macroName;
		this._location = location;
		this._filePath = filePath;
	}
	public addParameter(parameterName: string, parameterValue: string) {
		this._parameterMap.set(parameterName, parameterValue);
	}

	public get macroName(): string {
		return this._macroName;
	}
	public get filePath(): string {
		return this._filePath;
	}
	public get location(): vscode.Location | null {
		return this._location;
	}
	public get parameterMap(): Map<string, string> {
		return this._parameterMap;
	}
	public set parameterMap(value: Map<string, string>) {
		this._parameterMap = value;
	}

}
