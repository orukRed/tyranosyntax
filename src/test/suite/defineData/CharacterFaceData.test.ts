import * as assert from "assert";
import * as vscode from "vscode";
import { CharacterFaceData } from "../../../defineData/CharacterFaceData";

suite("CharacterFaceData", () => {
  vscode.window.showInformationMessage("Start CharacterFaceData tests.");

  suite("constructor", () => {
    test("正常系 基本的なコンストラクタ", () => {
      // 値定義
      const name = "testCharacter";
      const face = "happy";
      const uri = vscode.Uri.file("/test/file.ks");
      const range = new vscode.Range(0, 0, 0, 10);
      const location = new vscode.Location(uri, range);

      // 実行
      const faceData = new CharacterFaceData(name, face, location);

      // アサート
      assert.strictEqual(faceData.name, name);
      assert.strictEqual(faceData.face, face);
      assert.strictEqual(faceData.location, location);
    });

    test("正常系 空文字列のname", () => {
      // 値定義
      const name = "";
      const face = "neutral";
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(0, 0, 0, 10));

      // 実行
      const faceData = new CharacterFaceData(name, face, location);

      // アサート
      assert.strictEqual(faceData.name, name);
      assert.strictEqual(faceData.face, face);
    });

    test("正常系 空文字列のface", () => {
      // 値定義
      const name = "character";
      const face = "";
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(0, 0, 0, 10));

      // 実行
      const faceData = new CharacterFaceData(name, face, location);

      // アサート
      assert.strictEqual(faceData.name, name);
      assert.strictEqual(faceData.face, face);
    });

    test("正常系 日本語のname", () => {
      // 値定義
      const name = "テストキャラクター";
      const face = "笑顔";
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(0, 0, 0, 10));

      // 実行
      const faceData = new CharacterFaceData(name, face, location);

      // アサート
      assert.strictEqual(faceData.name, name);
      assert.strictEqual(faceData.face, face);
    });

    test("正常系 特殊文字を含む値", () => {
      // 値定義
      const name = "char_01-test";
      const face = "face_happy.png";
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(0, 0, 0, 10));

      // 実行
      const faceData = new CharacterFaceData(name, face, location);

      // アサート
      assert.strictEqual(faceData.name, name);
      assert.strictEqual(faceData.face, face);
    });
  });

  suite("getters", () => {
    test("正常系 全てのプロパティが読み取り専用", () => {
      // 値定義
      const name = "testCharacter";
      const face = "happy";
      const location = new vscode.Location(vscode.Uri.file("/test.ks"), new vscode.Range(0, 0, 0, 10));
      const faceData = new CharacterFaceData(name, face, location);

      // アサート - getterが存在し、値が正しく取得できることを確認
      assert.strictEqual(faceData.name, name);
      assert.strictEqual(faceData.face, face);
      assert.strictEqual(faceData.location, location);

      // 参照の同一性を確認
      assert.strictEqual(faceData.location.uri, location.uri);
      assert.strictEqual(faceData.location.range.start.line, location.range.start.line);
      assert.strictEqual(faceData.location.range.start.character, location.range.start.character);
      assert.strictEqual(faceData.location.range.end.line, location.range.end.line);
      assert.strictEqual(faceData.location.range.end.character, location.range.end.character);
    });
  });
});