import * as assert from "assert";
import * as vscode from "vscode";
import { CharacterLayerData } from "../../../defineData/CharacterLayerData";

suite("CharacterLayerData", () => {
  vscode.window.showInformationMessage("Start CharacterLayerData tests.");

  suite("constructor", () => {
    test("正常系 基本的なコンストラクタ", () => {
      // 値定義
      const name = "yuko";
      const part = "mouth";
      const id = "smile";
      const uri = vscode.Uri.file("/test/file.ks");
      const range = new vscode.Range(0, 0, 0, 10);
      const location = new vscode.Location(uri, range);

      // 実行
      const layerData = new CharacterLayerData(name, part, id, location);

      // アサート
      assert.strictEqual(layerData.name, name);
      assert.strictEqual(layerData.part, part);
      assert.strictEqual(layerData.id, id);
      assert.strictEqual(layerData.location, location);
    });

    test("正常系 空文字列のname", () => {
      // 値定義
      const name = "";
      const part = "eyes";
      const id = "open";
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(0, 0, 0, 10));

      // 実行
      const layerData = new CharacterLayerData(name, part, id, location);

      // アサート
      assert.strictEqual(layerData.name, name);
      assert.strictEqual(layerData.part, part);
      assert.strictEqual(layerData.id, id);
    });

    test("正常系 空文字列のpart", () => {
      // 値定義
      const name = "character";
      const part = "";
      const id = "default";
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(0, 0, 0, 10));

      // 実行
      const layerData = new CharacterLayerData(name, part, id, location);

      // アサート
      assert.strictEqual(layerData.name, name);
      assert.strictEqual(layerData.part, part);
      assert.strictEqual(layerData.id, id);
    });

    test("正常系 空文字列のid", () => {
      // 値定義
      const name = "character";
      const part = "face";
      const id = "";
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(0, 0, 0, 10));

      // 実行
      const layerData = new CharacterLayerData(name, part, id, location);

      // アサート
      assert.strictEqual(layerData.name, name);
      assert.strictEqual(layerData.part, part);
      assert.strictEqual(layerData.id, id);
    });

    test("正常系 日本語の値", () => {
      // 値定義
      const name = "ゆうこ";
      const part = "口";
      const id = "笑顔";
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(0, 0, 0, 10));

      // 実行
      const layerData = new CharacterLayerData(name, part, id, location);

      // アサート
      assert.strictEqual(layerData.name, name);
      assert.strictEqual(layerData.part, part);
      assert.strictEqual(layerData.id, id);
    });

    test("正常系 特殊文字を含む値", () => {
      // 値定義
      const name = "char_01-test";
      const part = "part_mouth.001";
      const id = "id_smile_v2";
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(0, 0, 0, 10));

      // 実行
      const layerData = new CharacterLayerData(name, part, id, location);

      // アサート
      assert.strictEqual(layerData.name, name);
      assert.strictEqual(layerData.part, part);
      assert.strictEqual(layerData.id, id);
    });

    test("正常系 長い文字列", () => {
      // 値定義
      const name = "a".repeat(100);
      const part = "b".repeat(50);
      const id = "c".repeat(200);
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(0, 0, 0, 10));

      // 実行
      const layerData = new CharacterLayerData(name, part, id, location);

      // アサート
      assert.strictEqual(layerData.name, name);
      assert.strictEqual(layerData.part, part);
      assert.strictEqual(layerData.id, id);
    });
  });

  suite("getters", () => {
    test("正常系 全てのプロパティが読み取り専用", () => {
      // 値定義
      const name = "testCharacter";
      const part = "testPart";
      const id = "testId";
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(1, 5, 1, 15));
      const layerData = new CharacterLayerData(name, part, id, location);

      // アサート - getterが存在し、値が正しく取得できることを確認
      assert.strictEqual(layerData.name, name);
      assert.strictEqual(layerData.part, part);
      assert.strictEqual(layerData.id, id);
      assert.strictEqual(layerData.location, location);

      // 参照の同一性を確認
      assert.strictEqual(layerData.location.uri, location.uri);
      assert.strictEqual(layerData.location.range.start.line, location.range.start.line);
      assert.strictEqual(layerData.location.range.start.character, location.range.start.character);
      assert.strictEqual(layerData.location.range.end.line, location.range.end.line);
      assert.strictEqual(layerData.location.range.end.character, location.range.end.character);
    });
  });
});