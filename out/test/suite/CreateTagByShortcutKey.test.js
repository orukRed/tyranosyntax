"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require("vscode");
const CreateTagByShortcutKey_1 = require("../../CreateTagByShortcutKey");
// import * as myExtension from '../../extension';
suite('KeyPushShiftEnter関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
        let ctby = new CreateTagByShortcutKey_1.CreateTagByShortcutKey();
        ctby.KeyPushShiftEnter();
    });
});
suite('KeyPushCtrlEnter関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
        let ctby = new CreateTagByShortcutKey_1.CreateTagByShortcutKey();
        ctby.KeyPushCtrlEnter();
    });
});
suite('KeyPushAltEnter関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
        let ctby = new CreateTagByShortcutKey_1.CreateTagByShortcutKey();
        ctby.KeyPushAltEnter();
    });
});
//# sourceMappingURL=CreateTagByShortcutKey.test.js.map