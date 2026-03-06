import * as vscode from "vscode";

/**
 * ksファイル内で定義したラベル情報を格納するためのクラス
 */
export class LabelData {
  public readonly name: string; //ラベル名
  public readonly location: vscode.Location;
  public readonly description: string; //ラベルの説明

  public constructor(
    name: string,
    location: vscode.Location,
    description: string = "",
  ) {
    this.name = name;
    this.location = location;
    this.description = description;
  }
}
