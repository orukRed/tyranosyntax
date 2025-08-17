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
});
