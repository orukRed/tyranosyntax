import * as assert from "assert";
import * as vscode from "vscode";
import { InformationExtension } from "../../InformationExtension";

suite("InformationExtension", () => {
  vscode.window.showInformationMessage("Start InformationExtension tests.");

  suite("getInstance", () => {
    test("正常系 インスタンスが取得できる", () => {
      // 実行
      const instance1 = InformationExtension.getInstance();
      const instance2 = InformationExtension.getInstance();

      // アサート
      assert.strictEqual(
        instance1,
        instance2,
        "同じインスタンスが返されるべき",
      );
      assert.ok(
        instance1 instanceof InformationExtension,
        "InformationExtensionのインスタンスであるべき",
      );
    });
  });

  suite("language property", () => {
    test("正常系 言語設定が取得できる", () => {
      // 実行
      const language = InformationExtension.language;

      // アサート
      assert.ok(typeof language === "string", "言語設定は文字列であるべき");
      assert.ok(language.length > 0, "言語設定は空文字列でないべき");
    });
  });

  suite("path property", () => {
    test("正常系 初期状態でundefined", () => {});

    test("正常系 値を設定できる", () => {
      // 値定義
      const testPath = "/test/path";

      // 実行
      InformationExtension.path = testPath;

      // アサート
      assert.strictEqual(
        InformationExtension.path,
        testPath,
        "設定した値が取得できるべき",
      );

      // クリーンアップ
      InformationExtension.path = undefined;
    });
  });
});
