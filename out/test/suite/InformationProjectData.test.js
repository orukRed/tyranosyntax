"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require("vscode");
const InformationProjectData_1 = require("../../InformationProjectData");
// import * as myExtension from '../../extension';
suite('InformationProjectData.getDefaultTag', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系', () => {
        //値定義
        const info = InformationProjectData_1.InformationProjectData.getInstance();
        info.getDefaultTag();
        assert.deepStrictEqual(info.getDefaultTag(), info.getDefaultTag());
    });
});
//# sourceMappingURL=InformationProjectData.test.js.map