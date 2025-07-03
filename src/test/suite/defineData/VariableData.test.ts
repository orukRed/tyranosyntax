import * as assert from "assert";
import * as vscode from "vscode";
import { VariableData } from "../../../defineData/VariableData";

suite("VariableData", () => {
  vscode.window.showInformationMessage("Start VariableData tests.");

  suite("constructor", () => {
    test("正常系 基本的なコンストラクタ", () => {
      // 値定義
      const name = "testVar";
      const value = "testValue";
      const kind = "f";

      // 実行
      const variableData = new VariableData(name, value, kind);

      // アサート
      assert.strictEqual(variableData.name, name);
      assert.strictEqual(variableData.kind, kind);
      assert.strictEqual(variableData.type, "");
      assert.strictEqual(variableData.description, "");
      assert.deepStrictEqual(variableData.nestVariableData, []);
      assert.deepStrictEqual(variableData.locations, []);
    });

    test("正常系 全パラメータ指定", () => {
      // 値定義
      const name = "complexVar";
      const value = "complexValue";
      const kind = "sf";
      const type = "string";
      const description = "テスト用変数";
      const nestData = [new VariableData("nested", "nestedValue", "tf")];

      // 実行
      const variableData = new VariableData(name, value, kind, type, description, nestData);

      // アサート
      assert.strictEqual(variableData.name, name);
      assert.strictEqual(variableData.kind, kind);
      assert.strictEqual(variableData.type, type);
      assert.strictEqual(variableData.description, description);
      assert.strictEqual(variableData.nestVariableData.length, 1);
      assert.strictEqual(variableData.nestVariableData[0].name, "nested");
    });

    test("正常系 value undefined", () => {
      // 値定義
      const name = "undefinedVar";
      const value = undefined;
      const kind = "mp";

      // 実行
      const variableData = new VariableData(name, value, kind);

      // アサート
      assert.strictEqual(variableData.name, name);
      assert.strictEqual(variableData.kind, kind);
    });

    test("正常系 kind undefined", () => {
      // 値定義
      const name = "noKindVar";
      const value = "value";
      const kind = undefined;

      // 実行
      const variableData = new VariableData(name, value, kind);

      // アサート
      assert.strictEqual(variableData.name, name);
      assert.strictEqual(variableData.kind, undefined);
    });
  });

  suite("locations management", () => {
    test("正常系 location追加", () => {
      // 値定義
      const variableData = new VariableData("test", "value", "f");
      const uri = vscode.Uri.file("/test/file.ks");
      const range = new vscode.Range(0, 0, 0, 10);
      const location = new vscode.Location(uri, range);

      // 実行
      variableData.addLocation(location);

      // アサート
      assert.strictEqual(variableData.locations.length, 1);
      assert.strictEqual(variableData.locations[0], location);
    });

    test("正常系 複数location追加", () => {
      // 値定義
      const variableData = new VariableData("test", "value", "f");
      const uri1 = vscode.Uri.file("/test/file1.ks");
      const uri2 = vscode.Uri.file("/test/file2.ks");
      const location1 = new vscode.Location(uri1, new vscode.Range(0, 0, 0, 10));
      const location2 = new vscode.Location(uri2, new vscode.Range(1, 0, 1, 10));

      // 実行
      variableData.addLocation(location1);
      variableData.addLocation(location2);

      // アサート
      assert.strictEqual(variableData.locations.length, 2);
      assert.strictEqual(variableData.locations[0], location1);
      assert.strictEqual(variableData.locations[1], location2);
    });

    test("正常系 location削除", () => {
      // 値定義
      const variableData = new VariableData("test", "value", "f");
      const uri1 = vscode.Uri.file("/test/file1.ks");
      const uri2 = vscode.Uri.file("/test/file2.ks");
      const location1 = new vscode.Location(uri1, new vscode.Range(0, 0, 0, 10));
      const location2 = new vscode.Location(uri2, new vscode.Range(1, 0, 1, 10));
      
      variableData.addLocation(location1);
      variableData.addLocation(location2);

      // 実行
      variableData.deleteLocation(uri1);

      // アサート
      assert.strictEqual(variableData.locations.length, 1);
      assert.strictEqual(variableData.locations[0].uri.fsPath, uri2.fsPath);
    });

    test("正常系 存在しないlocation削除", () => {
      // 値定義
      const variableData = new VariableData("test", "value", "f");
      const uri1 = vscode.Uri.file("/test/file1.ks");
      const uri2 = vscode.Uri.file("/test/file2.ks");
      const location1 = new vscode.Location(uri1, new vscode.Range(0, 0, 0, 10));
      
      variableData.addLocation(location1);

      // 実行
      variableData.deleteLocation(uri2);

      // アサート
      assert.strictEqual(variableData.locations.length, 1);
      assert.strictEqual(variableData.locations[0], location1);
    });
  });

  suite("type setter/getter", () => {
    test("正常系 type設定", () => {
      // 値定義
      const variableData = new VariableData("test", "value", "f");
      const newType = "number";

      // 実行
      variableData.type = newType;

      // アサート
      assert.strictEqual(variableData.type, newType);
    });
  });

  suite("nestVariableData setter", () => {
    test("正常系 nestVariableData設定", () => {
      // 値定義
      const variableData = new VariableData("test", "value", "f");
      const nested1 = new VariableData("nested1", "value1", "sf");
      const nested2 = new VariableData("nested2", "value2", "tf");
      const nestData = [nested1, nested2];

      // 実行
      variableData.nestVariableData = nestData;

      // アサート
      assert.strictEqual(variableData.nestVariableData.length, 2);
      assert.strictEqual(variableData.nestVariableData[0], nested1);
      assert.strictEqual(variableData.nestVariableData[1], nested2);
    });
  });
});