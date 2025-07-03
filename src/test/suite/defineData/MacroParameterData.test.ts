import * as assert from "assert";
import * as vscode from "vscode";
import { MacroParameterData } from "../../../defineData/MacroParameterData";

suite("MacroParameterData", () => {
  vscode.window.showInformationMessage("Start MacroParameterData tests.");

  suite("constructor", () => {
    test("正常系 基本的なコンストラクタ", () => {
      // 値定義
      const name = "storage";
      const required = true;
      const description = "ファイルのパス";

      // 実行
      const parameterData = new MacroParameterData(name, required, description);

      // アサート
      assert.strictEqual(parameterData.name, name);
      assert.strictEqual(parameterData.required, required);
      assert.strictEqual(parameterData.description, description);
    });

    test("正常系 必須でないパラメータ", () => {
      // 値定義
      const name = "width";
      const required = false;
      const description = "幅の指定";

      // 実行
      const parameterData = new MacroParameterData(name, required, description);

      // アサート
      assert.strictEqual(parameterData.name, name);
      assert.strictEqual(parameterData.required, required);
      assert.strictEqual(parameterData.description, description);
    });

    test("正常系 空文字列のname", () => {
      // 値定義
      const name = "";
      const required = true;
      const description = "説明";

      // 実行
      const parameterData = new MacroParameterData(name, required, description);

      // アサート
      assert.strictEqual(parameterData.name, name);
      assert.strictEqual(parameterData.required, required);
      assert.strictEqual(parameterData.description, description);
    });

    test("正常系 空文字列の説明", () => {
      // 値定義
      const name = "param";
      const required = false;
      const description = "";

      // 実行
      const parameterData = new MacroParameterData(name, required, description);

      // アサート
      assert.strictEqual(parameterData.name, name);
      assert.strictEqual(parameterData.required, required);
      assert.strictEqual(parameterData.description, description);
    });
  });

  suite("setters and getters", () => {
    test("正常系 name setter", () => {
      // 値定義
      const parameterData = new MacroParameterData("oldName", true, "説明");
      const newName = "newName";

      // 実行
      parameterData.name = newName;

      // アサート
      assert.strictEqual(parameterData.name, newName);
    });

    test("正常系 required setter", () => {
      // 値定義
      const parameterData = new MacroParameterData("param", true, "説明");

      // 実行
      parameterData.required = false;

      // アサート
      assert.strictEqual(parameterData.required, false);
    });

    test("正常系 description setter", () => {
      // 値定義
      const parameterData = new MacroParameterData("param", true, "古い説明");
      const newDescription = "新しい説明";

      // 実行
      parameterData.description = newDescription;

      // アサート
      assert.strictEqual(parameterData.description, newDescription);
    });

    test("正常系 複数のプロパティを変更", () => {
      // 値定義
      const parameterData = new MacroParameterData("param1", true, "説明1");

      // 実行
      parameterData.name = "param2";
      parameterData.required = false;
      parameterData.description = "説明2";

      // アサート
      assert.strictEqual(parameterData.name, "param2");
      assert.strictEqual(parameterData.required, false);
      assert.strictEqual(parameterData.description, "説明2");
    });

    test("正常系 日本語の値", () => {
      // 値定義
      const parameterData = new MacroParameterData("", false, "");

      // 実行
      parameterData.name = "パラメータ名";
      parameterData.description = "これは日本語の説明です";

      // アサート
      assert.strictEqual(parameterData.name, "パラメータ名");
      assert.strictEqual(parameterData.description, "これは日本語の説明です");
    });

    test("正常系 特殊文字を含む値", () => {
      // 値定義
      const parameterData = new MacroParameterData("", false, "");

      // 実行
      parameterData.name = "param_01-test.value";
      parameterData.description = "Special chars: !@#$%^&*()";

      // アサート
      assert.strictEqual(parameterData.name, "param_01-test.value");
      assert.strictEqual(parameterData.description, "Special chars: !@#$%^&*()");
    });

    test("正常系 長い文字列", () => {
      // 値定義
      const parameterData = new MacroParameterData("", false, "");
      const longName = "a".repeat(100);
      const longDescription = "b".repeat(500);

      // 実行
      parameterData.name = longName;
      parameterData.description = longDescription;

      // アサート
      assert.strictEqual(parameterData.name, longName);
      assert.strictEqual(parameterData.description, longDescription);
    });
  });
});