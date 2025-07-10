import * as vscode from "vscode";
import { CharacterFaceData } from "./CharacterFaceData";
import { CharacterLayerData as CharacterPartData } from "./CharacterLayerData";

/**
 * キャラクター操作カテゴリのタグで定義したキャラクター情報を格納するためのクラス
 */
export class CharacterData {
  private _name: string = ""; //chara_newのnameで定義した名前
  private _jname: string = ""; //chara_newのjnameで定義した表示名
  private _faceList: CharacterFaceData[] = []; //chara_faceのfaceで定義した表情名
  private _layer: Map<string, CharacterPartData[]> = new Map(); //キーをpart,値をid[]として、それらを配列で持つ
  private _location: vscode.Location; //chara_newで定義した場所
  constructor(name: string, jname: string, location: vscode.Location) {
    this._name = name;
    this._jname = jname;
    this._location = location;
  }

  public addFace(face: CharacterFaceData) {
    this._faceList.push(face);
  }

  public deleteFaceByFilePath(fsPath: string) {
    this._faceList = this._faceList.filter((face) => {
      return face.location?.uri.fsPath !== fsPath;
    });
  }

  public addLayer(part: string, parts: CharacterPartData) {
    if (this._layer.has(part)) {
      this._layer.get(part)?.push(parts);
    } else {
      this._layer.set(part, [parts]);
    }
  }

  public deleteLayerByFilePath(fsPath: string) {
    for (const [part, parts] of this._layer) {
      this._layer.set(
        part,
        parts.filter((part) => {
          return part.location?.uri.fsPath !== fsPath;
        }),
      );
    }
  }

  public get name(): string {
    return this._name;
  }
  public get jname(): string {
    return this._jname;
  }
  public get faceList(): CharacterFaceData[] {
    return this._faceList;
  }
  public set faceList(value: CharacterFaceData[]) {
    this._faceList = value;
  }
  public get layer(): Map<string, CharacterPartData[]> {
    return this._layer;
  }
  public set layer(value: Map<string, CharacterPartData[]>) {
    this._layer = value;
  }
  public get location(): vscode.Location {
    return this._location;
  }
}
