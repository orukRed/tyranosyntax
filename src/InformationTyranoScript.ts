import * as fs from 'fs';
import * as vscode from 'vscode';

/**
 * ティラノスクリプトに関する情報。
 * シングルトン。
 */
export class InformationTyranoScript {

	private static instance: InformationTyranoScript = new InformationTyranoScript();

	public static getInstance(): InformationTyranoScript {
		return this.instance;
	}

	private constructor() {
	}

	/**
	 * ティラノスクリプトにデフォルトで提供されているを返却します。
	 * @returns ティラノスクリプトにデフォルトで提供されているタグ
	 */
	public getDefaultTag(): string[] {
		let tyranoDefaultTag: string[] = [];
		JSON.parse(fs.readFileSync(__dirname + "/./../Tiptool/tyrano.tiptool.json", "utf8"),
			(key, value) => {
				if (key === "prefix") {
					tyranoDefaultTag.push(value);
					return value;
				};
			});

		//内部のパーサーとしては*はラベル、普通の文字列はtextで追加されているので返却
		tyranoDefaultTag.push("label");
		tyranoDefaultTag.push("text");

		return tyranoDefaultTag;
	}

}
