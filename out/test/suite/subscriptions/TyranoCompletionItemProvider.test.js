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
const assert = __importStar(require("assert"));
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = __importStar(require("vscode"));
const TyranoCompletionItemProvider_1 = require("../../../subscriptions/TyranoCompletionItemProvider");
// import * as myExtension from '../../extension';
suite('TyranoCompletionItemProvider.provideCompletionItems', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
        //値定義
        const thp = new TyranoCompletionItemProvider_1.TyranoCompletionItemProvider();
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
suite('TyranoCompletionItemProvider.conpletionLabel', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
    });
});
suite('TyranoCompletionItemProvider.completionVariable', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
    });
});
suite('TyranoCompletionItemProvider.completionFile', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
    });
});
suite('TyranoCompletionItemProvider.completionParameter', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
    });
});
suite('TyranoCompletionItemProvider.completionTag', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
        const tcip = new TyranoCompletionItemProvider_1.TyranoCompletionItemProvider();
        tcip.completionTag();
    });
});
suite('TyranoCompletionItemProvider.removeBracket', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系 [ ]のある文字列から[ ]が消えて帰ってくる', () => {
        const tcip = new TyranoCompletionItemProvider_1.TyranoCompletionItemProvider();
        assert.strictEqual(tcip.removeBracket('[bg storage="hoge.png]"'), 'bg storage="hoge.png"');
    });
    test('正常系 [ ]のある文字列から[ ]が消えて帰ってくる', () => {
        const tcip = new TyranoCompletionItemProvider_1.TyranoCompletionItemProvider();
        assert.strictEqual(tcip.removeBracket('[][][][[][][][[[[][]]]]'), '');
    });
    test('異常系 [ ]のない文字列をそのまま返す', () => {
        const tcip = new TyranoCompletionItemProvider_1.TyranoCompletionItemProvider();
        assert.strictEqual(tcip.removeBracket('bg storage="hoge.png"'), 'bg storage="hoge.png"');
    });
});
//# sourceMappingURL=TyranoCompletionItemProvider.test.js.map