import * as vscode from 'vscode';

export class DefineMacroData {
	private _macroName: string = "";//マクロ名。[hoge]などのhoge部分。
	public get macroName(): string {
		return this._macroName;
	}
	private _filePath: string = "";
	public get filePath(): string {
		return this._filePath;
	}
	private _location: vscode.Location | null = null;//定義ジャンプに使う位置情報
	public get location(): vscode.Location | null {
		return this._location;
	}

	public constructor(macroName: string, location: vscode.Location, filePath: string) {
		this._macroName = macroName;
		this._location = location;
		this._filePath = filePath;
	}
}