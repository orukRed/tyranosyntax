/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { TyranoOutlineProvider } from "../../../subscriptions/TyranoOutlineProvider";

class MockTextDocument implements vscode.TextDocument {
  mockTextLine = new MockTextLine();
  uri!: vscode.Uri; //!で限定代入アサーション null,undefinedでないことをアサート
  fileName!: string;
  isUntitled!: boolean;
  languageId!: string;
  version!: number;
  isDirty!: boolean;
  isClosed!: boolean;
  save(): Thenable<boolean> {
    throw new Error("Method not implemented.");
  }
  eol!: vscode.EndOfLine;
  lineCount = 1;
  lineAt(line: number): vscode.TextLine;
  lineAt(position: vscode.Position): vscode.TextLine;
  lineAt(_position: any): vscode.TextLine {
    return this.mockTextLine;
  }
  offsetAt(_position: vscode.Position): number {
    throw new Error("Method not implemented.");
  }
  positionAt(_offset: number): vscode.Position {
    throw new Error("Method not implemented.");
  }
  getText(_range?: vscode.Range): string {
    return "ここに文字列";
    // throw new Error('Method not implemented.');
  }
  getWordRangeAtPosition(
    _position: vscode.Position,
    _regex?: RegExp,
  ): vscode.Range | undefined {
    throw new Error("Method not implemented.");
  }
  validateRange(_range: vscode.Range): vscode.Range {
    throw new Error("Method not implemented.");
  }
  validatePosition(_position: vscode.Position): vscode.Position {
    throw new Error("Method not implemented.");
  }
}

class MockCancellationToken implements vscode.CancellationToken {
  isCancellationRequested!: boolean;
  onCancellationRequested!: vscode.Event<any>;
}

class MockTextLine implements vscode.TextLine {
  lineNumber!: number;
  text = "1";
  range = new vscode.Range(
    new vscode.Position(0, 0),
    new vscode.Position(this.text.length, this.text.length),
  );
  rangeIncludingLineBreak!: vscode.Range;
  firstNonWhitespaceCharacterIndex!: number;
  isEmptyOrWhitespace!: boolean;
}

suite("TyranoOutlineProvider.provideDocumentSymbols関数", () => {
  vscode.window.showInformationMessage("Start all tests.");
  test("正常系 ifタグ[]", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: '[if exp="true"]',
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 ifタグ@", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: '@if exp="true"',
      writable: false,
    });
    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 elsifタグ[]", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: '[elsif exp="true"]',
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 elsifタグ@", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: '@elsif exp="true"',
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 elseタグ[]", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: "[else]",
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 elseタグ@", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: "@else",
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 endifタグ[]", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: "[endif]",
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 endifタグ@", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: "@endif",
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 ignoreタグ[]", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: '[ignore exp=""]',
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 ignoreタグ@", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: '@ignore exp=""',
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 endignoreタグ[]", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: "[endignore]",
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 endignoreタグ@", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: "@endignore",
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 jumpタグ[]", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: '[jump storage="test.ks"]',
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 jumpタグ@", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: '@jump storage="test.ks"',
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 callタグ[]", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: '[call storage="test.ks"]',
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 callタグ@", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: '@call storage="test.ks"',
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 buttonタグ[]", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: '[button storage="test.ks"]',
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 buttonタグ@", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: '@button storage="test.ks"',
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 linkタグ[]", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: '[link storage="test.ks"]',
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 linkタグ@", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: '@link storage="test.ks"',
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 iscriptタグ[]", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: "[iscript]",
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 iscriptタグ@", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: "@iscript",
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 endscriptタグ[]", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: "[endscript]",
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 endscriptタグ@", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: "@endscript",
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 loadjsタグ[]", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: '[loadjs storage=""]',
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 loadjsタグ@", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: '@loadjs storage=""',
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("正常系 *ラベル", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
    const excepted = Object.defineProperty(document.lineAt(0), "text", {
      value: "*test_label",
      writable: false,
    });

    //実行
    const actual = op.provideDocumentSymbols(
      document,
      token,
    ) as vscode.DocumentSymbol[];

    //アサート
    assert.deepStrictEqual(actual[0].name, excepted.text);
  });

  test("異常系 */で終わるブロックコメントの行", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
  

    //実行
    const actual = op.provideDocumentSymbols(document, token) as vscode.DocumentSymbol[];

    //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
    assert.deepStrictEqual(actual, []);
  });

  test("異常系 /*で終わるブロックコメントの行", () => {
    //値定義
    const document = new MockTextDocument();
    const token = new MockCancellationToken();
    const op = new TyranoOutlineProvider();
  
    //実行
    const actual = op.provideDocumentSymbols(document, token) as vscode.DocumentSymbol[];

    //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
    assert.deepStrictEqual(actual, []);
  });
});

suite("TyranoOutlineProvider.isAddTagOutline関数", () => {
  test("正常系 @endscriptタグが送られてくる", () => {
    //値定義
    const op = new TyranoOutlineProvider();
    const excepted = true;

    //実行
    // (hoge as any)でprivateメソッドにアクセスできる
    const actual = (op as any).isAddTagOutline("@endscript");

    //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
    assert.deepStrictEqual(actual, excepted);
  });

  test("正常系 [endscript]タグが送られてくる", () => {
    //値定義
    const op = new TyranoOutlineProvider();
    const excepted = true;

    //実行
    // (hoge as any)でprivateメソッドにアクセスできる
    const actual = (op as any).isAddTagOutline("@endscript");

    //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
    assert.deepStrictEqual(actual, excepted);
  });

  test('正常系 [jump storage="hoge.ks"]タグが送られてくる', () => {
    //値定義
    const op = new TyranoOutlineProvider();
    const excepted = true;

    //実行
    // (hoge as any)でprivateメソッドにアクセスできる
    const actual = (op as any).isAddTagOutline('[jump storage="hoge.ks"]');

    //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
    assert.deepStrictEqual(actual, excepted);
  });

  test("異常系 @fooタグが送られてくる(package.jsonで定義されていないタグ)", () => {
    //値定義
    const op = new TyranoOutlineProvider();
    const excepted = false;

    //実行
    // (hoge as any)でprivateメソッドにアクセスできる
    const actual = (op as any).isAddTagOutline("@foo");

    //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
    assert.deepStrictEqual(actual, excepted);
  });

  test("異常系 [foo]タグが送られてくる(package.jsonで定義されていないタグ)", () => {
    //値定義
    const op = new TyranoOutlineProvider();
    const excepted = false;

    //実行
    // (hoge as any)でprivateメソッドにアクセスできる
    const actual = (op as any).isAddTagOutline("[foo]");

    //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
    assert.deepStrictEqual(actual, excepted);
  });
});

suite("TyranoOutlineProvider.isAddVariableOutLine関数", () => {
  test("正常系 f.hoge1", () => {
    //値定義
    const op = new TyranoOutlineProvider();
    const excepted = true;

    //実行
    const actual = (op as any).isAddVariableOutLine("f.hoge1");

    assert.deepStrictEqual(actual, excepted);
  });

  test("正常系 sf.hoge1", () => {
    //値定義
    const op = new TyranoOutlineProvider();
    const excepted = true;

    //実行
    // (hoge as any)でprivateメソッドにアクセスできる
    const actual = (op as any).isAddVariableOutLine("sf.hoge1");

    //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
    assert.deepStrictEqual(actual, excepted);
  });

  test("正常系 tf.hoge1", () => {
    //値定義
    const op = new TyranoOutlineProvider();
    const excepted = true;

    //実行
    // (hoge as any)でprivateメソッドにアクセスできる
    const actual = (op as any).isAddVariableOutLine("tf.hoge1");

    //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
    assert.deepStrictEqual(actual, excepted);
  });

  test("異常系 .hoge1", () => {
    //値定義
    const op = new TyranoOutlineProvider();
    const excepted = false;

    //実行
    // (hoge as any)でprivateメソッドにアクセスできる
    const actual = (op as any).isAddVariableOutLine(".hoge1");

    //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
    assert.deepStrictEqual(actual, excepted);
  });

  test("正常系 [emb exp=f.1aaaa=1]", () => {
    //値定義
    const op = new TyranoOutlineProvider();
    const excepted = true;

    //実行
    // (hoge as any)でprivateメソッドにアクセスできる
    const actual = (op as any).isAddVariableOutLine("[emb exp=f.aaaa12345=1 ]");

    //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
    assert.deepStrictEqual(actual, excepted);
  });
});

suite("TyranoOutlineProvider.isAddLabelOutLine関数", () => {
  test("正常系 *hoge", () => {
    //値定義
    const op = new TyranoOutlineProvider();
    const excepted = true;

    //実行
    const actual = (op as any).isAddLabelOutLine("*hoge");

    assert.deepStrictEqual(actual, excepted);
  });

  test("正常系 *hoge-hoge", () => {
    //値定義
    const op = new TyranoOutlineProvider();
    const excepted = true;

    //実行
    const actual = (op as any).isAddLabelOutLine("*hoge-hoge");

    assert.deepStrictEqual(actual, excepted);
  });

  test("正常系 *hoge_hoge", () => {
    //値定義
    const op = new TyranoOutlineProvider();
    const excepted = true;

    //実行
    const actual = (op as any).isAddLabelOutLine("*hoge_hoge");

    assert.deepStrictEqual(actual, excepted);
  });

  test("異常系 */", () => {
    //値定義
    const op = new TyranoOutlineProvider();
    const excepted = false;

    //実行
    const actual = (op as any).isAddLabelOutLine("*/");

    assert.deepStrictEqual(actual, excepted);
  });
});

