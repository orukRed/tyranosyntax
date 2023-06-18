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
exports.TyranoTagHoverProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
class TyranoTagHoverProvider {
    jsonTyranoSnippet;
    regExp;
    constructor() {
        this.jsonTyranoSnippet = JSON.parse(fs.readFileSync(__dirname + "/./../../Tooltip/tyrano.Tooltip.json", "utf8"));
        // this.regExp = /(\w+)(\s*((\w*)=\"?([a-zA-Z0-9_./\*]*)\"?)*)*/;//取得した行に対しての正規表現	//タグのどこをホバーしてもツールチップ出る版
        this.regExp = /(\[||\@)(\w+)(\s*)/; //取得した行に対しての正規表現 //タグ名のみホバーでツールチップ出る版
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
    async provideHover(document, position, token) {
        let wordRange = document.getWordRangeAtPosition(position, this.regExp);
        if (!wordRange) {
            return Promise.reject("no word here"); //指定文字がなかった時。引数で与えられた理由でPromiseオブジェクトを返却
        }
        let matcher = document.getText(wordRange).match(this.regExp);
        let markdownText = null;
        if (matcher != null) {
            markdownText = this.createMarkdownText(this.jsonTyranoSnippet[matcher[2]]);
        }
        if (!markdownText) {
            return Promise.reject("unmatched."); //指定文字がなかった時。引数で与えられた理由でPromiseオブジェクトを返却
        }
        return new vscode.Hover(markdownText); //解決したPromiseオブジェクトを返却。この場合、現在の文字列を返却	
    }
}
exports.TyranoTagHoverProvider = TyranoTagHoverProvider;
//# sourceMappingURL=TyranoTagHoverProvider.js.map