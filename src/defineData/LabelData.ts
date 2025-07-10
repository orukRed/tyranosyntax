import * as vscode from "vscode";

/**
 * ksファイル内で定義したラベル情報を格納するためのクラス
 */
export class LabelData {
  private _name: string; //ラベル名
  private _location: vscode.Location;
  private _description: string; //ラベルの説明

  public get description(): string | undefined {
    return this._description;
  }
  public get name(): string {
    return this._name;
  }
  public get location(): vscode.Location {
    return this._location;
  }
  public constructor(
    _name: string,
    _location: vscode.Location,
    _description: string = "",
  ) {
    this._name = _name;
    this._location = _location;
    this._description = _description;
  }
}
