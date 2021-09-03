import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { TagHoverProvider } from '../../TagHoverProvider';
// import * as myExtension from '../../extension';


suite('provideHover関数', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('正常系', () => {
		//値定義
		const thp = new TagHoverProvider();

		// const excepted = Object.defineProperty(document.lineAt(0), 'text',{
		// 	value:"@elsif exp=\"true\"",
		// 	writable:false,
		// });	

		//実行・期待値
		// let actual = yjp.provideDocumentSymbols(document,token)!;

		//アサート
		// assert.strictEqual(actual[0].name, excepted.text);
	});

});

suite('createMarkdownText関数', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('正常系', () => {

	});

});