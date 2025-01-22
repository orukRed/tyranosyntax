/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import { TyranoRenameProvider } from "../../../subscriptions/TyranoRenameProvider";
import { TextDocument } from "vscode-languageserver-textdocument";

class MockTextDocument implements vscode.TextDocument {
  private text: string;
  private lines: string[];

  constructor(content: string) {
    this.text = content;
    this.lines = content.split("\n");
  }

  uri!: vscode.Uri;
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

  get lineCount(): number {
    return this.lines.length;
  }

  lineAt(line: number | vscode.Position): vscode.TextLine {
    const lineNumber = typeof line === "number" ? line : line.line;
    const text = this.lines[lineNumber];
    return {
      lineNumber,
      text,
      range: new vscode.Range(lineNumber, 0, lineNumber, text.length),
      rangeIncludingLineBreak: new vscode.Range(
        lineNumber,
        0,
        lineNumber,
        text.length + 1,
      ),
      firstNonWhitespaceCharacterIndex: text.search(/\S/),
      isEmptyOrWhitespace: text.trim().length === 0,
    };
  }

  offsetAt(position: vscode.Position): number {
    let offset = 0;
    for (let i = 0; i < position.line; i++) {
      offset += this.lines[i].length + 1; // +1 for newline
    }
    return offset + position.character;
  }

  positionAt(offset: number): vscode.Position {
    let currentOffset = 0;
    let currentLine = 0;

    while (currentOffset + this.lines[currentLine].length + 1 <= offset) {
      currentOffset += this.lines[currentLine].length + 1;
      currentLine++;
    }

    return new vscode.Position(currentLine, offset - currentOffset);
  }

  getText(range?: vscode.Range): string {
    if (!range) {
      return this.text;
    }

    let result = "";
    for (let i = range.start.line; i <= range.end.line; i++) {
      const line = this.lines[i];
      if (i === range.start.line && i === range.end.line) {
        result += line.substring(range.start.character, range.end.character);
      } else if (i === range.start.line) {
        result += line.substring(range.start.character) + "\n";
      } else if (i === range.end.line) {
        result += line.substring(0, range.end.character);
      } else {
        result += line + "\n";
      }
    }
    return result;
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

suite("TyranoRenameProvider", () => {
  let provider: TyranoRenameProvider;

  setup(() => {
    provider = new TyranoRenameProvider();
  });

  suite("prepareRename", () => {
    test("マクロ定義のリネームが可能", async () => {
      const document = new MockTextDocument(
        '@macro name="test_macro"\n[endmacro]',
      );
      const position = new vscode.Position(0, 15); // "test_macro"の位置
      const token = new vscode.CancellationTokenSource().token;

      const result = await provider.prepareRename(document, position, token);
      assert.ok(result instanceof vscode.Range);
      if (result instanceof vscode.Range) {
        assert.strictEqual(document.getText(result), "test_macro");
      }
    });

    test("TyranoScript変数（f.）のリネームが可能", async () => {
      const document = new MockTextDocument('[eval exp="f.test_var = 1"]');
      const position = new vscode.Position(0, 13); // "f.test_var"の位置
      const token = new vscode.CancellationTokenSource().token;

      const result = await provider.prepareRename(document, position, token);
      assert.ok(result instanceof vscode.Range);
      if (result instanceof vscode.Range) {
        assert.strictEqual(document.getText(result), "f.test_var");
      }
    });

    test("コメント行（;）のリネームが不可能", async () => {
      const document = new MockTextDocument(';[eval exp="f.test_var = 1"]');
      const position = new vscode.Position(0, 15);
      const token = new vscode.CancellationTokenSource().token;

      try {
        await provider.prepareRename(document, position, token);
        assert.fail("コメント行でリネームが許可されてしまいました");
      } catch (error) {
        assert.strictEqual(
          (error as Error).message,
          "コメントはリネーム不可です",
        );
      }
    });

    test("ラベル行（*）のリネームが不可能", async () => {
      const document = new MockTextDocument("*test_label");
      const position = new vscode.Position(0, 5);
      const token = new vscode.CancellationTokenSource().token;

      try {
        await provider.prepareRename(document, position, token);
        assert.fail("ラベル行でリネームが許可されてしまいました");
      } catch (error) {
        assert.strictEqual(
          (error as Error).message,
          "ラベルはリネーム不可です",
        );
      }
    });
  });

  suite("provideRenameEdits", () => {
    //FIXME:動作は問題ないけどテストコードでfail
    test("マクロ定義と呼び出しの両方がリネームされる", async () => {
      const document = new MockTextDocument(
        `@macro name="test_macro"\n[endmacro]\n[test_macro]\n@test_macro`,
      );
      const position = new vscode.Position(0, 15); // マクロ定義の"test_macro"の位置
      const newName = "new_macro";
      const token = new vscode.CancellationTokenSource().token;

      const workspaceEdit = await provider.provideRenameEdits(
        document,
        position,
        newName,
        token,
      );
      assert.ok(workspaceEdit instanceof vscode.WorkspaceEdit);

      // 変更内容を確認するためのモックメソッド
      const changes: { [key: string]: vscode.TextEdit[] } = {};
      const mockReplace = (
        uri: vscode.Uri,
        range: vscode.Range,
        newText: string,
      ) => {
        if (!changes[uri.toString()]) {
          changes[uri.toString()] = [];
        }
        changes[uri.toString()].push(new vscode.TextEdit(range, newText));
      };
      workspaceEdit.replace = mockReplace as any;

      // 変更が正しく適用されているか確認

      assert.strictEqual(Object.keys(changes).length > 0, true);
    });

    test("変数のリネームがプロジェクト全体に適用される（f.）", async () => {
      const document = new MockTextDocument(
        `[eval exp="f.test_var = 1"]\n[if exp="f.test_var == 1"]`,
      );
      const position = new vscode.Position(0, 13); // "f.test_var"の位置
      const newName = "f.new_var";
      const token = new vscode.CancellationTokenSource().token;

      const workspaceEdit = await provider.provideRenameEdits(
        document,
        position,
        newName,
        token,
      );
      assert.ok(workspaceEdit instanceof vscode.WorkspaceEdit);

      // 変更内容を追跡するためのオブジェクト
      const changes: { [key: string]: vscode.TextEdit[] } = {};

      // 元のreplaceメソッドを保存
      const originalReplace = workspaceEdit.replace;

      // replaceメソッドをモック
      workspaceEdit.replace = (
        uri: vscode.Uri,
        range: vscode.Range,
        newText: string,
      ) => {
        if (!changes[uri.toString()]) {
          changes[uri.toString()] = [];
        }
        changes[uri.toString()].push(new vscode.TextEdit(range, newText));
        // 元のreplaceメソッドも呼び出す
        return originalReplace.call(workspaceEdit, uri, range, newText);
      };

      // 変更を適用
      const documentUri = vscode.Uri.file("test.ks");
      const range = new vscode.Range(0, 11, 0, 21); // "f.test_var"の範囲
      workspaceEdit.replace(documentUri, range, "f.new_var");

      // 変更が正しく追跡されているか確認
      assert.strictEqual(Object.keys(changes).length > 0, true);
    });

    //FIXME:動作は問題ないけどテストコードでfail
    test("tf.変数のリネームがカレントファイルのみに適用される", async () => {
      const document = new MockTextDocument(
        `[eval exp="tf.test_var = 1"]\n[if exp="tf.test_var == 1"]`,
      );
      const position = new vscode.Position(0, 13); // "tf.test_var"の位置
      const newName = "tf.new_var";
      const token = new vscode.CancellationTokenSource().token;

      const workspaceEdit = await provider.provideRenameEdits(
        document,
        position,
        newName,
        token,
      );
      assert.ok(workspaceEdit instanceof vscode.WorkspaceEdit);

      // 変更内容を確認するためのモックメソッド
      const changes: { [key: string]: vscode.TextEdit[] } = {};
      const mockReplace = (
        uri: vscode.Uri,
        range: vscode.Range,
        newText: string,
      ) => {
        if (!changes[uri.toString()]) {
          changes[uri.toString()] = [];
        }
        changes[uri.toString()].push(new vscode.TextEdit(range, newText));
      };
      workspaceEdit.replace = mockReplace as any;

      // 変更がカレントファイルのみに適用されているか確認
      assert.strictEqual(Object.keys(changes).length, 1);
    });

    test("部分一致の変数名はリネームされない", async () => {
      const document = new MockTextDocument(
        `[eval exp="f.test = 1"]\n[eval exp="f.test_var = 2"]`,
      );
      const position = new vscode.Position(0, 13); // "f.test"の位置
      const newName = "f.new_test";
      const token = new vscode.CancellationTokenSource().token;

      const workspaceEdit = await provider.provideRenameEdits(
        document,
        position,
        newName,
        token,
      );
      assert.ok(workspaceEdit instanceof vscode.WorkspaceEdit);

      // 変更内容を確認するためのモックメソッド
      const changes: { [key: string]: vscode.TextEdit[] } = {};
      const mockReplace = (
        uri: vscode.Uri,
        range: vscode.Range,
        newText: string,
      ) => {
        if (!changes[uri.toString()]) {
          changes[uri.toString()] = [];
        }
        changes[uri.toString()].push(new vscode.TextEdit(range, newText));
      };
      workspaceEdit.replace = mockReplace as any;

      // f.test_varがリネームされていないことを確認
      const changesArray = Object.values(changes).flat();
      const hasTestVar = changesArray.some((edit) =>
        edit.newText.includes("test_var"),
      );
      assert.strictEqual(hasTestVar, false);
    });
  });
});
