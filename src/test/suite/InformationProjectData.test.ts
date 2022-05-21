import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { InformationProjectData } from '../../InformationProjectData';
// import * as myExtension from '../../extension';


suite('InformationProjectData.getDefaultTag', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('正常系', () => {
		//値定義
		const info = InformationProjectData.getInstance();

		info.getDefaultTag();
		assert.deepStrictEqual((info as any).getDefaultTag(), info.getDefaultTag());
	});

});
