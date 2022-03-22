import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { CreateTagByShortcutKey } from '../../CreateTagByShortcutKey';
// import * as myExtension from '../../extension';


suite('CreateTagByShortcutKey.KeyPushShiftEnter関数', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('正常系', () => {
		//値定義
		let ctby = new CreateTagByShortcutKey();
		let excepted = true;

		//実行
		let actual = ctby.KeyPushShiftEnter();

		//アサート
		assert.strictEqual(actual, excepted);
	});

});


suite('CreateTagByShortcutKey.KeyPushCtrlEnter関数', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('正常系', () => {
		//値定義
		let ctby = new CreateTagByShortcutKey();
		let excepted = true;

		//実行
		let actual = ctby.KeyPushCtrlEnter();

		//アサート
		assert.strictEqual(actual, excepted);
	});
});


suite('CreateTagByShortcutKey.KeyPushAltEnter関数', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('正常系', () => {
		//値定義
		let ctby = new CreateTagByShortcutKey();
		let excepted = true;

		//実行
		let actual = ctby.KeyPushAltEnter();

		//アサート
		assert.strictEqual(actual, excepted);
	});
});