"use strict";
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
exports.TagHoverProvider = void 0;
const vscode = require("vscode");
const fs = require("fs");
class TagHoverProvider {
    constructor() {
        this.jsonTyranoSnippet = JSON.parse(fs.readFileSync(__dirname + "./../snippet/tyrano.snippet.json", "utf8"));
        this.regExp = /(\w+)(\s*((\w*)=\"?([a-zA-Z0-9_./\*]*)\"?)*)*/; //取得した行に対しての正規表現
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
                console.log("error");
                return Promise.reject("no word here"); //指定文字がなかった時。引数で与えられた理由でPromiseオブジェクトを返却
            }
            console.log(document.getText(wordRange));
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
exports.TagHoverProvider = TagHoverProvider;
//# sourceMappingURL=TagHoverProvider.js.map