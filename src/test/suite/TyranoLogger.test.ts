import * as assert from "assert";
import * as vscode from "vscode";
import { TyranoLogger, ErrorLevel } from "../../TyranoLogger";

suite("ErrorLevel", () => {
  vscode.window.showInformationMessage("Start ErrorLevel tests.");

  test("正常系 定数が正しく定義されている", () => {
    // アサート
    assert.strictEqual(ErrorLevel.DEBUG, "DEBUG");
    assert.strictEqual(ErrorLevel.INFO, "INFO");
    assert.strictEqual(ErrorLevel.WARN, "WARN");
    assert.strictEqual(ErrorLevel.ERROR, "ERROR");
    assert.strictEqual(ErrorLevel.FATAL, "FATAL");
  });
});

suite("TyranoLogger", () => {
  vscode.window.showInformationMessage("Start TyranoLogger tests.");

  suite("print", () => {
    test("正常系 デフォルトのエラーレベル", () => {
      // 実行（例外が発生しないことを確認）
      assert.doesNotThrow(() => {
        TyranoLogger.print("テストメッセージ");
      });
    });

    test("正常系 DEBUGレベル", () => {
      // 実行（例外が発生しないことを確認）
      assert.doesNotThrow(() => {
        TyranoLogger.print("デバッグメッセージ", ErrorLevel.DEBUG);
      });
    });

    test("正常系 INFOレベル", () => {
      // 実行（例外が発生しないことを確認）
      assert.doesNotThrow(() => {
        TyranoLogger.print("情報メッセージ", ErrorLevel.INFO);
      });
    });

    test("正常系 WARNレベル", () => {
      // 実行（例外が発生しないことを確認）
      assert.doesNotThrow(() => {
        TyranoLogger.print("警告メッセージ", ErrorLevel.WARN);
      });
    });

    test("正常系 ERRORレベル", () => {
      // 実行（例外が発生しないことを確認）
      assert.doesNotThrow(() => {
        TyranoLogger.print("エラーメッセージ", ErrorLevel.ERROR);
      });
    });

    test("正常系 FATALレベル", () => {
      // 実行（例外が発生しないことを確認）
      assert.doesNotThrow(() => {
        TyranoLogger.print("致命的エラーメッセージ", ErrorLevel.FATAL);
      });
    });

    test("正常系 空文字列", () => {
      // 実行（例外が発生しないことを確認）
      assert.doesNotThrow(() => {
        TyranoLogger.print("", ErrorLevel.INFO);
      });
    });

    test("正常系 長い文字列", () => {
      const longMessage = "a".repeat(1000);
      // 実行（例外が発生しないことを確認）
      assert.doesNotThrow(() => {
        TyranoLogger.print(longMessage, ErrorLevel.INFO);
      });
    });
  });

  suite("printStackTrace", () => {
    test("正常系 Error型のスタックトレース", () => {
      const error = new Error("テストエラー");
      
      // 実行（例外が発生しないことを確認）
      assert.doesNotThrow(() => {
        TyranoLogger.printStackTrace(error);
      });
    });

    test("正常系 文字列型の例外", () => {
      const errorMessage = "文字列エラー";
      
      // 実行（例外が発生しないことを確認）
      assert.doesNotThrow(() => {
        TyranoLogger.printStackTrace(errorMessage);
      });
    });

    test("正常系 unknown型の例外", () => {
      const unknownError = { message: "不明なエラー" };
      
      // 実行（例外が発生しないことを確認）
      assert.doesNotThrow(() => {
        TyranoLogger.printStackTrace(unknownError);
      });
    });

    test("正常系 nullの例外", () => {
      // 実行（例外が発生しないことを確認）
      assert.doesNotThrow(() => {
        TyranoLogger.printStackTrace(null);
      });
    });

    test("正常系 undefinedの例外", () => {
      // 実行（例外が発生しないことを確認）
      assert.doesNotThrow(() => {
        TyranoLogger.printStackTrace(undefined);
      });
    });
  });
});