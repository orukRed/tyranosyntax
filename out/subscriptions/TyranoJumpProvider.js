"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoJumpProvider = void 0;
const vscode = __importStar(require("vscode"));
const InformationWorkSpace_1 = require("../InformationWorkSpace");
const fs = __importStar(require("fs"));
const Parser_1 = require("../Parser");
class TyranoJumpProvider {
    constructor() {
    }
    /**
     * alt(option) + J でシナリオジャンプした時の挙動
     */
    async toDestination() {
        const infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
        const parser = Parser_1.Parser.getInstance();
        let jumpTagObject = {};
        const document = vscode.window.activeTextEditor?.document;
        const position = vscode.window.activeTextEditor?.selection.active;
        if (document === undefined || position === undefined || jumpTagObject === undefined) {
            return;
        }
        const projectPath = await infoWs.getProjectPathByFilePath(document.uri.fsPath);
        const parsedData = parser.parseText(document.lineAt(position.line).text);
        // TyranoScript syntax.tag.parameterから、{"tagName":"Path"}の形のObjectを作成
        const tags = await vscode.workspace.getConfiguration().get('TyranoScript syntax.tag.parameter');
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
        const tagIndex = parser.getIndex(parsedData, position.character);
        //カーソル位置のタグ名取得
        const tagName = parsedData[tagIndex]["name"];
        let jumpStorage = parsedData[tagIndex]["pm"]["storage"];
        let jumpTarget = parsedData[tagIndex]["pm"]["target"];
        //TODO:loadcssタグ専用にfileを見るんじゃなくて、参照ラベル名（storageとかfileとか）をpackage.jsonで指定できるようにする。TyranoScript syntax.tag.parameterのような感じのobjectにすればいけるはず
        //リファクタリングに時間がかかりそうなことや、バグの懸念、今後も設計が変わるおそれがあるので今はこのままで
        if (jumpStorage === undefined) {
            if (parsedData[tagIndex]["pm"]["file"] !== undefined) {
                jumpStorage = parsedData[tagIndex]["pm"]["file"];
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
                vscode.window.showWarningMessage(`${parsedData[tagIndex]["pm"]["storage"]}は存在しないファイルです。`);
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
            const jumpDefinitionArray_s = parser.parseText(jumpDefinitionFile.getText());
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