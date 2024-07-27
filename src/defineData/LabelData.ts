import * as vscode from "vscode";

/**
 * ksファイル内で定義したラベル情報を格納するためのクラス
 */
export class LabelData {
  private _name: string; //ラベル名
  private _location: vscode.Location;

  public get name(): string {
    return this._name;
  }
  public get location(): vscode.Location {
    return this._location;
  }
  public constructor(_name: string, _location: vscode.Location) {
    this._name = _name;
    this._location = _location;
  }
}
