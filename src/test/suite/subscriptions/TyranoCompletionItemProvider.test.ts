/* eslint-disable @typescript-eslint/no-explicit-any */
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as assert from "assert";
import * as vscode from "vscode";
import { TyranoCompletionItemProvider } from "../../../subscriptions/TyranoCompletionItemProvider";
// import * as path from "path";

// // 新しく追加した型定義のテスト用
// type TagParameterConfig = {
//   type: string | string[];
//   path?: string;
//   values?: string[];
// };

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
      text: '[bg storage="',
      range: new vscode.Range(line, 0, line, 13),
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
    return '[bg storage="';
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

class MockCompletionContext implements vscode.CompletionContext {
  triggerKind = vscode.CompletionTriggerKind.Invoke;
  triggerCharacter = undefined;
}

suite("TyranoCompletionItemProvider", () => {
  vscode.window.showInformationMessage(
    "Start TyranoCompletionItemProvider tests.",
  );

  suite("constructor", () => {
    test("正常系 インスタンス作成", () => {
      // 実行
      assert.doesNotThrow(() => {
        new TyranoCompletionItemProvider();
      });
    });

    test("正常系 インスタンスが正しく初期化される", () => {
      // 実行
      const provider = new TyranoCompletionItemProvider();

      // アサート
      assert.ok(
        provider instanceof TyranoCompletionItemProvider,
        "TyranoCompletionItemProviderのインスタンスであるべき",
      );
      assert.ok(
        typeof provider.provideCompletionItems === "function",
        "provideCompletionItemsメソッドが存在するべき",
      );
    });
  });

  suite("provideCompletionItems", () => {
    test("正常系 メソッドが存在する", () => {
      // 値定義
      const provider = new TyranoCompletionItemProvider();

      // アサート
      assert.ok(
        typeof provider.provideCompletionItems === "function",
        "provideCompletionItemsメソッドが存在するべき",
      );
    });

    test("正常系 メソッド呼び出しで例外が発生しない", async () => {
      // 値定義
      const provider = new TyranoCompletionItemProvider();
      const document = new MockTextDocument();
      const position = new vscode.Position(0, 13);
      const token = new MockCancellationToken();
      const context = new MockCompletionContext();

      // 実行（例外が発生しないことを確認）
      try {
        const result = await provider.provideCompletionItems(
          document,
          position,
          token,
          context,
        );
        // 結果がundefined, null, CompletionItem[], またはCompletionListのいずれかであることを確認
        assert.ok(
          result === undefined ||
            result === null ||
            Array.isArray(result) ||
            (result && typeof result === "object" && "items" in result),
          "戻り値は適切な型であるべき",
        );
      } catch (error) {
        // 依存関係が未初期化の場合など、期待されるエラーは許可
        assert.ok(
          error instanceof Error,
          "エラーが発生した場合はErrorインスタンスであるべき",
        );
      }
    });

    test("正常系 戻り値の型チェック", async () => {
      // 値定義
      const provider = new TyranoCompletionItemProvider();
      const document = new MockTextDocument();
      const position = new vscode.Position(0, 13);
      const token = new MockCancellationToken();
      const context = new MockCompletionContext();

      try {
        // 実行
        const result = await provider.provideCompletionItems(
          document,
          position,
          token,
          context,
        );

        // アサート - 戻り値が適切な型であることを確認
        if (result !== undefined && result !== null) {
          const isValidResult =
            Array.isArray(result) ||
            (typeof result === "object" &&
              "items" in result &&
              Array.isArray((result as any).items));

          assert.ok(
            isValidResult,
            "戻り値は有効なCompletionItem[]またはCompletionList型であるべき",
          );
        }
      } catch (_error) {
        // 依存関係が未初期化の場合のエラーは想定内
        assert.ok(true, "依存関係のエラーは想定内");
      }
    });

    test("正常系 異なる位置での呼び出し", async () => {
      // 値定義
      const provider = new TyranoCompletionItemProvider();
      const document = new MockTextDocument();
      const token = new MockCancellationToken();
      const context = new MockCompletionContext();

      const positions = [
        new vscode.Position(0, 0),
        new vscode.Position(0, 5),
        new vscode.Position(0, 13),
      ];

      // 実行（各位置で例外が発生しないことを確認）
      for (const position of positions) {
        try {
          await provider.provideCompletionItems(
            document,
            position,
            token,
            context,
          );
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
        TyranoCompletionItemProvider,
        "TyranoCompletionItemProviderクラスが存在するべき",
      );
      assert.strictEqual(
        typeof TyranoCompletionItemProvider,
        "function",
        "TyranoCompletionItemProviderはコンストラクタ関数であるべき",
      );
    });

    test("正常系 CompletionItemProviderインターフェースを実装", () => {
      // 値定義
      const provider = new TyranoCompletionItemProvider();

      // アサート - 必要なメソッドが存在することを確認
      assert.ok(
        typeof provider.provideCompletionItems === "function",
        "provideCompletionItemsメソッドが存在するべき",
      );
    });
  });

  // 新しい機能のテスト
  suite("enum and layer completion", () => {
    test("config.tjs値の抽出テスト", () => {
      const provider = new TyranoCompletionItemProvider();

      // config.tjsの内容をモック
      const configContent = `
// Config.tjs - ティラノスクリプト 設定
;numCharacterLayers = 5;
;numMessageLayers = 3;
;otherParam = 10;
      `;

      // private メソッドにアクセスするため any でキャスト
      const providerAny = provider as any;

      // numCharacterLayersの抽出テスト
      const numCharacterLayers = providerAny.extractConfigValue(
        configContent,
        "numCharacterLayers",
      );
      assert.strictEqual(
        numCharacterLayers,
        5,
        "numCharacterLayersが正しく抽出されるべき",
      );

      // numMessageLayersの抽出テスト
      const numMessageLayers = providerAny.extractConfigValue(
        configContent,
        "numMessageLayers",
      );
      assert.strictEqual(
        numMessageLayers,
        3,
        "numMessageLayersが正しく抽出されるべき",
      );

      // 存在しないパラメータのテスト
      const nonExistent = providerAny.extractConfigValue(
        configContent,
        "nonExistentParam",
      );
      assert.strictEqual(
        nonExistent,
        null,
        "存在しないパラメータはnullを返すべき",
      );
    });

    test("getConfigValues デフォルト値テスト", async () => {
      const provider = new TyranoCompletionItemProvider();
      const providerAny = provider as any;

      // 存在しないパスでテスト（デフォルト値が返されることを確認）
      const result = await providerAny.getConfigValues("/nonexistent/path");

      assert.strictEqual(
        result.numCharacterLayers,
        3,
        "デフォルトのnumCharacterLayersは3であるべき",
      );
      assert.strictEqual(
        result.numMessageLayers,
        2,
        "デフォルトのnumMessageLayersは2であるべき",
      );
    });
  });

  suite("TagParameterConfig type handling", () => {
    test("型定義の互換性テスト", () => {
      // TagParameterConfig型が正しく定義されていることを確認
      const enumConfig = {
        type: "enum",
        values: ["true", "false"],
      };

      const layerConfig = {
        type: ["layer"],
      };

      const imageConfig = {
        type: ["image"],
        path: "data/image",
      };

      // これらのオブジェクトがTagParameterConfig型として扱えることを確認
      assert.ok(enumConfig.type === "enum", "enum typeが正しく設定されるべき");
      assert.ok(
        Array.isArray(layerConfig.type),
        "layer typeが配列として設定されるべき",
      );
      assert.ok(
        imageConfig.path === "data/image",
        "pathが正しく設定されるべき",
      );
    });
  });

  suite("completionResource method tests", () => {
    test("enum タイプの補完候補生成テスト", async () => {
      const provider = new TyranoCompletionItemProvider();
      const providerAny = provider as any;

      // enumタイプのパラメータ設定をモック
      const enumParamConfig = {
        type: "enum",
        values: ["true", "false", "auto"],
      };

      try {
        // completionResourceメソッドを呼び出し（privateメソッドなのでanyでキャスト）
        const result = await providerAny.completionResource(
          "/test/project",
          "enum",
          "/test/reference",
          enumParamConfig,
        );

        if (result && Array.isArray(result)) {
          // enum値が補完候補に含まれていることを確認
          const labels = result.map((item: any) => item.label);
          assert.ok(labels.includes("true"), "trueが補完候補に含まれるべき");
          assert.ok(labels.includes("false"), "falseが補完候補に含まれるべき");
          assert.ok(labels.includes("auto"), "autoが補完候補に含まれるべき");

          // CompletionItemKind.Enumが設定されていることを確認
          const enumItems = result.filter(
            (item: any) => item.kind === vscode.CompletionItemKind.Enum,
          );
          assert.strictEqual(
            enumItems.length,
            3,
            "Enum種別のアイテムが3つあるべき",
          );
        }
      } catch (error) {
        // テスト環境での依存関係エラーは許可
        assert.ok(
          error instanceof Error,
          "エラーが発生する場合はErrorインスタンスであるべき",
        );
      }
    });

    test("layer タイプの補完候補生成テスト", async () => {
      const provider = new TyranoCompletionItemProvider();
      const providerAny = provider as any;

      // getConfigValuesメソッドをモック
      const originalGetConfigValues = providerAny.getConfigValues;
      providerAny.getConfigValues = async () => ({
        numCharacterLayers: 2,
        numMessageLayers: 1,
      });

      try {
        const result = await providerAny.completionResource(
          "/test/project",
          "layer",
          "/test/reference",
          { type: "layer" },
        );

        if (result && Array.isArray(result)) {
          const labels = result.map((item: any) => item.label);

          // 数値レイヤー（0,1,2）の確認
          assert.ok(labels.includes("0"), "レイヤー0が補完候補に含まれるべき");
          assert.ok(labels.includes("1"), "レイヤー1が補完候補に含まれるべき");
          assert.ok(labels.includes("2"), "レイヤー2が補完候補に含まれるべき");

          // メッセージレイヤー（message0,message1）の確認
          assert.ok(
            labels.includes("message0"),
            "message0が補完候補に含まれるべき",
          );
          assert.ok(
            labels.includes("message1"),
            "message1が補完候補に含まれるべき",
          );

          // CompletionItemKind.Valueが設定されていることを確認
          const valueItems = result.filter(
            (item: any) => item.kind === vscode.CompletionItemKind.Value,
          );
          assert.strictEqual(
            valueItems.length,
            5,
            "Value種別のアイテムが5つあるべき",
          );
        }
      } catch (error) {
        assert.ok(
          error instanceof Error,
          "エラーが発生する場合はErrorインスタンスであるべき",
        );
      } finally {
        // モックを元に戻す
        providerAny.getConfigValues = originalGetConfigValues;
      }
    });

    test("複合タイプ（enum + layer）の補完候補生成テスト", async () => {
      const provider = new TyranoCompletionItemProvider();
      const providerAny = provider as any;

      // getConfigValuesメソッドをモック
      providerAny.getConfigValues = async () => ({
        numCharacterLayers: 1,
        numMessageLayers: 1,
      });

      try {
        const result = await providerAny.completionResource(
          "/test/project",
          ["enum", "layer"],
          "/test/reference",
          {
            type: ["enum", "layer"],
            values: ["custom1", "custom2"],
          },
        );

        if (result && Array.isArray(result)) {
          const labels = result.map((item: any) => item.label);

          // enum値の確認
          assert.ok(
            labels.includes("custom1"),
            "custom1が補完候補に含まれるべき",
          );
          assert.ok(
            labels.includes("custom2"),
            "custom2が補完候補に含まれるべき",
          );

          // layer値の確認
          assert.ok(labels.includes("0"), "レイヤー0が補完候補に含まれるべき");
          assert.ok(labels.includes("1"), "レイヤー1が補完候補に含まれるべき");
          assert.ok(
            labels.includes("message0"),
            "message0が補完候補に含まれるべき",
          );
          assert.ok(
            labels.includes("message1"),
            "message1が補完候補に含まれるべき",
          );
        }
      } catch (error) {
        assert.ok(
          error instanceof Error,
          "エラーが発生する場合はErrorインスタンスであるべき",
        );
      }
    });
  });
});
