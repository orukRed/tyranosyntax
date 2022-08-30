import * as vscode from 'vscode';

export class DefineMacroData {
	fileName: string;//ファイル名：hoge.pngなど。
	absoluteFilePath: string;//  /User/hogeProject/data/bgimage/foo/bar.pngなど。
	location: vscode.Location;//定義ジャンプに使う位置情報

	public constructor(fileName: string, filePath: string, location: vscode.Location) {
		this.fileName = fileName;
		this.absoluteFilePath = filePath;
		this.location = location;
	}

}