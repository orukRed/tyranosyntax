import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { InformationWorkSpace } from '../../InformationWorkSpace';
// import * as myExtension from '../../extension';


suite('InformationWorkSpace.getProjectRootPath', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('正常系', () => {
		//値定義
		const info = InformationWorkSpace.getInstance();

		// assert.strictEqual((info as any).getWorkspaceRootPath(), "");//絶対パス取得するのでgithubにあげられない。
	});

});

suite('InformationWorkSpace.getProjectFiles', () => {
	vscode.window.showInformationMessage('Start all tests.');
	// 配列はdeepStrictEqualを使うこと。配列を再帰的に中身まで見てくれる。
	// strictEqualだとアドレスを比較する。
	test('正常系 プロジェクトパスだとファイル多すぎるのでbgimageフォルダを指定', () => {
		//値定義
		const info = InformationWorkSpace.getInstance();

		const expect = ["bgimage/room.jpg", "bgimage/rouka.jpg", "bgimage/title.jpg", "bgm/music.ogg", "image/config/bg_config.jpg"];

		assert.deepStrictEqual((info as any).getProjectFiles((info as any).getProjectRootPath() + info.DATA_DIRECTORY, [".jpg", ".ogg"], false), expect);
	});

	test('異常系 不正なパスを与える', () => {
		//値定義
		const info = InformationWorkSpace.getInstance();
		assert.deepStrictEqual((info as any).getProjectFiles("hoge/foo/bar/"), []);
	});

	test('異常系 パスでない文字列を与える', () => {
		//値定義
		const info = InformationWorkSpace.getInstance();
		assert.deepStrictEqual((info as any).getProjectFiles("hoge"), []);
	});

	test('異常系 undefinedを与える', () => {
		//値定義
		const info = InformationWorkSpace.getInstance();
		assert.deepStrictEqual((info as any).getProjectFiles(undefined), []);
	});

	test('異常系 空文字を与える', () => {
		//値定義
		const info = InformationWorkSpace.getInstance();
		assert.deepStrictEqual((info as any).getProjectFiles(""), []);
	});


});