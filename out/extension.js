"use strict";
//拡張機能のエントリポイント
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const fs = require("fs");
const vscode = require("vscode");
const TYRANO_MODE = { scheme: 'file', language: 'tyrano' };
class TagHoverProvider {
    constructor() {
        this.jsonTyranoSnippet = JSON.parse(fs.readFileSync(__dirname + "./../snippet/tyrano.snippet.json", "utf8"));
        this.regExp = /((\w+))\s*((\S*)=\"?(\w*)\"?)*()/;
    }
    createMarkdownText(textValue) {
        if (!textValue)
            return null;
        let textCopy = textValue['description'].slice(); //非同期通信では引数で受け取った配列を変更してはいけない
        let backQuoteStartIndex = textCopy.indexOf("[パラメータ]");
        textCopy.splice(backQuoteStartIndex, 0, "```tyrano"); //マークダウンの作成
        textCopy.push("```");
        //マークダウン崩れるのでここはインデント変えたらだめ
        let sentence = `
### ${textValue["prefix"]}

${textCopy.join('  \n')}
`;
        let markdownText = new vscode.MarkdownString(sentence);
        return markdownText;
    }
    provideHover(document, position, token) {
        return __awaiter(this, void 0, void 0, function* () {
            let wordRange = document.getWordRangeAtPosition(position, this.regExp);
            if (!wordRange) {
                return Promise.reject("no word here"); //指定文字がなかった時。引数で与えられた理由でPromiseオブジェクトを返却
            }
            let matcher = document.getText(wordRange).match(this.regExp);
            let markdownText = null;
            if (matcher != null) {
                markdownText = this.createMarkdownText(this.jsonTyranoSnippet["[" + matcher[1] + "]"]);
            }
            if (!markdownText) {
                return Promise.reject("unmatched."); //指定文字がなかった時。引数で与えられた理由でPromiseオブジェクトを返却
            }
            return new vscode.Hover(markdownText); //解決したPromiseオブジェクトを返却。この場合、現在の文字列を返却	
        });
    }
}
class OutlineProvider {
    constructor() {
        this.regExp = /((\w+))\s*((\S*)=\"?(\w*)\"?)*()/;
        this.MATCH_TEXTS = ["if", "elseif", "else", "endif", "ignore", "endignore", "jump", "call", "button", "link", "s", "iscript", "endscript", "loadjs"];
    }
    provideDocumentSymbols(document, token) {
        let symbols = [];
        for (let i = 0; i < document.lineCount; i++) {
            let line = document.lineAt(i); //i行目のドキュメントを取得
            let match = line.text.match(this.regExp); //[hoge param=""]の形式のタグでマッチしてるかを探して変数に格納
            if (!match) {
                // return Promise.reject("unmatched."); //指定文字がなかった時。引数で与えられた理由でPromiseオブジェクトを返却
                continue;
            }
            let matchText = match[1];
            //matchTextがMATCH_TEXTSで定義したいずれかのタグがあるならアウトラインに表示
            for (let j = 0; j < this.MATCH_TEXTS.length; j++) {
                if (matchText === this.MATCH_TEXTS[j]) {
                    let symbol = new vscode.DocumentSymbol(line.text, 'Component', vscode.SymbolKind.Class, line.range, line.range);
                    symbols.push(symbol);
                }
            }
            //ラベルをアウトラインに表示
            if (line.text.startsWith("*")) {
                let symbol = new vscode.DocumentSymbol(line.text, 'Component', vscode.SymbolKind.Function, line.range, line.range);
                symbols.push(symbol);
            }
        }
        return symbols;
    }
}
/**
 * 将来的に、ユーザーが任意のタグをShortcutで出力できるように
 */
class CreateTagByShortcutKey {
    /**
     * shift + Enterで実行されるコマンド
     */
    KeyPushShiftEnter() {
        const editor = vscode.window.activeTextEditor;
        if (editor != undefined) {
            let cursorPos = editor.selection.active;
            editor.edit((editbuilder) => {
                editbuilder.insert(cursorPos, "[l][r]");
            });
        }
    }
    /**
     * ctrl + Enterで実行されるコマンド
     */
    KeyPushCtrlEnter() {
        const editor = vscode.window.activeTextEditor;
        if (editor != undefined) {
            let cursorPos = editor.selection.active;
            editor.edit((editbuilder) => {
                editbuilder.insert(cursorPos, "[p]");
            });
        }
    }
    /**
     * alt + Enterで実行されるコマンド
     */
    KeyPushAltEnter() {
        const editor = vscode.window.activeTextEditor;
        if (editor != undefined) {
            let cursorPos = editor.selection.active;
            editor.edit((editbuilder) => {
                editbuilder.insert(cursorPos, "#");
            });
        }
    }
}
function activate(context) {
    //登録処理
    //サブスクリプションを登録することで、拡張機能がアンロードされたときにコマンドを解除してくれる
    context.subscriptions.push(vscode.languages.registerHoverProvider(TYRANO_MODE, new TagHoverProvider()));
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(TYRANO_MODE, new OutlineProvider()));
    let ctbs = new CreateTagByShortcutKey();
    context.subscriptions.push(vscode.commands.registerCommand('tyrano.shiftEnter', ctbs.KeyPushShiftEnter));
    context.subscriptions.push(vscode.commands.registerCommand('tyrano.ctrlEnter', ctbs.KeyPushCtrlEnter));
    context.subscriptions.push(vscode.commands.registerCommand('tyrano.altEnter', ctbs.KeyPushAltEnter));
}
exports.activate = activate;
function deactivate() {
    return undefined;
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map