import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { OutlineProvider } from '../../OutlineProvider';
// import * as myExtension from '../../extension';

class MockTextDocument implements vscode.TextDocument{
	mockTextLine = new MockTextLine();
	uri!: vscode.Uri; //!で限定代入アサーション null,undefinedでないことをアサート
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
	lineCount = 1;
	lineAt(line: number): vscode.TextLine;
	lineAt(position: vscode.Position): vscode.TextLine;
	lineAt(position: any): vscode.TextLine {
		return this.mockTextLine;
	}
	offsetAt(position: vscode.Position): number {
		throw new Error('Method not implemented.');
	}
	positionAt(offset: number): vscode.Position {
		throw new Error('Method not implemented.');
	}
	getText(range?: vscode.Range): string {
		return "ここに文字列";
		// throw new Error('Method not implemented.');
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

class MockCancellationToken implements vscode.CancellationToken{
	isCancellationRequested!: boolean;
	onCancellationRequested!: vscode.Event<any>;
	
}

class MockTextLine implements vscode.TextLine{
	lineNumber!: number;
	text="1";
	range = new vscode.Range(new vscode.Position(0,0), new vscode.Position(this.text.length, this.text.length));
	rangeIncludingLineBreak!: vscode.Range;
	firstNonWhitespaceCharacterIndex!: number;
	isEmptyOrWhitespace!: boolean;
}


suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 ifタグ[]', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"[if exp=\"true\"]",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 ifタグ@', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"@if exp=\"true\"",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 elsifタグ[]', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"[elsif exp=\"true\"]",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 elsifタグ@', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"@elsif exp=\"true\"",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});


suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 elseタグ[]', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"[else]",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 elseタグ@', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"@else",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});


suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 endifタグ[]', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"[endif]",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 endifタグ@', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"@endif",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 ignoreタグ[]', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"[ignore exp=\"\"]",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 ignoreタグ@', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"@ignore exp=\"\"",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 endignoreタグ[]', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"[endignore]",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 endignoreタグ@', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"@endignore",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 jumpタグ[]', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"[jump storage=\"test.ks\"]",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 jumpタグ@', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"@jump storage=\"test.ks\"",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 callタグ[]', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"[call storage=\"test.ks\"]",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 callタグ@', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"@call storage=\"test.ks\"",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});


suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 buttonタグ[]', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"[button storage=\"test.ks\"]",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 buttonタグ@', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"@button storage=\"test.ks\"",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});


suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 linkタグ[]', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"[link storage=\"test.ks\"]",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 linkタグ@', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"@link storage=\"test.ks\"",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});



suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 sタグ[]', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"[s]",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 sタグ@', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"@s",
			writable:false,
		});

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});


suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 iscriptタグ[]', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"[iscript]",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 iscriptタグ@', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"@iscript",
			writable:false,
		});

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});


suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 endscriptタグ[]', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"[endscript]",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 endscriptタグ@', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"@endscript",
			writable:false,
		});

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});


suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 loadjsタグ[]', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"[loadjs storage=\"\"]",
			writable:false,
		});		

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});

suite('provideDocumentSymbols関数', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('正常系 loadjsタグ@', () => {
		//値定義
		const document = new MockTextDocument();
		const token = new MockCancellationToken();
		const op = new OutlineProvider();
		const excepted = Object.defineProperty(document.lineAt(0), 'text',{
			value:"@loadjs storage=\"\"",
			writable:false,
		});

		//実行
		let actual = op.provideDocumentSymbols(document,token)!;

		//アサート
		assert.strictEqual(actual[0].name, excepted.text);
	});
});