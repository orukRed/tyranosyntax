"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require("vscode");
const TyranoDiagnostic_1 = require("../../../subscriptions/TyranoDiagnostic");
// import * as myExtension from '../../extension';
suite('TyranoDiagnostic.isExistAmpersandAtBeginning', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('&f.hoge true返却', () => {
        //値定義
        const diag = new TyranoDiagnostic_1.TyranoDiagnostic();
        assert.strictEqual(diag.isExistAmpersandAtBeginning("&f.hoge"), true);
    });
    test('f.hoge false返却', () => {
        //値定義
        const diag = new TyranoDiagnostic_1.TyranoDiagnostic();
        assert.strictEqual(diag.isExistAmpersandAtBeginning("f.hoge"), false);
    });
});
// suite('InformationWorkSpace.getProjectFiles', () => {
// 	vscode.window.showInformationMessage('Start all tests.');
// 	// 配列はdeepStrictEqualを使うこと。配列を再帰的に中身まで見てくれる。
// 	// strictEqualだとアドレスを比較する。
// 	test('正常系 プロジェクトパスだとファイル多すぎるのでbgimageフォルダを指定', () => {
// 		//値定義
// 		const info = InformationWorkSpace.getInstance();
// 		const expect = ['room.jpg', 'rouka.jpg', 'title.jpg'];
// 		assert.deepStrictEqual((info as any).getProjectFiles((info as any).getProjectRootPath() + info.DATA_DIRECTORY + "/bgimage"), expect);
// 	});
// 	test('異常系 不正なパスを与える', () => {
// 		//値定義
// 		const info = InformationWorkSpace.getInstance();
// 		assert.deepStrictEqual((info as any).getProjectFiles("hoge/foo/bar/"), []);
// 	});
//# sourceMappingURL=TyranoDiagnostic.test.js.map