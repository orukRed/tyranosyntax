"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require("vscode");
const TyranoTagHoverProvider_1 = require("../../../subscriptions/TyranoTagHoverProvider");
// import * as myExtension from '../../extension';
suite('TyranoTagHoverProvider.provideHover関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
        //値定義
        const thp = new TyranoTagHoverProvider_1.TyranoTagHoverProvider();
        // const excepted = Object.defineProperty(document.lineAt(0), 'text',{
        // 	value:"@elsif exp=\"true\"",
        // 	writable:false,
        // });	
        //実行・期待値
        // let actual = yjp.provideDocumentSymbols(document,token)!;
        //アサート
        // assert.strictEqual(actual[0].name, excepted.text);
    });
});
suite('TyranoTagHoverProvider.createMarkdownText関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
    });
});
//# sourceMappingURL=TyranoTagHoverProvider.test.js.map