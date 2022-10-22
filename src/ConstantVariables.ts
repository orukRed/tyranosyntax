
/**
 * 定数を定義するクラス
 */
export class ConstantVariables {
	public static readonly variableAndTagParseRegExp: RegExp = /(\[||\@)(\w+)(\s*)/;	//変数やマクロ名を抽出する正規表現 ex:「f.hoge=10;」→「f.hoge」　「[hoge_tag]」→「hoge_tag」
}
