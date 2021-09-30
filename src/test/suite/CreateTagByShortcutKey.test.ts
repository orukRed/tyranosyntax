import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { CreateTagByShortcutKey } from '../../CreateTagByShortcutKey';
// import * as myExtension from '../../extension';


suite('KeyPushShiftEnter関数', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('正常系', () => {
		let ctby = new CreateTagByShortcutKey();
		ctby.KeyPushShiftEnter();
	});

});


suite('KeyPushCtrlEnter関数', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('正常系', () => {
		let ctby = new CreateTagByShortcutKey();
		ctby.KeyPushCtrlEnter();
	});
});


suite('KeyPushAltEnter関数', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('正常系', () => {
		let ctby = new CreateTagByShortcutKey();
		ctby.KeyPushAltEnter();
	});
});