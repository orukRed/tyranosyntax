import { Location } from "vscode-languageserver/node";

export class CharacterLayerData {
  public readonly name: string;
  public readonly part: string;
  public readonly id: string;
  public readonly location: Location;

  public constructor(
    name: string,
    part: string,
    id: string,
    location: Location,
  ) {
    this.name = name;
    this.part = part;
    this.id = id;
    this.location = location;
  }
}
