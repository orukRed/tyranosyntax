import * as vscode from "vscode";

export class CharacterFaceData {
  private _name: string; //chara_faceのnameで参照した名前
  private _face: string; //chara_faceのfaceで定義した表情名 e.g.happy
  private _location: vscode.Location; //chara_faceで定義した場所

  public constructor(name: string, face: string, location: vscode.Location) {
    this._name = name;
    this._face = face;
    this._location = location;
  }

  public get name(): string {
    return this._name;
  }
  public get face(): string {
    return this._face;
  }
  public get location(): vscode.Location {
    return this._location;
  }
}
