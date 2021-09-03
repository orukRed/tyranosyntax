"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require("vscode");
const TyranoSemanticTokenProvider_1 = require("../../TyranoSemanticTokenProvider");
// import * as myExtension from '../../extension';
class MockTextDocument {
    save() {
        throw new Error('Method not implemented.');
    }
    lineAt(position) {
        throw new Error('Method not implemented.');
    }
    offsetAt(position) {
        throw new Error('Method not implemented.');
    }
    positionAt(offset) {
        throw new Error('Method not implemented.');
    }
    getText(range) {
        throw new Error('Method not implemented.');
    }
    getWordRangeAtPosition(position, regex) {
        throw new Error('Method not implemented.');
    }
    validateRange(range) {
        throw new Error('Method not implemented.');
    }
    validatePosition(position) {
        throw new Error('Method not implemented.');
    }
}
suite('provideSemanticHighlight関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系 v5のタグがハイライトされる', () => {
        //値定義
        let argDocument = new MockTextDocument();
        const tstp = new TyranoSemanticTokenProvider_1.TyranoSemanticTokenProvider();
        //実行・期待値
        ;
        const actual = tstp.provideSemanticHighlight(argDocument); //anyでキャストしてprivate型を通す
        const excepted = Object.defineProperty(new vscode.SemanticTokens(new Uint32Array()), 'build', {
            value: new vscode.SemanticTokens(new Uint32Array()),
            writable: false,
        });
        //アサート
        assert.strictEqual(actual, excepted);
    });
    test('正常系 変数(f.)がハイライトされる', () => {
        //値定義
        let argDocument = new MockTextDocument();
        const tstp = new TyranoSemanticTokenProvider_1.TyranoSemanticTokenProvider();
        //実行・期待値
        ;
        const actual = tstp.provideSemanticHighlight(argDocument); //anyでキャストしてprivate型を通す
        const excepted = Object.defineProperty(new vscode.SemanticTokens(new Uint32Array()), 'build', {
            value: new vscode.SemanticTokens(new Uint32Array()),
            writable: false,
        });
        //アサート
        assert.strictEqual(actual, excepted);
    });
    test('正常系 変数(sf.)がハイライトされる', () => {
        //値定義
        let argDocument = new MockTextDocument();
        const tstp = new TyranoSemanticTokenProvider_1.TyranoSemanticTokenProvider();
        //実行・期待値
        ;
        const actual = tstp.provideSemanticHighlight(argDocument); //anyでキャストしてprivate型を通す
        const excepted = Object.defineProperty(new vscode.SemanticTokens(new Uint32Array()), 'build', {
            value: new vscode.SemanticTokens(new Uint32Array()),
            writable: false,
        });
        //アサート
        assert.strictEqual(actual, excepted);
    });
    test('正常系 変数(tf.)がハイライトされる', () => {
        //値定義
        let argDocument = new MockTextDocument();
        const tstp = new TyranoSemanticTokenProvider_1.TyranoSemanticTokenProvider();
        //実行・期待値
        ;
        const actual = tstp.provideSemanticHighlight(argDocument); //anyでキャストしてprivate型を通す
        const excepted = Object.defineProperty(new vscode.SemanticTokens(new Uint32Array()), 'build', {
            value: new vscode.SemanticTokens(new Uint32Array()),
            writable: false,
        });
        //アサート
        assert.strictEqual(actual, excepted);
    });
    test('正常系 macroタグ定義がハイライトされる', () => {
        //値定義
        let argDocument = new MockTextDocument();
        const tstp = new TyranoSemanticTokenProvider_1.TyranoSemanticTokenProvider();
        //実行・期待値
        ;
        const actual = tstp.provideSemanticHighlight(argDocument); //anyでキャストしてprivate型を通す
        const excepted = Object.defineProperty(new vscode.SemanticTokens(new Uint32Array()), 'build', {
            value: new vscode.SemanticTokens(new Uint32Array()),
            writable: false,
        });
        //アサート
        assert.strictEqual(actual, excepted);
    });
    test('異常系 ハイライトされないテキストを送る', () => {
        //値定義
        let argDocument = new MockTextDocument();
        const tstp = new TyranoSemanticTokenProvider_1.TyranoSemanticTokenProvider();
        //実行・期待値
        ;
        const actual = tstp.provideSemanticHighlight(argDocument); //anyでキャストしてprivate型を通す
        const excepted = Object.defineProperty(new vscode.SemanticTokens(new Uint32Array()), 'build', {
            value: new vscode.SemanticTokens(new Uint32Array()),
            writable: false,
        });
        //アサート
        assert.strictEqual(actual, excepted);
    });
});
//# sourceMappingURL=TyranoSemanticTokenProvider.test.js.map