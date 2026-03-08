import { Location } from "vscode-languageserver/node";

export class CharacterFaceData {
  public readonly name: string;
  public readonly face: string;
  public readonly location: Location;

  public constructor(name: string, face: string, location: Location) {
    this.name = name;
    this.face = face;
    this.location = location;
  }
}
