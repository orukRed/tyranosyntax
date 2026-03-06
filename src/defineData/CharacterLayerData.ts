import * as vscode from "vscode";

export class CharacterLayerData {
  public readonly name: string; //chara_layerのnameで参照した名前//e.g.yuko
  public readonly part: string; //chara_layerのpartで定義したパーツ名//e.g.mouse
  public readonly id: string; //chara_layerのidで定義した識別名//e.g.egao
  public readonly location: vscode.Location; //chara_layerで定義した場所

  public constructor(
    name: string,
    part: string,
    id: string,
    location: vscode.Location,
  ) {
    this.name = name;
    this.part = part;
    this.id = id;
    this.location = location;
  }
}
