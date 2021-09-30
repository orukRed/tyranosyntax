import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { TyranoSemanticTokenProvider } from '../../TyranoSemanticTokenProvider';
// import * as myExtension from '../../extension';

class MockTextDocument implements vscode.TextDocument{
	uri!: vscode.Uri;
	fileName!: string;
	isUntitled!: boolean;
	languageId!: string;
	version!: number;
	isDirty!: boolean;
	isClosed!: boolean;
	save(): Thenable<boolean> {
		throw new Error('Method not implemented.');
	}
	eol!: vscode.EndOfLine;
	lineCount!: number;
	lineAt(line: number): vscode.TextLine;
	lineAt(position: vscode.Position): vscode.TextLine;
	lineAt(position: any): vscode.TextLine {
		throw new Error('Method not implemented.');
	}
	offsetAt(position: vscode.Position): number {
		throw new Error('Method not implemented.');
	}
	positionAt(offset: number): vscode.Position {
		throw new Error('Method not implemented.');
	}
	getText(range?: vscode.Range): string {
		throw new Error('Method not implemented.');
	}
	getWordRangeAtPosition(position: vscode.Position, regex?: RegExp): vscode.Range | undefined {
		throw new Error('Method not implemented.');
	}
	validateRange(range: vscode.Range): vscode.Range {
		throw new Error('Method not implemented.');
	}
	validatePosition(position: vscode.Position): vscode.Position {
		throw new Error('Method not implemented.');
	}
}

suite('provideSemanticHighlight関数', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('正常系 v5のタグがハイライトされる', () => {
		//値定義
		let argDocument = new MockTextDocument();	
		const  tstp = new TyranoSemanticTokenProvider();


		//実行・期待値
		;const actual = (tstp as any).provideSemanticHighlight(argDocument);//anyでキャストしてprivate型を通す
		const excepted = Object.defineProperty(new vscode.SemanticTokens(new Uint32Array()), 'build',{
			value:new vscode.SemanticTokens(new Uint32Array()),
			writable:false,
		});

		//アサート
		assert.strictEqual(actual, excepted);
	});

	test('正常系 変数(f.)がハイライトされる', () => {
		//値定義
		let argDocument = new MockTextDocument();	
		const  tstp = new TyranoSemanticTokenProvider();


		//実行・期待値
		;const actual = (tstp as any).provideSemanticHighlight(argDocument);//anyでキャストしてprivate型を通す
		const excepted = Object.defineProperty(new vscode.SemanticTokens(new Uint32Array()), 'build',{
			value:new vscode.SemanticTokens(new Uint32Array()),
			writable:false,
		});

		//アサート
		assert.strictEqual(actual, excepted);
	});

	test('正常系 変数(sf.)がハイライトされる', () => {
		//値定義
		let argDocument = new MockTextDocument();	
		const  tstp = new TyranoSemanticTokenProvider();


		//実行・期待値
		;const actual = (tstp as any).provideSemanticHighlight(argDocument);//anyでキャストしてprivate型を通す
		const excepted = Object.defineProperty(new vscode.SemanticTokens(new Uint32Array()), 'build',{
			value:new vscode.SemanticTokens(new Uint32Array()),
			writable:false,
		});

		//アサート
		assert.strictEqual(actual, excepted);
	});


	test('正常系 変数(tf.)がハイライトされる', () => {
		//値定義
		let argDocument = new MockTextDocument();	
		const  tstp = new TyranoSemanticTokenProvider();


		//実行・期待値
		;const actual = (tstp as any).provideSemanticHighlight(argDocument);//anyでキャストしてprivate型を通す
		const excepted = Object.defineProperty(new vscode.SemanticTokens(new Uint32Array()), 'build',{
			value:new vscode.SemanticTokens(new Uint32Array()),
			writable:false,
		});

		//アサート
		assert.strictEqual(actual, excepted);
	});	

	test('正常系 macroタグ定義がハイライトされる', () => {
		//値定義
		let argDocument = new MockTextDocument();	
		const  tstp = new TyranoSemanticTokenProvider();


		//実行・期待値
		;const actual = (tstp as any).provideSemanticHighlight(argDocument);//anyでキャストしてprivate型を通す
		const excepted = Object.defineProperty(new vscode.SemanticTokens(new Uint32Array()), 'build',{
			value:new vscode.SemanticTokens(new Uint32Array()),
			writable:false,
		});

		//アサート
		assert.strictEqual(actual, excepted);
	});		

	test('異常系 ハイライトされないテキストを送る', () => {
		//値定義
		let argDocument = new MockTextDocument();	
		const  tstp = new TyranoSemanticTokenProvider();


		//実行・期待値
		;const actual = (tstp as any).provideSemanticHighlight(argDocument);//anyでキャストしてprivate型を通す
		const excepted = Object.defineProperty(new vscode.SemanticTokens(new Uint32Array()), 'build',{
			value:new vscode.SemanticTokens(new Uint32Array()),
			writable:false,
		});

		//アサート
		assert.strictEqual(actual, excepted);
	});

});
