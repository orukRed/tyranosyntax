"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require("vscode");
const TyranoCreateTagByShortcutKey_1 = require("../../TyranoCreateTagByShortcutKey");
// import * as myExtension from '../../extension';
suite('TyranoCreateTagByShortcutKey.KeyPushShiftEnter関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
        //値定義
        let ctby = new TyranoCreateTagByShortcutKey_1.TyranoCreateTagByShortcutKey();
        let excepted = true;
        //実行
        let actual = ctby.KeyPushShiftEnter();
        //アサート
        assert.strictEqual(actual, excepted);
    });
});
suite('TyranoCreateTagByShortcutKey.KeyPushCtrlEnter関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
        //値定義
        let ctby = new TyranoCreateTagByShortcutKey_1.TyranoCreateTagByShortcutKey();
        let excepted = true;
        //実行
        let actual = ctby.KeyPushCtrlEnter();
        //アサート
        assert.strictEqual(actual, excepted);
    });
});
suite('TyranoCreateTagByShortcutKey.KeyPushAltEnter関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
        //値定義
        let ctby = new TyranoCreateTagByShortcutKey_1.TyranoCreateTagByShortcutKey();
        let excepted = true;
        //実行
        let actual = ctby.KeyPushAltEnter();
        //アサート
        assert.strictEqual(actual, excepted);
    });
});
//# sourceMappingURL=TyranoCreateTagByShortcutKey.test.js.map