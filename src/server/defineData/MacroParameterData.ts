/**
 * マクロのパラメータ（[bg storage="hoge.ks"]のstorageの部分）
 * 将来的にjsで定義したタグのパラメータをこれに格納する
 */
export class MacroParameterData {
  public readonly name: string; //parameter名
  public readonly required: boolean; //必須かどうか
  public readonly description: string; //parameterの説明
  public readonly detail: string; //詳細な説明（将来的に使うかも）

  constructor(
    name: string,
    required: boolean,
    description: string,
    detail: string = "",
  ) {
    this.name = name;
    this.required = required;
    this.description = description;
    this.detail = detail;
  }
}
