import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { InformationProjectData } from '../../InformationProjectData';
// import * as myExtension from '../../extension';
import { ConstantVariables } from '../../ConstantVariables';


suite('ConstantVariables.wordParseRegExp', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('正常系', () => {
		//値定義
		const word = "[jump]";
		const expected = "jump";
		const actual: RegExpExecArray | null = new RegExp(ConstantVariables.variableAndTagParseRegExp).exec(word);
		assert.strictEqual(actual![1], expected);
	});

});
