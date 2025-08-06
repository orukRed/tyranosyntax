/**
 * マクロのパラメータ（[bg storage="hoge.ks"]のstorageの部分）
 * 将来的にjsで定義したタグのパラメータをこれに格納する
 */
export class MacroParameterData {
  private readonly _name: string = ""; //parameter名
  private readonly _required: boolean = false; //必須かどうか
  private readonly _description: string = ""; //parameterの説明
  private readonly _detail: string = ""; //詳細な説明（将来的に使うかも）

  constructor(
    name: string,
    required: boolean,
    description: string,
    detail: string = "",
  ) {
    this._name = name;
    this._required = required;
    this._description = description;
    this._detail = detail;
  }
  public get name(): string {
    return this._name;
  }
  public get required(): boolean {
    return this._required;
  }
  public get description(): string {
    return this._description;
  }

  public get detail(): string {
    return this._detail;
  }
}

