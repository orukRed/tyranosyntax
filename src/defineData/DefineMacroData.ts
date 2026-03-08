import * as vscode from "vscode";
import { MacroParameterData } from "./MacroParameterData";

export class DefineMacroData {
  public readonly macroName: string; //マクロ名。[hoge]などのhoge部分。
  public readonly filePath: string;
  public readonly location: vscode.Location | null; //定義ジャンプに使う位置情報
  public readonly parameter: MacroParameterData[] = []; //TODO:まだ未実装だけどそのうち追加する。マクロのパラメータ
  public description: string; //マクロの説明

  public constructor(
    macroName: string,
    location: vscode.Location,
    filePath: string,
    description: string,
  ) {
    this.macroName = macroName;
    this.location = location;
    this.filePath = filePath;
    this.description = description;
  }

  /**
   * マクロで定義したパラメータを入れる用のメソッド
   */
  private parseParametersToJsonObject(): object[] {
    return this.parameter.map((parameter) => ({
      name: parameter.name,
      required: parameter.required,
      description: parameter.description,
      detail: parameter.detail,
    }));
  }

  /**
   * 入力補完に使うjsonオブジェクトへと変換します。
   * @returns
   */
  public parseToJsonObject(): object {
    return {
      name: this.macroName,
      description: this.description,
      parameters: this.parseParametersToJsonObject(),
    };
  }
}
