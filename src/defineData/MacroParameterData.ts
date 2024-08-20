/**
 * マクロのパラメータ（[bg storage="hoge.ks"]のstorageの部分）
 * 将来的にjsで定義したタグのパラメータをこれに格納する
 */
export class MacroParameterData {
  private _name: string = ""; //parameter名
  private _required: boolean = false; //必須かどうか
  private _description: string = ""; //parameterの説明

  constructor(name: string, required: boolean, description: string) {
    this._name = name;
    this._required = required;
    this._description = description;
  }
  public get name(): string {
    return this._name;
  }
  public set name(value: string) {
    this._name = value;
  }
  public get required(): boolean {
    return this._required;
  }
  public set required(value: boolean) {
    this._required = value;
  }
  public get description(): string {
    return this._description;
  }
  public set description(value: string) {
    this._description = value;
  }
}

