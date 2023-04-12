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