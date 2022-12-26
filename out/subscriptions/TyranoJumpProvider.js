"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoJumpProvider = void 0;
const vscode = require("vscode");
const InformationWorkSpace_1 = require("../InformationWorkSpace");
const fs = require("fs");
class TyranoJumpProvider {
    constructor() {
    }
    /**
     * alt(option) + J でシナリオジャンプした時の挙動
     */
    async toDestination() {
        var _a, _b;
        const infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
        const jumpTagObject = vscode.workspace.getConfiguration().get('TyranoScript syntax.jump.tag');
        const document = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document;
        const position = (_b = vscode.window.activeTextEditor) === null || _b === void 0 ? void 0 : _b.selection.active;
        if (document === undefined || position === undefined || jumpTagObject === undefined) {
            return;
        }
        const projectPath = await infoWs.getProjectPathByFilePath(document.uri.fsPath);
        let parsedData = infoWs.parser.tyranoParser.parseScenario(document.lineAt(position.line).text);
        const array_s = parsedData["array_s"];
        //F12押した付近のタグのデータを取得
        let tagNumber = "";
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
        //BUG:loadcssタグ専用にfileを見るんじゃなくて、参照ラベル名（storageとかfileとか）をpackage.jsonで指定できるようにする。TyranoScript syntax.tag.parameterのような感じのobjectにすればいけるはず
        if (jumpStorage === undefined) {
            if (array_s[tagNumber]["pm"]["file"] !== undefined) {
                jumpStorage = array_s[tagNumber]["pm"]["file"];
            }
            else {
                jumpStorage = document.fileName.substring(document.fileName.lastIndexOf(infoWs.pathDelimiter) + 1);
            }
        }
        //ラベルから*の除去しておく
        if (jumpTarget) {
            jumpTarget = jumpTarget.replace("*", "");
        }
        //カーソルの位置のタグがジャンプ系タグなら
        if (Object.keys(jumpTagObject).includes(tagName)) {
            //変数を使っている場合はジャンプさせない
            const variableStr = /&f\.|&sf\.|&tf\.|&mp\|/;
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
            const tmpParse = infoWs.parser.tyranoParser.parseScenario(jumpDefinitionFile.getText());
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
        }
        else {
            vscode.window.showWarningMessage("現在選択しているタグはTyranoScript syntax.jump.tagに登録されているタグではありません。\nsetting.jsonをご確認ください。");
        }
    }
}
exports.TyranoJumpProvider = TyranoJumpProvider;
//# sourceMappingURL=TyranoJumpProvider.js.map