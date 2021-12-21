"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require("vscode");
const CreateTagByShortcutKey_1 = require("../../CreateTagByShortcutKey");
// import * as myExtension from '../../extension';
suite('KeyPushShiftEnter関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
        //値定義
        let ctby = new CreateTagByShortcutKey_1.CreateTagByShortcutKey();
        let excepted = true;
        //実行
        let actual = ctby.KeyPushShiftEnter();
        //アサート
        assert.strictEqual(actual, excepted);
    });
});
suite('KeyPushCtrlEnter関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
        //値定義
        let ctby = new CreateTagByShortcutKey_1.CreateTagByShortcutKey();
        let excepted = true;
        //実行
        let actual = ctby.KeyPushCtrlEnter();
        //アサート
        assert.strictEqual(actual, excepted);
    });
});
suite('KeyPushAltEnter関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
        //値定義
        let ctby = new CreateTagByShortcutKey_1.CreateTagByShortcutKey();
        let excepted = true;
        //実行
        let actual = ctby.KeyPushAltEnter();
        //アサート
        assert.strictEqual(actual, excepted);
    });
});
//# sourceMappingURL=CreateTagByShortcutKey.test.js.map