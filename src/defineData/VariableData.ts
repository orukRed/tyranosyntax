import * as vscode from "vscode";

/**
 * evalタグやjsからの変数定義で宣言された変数情報を格納するためのクラス
 */
export class VariableData {
  public readonly name: string; //変数名
  public readonly kind: string | undefined; //変数の種類 f sf tf mpのいずれか
  public readonly description: string | undefined; //変数の説明
  public locations: vscode.Location[] = []; //定義ジャンプに使う位置情報？ あと今は変数の定義場所取得手段思いつかないので、変数の使用箇所とする。そのため配列で値保持
  public nestVariableData: VariableData[] = []; //ネストされた変数情報を格納するための配列
  public type: string = ""; //変数の型

  public addLocation(value: vscode.Location) {
    this.locations.push(value);
  }
  public deleteLocation(deletePath: vscode.Uri) {
    this.locations = this.locations.filter((location) => {
      return location.uri.fsPath !== deletePath.fsPath;
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
