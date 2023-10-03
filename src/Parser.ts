import * as path from 'path';

/**
 * ティラノスクリプト本体に存在するパーサー処理を用いたパーサークラスです。
 * parseScenarioした後に追加の処理をすることが多かったため作成したクラスです。
 */
export class Parser {
	private static instance: Parser = new Parser();
	private parser = require(`.${path.sep}lib${path.sep}tyrano_parser.js`);
	private constructor() { }
	public static getInstance(): Parser {
		return this.instance;
	}

	/**
	 * 引数から、カーソルより左側のタグを返却する
	 * @param parsedData getParseTextで取得したパース済みのデータ
	 * @param character カーソル位置(position.character)
	 * @returns 
	 */
	public getIndex(parsedData: any, character: number): number {
		let ret: number = -1;
		for (const [index, data] of parsedData.entries()) {
			//マクロの定義column > カーソル位置なら探索不要なのでbreak;
			if (data["column"] > character) {
				return ret;
			}
			ret = index;
		}
		return ret;
	}



	/**
	 * 引数で与えたテキストをパースして、パースしたデータを返却します。
	 * @param text 
	 * @returns 
	 */
	public parseText(text: string): any {
		return this.parser.parseScenario(text)["array_s"];
	}

}