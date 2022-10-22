"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require("vscode");
// import * as myExtension from '../../extension';
const ConstantVariables_1 = require("../../ConstantVariables");
suite('ConstantVariables.wordParseRegExp', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
        //値定義
        const word = "[jump]";
        const expected = "jump";
        const actual = new RegExp(ConstantVariables_1.ConstantVariables.variableAndTagParseRegExp).exec(word);
        assert.strictEqual(actual[1], expected);
    });
});
//# sourceMappingURL=ConstantVariables.test.js.map