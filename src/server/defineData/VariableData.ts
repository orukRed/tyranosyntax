import { Location } from "vscode-languageserver/node";

/**
 * evalタグやjsからの変数定義で宣言された変数情報を格納するためのクラス
 */
export class VariableData {
  public readonly name: string;
  public readonly kind: string | undefined;
  public readonly description: string | undefined;
  public locations: Location[] = [];
  public nestVariableData: VariableData[] = [];
  public type: string = "";

  public addLocation(value: Location) {
    this.locations.push(value);
  }

  public deleteLocation(deleteUri: string) {
    this.locations = this.locations.filter((location) => {
      return location.uri !== deleteUri;
    });
  }

  public constructor(
    name: string,
    _value: string | undefined,
    kind: string | undefined,
    type: string = "",
    description: string = "",
    nestVariableData: VariableData[] = [],
  ) {
    this.name = name;
    this.kind = kind;
    this.type = type;
    this.description = description;
    this.nestVariableData = nestVariableData;
  }
}
