import * as vscode from "vscode";

export class CharacterFaceData {
  public readonly name: string; //chara_faceのnameで参照した名前
  public readonly face: string; //chara_faceのfaceで定義した表情名 e.g.happy
  public readonly location: vscode.Location; //chara_faceで定義した場所

  public constructor(name: string, face: string, location: vscode.Location) {
    this.name = name;
    this.face = face;
    this.location = location;
  }
}
