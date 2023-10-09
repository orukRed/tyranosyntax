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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoHoverProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const InformationWorkSpace_1 = require("../InformationWorkSpace");
class TyranoHoverProvider {
    jsonTyranoSnippet;
    regExp;
    infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
    constructor() {
        this.jsonTyranoSnippet = JSON.parse(fs.readFileSync(path_1.default.join(__dirname, "./../../Tooltip/tyrano.Tooltip.json"), "utf8"));
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
    /**
     * 引数の情報から、画像を表示するためのMarkdownStringを作成して返却します。
     * @param paramValue storage="hoge"などの、hogeの部分
     * @param projectPath
     * @param defaultPath
     * @returns
     */
    async createImageViewMarkdownText(paramValue, projectPath, defaultPath) {
        const markdownText = new vscode.MarkdownString(`${paramValue}<br>`);
        markdownText.appendMarkdown(`<img src="${paramValue}" width=350>`);
        markdownText.supportHtml = true;
        markdownText.isTrusted = true;
        markdownText.supportThemeIcons = true;
        markdownText.baseUri = vscode.Uri.file(path_1.default.join(projectPath, defaultPath, path_1.default.sep));
        return markdownText;
    }
    async provideHover(document, position, token) {
        //param="hoge"の部分があるかどうか検索
        const parameterWordRange = document.getWordRangeAtPosition(position, new RegExp(/[\S]+="[\S]+"/));
        if (parameterWordRange) {
            //プロジェクトパス取得
            const projectPath = await this.infoWs.getProjectPathByFilePath(document.uri.fsPath);
            //タグ名取得
            const exp = /(\w+)(\s*((\w*)=\"?([a-zA-Z0-9_./\*]*)\"?)*)*/;
            const wordRange = document.getWordRangeAtPosition(position, exp);
            const matcher = document.getText(wordRange).match(exp);
            const tag = matcher[1];
            //parameter名(storageとかgraphicとか)取得
            const parameter = document.getText(parameterWordRange).match(/(\w+)="/)[1];
            //storage="hoge"のhogeを取得 この処理もParserに移動してよさそう？ 要検討
            const regExpParameterValue = new RegExp(`${parameter}="([^"]+)"`);
            const match = document.getText(parameterWordRange).match(regExpParameterValue);
            const parameterValue = match !== null ? match[1] : "";
            //TyranoScript syntax.tag.parameterの値から、/data/bgimageなどのデフォルトパスを取得する
            let tagParams = await vscode.workspace.getConfiguration().get('TyranoScript syntax.tag.parameter');
            const defaultPath = tagParams[tag][parameter]["path"]; // data/bgimage
            return new vscode.Hover(await this.createImageViewMarkdownText(parameterValue, projectPath, defaultPath));
        }
        const wordRange = document.getWordRangeAtPosition(position, this.regExp);
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
exports.TyranoHoverProvider = TyranoHoverProvider;
//# sourceMappingURL=TyranoTHoverProvider.js.map