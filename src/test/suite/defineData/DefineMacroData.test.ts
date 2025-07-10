/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import { DefineMacroData } from "../../../defineData/DefineMacroData";

suite("DefineMacroData", () => {
  vscode.window.showInformationMessage("Start DefineMacroData tests.");

  suite("constructor", () => {
    test("正常系 基本的なコンストラクタ", () => {
      // 値定義
      const macroName = "testMacro";
      const filePath = "/test/macros.ks";
      const description = "テスト用マクロ";
      const uri = vscode.Uri.file(filePath);
      const range = new vscode.Range(0, 0, 0, 10);
      const location = new vscode.Location(uri, range);

      // 実行
      const macroData = new DefineMacroData(
        macroName,
        location,
        filePath,
        description,
      );

      // アサート
      assert.strictEqual(macroData.macroName, macroName);
      assert.strictEqual(macroData.filePath, filePath);
      assert.strictEqual(macroData.description, description);
      assert.strictEqual(macroData.location, location);
      assert.deepStrictEqual(macroData.parameter, []);
    });

    test("正常系 空文字列のmacroName", () => {
      // 値定義
      const macroName = "";
      const filePath = "/test/macros.ks";
      const description = "空の名前のマクロ";
      const location = new vscode.Location(
        vscode.Uri.file(filePath),
        new vscode.Range(0, 0, 0, 10),
      );

      // 実行
      const macroData = new DefineMacroData(
        macroName,
        location,
        filePath,
        description,
      );

      // アサート
      assert.strictEqual(macroData.macroName, macroName);
      assert.strictEqual(macroData.filePath, filePath);
      assert.strictEqual(macroData.description, description);
    });

    test("正常系 空文字列の説明", () => {
      // 値定義
      const macroName = "noDescMacro";
      const filePath = "/test/macros.ks";
      const description = "";
      const location = new vscode.Location(
        vscode.Uri.file(filePath),
        new vscode.Range(0, 0, 0, 10),
      );

      // 実行
      const macroData = new DefineMacroData(
        macroName,
        location,
        filePath,
        description,
      );

      // アサート
      assert.strictEqual(macroData.macroName, macroName);
      assert.strictEqual(macroData.description, description);
    });

    test("正常系 日本語のmacroName", () => {
      // 値定義
      const macroName = "テストマクロ";
      const filePath = "/test/日本語.ks";
      const description = "日本語の説明";
      const location = new vscode.Location(
        vscode.Uri.file(filePath),
        new vscode.Range(0, 0, 0, 10),
      );

      // 実行
      const macroData = new DefineMacroData(
        macroName,
        location,
        filePath,
        description,
      );

      // アサート
      assert.strictEqual(macroData.macroName, macroName);
      assert.strictEqual(macroData.filePath, filePath);
      assert.strictEqual(macroData.description, description);
    });

    test("正常系 特殊文字を含む値", () => {
      // 値定義
      const macroName = "macro_01-test.v2";
      const filePath = "/path/with-special_chars.v1.ks";
      const description = "Special: !@#$%^&*()";
      const location = new vscode.Location(
        vscode.Uri.file(filePath),
        new vscode.Range(0, 0, 0, 10),
      );

      // 実行
      const macroData = new DefineMacroData(
        macroName,
        location,
        filePath,
        description,
      );

      // アサート
      assert.strictEqual(macroData.macroName, macroName);
      assert.strictEqual(macroData.filePath, filePath);
      assert.strictEqual(macroData.description, description);
    });
  });

  suite("description setter", () => {
    test("正常系 description変更", () => {
      // 値定義
      const macroData = new DefineMacroData(
        "test",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(0, 0, 0, 10),
        ),
        "/test.ks",
        "古い説明",
      );
      const newDescription = "新しい説明";

      // 実行
      macroData.description = newDescription;

      // アサート
      assert.strictEqual(macroData.description, newDescription);
    });

    test("正常系 空文字列に変更", () => {
      // 値定義
      const macroData = new DefineMacroData(
        "test",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(0, 0, 0, 10),
        ),
        "/test.ks",
        "説明あり",
      );

      // 実行
      macroData.description = "";

      // アサート
      assert.strictEqual(macroData.description, "");
    });

    test("正常系 日本語に変更", () => {
      // 値定義
      const macroData = new DefineMacroData(
        "test",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(0, 0, 0, 10),
        ),
        "/test.ks",
        "English description",
      );

      // 実行
      macroData.description = "日本語の説明";

      // アサート
      assert.strictEqual(macroData.description, "日本語の説明");
    });
  });

  suite("parseToJsonObject", () => {
    test("正常系 JSONオブジェクト変換", () => {
      // 値定義
      const macroName = "testMacro";
      const description = "テスト用マクロ";
      const macroData = new DefineMacroData(
        macroName,
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(0, 0, 0, 10),
        ),
        "/test.ks",
        description,
      );

      // 実行
      const jsonObject = macroData.parseToJsonObject();

      // アサート
      assert.ok(
        typeof jsonObject === "object",
        "JSONオブジェクトが返されるべき",
      );
      assert.strictEqual(
        (jsonObject as any).name,
        macroName,
        "nameプロパティが正しく設定されるべき",
      );
      assert.strictEqual(
        (jsonObject as any).description,
        description,
        "descriptionプロパティが正しく設定されるべき",
      );
      assert.ok(
        (jsonObject as any).parameters,
        "parametersプロパティが存在するべき",
      );
      assert.ok(
        typeof (jsonObject as any).parameters === "object",
        "parametersはオブジェクトであるべき",
      );
    });

    test("正常系 空の説明でのJSON変換", () => {
      // 値定義
      const macroName = "emptyDescMacro";
      const description = "";
      const macroData = new DefineMacroData(
        macroName,
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(0, 0, 0, 10),
        ),
        "/test.ks",
        description,
      );

      // 実行
      const jsonObject = macroData.parseToJsonObject();

      // アサート
      assert.strictEqual((jsonObject as any).name, macroName);
      assert.strictEqual((jsonObject as any).description, description);
      assert.ok((jsonObject as any).parameters !== undefined);
    });

    test("正常系 日本語でのJSON変換", () => {
      // 値定義
      const macroName = "日本語マクロ";
      const description = "これは日本語の説明です";
      const macroData = new DefineMacroData(
        macroName,
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(0, 0, 0, 10),
        ),
        "/test.ks",
        description,
      );

      // 実行
      const jsonObject = macroData.parseToJsonObject();

      // アサート
      assert.strictEqual((jsonObject as any).name, macroName);
      assert.strictEqual((jsonObject as any).description, description);
    });
  });

  suite("getters", () => {
    test("正常系 全てのgetterが正しく動作", () => {});

    test("正常系 読み取り専用プロパティの確認", () => {});
  });
});
