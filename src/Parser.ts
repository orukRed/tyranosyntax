import { InformationWorkSpace } from "./InformationWorkSpace";
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
	 * 与えられた行とカーソルを引数として、カーソルより左側のタグを返却する
	 * @param line 
	 * @returns 
	 */
	public getTagName(line: string, cursor: string): string {
		return ""
	}

	/**
	 * 与えられた行とカーソルを引数として、カーソルより左側のタグのパラメータ名を返却する
	 */
	public getParameterName(line: string, cursor: string){

	}

	/**
	 * 与えられた行とカーソルを引数として、カーソルより左側のタグのパラメータ値を返却する
	 */
	public getParameterValue(line: string, cursor: string){

	}

	/**
	 * 引数で与えたテキストをパースして、パースしたデータを返却します。
	 * @param text 
	 * @returns 
	 */
	public parseText(text: string): Object {
		return this.parser.parseScenario(text);
	}

}