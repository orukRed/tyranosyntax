import * as vscode from "vscode";
import { CharacterFaceData } from "./CharacterFaceData";
import { CharacterLayerData as CharacterPartData } from "./CharacterLayerData";

/**
 * キャラクター操作カテゴリのタグで定義したキャラクター情報を格納するためのクラス
 */
export class CharacterData {
  public readonly name: string; //chara_newのnameで定義した名前
  public readonly jname: string; //chara_newのjnameで定義した表示名
  public faceList: CharacterFaceData[] = []; //chara_faceのfaceで定義した表情名
  public layer: Map<string, CharacterPartData[]> = new Map(); //キーをpart,値をid[]として、それらを配列で持つ
  public readonly location: vscode.Location; //chara_newで定義した場所

  constructor(name: string, jname: string, location: vscode.Location) {
    this.name = name;
    this.jname = jname;
    this.location = location;
  }

  public addFace(face: CharacterFaceData) {
    this.faceList.push(face);
  }

  public deleteFaceByFilePath(fsPath: string) {
    this.faceList = this.faceList.filter((face) => {
      return face.location?.uri.fsPath !== fsPath;
    });
  }

  public addLayer(part: string, parts: CharacterPartData) {
    if (this.layer.has(part)) {
      this.layer.get(part)?.push(parts);
    } else {
      this.layer.set(part, [parts]);
    }
  }

  public deleteLayerByFilePath(fsPath: string) {
    for (const [part, parts] of this.layer) {
      this.layer.set(
        part,
        parts.filter((part) => {
          return part.location?.uri.fsPath !== fsPath;
        }),
      );
    }
  }
}
