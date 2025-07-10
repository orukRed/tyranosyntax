import * as vscode from "vscode";

export class CharacterLayerData {
  private _name: string; //chara_layerのnameで参照した名前//e.g.yuko
  private _part: string; //chara_layerのpartで定義したパーツ名//e.g.mouse
  private _id: string; //chara_layerのidで定義した識別名//e.g.egao
  private _location: vscode.Location; //chara_layerで定義した場所

  public constructor(
    name: string,
    part: string,
    id: string,
    location: vscode.Location,
  ) {
    this._name = name;
    this._part = part;
    this._id = id;
    this._location = location;
  }
  public get name(): string {
    return this._name;
  }
  public get part(): string {
    return this._part;
  }
  public get id(): string {
    return this._id;
  }
  public get location(): vscode.Location {
    return this._location;
  }
}
