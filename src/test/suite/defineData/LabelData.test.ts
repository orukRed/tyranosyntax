import * as assert from "assert";
import * as vscode from "vscode";
import { LabelData } from "../../../defineData/LabelData";

suite("LabelData", () => {
  vscode.window.showInformationMessage("Start LabelData tests.");

  suite("constructor", () => {
    test("正常系 基本的なコンストラクタ", () => {
      // 値定義
      const name = "testLabel";
      const uri = vscode.Uri.file("/test/file.ks");
      const range = new vscode.Range(0, 0, 0, 10);
      const location = new vscode.Location(uri, range);

      // 実行
      const labelData = new LabelData(name, location);

      // アサート
      assert.strictEqual(labelData.name, name);
      assert.strictEqual(labelData.location, location);
      assert.strictEqual(labelData.description, "");
    });

    test("正常系 説明付きコンストラクタ", () => {
      // 値定義
      const name = "labelWithDescription";
      const description = "これはテスト用のラベルです";
      const uri = vscode.Uri.file("/test/file.ks");
      const range = new vscode.Range(1, 5, 1, 15);
      const location = new vscode.Location(uri, range);

      // 実行
      const labelData = new LabelData(name, location, description);

      // アサート
      assert.strictEqual(labelData.name, name);
      assert.strictEqual(labelData.location, location);
      assert.strictEqual(labelData.description, description);
    });

    test("正常系 空文字列のname", () => {
      // 値定義
      const name = "";
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(0, 0, 0, 10));

      // 実行
      const labelData = new LabelData(name, location);

      // アサート
      assert.strictEqual(labelData.name, name);
      assert.strictEqual(labelData.description, "");
    });

    test("正常系 空文字列の説明", () => {
      // 値定義
      const name = "emptyDescLabel";
      const description = "";
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(0, 0, 0, 10));

      // 実行
      const labelData = new LabelData(name, location, description);

      // アサート
      assert.strictEqual(labelData.name, name);
      assert.strictEqual(labelData.description, description);
    });

    test("正常系 日本語のname", () => {
      // 値定義
      const name = "テストラベル";
      const description = "日本語の説明文";
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(0, 0, 0, 10));

      // 実行
      const labelData = new LabelData(name, location, description);

      // アサート
      assert.strictEqual(labelData.name, name);
      assert.strictEqual(labelData.description, description);
    });

    test("正常系 特殊文字を含むname", () => {
      // 値定義
      const name = "label_01-test.end";
      const description = "Special characters: !@#$%^&*()";
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(0, 0, 0, 10));

      // 実行
      const labelData = new LabelData(name, location, description);

      // アサート
      assert.strictEqual(labelData.name, name);
      assert.strictEqual(labelData.description, description);
    });

    test("正常系 長い文字列", () => {
      // 値定義
      const name = "a".repeat(100);
      const description = "b".repeat(500);
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(0, 0, 0, 10));

      // 実行
      const labelData = new LabelData(name, location, description);

      // アサート
      assert.strictEqual(labelData.name, name);
      assert.strictEqual(labelData.description, description);
    });
  });

  suite("getters", () => {
    test("正常系 全てのプロパティが読み取り専用", () => {
      // 値定義
      const name = "testLabel";
      const description = "テスト用ラベル";
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(2, 10, 2, 20));
      const labelData = new LabelData(name, location, description);

      // アサート - getterが存在し、値が正しく取得できることを確認
      assert.strictEqual(labelData.name, name);
      assert.strictEqual(labelData.location, location);
      assert.strictEqual(labelData.description, description);

      // 参照の同一性を確認
      assert.strictEqual(labelData.location.uri, location.uri);
      assert.strictEqual(labelData.location.range.start.line, location.range.start.line);
      assert.strictEqual(labelData.location.range.start.character, location.range.start.character);
      assert.strictEqual(labelData.location.range.end.line, location.range.end.line);
      assert.strictEqual(labelData.location.range.end.character, location.range.end.character);
    });

    test("正常系 descriptionプロパティの型チェック", () => {
      // 値定義
      const labelData = new LabelData("test", new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(0, 0, 0, 10)), "説明");

      // アサート - descriptionのgetterの戻り値の型を確認
      const description = labelData.description;
      assert.ok(typeof description === "string" || description === undefined, "descriptionは文字列またはundefinedであるべき");
    });
  });
});