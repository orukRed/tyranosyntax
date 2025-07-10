import * as vscode from "vscode";
import { MacroParameterData } from "./MacroParameterData";

export class DefineMacroData {
  private _macroName: string = ""; //マクロ名。[hoge]などのhoge部分。
  private _filePath: string = "";
  private _location: vscode.Location | null = null; //定義ジャンプに使う位置情報
  private _parameter: MacroParameterData[] = []; //TODO:まだ未実装だけどそのうち追加する。マクロのパラメータ
  private _description: string = ""; //マクロの説明

  public constructor(
    macroName: string,
    location: vscode.Location,
    filePath: string,
    description: string,
  ) {
    this._macroName = macroName;
    this._location = location;
    this._filePath = filePath;
    this._description = description;
  }

  /**
   * マクロで定義したパラメータを入れる用のメソッド
   * //FIXME: 現在マクロのパラメータの補完はsetting.jsonで定義しており、このメソッドは使われていない。
   * そのため空のオブジェクトを返す実装となっている。将来的にどうするか要検討すること。
   */
  private parseParametersToJsonObject(): object {
    const obj = {};
    this._parameter.forEach((parameter) => {
      Object.assign(this._parameter, {
        name: parameter.name,
        required: parameter.required,
        description: parameter.description,
      });
    });
    return obj;
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

  public get macroName(): string {
    return this._macroName;
  }
  public get filePath(): string {
    return this._filePath;
  }
  public get location(): vscode.Location | null {
    return this._location;
  }
  public get description(): string {
    return this._description;
  }
  public set description(value: string) {
    this._description = value;
  }
  public get parameter(): MacroParameterData[] {
    return this._parameter;
  }
}

