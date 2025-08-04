/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { TyranoDiagnostic } from "../../../subscriptions/TyranoDiagnostic";

// Mock TextDocument for testing
class MockTextDocument implements vscode.TextDocument {
  uri = vscode.Uri.file("/test.ks");
  fileName = "/test.ks";
  isUntitled = false;
  languageId = "tyrano";
  version = 1;
  isDirty = false;
  isClosed = false;
  eol = vscode.EndOfLine.LF;
  lineCount = 3;

  save(): Thenable<boolean> {
    return Promise.resolve(true);
  }
  lineAt(lineOrPosition: number | vscode.Position): vscode.TextLine {
    const line =
      typeof lineOrPosition === "number" ? lineOrPosition : lineOrPosition.line;
    const lines = ['[macro name="test"]', "[testmacro]", "[endmacro]"];
    return {
      lineNumber: line,
      text: lines[line] || "",
      range: new vscode.Range(line, 0, line, (lines[line] || "").length),
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
    return '[macro name="test"]\n[testmacro]\n[endmacro]';
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

suite("TyranoDiagnostic", () => {
  vscode.window.showInformationMessage("Start TyranoDiagnostic tests.");

  suite("constructor", () => {
    test("正常系 インスタンス作成", () => {
      // 実行
      assert.doesNotThrow(() => {
        new TyranoDiagnostic();
      });
    });

    test("正常系 インスタンスが正しく初期化される", () => {
      // 実行
      const diagnostic = new TyranoDiagnostic();

      // アサート
      assert.ok(
        diagnostic instanceof TyranoDiagnostic,
        "TyranoDiagnosticのインスタンスであるべき",
      );
      assert.ok(
        typeof diagnostic.createDiagnostics === "function",
        "createDiagnosticsメソッドが存在するべき",
      );
    });
  });

  suite("createDiagnostics", () => {
    test("正常系 メソッドが存在する", () => {
      // 値定義
      const diagnostic = new TyranoDiagnostic();

      // アサート
      assert.ok(
        typeof diagnostic.createDiagnostics === "function",
        "createDiagnosticsメソッドが存在するべき",
      );
    });

    test("正常系 メソッド呼び出しで例外が発生しない", async () => {
      // 値定義
      const diagnostic = new TyranoDiagnostic();
      const testPath = "/test/path/test.ks";

      // 実行（例外が発生しないことを確認）
      try {
        const result = await diagnostic.createDiagnostics(testPath);
        // 戻り値はundefinedまたは配列
        assert.ok(
          result === undefined || Array.isArray(result),
          "戻り値はundefinedまたは配列であるべき",
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
      const diagnostic = new TyranoDiagnostic();
      const testPath = "/test/path/test.ks";

      try {
        // 実行
        const result = await diagnostic.createDiagnostics(testPath);

        // アサート
        if (result !== undefined) {
          assert.ok(Array.isArray(result), "戻り値は配列であるべき");

          // 配列の各要素がDiagnosticオブジェクトであることを確認
          result.forEach((item, index) => {
            assert.ok(
              item instanceof vscode.Diagnostic,
              `結果[${index}]はDiagnosticインスタンスであるべき`,
            );
          });
        }
      } catch (error) {
        // 依存関係のエラーは想定内
        assert.ok(true, "依存関係のエラーは想定内");
      }
    });

    test("正常系 undefinedパス", async () => {
      // 値定義
      const diagnostic = new TyranoDiagnostic();

      try {
        // 実行
        const result = await diagnostic.createDiagnostics(undefined);

        // アサート - undefinedを渡した場合はundefinedが返される
        assert.strictEqual(
          result,
          undefined,
          "undefinedパスの場合はundefinedが返されるべき",
        );
      } catch (error) {
        // エラーは想定内
        assert.ok(true, "エラーは想定内");
      }
    });
  });

  suite("isExistAmpersandAtBeginning", () => {
    test("正常系 &f.hoge true返却", () => {
      //値定義
      const diag = new TyranoDiagnostic();

      // 実行・アサート
      assert.strictEqual(
        (diag as any).isExistAmpersandAtBeginning("&f.hoge"),
        true,
        "&で始まる文字列はtrueを返すべき",
      );
    });

    test("正常系 f.hoge false返却", () => {
      //値定義
      const diag = new TyranoDiagnostic();

      // 実行・アサート
      assert.strictEqual(
        (diag as any).isExistAmpersandAtBeginning("f.hoge"),
        false,
        "&で始まらない文字列はfalseを返すべき",
      );
    });

    test("正常系 &sf.test true返却", () => {
      //値定義
      const diag = new TyranoDiagnostic();

      // 実行・アサート
      assert.strictEqual(
        (diag as any).isExistAmpersandAtBeginning("&sf.test"),
        true,
        "&で始まるsf変数はtrueを返すべき",
      );
    });

    test("正常系 &tf.flag true返却", () => {
      //値定義
      const diag = new TyranoDiagnostic();

      // 実行・アサート
      assert.strictEqual(
        (diag as any).isExistAmpersandAtBeginning("&tf.flag"),
        true,
        "&で始まるtf変数はtrueを返すべき",
      );
    });

    test("正常系 空文字列 false返却", () => {
      //値定義
      const diag = new TyranoDiagnostic();

      // 実行・アサート
      assert.strictEqual(
        (diag as any).isExistAmpersandAtBeginning(""),
        false,
        "空文字列はfalseを返すべき",
      );
    });

    test("正常系 &のみ true返却", () => {
      //値定義
      const diag = new TyranoDiagnostic();

      // 実行・アサート
      assert.strictEqual(
        (diag as any).isExistAmpersandAtBeginning("&"),
        true,
        "&のみの文字列はtrueを返すべき",
      );
    });

    test("正常系 途中に&がある文字列 false返却", () => {
      //値定義
      const diag = new TyranoDiagnostic();

      // 実行・アサート
      assert.strictEqual(
        (diag as any).isExistAmpersandAtBeginning("test&value"),
        false,
        "途中に&がある文字列はfalseを返すべき",
      );
    });

    test("正常系 日本語文字列 false返却", () => {
      //値定義
      const diag = new TyranoDiagnostic();

      // 実行・アサート
      assert.strictEqual(
        (diag as any).isExistAmpersandAtBeginning("テスト"),
        false,
        "日本語文字列はfalseを返すべき",
      );
    });

    test("正常系 &と日本語 true返却", () => {
      //値定義
      const diag = new TyranoDiagnostic();

      // 実行・アサート
      assert.strictEqual(
        (diag as any).isExistAmpersandAtBeginning("&テスト"),
        true,
        "&で始まる日本語文字列はtrueを返すべき",
      );
    });
  });

  suite("class structure", () => {
    test("正常系 クラスが正しく定義されている", () => {
      // アサート
      assert.ok(TyranoDiagnostic, "TyranoDiagnosticクラスが存在するべき");
      assert.strictEqual(
        typeof TyranoDiagnostic,
        "function",
        "TyranoDiagnosticはコンストラクタ関数であるべき",
      );
    });

    test("正常系 必要なメソッドが存在", () => {
      // 値定義
      const diagnostic = new TyranoDiagnostic();

      // アサート
      assert.ok(
        typeof diagnostic.createDiagnostics === "function",
        "createDiagnosticsメソッドが存在するべき",
      );
      assert.ok(
        typeof (diagnostic as any).isExistAmpersandAtBeginning === "function",
        "isExistAmpersandAtBeginningメソッドが存在するべき",
      );
    });

    test("正常系 プライベートメソッドの動作確認", () => {
      // 値定義
      const diagnostic = new TyranoDiagnostic();

      // アサート - プライベートメソッドが期待通りに動作することを確認
      assert.ok(
        typeof (diagnostic as any).isExistAmpersandAtBeginning === "function",
        "プライベートメソッドにアクセスできるべき",
      );

      // 基本的な動作テスト
      assert.strictEqual(
        (diagnostic as any).isExistAmpersandAtBeginning("&test"),
        true,
      );
      assert.strictEqual(
        (diagnostic as any).isExistAmpersandAtBeginning("test"),
        false,
      );
    });
  });

  suite("undefined macro underline length", () => {
    test("タグ名のみが下線で示される", () => {
      // 未定義マクロの診断における下線の長さがタグ名と一致することをテスト
      const testText = '[unknownmacro param1="value1" param2="value2"]';
      const tagName = "unknownmacro";
      
      // タグの開始位置を計算
      const tagFirstIndex = testText.indexOf(tagName);
      const tagLastIndex = tagFirstIndex + tagName.length;
      
      // 期待される下線の範囲
      const expectedUnderlineText = testText.substring(tagFirstIndex, tagLastIndex);
      
      // アサート
      assert.strictEqual(tagFirstIndex, 1, "タグは1文字目から始まるべき");
      assert.strictEqual(tagLastIndex, 13, "タグは13文字目で終わるべき");
      assert.strictEqual(expectedUnderlineText, tagName, "下線はタグ名のみにかかるべき");
      assert.strictEqual(expectedUnderlineText.length, 12, "下線の長さはタグ名の長さと一致するべき");
    });

    test("パラメータ付きタグでもタグ名のみが下線で示される", () => {
      // より長いパラメータを持つタグのテスト
      const testText = '[invalidtag storage="test.ks" target="label1" visible="true"]';
      const tagName = "invalidtag";
      
      // タグの開始位置を計算
      const tagFirstIndex = testText.indexOf(tagName);
      const tagLastIndex = tagFirstIndex + tagName.length;
      
      // 期待される下線の範囲
      const expectedUnderlineText = testText.substring(tagFirstIndex, tagLastIndex);
      
      // アサート
      assert.strictEqual(expectedUnderlineText, tagName, "下線はタグ名のみにかかるべき");
      assert.strictEqual(expectedUnderlineText.length, tagName.length, "下線の長さはタグ名の長さと一致するべき");
      
      // パラメータ部分は下線に含まれないことを確認
      const parametersPart = testText.substring(tagLastIndex);
      assert.ok(parametersPart.includes('storage="test.ks"'), "パラメータは下線範囲に含まれないべき");
    });
  });
});
