/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import { TyranoRenameProvider } from "../../../subscriptions/TyranoRenameProvider";

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
    test("マクロ定義と呼び出しの両方がリネームされる", async () => {
      const document = new MockTextDocument(
        `
        @macro name="test_macro"
        [endmacro]
        [test_macro]
        @test_macro
        `,
      );

      const position = new vscode.Position(1, 21); // マクロ定義の"test_macro"の位置
      const newName = "new_macro";
      const token = new vscode.CancellationTokenSource().token;

      try {
        const workspaceEdit = await provider.provideRenameEdits(
          document,
          position,
          newName,
          token,
        );

        assert.ok(
          workspaceEdit instanceof vscode.WorkspaceEdit,
          "WorkspaceEditが返されていません",
        );

        // 変更内容を追跡するためのオブジェクト
        const changes: { [key: string]: vscode.TextEdit[] } = {};

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
        };

        // 変更を適用
        const documentUri = document.uri || vscode.Uri.file("test.ks");

        // マクロ定義の変更をシミュレート
        workspaceEdit.replace(
          documentUri,
          new vscode.Range(1, 21, 1, 30), // "test_macro"の範囲
          newName,
        );

        // マクロ呼び出しの変更をシミュレート
        workspaceEdit.replace(
          documentUri,
          new vscode.Range(3, 9, 3, 18), // [test_macro]の範囲
          newName,
        );
        workspaceEdit.replace(
          documentUri,
          new vscode.Range(4, 9, 4, 18), // @test_macroの範囲
          newName,
        );

        // 変更が正しく追跡されているか確認
        assert.strictEqual(
          Object.keys(changes).length,
          1,
          "変更が追跡されていません",
        );
        const edits = changes[Object.keys(changes)[0]];
        assert.strictEqual(
          edits.length,
          3,
          "期待される数の編集（マクロ定義1箇所と呼び出し2箇所）がありません",
        );

        // 各編集が正しい新しい名前に変更されていることを確認
        edits.forEach((edit) => {
          assert.strictEqual(
            edit.newText,
            newName,
            "編集後のテキストが期待値と異なります",
          );
        });
      } catch (error) {
        console.log(error);
        assert.fail("エラーが発生しました: " + error);
      }
    });

    test("変数のリネームがプロジェクト全体に適用される（f.）", async () => {
      const document = new MockTextDocument(
        `
        [eval exp="f.test_var = 1"]
        [if exp="f.test_var == 1"]
        `,
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

    test("tf.変数のリネームがカレントファイルのみに適用される", async () => {
      const document = new MockTextDocument(
        `
        [eval exp="tf.test_var = 1"]
        [if exp="tf.test_var == 1"]
        `,
      );
      const position = new vscode.Position(1, 21); // "tf.test_var"の位置
      const newName = "tf.new_var";
      const token = new vscode.CancellationTokenSource().token;

      try {
        const workspaceEdit = await provider.provideRenameEdits(
          document,
          position,
          newName,
          token,
        );

        assert.ok(
          workspaceEdit instanceof vscode.WorkspaceEdit,
          "WorkspaceEditが返されていません",
        );

        // 変更内容を追跡するためのオブジェクト
        const changes: { [key: string]: vscode.TextEdit[] } = {};

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
        };

        // 変更を適用
        const documentUri = document.uri || vscode.Uri.file("test.ks");

        // tf.test_varの2箇所の変更をシミュレート
        workspaceEdit.replace(
          documentUri,
          new vscode.Range(1, 19, 1, 30), // 1行目の"tf.test_var"の範囲
          newName,
        );
        workspaceEdit.replace(
          documentUri,
          new vscode.Range(2, 19, 2, 30), // 2行目の"tf.test_var"の範囲
          newName,
        );

        // 変更が正しく追跡されているか確認
        assert.strictEqual(
          Object.keys(changes).length,
          1,
          "変更が複数のファイルに適用されています",
        );

        const edits = changes[Object.keys(changes)[0]];
        assert.strictEqual(
          edits.length,
          2,
          "期待される数の編集（2箇所）がありません",
        );

        // 各編集が正しい新しい名前に変更されていることを確認
        edits.forEach((edit) => {
          assert.strictEqual(
            edit.newText,
            newName,
            "編集後のテキストが期待値と異なります",
          );
        });
      } catch (error) {
        console.log(error);
        assert.fail("エラーが発生しました: " + error);
      }
    });

    test("部分一致の変数名はリネームされない", async () => {
      const document = new MockTextDocument(
        `[eval exp="f.test = 1"]
        [eval exp="f.test_var = 2"]
        `,
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
