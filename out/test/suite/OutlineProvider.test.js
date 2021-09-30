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
suite('provideDocumentSymbols関数', () => {
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
suite('provideDocumentSymbols関数', () => {
    vscode.window.showInformationMessage('Start all tests.');
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
});
//# sourceMappingURL=OutlineProvider.test.js.map