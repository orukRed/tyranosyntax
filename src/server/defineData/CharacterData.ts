import { Location } from "vscode-languageserver/node";
import { CharacterFaceData } from "./CharacterFaceData";
import { CharacterLayerData as CharacterPartData } from "./CharacterLayerData";
import { URI } from "vscode-uri";

/**
 * キャラクター操作カテゴリのタグで定義したキャラクター情報を格納するためのクラス
 */
export class CharacterData {
  public readonly name: string;
  public readonly jname: string;
  public faceList: CharacterFaceData[] = [];
  public layer: Map<string, CharacterPartData[]> = new Map();
  public readonly location: Location;

  constructor(name: string, jname: string, location: Location) {
    this.name = name;
    this.jname = jname;
    this.location = location;
  }

  public addFace(face: CharacterFaceData) {
    this.faceList.push(face);
  }

  public deleteFaceByFilePath(fsPath: string) {
    this.faceList = this.faceList.filter((face) => {
      return URI.parse(face.location?.uri ?? "").fsPath !== fsPath;
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
          return URI.parse(part.location?.uri ?? "").fsPath !== fsPath;
        }),
      );
    }
  }
}
