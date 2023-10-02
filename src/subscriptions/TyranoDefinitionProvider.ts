
import * as vscode from 'vscode';
import { ConstantVariables } from '../ConstantVariables';
import { InformationWorkSpace } from '../InformationWorkSpace';
import { Parser } from '../Parser';

export class TyranoDefinitionProvider {

	private infoWs = InformationWorkSpace.getInstance();
	private parser: Parser = Parser.getInstance();
	constructor() {

	}


	/**
	 * Provide the definition of the symbol at the given position and document.
	 *
	 * @param document The document in which the command was invoked.
	 * @param position The position at which the command was invoked.
	 * @param token A cancellation token.
	 * @return A definition or a thenable that resolves to such. The lack of a result can be
	 * signaled by returning `undefined` or `null`.
	 */
	async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Definition | vscode.LocationLink[] | null | undefined> {

		const projectPath = await this.infoWs.getProjectPathByFilePath(document.uri.fsPath);
		let parsedData = this.parser.parseText(document.lineAt(position.line).text);
		const array_s = parsedData["array_s"];

		//F12押した付近のタグのデータを取得
		let tagNumber: string = "";
		for (let data in array_s) {
			//マクロの定義column > カーソル位置なら探索不要なのでbreak;
			if (array_s[data]["column"] > position.character) {
				break;
			}
			tagNumber = data;
		}
		//カーソル位置のマクロのMapデータ取得
		const retMacroData = this.infoWs.defineMacroMap.get(projectPath)?.get(array_s[tagNumber]["name"]);

		return retMacroData?.location;
	}


}