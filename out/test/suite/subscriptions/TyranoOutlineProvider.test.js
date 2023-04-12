"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = __importStar(require("vscode"));
const TyranoOutlineProvider_1 = require("../../../subscriptions/TyranoOutlineProvider");
// import * as myExtension from '../../extension';
class MockTextDocument {
    mockTextLine = new MockTextLine();
    uri; //!で限定代入アサーション null,undefinedでないことをアサート
    fileName;
    isUntitled;
    languageId;
    version;
    isDirty;
    isClosed;
    save() {
        throw new Error('Method not implemented.');
    }
    eol;
    lineCount = 1;
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
    isCancellationRequested;
    onCancellationRequested;
}
class MockTextLine {
    lineNumber;
    text = "1";
    range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(this.text.length, this.text.length));
    rangeIncludingLineBreak;
    firstNonWhitespaceCharacterIndex;
    isEmptyOrWhitespace;
}
suite('TyranoOutlineProvider.provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('正常系 ifタグ[]', () => {
        //値定義
        const document = new MockTextDocument();
        const token = new MockCancellationToken();
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
        const excepted = Object.defineProperty(document.lineAt(0), 'text', {
            value: "@link storage=\"test.ks\"",
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
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
suite('TyranoOutlineProvider.isAddTagOutline関数', () => {
    test('正常系 @endscriptタグが送られてくる', () => {
        //値定義
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
        const excepted = true;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddTagOutline("@endscript");
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
    test('正常系 [endscript]タグが送られてくる', () => {
        //値定義
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
        const excepted = true;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddTagOutline("@endscript");
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
    test('正常系 [jump storage="hoge.ks"]タグが送られてくる', () => {
        //値定義
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
        const excepted = true;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddTagOutline('[jump storage="hoge.ks"]');
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
    test('異常系 @fooタグが送られてくる(package.jsonで定義されていないタグ)', () => {
        //値定義
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
        const excepted = false;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddTagOutline("@foo");
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
    test('異常系 [foo]タグが送られてくる(package.jsonで定義されていないタグ)', () => {
        //値定義
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
        const excepted = false;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddTagOutline("[foo]");
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
});
suite('TyranoOutlineProvider.isAddVariableOutLine関数', () => {
    test('正常系 f.hoge1', () => {
        //値定義
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
        const excepted = true;
        //実行
        let actual = op.isAddVariableOutLine("f.hoge1");
        assert.deepStrictEqual(actual, excepted);
    });
    test('正常系 sf.hoge1', () => {
        //値定義
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
        const excepted = true;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddVariableOutLine("sf.hoge1");
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
    test('正常系 tf.hoge1', () => {
        //値定義
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
        const excepted = true;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddVariableOutLine("tf.hoge1");
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
    test('異常系 .hoge1', () => {
        //値定義
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
        const excepted = false;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddVariableOutLine(".hoge1");
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
    test('正常系 [emb exp=f.1aaaa=1]', () => {
        //値定義
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
        const excepted = true;
        //実行
        // (hoge as any)でprivateメソッドにアクセスできる
        let actual = op.isAddVariableOutLine('[emb exp=f.aaaa12345=1 ]');
        //アサート deepがあると、値のみの検査 deepがないと、同じオブジェクト参照であるかどうかの精査を行う
        assert.deepStrictEqual(actual, excepted);
    });
});
suite('TyranoOutlineProvider.isAddLabelOutLine関数', () => {
    test('正常系 *hoge', () => {
        //値定義
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
        const excepted = true;
        //実行
        let actual = op.isAddLabelOutLine('*hoge');
        assert.deepStrictEqual(actual, excepted);
    });
    test('正常系 *hoge-hoge', () => {
        //値定義
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
        const excepted = true;
        //実行
        let actual = op.isAddLabelOutLine('*hoge-hoge');
        assert.deepStrictEqual(actual, excepted);
    });
    test('正常系 *hoge_hoge', () => {
        //値定義
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
        const excepted = true;
        //実行
        let actual = op.isAddLabelOutLine('*hoge_hoge');
        assert.deepStrictEqual(actual, excepted);
    });
    test('異常系 */', () => {
        //値定義
        const op = new TyranoOutlineProvider_1.TyranoOutlineProvider();
        const excepted = false;
        //実行
        let actual = op.isAddLabelOutLine('*/');
        assert.deepStrictEqual(actual, excepted);
    });
});
//# sourceMappingURL=TyranoOutlineProvider.test.js.map