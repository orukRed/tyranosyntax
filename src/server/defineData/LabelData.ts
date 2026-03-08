import { Location } from "vscode-languageserver/node";

/**
 * ksファイル内で定義したラベル情報を格納するためのクラス
 */
export class LabelData {
  public readonly name: string;
  public readonly location: Location;
  public readonly description: string;

  public constructor(
    name: string,
    location: Location,
    description: string = "",
  ) {
    this.name = name;
    this.location = location;
    this.description = description;
  }
}
