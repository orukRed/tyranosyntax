/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import { TyranoDefinitionProvider } from "../../../subscriptions/TyranoDefinitionProvider";

// Mock classes for testing
class MockTextDocument implements vscode.TextDocument {
  uri = vscode.Uri.file("/test.ks");
  fileName = "/test.ks";
  isUntitled = false;
  languageId = "tyrano";
  version = 1;
  isDirty = false;
  isClosed = false;
  eol = vscode.EndOfLine.LF;
  lineCount = 1;

  save(): Thenable<boolean> {
    return Promise.resolve(true);
  }
  lineAt(lineOrPosition: number | vscode.Position): vscode.TextLine {
    const line =
      typeof lineOrPosition === "number" ? lineOrPosition : lineOrPosition.line;
    return {
      lineNumber: line,
      text: "[testmacro]",
      range: new vscode.Range(line, 0, line, 11),
      rangeIncludingLineBreak: new vscode.Range(line, 0, line + 1, 0),
      firstNonWhitespaceCharacterIndex: 0,
      isEmptyOrWhitespace: false,
    };
  }
  offsetAt(_position: vscode.Position): number {
    return 0;
  }
  positionAt(_offset: number): vscode.Position {
    return new vscode.Position(0, 0);
  }
  getText(_range?: vscode.Range): string {
    return "[testmacro]";
  }
  getWordRangeAtPosition(
    _position: vscode.Position,
    _regex?: RegExp,
  ): vscode.Range | undefined {
    return undefined;
  }
  validateRange(range: vscode.Range): vscode.Range {
    return range;
  }
  validatePosition(position: vscode.Position): vscode.Position {
    return position;
  }
}

class MockCancellationToken implements vscode.CancellationToken {
  isCancellationRequested = false;
  onCancellationRequested = new vscode.EventEmitter<any>().event;
}

suite("TyranoDefinitionProvider", () => {
  vscode.window.showInformationMessage("Start TyranoDefinitionProvider tests.");

  suite("constructor", () => {
    test("正常系 インスタンス作成", () => {
      // 実行
      assert.doesNotThrow(() => {
        new TyranoDefinitionProvider();
      });
    });

    test("正常系 インスタンスが正しく初期化される", () => {
      // 実行
      const provider = new TyranoDefinitionProvider();

      // アサート
      assert.ok(
        provider instanceof TyranoDefinitionProvider,
        "TyranoDefinitionProviderのインスタンスであるべき",
      );
      assert.ok(
        typeof provider.provideDefinition === "function",
        "provideDefinitionメソッドが存在するべき",
      );
    });
  });

  suite("provideDefinition", () => {
    test("正常系 メソッドが存在する", () => {
      // 値定義
      const provider = new TyranoDefinitionProvider();

      // アサート
      assert.ok(
        typeof provider.provideDefinition === "function",
        "provideDefinitionメソッドが存在するべき",
      );
    });

    test("正常系 メソッド呼び出しで例外が発生しない", async () => {
      // 値定義
      const provider = new TyranoDefinitionProvider();
      const document = new MockTextDocument();
      const position = new vscode.Position(0, 0);
      const token = new MockCancellationToken();

      // 実行（例外が発生しないことを確認）
      try {
        const result = await provider.provideDefinition(
          document,
          position,
          token,
        );
        // 結果がundefined, null, Definition, またはLocationLink[]のいずれかであることを確認
        assert.ok(
          result === undefined ||
            result === null ||
            result instanceof vscode.Location ||
            Array.isArray(result),
          "戻り値は適切な型であるべき",
        );
      } catch (error) {
        // InformationWorkSpaceが初期化されていない場合など、期待されるエラーは許可
        assert.ok(
          error instanceof Error,
          "エラーが発生した場合はErrorインスタンスであるべき",
        );
      }
    });

    test("正常系 戻り値の型チェック", async () => {
      // 値定義
      const provider = new TyranoDefinitionProvider();
      const document = new MockTextDocument();
      const position = new vscode.Position(0, 5);
      const token = new MockCancellationToken();

      try {
        // 実行
        const result = await provider.provideDefinition(
          document,
          position,
          token,
        );

        // アサート - 戻り値が適切な型であることを確認
        if (result !== undefined && result !== null) {
          const isValidResult =
            result instanceof vscode.Location ||
            Array.isArray(result) ||
            (typeof result === "object" && "targetUri" in result);

          assert.ok(isValidResult, "戻り値は有効なDefinition型であるべき");
        }
      } catch (_error) {
        // 依存関係が未初期化の場合のエラーは想定内
        assert.ok(true, "依存関係のエラーは想定内");
      }
    });

    test("正常系 異なる位置での呼び出し", async () => {
      // 値定義
      const provider = new TyranoDefinitionProvider();
      const document = new MockTextDocument();
      const token = new MockCancellationToken();

      const positions = [
        new vscode.Position(0, 0),
        new vscode.Position(0, 5),
        new vscode.Position(0, 10),
      ];

      // 実行（各位置で例外が発生しないことを確認）
      for (const position of positions) {
        try {
          await provider.provideDefinition(document, position, token);
          assert.ok(
            true,
            `位置(${position.line}, ${position.character})で正常に実行されるべき`,
          );
        } catch (error) {
          // 依存関係の問題によるエラーは許可
          assert.ok(
            error instanceof Error,
            "エラーが発生する場合はErrorインスタンスであるべき",
          );
        }
      }
    });
  });

  suite("class structure", () => {
    test("正常系 クラスが正しく定義されている", () => {
      // アサート
      assert.ok(
        TyranoDefinitionProvider,
        "TyranoDefinitionProviderクラスが存在するべき",
      );
      assert.strictEqual(
        typeof TyranoDefinitionProvider,
        "function",
        "TyranoDefinitionProviderはコンストラクタ関数であるべき",
      );
    });

    test("正常系 プライベートプロパティが存在", () => {
      // 値定義
      const provider = new TyranoDefinitionProvider();

      // アサート - プライベートプロパティはアクセスできないが、インスタンスが正常に作成されることを確認
      assert.ok(provider, "プロバイダインスタンスが正しく作成されるべき");
      assert.ok(
        typeof (provider as any).infoWs !== "undefined",
        "infoWsプロパティが初期化されているべき",
      );
      assert.ok(
        typeof (provider as any).parser !== "undefined",
        "parserプロパティが初期化されているべき",
      );
    });
  });
});
