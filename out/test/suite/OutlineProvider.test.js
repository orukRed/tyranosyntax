"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require("vscode");
const OutlineProvider_1 = require("../../OutlineProvider");
// import * as myExtension from '../../extension';
class MockTextDocument {
    constructor() {
        this.mockTextLine = new MockTextLine();
        this.lineCount = 1;
    }
    save() {
        throw new Error('Method not implemented.');
    }
    lineAt(position) {
        return this.mockTextLine;
    }
    offsetAt(position) {
        throw new Error('Method not implemented.');
    }
    positionAt(offset) {
        throw new Error('Method not implemented.');
    }
    getText(range) {
        return "ここに文字列";
        // throw new Error('Method not implemented.');
    }
    getWordRangeAtPosition(position, regex) {
        throw new Error('Method not implemented.');
    }
    validateRange(range) {
        throw new Error('Method not implemented.');
    }
    validatePosition(position) {
        throw new Error('Method not implemented.');
    }
}
class MockCancellationToken {
}
class MockTextLine {
    constructor() {
        this.text = "1";
        this.range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(this.text.length, this.text.length));
    }
}
suite('OutlineProvider.provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系 ifタグ[]', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "[if exp=\"true\"]",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 ifタグ@', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "@if exp=\"true\"",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 elsifタグ[]', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "[elsif exp=\"true\"]",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 elsifタグ@', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "@elsif exp=\"true\"",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 elseタグ[]', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "[else]",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 elseタグ@', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "@else",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 endifタグ[]', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "[endif]",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 endifタグ@', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "@endif",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 ignoreタグ[]', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "[ignore exp=\"\"]",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 ignoreタグ@', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "@ignore exp=\"\"",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 endignoreタグ[]', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "[endignore]",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 endignoreタグ@', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "@endignore",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 jumpタグ[]', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "[jump storage=\"test.ks\"]",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 jumpタグ@', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "@jump storage=\"test.ks\"",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 callタグ[]', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "[call storage=\"test.ks\"]",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 callタグ@', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "@call storage=\"test.ks\"",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 buttonタグ[]', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "[button storage=\"test.ks\"]",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 buttonタグ@', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "@button storage=\"test.ks\"",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 linkタグ[]', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "[link storage=\"test.ks\"]",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 linkタグ@', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "@link storage=\"test.ks\"",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 sタグ[]', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "[s]",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 sタグ@', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "@s",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 iscriptタグ[]', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "[iscript]",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 iscriptタグ@', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "@iscript",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 endscriptタグ[]', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "[endscript]",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 endscriptタグ@', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "@endscript",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 loadjsタグ[]', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "[loadjs storage=\"\"]",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 loadjsタグ@', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "@loadjs storage=\"\"",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('正常系 *ラベル', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "*test_label",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート
        assert.strictEqual(actual[0].name, excepted.text);
    });
    test('異常系 */で終わるブロックコメントの行', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "\*\/",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, []);
    });
    test('異常系 /*で終わるブロックコメントの行', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "/*",
            writable: false,
        });
        //実行
        let actual = op.provideDocumentSymbols(document, token);
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, []);
    });
});
suite('OutlineProvider.isAddTagOutline関数', () => {
    test('正常系 @endscriptタグが送られてくる', () => {
        //値定義
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = true;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddTagOutline("@endscript");
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
    test('正常系 [endscript]タグが送られてくる', () => {
        //値定義
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = true;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddTagOutline("@endscript");
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
    test('正常系 [jump storage="hoge.ks"]タグが送られてくる', () => {
        //値定義
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = true;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddTagOutline('[jump storage="hoge.ks"]');
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
    test('異常系 @fooタグが送られてくる(package.jsonで定義されていないタグ)', () => {
        //値定義
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = false;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddTagOutline("@foo");
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
    test('異常系 [foo]タグが送られてくる(package.jsonで定義されていないタグ)', () => {
        //値定義
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = false;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddTagOutline("[foo]");
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
});
suite('OutlineProvider.isAddVariableOutLine関数', () => {
    test('正常系 f.hoge1', () => {
        //値定義
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = true;
        //実行
        let actual = op.isAddVariableOutLine("f.hoge1");
        assert.deepStrictEqual(actual, excepted);
    });
    test('正常系 sf.hoge1', () => {
        //値定義
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = true;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddVariableOutLine("sf.hoge1");
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
    test('正常系 tf.hoge1', () => {
        //値定義
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = true;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddVariableOutLine("tf.hoge1");
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
    test('異常系 .hoge1', () => {
        //値定義
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = false;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddVariableOutLine(".hoge1");
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
    test('正常系 [emb exp=f.1aaaa=1]', () => {
        //値定義
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = true;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddVariableOutLine('[emb exp=f.aaaa12345=1 ]');
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
});
suite('OutlineProvider.isAddLabelOutLine関数', () => {
    test('正常系 *hoge', () => {
        //値定義
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = true;
        //実行
        let actual = op.isAddLabelOutLine('*hoge');
        assert.deepStrictEqual(actual, excepted);
    });
    test('正常系 *hoge-hoge', () => {
        //値定義
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = true;
        //実行
        let actual = op.isAddLabelOutLine('*hoge-hoge');
        assert.deepStrictEqual(actual, excepted);
    });
    test('正常系 *hoge_hoge', () => {
        //値定義
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = true;
        //実行
        let actual = op.isAddLabelOutLine('*hoge_hoge');
        assert.deepStrictEqual(actual, excepted);
    });
    test('異常系 */', () => {
        //値定義
        const op = new OutlineProvider_1.OutlineProvider();
        const excepted = false;
        //実行
        let actual = op.isAddLabelOutLine('*/');
        assert.deepStrictEqual(actual, excepted);
    });
});
//# sourceMappingURL=OutlineProvider.test.js.map