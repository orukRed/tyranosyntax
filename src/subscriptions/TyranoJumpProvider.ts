
import * as vscode from 'vscode';
import { ConstantVariables } from '../ConstantVariables';
import { InformationWorkSpace } from '../InformationWorkSpace';
import * as fs from 'fs';
import { Parser } from '../Parser';

export class TyranoJumpProvider {

	constructor() {
	}
	/**
	 * alt(option) + J でシナリオジャンプした時の挙動
	 */
	public async toDestination() {

		const infoWs: InformationWorkSpace = InformationWorkSpace.getInstance();
		const parser: Parser = Parser.getInstance();
		let jumpTagObject: object = {};
		const document: vscode.TextDocument | undefined = vscode.window.activeTextEditor?.document;
		const position: vscode.Position | undefined = vscode.window.activeTextEditor?.selection.active
		if (document === undefined || position === undefined || jumpTagObject === undefined) {
			return;
		}
		const projectPath = await infoWs.getProjectPathByFilePath(document.uri.fsPath);
		let parsedData = parser.parseText(document.lineAt(position.line).text);
		const array_s = parsedData["array_s"];


		// TyranoScript syntax.tag.parameterから、{"tagName":"Path"}の形のObjectを作成
		const tags: Object = await vscode.workspace.getConfiguration().get('TyranoScript syntax.tag.parameter')!;
		const enableJumpTags = ["scenario", "script", "html", "css", "text"];
		for (let tagName in tags) {
			for (let paramName in tags[tagName]) {
				for (let type of tags[tagName][paramName].type) {
					if (enableJumpTags.includes(type)) {
						jumpTagObject[tagName] = tags[tagName][paramName].path;
					}
				}
			}
		}


		//F12押した付近のタグのデータを取得
		let tagNumber: string = "";
		for (let data in array_s) {
			//マクロの定義column > カーソル位置なら探索不要なのでbreak;
			if (array_s[data]["column"] > position.character) {
				break;
			}
			tagNumber = data;
		}

		//カーソル位置のタグ名取得
		const tagName = array_s[tagNumber]["name"];
		let jumpStorage = array_s[tagNumber]["pm"]["storage"];
		let jumpTarget = array_s[tagNumber]["pm"]["target"];

		//TODO:loadcssタグ専用にfileを見るんじゃなくて、参照ラベル名（storageとかfileとか）をpackage.jsonで指定できるようにする。TyranoScript syntax.tag.parameterのような感じのobjectにすればいけるはず
		//リファクタリングに時間がかかりそうなことや、バグの懸念、今後も設計が変わるおそれがあるので今はこのままで
		if (jumpStorage === undefined) {
			if (array_s[tagNumber]["pm"]["file"] !== undefined) {
				jumpStorage = array_s[tagNumber]["pm"]["file"];
			} else {
				jumpStorage = document.fileName.substring(document.fileName.lastIndexOf(infoWs.pathDelimiter) + 1,);
			}
		}
		//ラベルから*の除去しておく
		if (jumpTarget) {
			jumpTarget = jumpTarget.replace("*", "");
		}
		//カーソルの位置のタグがジャンプ系タグなら
		if (Object.keys(jumpTagObject).includes(tagName)) {
			//変数を使っている場合はジャンプさせない
			const variableStr = /&f\.|&sf\.|&tf\.|&mp\|/
			if (!fs.existsSync(vscode.Uri.file(`${projectPath}${infoWs.pathDelimiter}${jumpTagObject[tagName]}${infoWs.pathDelimiter}${jumpStorage}`).fsPath)) {
				vscode.window.showWarningMessage(`${array_s[tagNumber]["pm"]["storage"]}は存在しないファイルです。`);
				return;
			}

			const jumpDefinitionFile = await vscode.workspace.openTextDocument(vscode.Uri.file(`${projectPath}${infoWs.pathDelimiter}${jumpTagObject[tagName]}${infoWs.pathDelimiter}${jumpStorage}`));
			//ラベル未指定ならファイル頭にジャンプ
			if (jumpTarget == undefined) {
				const activeTextEditor = await vscode.window.showTextDocument(jumpDefinitionFile, { preview: true });
				activeTextEditor.selection = new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(0, 0));
				activeTextEditor.revealRange(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)));
				return;
			}

			//変数ならジャンプさせない
			if (jumpStorage.search(variableStr) !== -1 || jumpTarget.search(variableStr) !== -1) {
				vscode.window.showInformationMessage("storageやtargetパラメータに変数を使用しているためジャンプできません。");
				return;
			}

			const tmpParse = parser.parseText(jumpDefinitionFile.getText());
			const jumpDefinitionArray_s = tmpParse["array_s"];


			//ラベル探索して見つかったらその位置でジャンプしてreturn
			for (let data in jumpDefinitionArray_s) {
				if (jumpDefinitionArray_s[data]["name"] === "label") {
					if (jumpDefinitionArray_s[data]["pm"]["label_name"] === jumpTarget) {
						const activeTextEditor = await vscode.window.showTextDocument(jumpDefinitionFile, { preview: true });
						activeTextEditor.selection = new vscode.Selection(new vscode.Position(jumpDefinitionArray_s[data]["pm"]["line"], 0), new vscode.Position(jumpDefinitionArray_s[data]["pm"]["line"], 0));
						activeTextEditor.revealRange(new vscode.Range(new vscode.Position(jumpDefinitionArray_s[data]["pm"]["line"], 0), new vscode.Position(jumpDefinitionArray_s[data]["pm"]["line"], 0)), vscode.TextEditorRevealType.InCenter);
						return;
					}
				}
			}
			//ラベル見つからなかった時の処理
			const activeTextEditor = await vscode.window.showTextDocument(jumpDefinitionFile, { preview: true });
			activeTextEditor.selection = new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(0, 0));
			activeTextEditor.revealRange(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)));
			vscode.window.showInformationMessage("ラベルが見つからなかったためファイルの先頭へとジャンプしました。");
		} else {
			vscode.window.showWarningMessage("現在選択しているタグはTyranoScript syntax.jump.tagに登録されているタグではありません。\nsetting.jsonをご確認ください。");
		}
	}
}