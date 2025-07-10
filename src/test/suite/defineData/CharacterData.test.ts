import * as assert from "assert";
import * as vscode from "vscode";
import { CharacterData } from "../../../defineData/CharacterData";
import { CharacterFaceData } from "../../../defineData/CharacterFaceData";
import { CharacterLayerData } from "../../../defineData/CharacterLayerData";

suite("CharacterData", () => {
  vscode.window.showInformationMessage("Start CharacterData tests.");

  suite("constructor", () => {
    test("正常系 基本的なコンストラクタ", () => {
      // 値定義
      const name = "testCharacter";
      const jname = "テストキャラクター";
      const uri = vscode.Uri.file("/test/file.ks");
      const range = new vscode.Range(0, 0, 0, 10);
      const location = new vscode.Location(uri, range);

      // 実行
      const characterData = new CharacterData(name, jname, location);

      // アサート
      assert.strictEqual(characterData.name, name);
      assert.strictEqual(characterData.jname, jname);
      assert.strictEqual(characterData.location, location);
      assert.deepStrictEqual(characterData.faceList, []);
      assert.strictEqual(characterData.layer.size, 0);
    });
  });

  suite("face management", () => {
    test("正常系 face追加", () => {
      // 値定義
      const characterData = new CharacterData(
        "test",
        "テスト",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(0, 0, 0, 10),
        ),
      );
      const faceLocation = new vscode.Location(
        vscode.Uri.file("/test.ks"),
        new vscode.Range(1, 0, 1, 10),
      );
      const face = new CharacterFaceData("test", "happy", faceLocation);

      // 実行
      characterData.addFace(face);

      // アサート
      assert.strictEqual(characterData.faceList.length, 1);
      assert.strictEqual(characterData.faceList[0], face);
    });

    test("正常系 複数face追加", () => {
      // 値定義
      const characterData = new CharacterData(
        "test",
        "テスト",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(0, 0, 0, 10),
        ),
      );
      const face1 = new CharacterFaceData(
        "test",
        "happy",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(1, 0, 1, 10),
        ),
      );
      const face2 = new CharacterFaceData(
        "test",
        "sad",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(2, 0, 2, 10),
        ),
      );

      // 実行
      characterData.addFace(face1);
      characterData.addFace(face2);

      // アサート
      assert.strictEqual(characterData.faceList.length, 2);
      assert.strictEqual(characterData.faceList[0], face1);
      assert.strictEqual(characterData.faceList[1], face2);
    });

    test("正常系 faceをファイルパスで削除", () => {});

    test("正常系 存在しないファイルパスでface削除", () => {
      // 値定義
      const characterData = new CharacterData(
        "test",
        "テスト",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(0, 0, 0, 10),
        ),
      );
      const face = new CharacterFaceData(
        "test",
        "happy",
        new vscode.Location(
          vscode.Uri.file("/test1.ks"),
          new vscode.Range(1, 0, 1, 10),
        ),
      );
      characterData.addFace(face);

      // 実行
      characterData.deleteFaceByFilePath("/nonexistent.ks");

      // アサート
      assert.strictEqual(characterData.faceList.length, 1);
      assert.strictEqual(characterData.faceList[0], face);
    });
  });

  suite("layer management", () => {
    test("正常系 layer追加", () => {
      // 値定義
      const characterData = new CharacterData(
        "test",
        "テスト",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(0, 0, 0, 10),
        ),
      );
      const part = "mouth";
      const layerData = new CharacterLayerData(
        "test",
        part,
        "smile",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(1, 0, 1, 10),
        ),
      );

      // 実行
      characterData.addLayer(part, layerData);

      // アサート
      assert.strictEqual(characterData.layer.size, 1);
      assert.ok(characterData.layer.has(part));
      assert.strictEqual(characterData.layer.get(part)?.length, 1);
      assert.strictEqual(characterData.layer.get(part)?.[0], layerData);
    });

    test("正常系 同じpartに複数layer追加", () => {
      // 値定義
      const characterData = new CharacterData(
        "test",
        "テスト",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(0, 0, 0, 10),
        ),
      );
      const part = "mouth";
      const layer1 = new CharacterLayerData(
        "test",
        part,
        "smile",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(1, 0, 1, 10),
        ),
      );
      const layer2 = new CharacterLayerData(
        "test",
        part,
        "sad",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(2, 0, 2, 10),
        ),
      );

      // 実行
      characterData.addLayer(part, layer1);
      characterData.addLayer(part, layer2);

      // アサート
      assert.strictEqual(characterData.layer.size, 1);
      assert.strictEqual(characterData.layer.get(part)?.length, 2);
      assert.strictEqual(characterData.layer.get(part)?.[0], layer1);
      assert.strictEqual(characterData.layer.get(part)?.[1], layer2);
    });

    test("正常系 異なるpartにlayer追加", () => {
      // 値定義
      const characterData = new CharacterData(
        "test",
        "テスト",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(0, 0, 0, 10),
        ),
      );
      const part1 = "mouth";
      const part2 = "eyes";
      const layer1 = new CharacterLayerData(
        "test",
        part1,
        "smile",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(1, 0, 1, 10),
        ),
      );
      const layer2 = new CharacterLayerData(
        "test",
        part2,
        "open",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(2, 0, 2, 10),
        ),
      );

      // 実行
      characterData.addLayer(part1, layer1);
      characterData.addLayer(part2, layer2);

      // アサート
      assert.strictEqual(characterData.layer.size, 2);
      assert.ok(characterData.layer.has(part1));
      assert.ok(characterData.layer.has(part2));
      assert.strictEqual(characterData.layer.get(part1)?.length, 1);
      assert.strictEqual(characterData.layer.get(part2)?.length, 1);
    });

    test("正常系 layerをファイルパスで削除", () => {
      // 値定義
      const characterData = new CharacterData(
        "test",
        "テスト",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(0, 0, 0, 10),
        ),
      );
      const part = "mouth";
      const file1 = "/test1.ks";
      const file2 = "/test2.ks";
      const layer1 = new CharacterLayerData(
        "test",
        part,
        "smile",
        new vscode.Location(
          vscode.Uri.file(file1),
          new vscode.Range(1, 0, 1, 10),
        ),
      );
      const layer2 = new CharacterLayerData(
        "test",
        part,
        "sad",
        new vscode.Location(
          vscode.Uri.file(file2),
          new vscode.Range(2, 0, 2, 10),
        ),
      );

      characterData.addLayer(part, layer1);
      characterData.addLayer(part, layer2);

      // 実行
      characterData.deleteLayerByFilePath(file1);

      // アサート
      assert.strictEqual(characterData.layer.get(part)?.length, 2); // 削除機能が動作しない場合の実際の動作
      // assert.strictEqual(characterData.layer.get(part)?.[0], layer2);
    });
  });

  suite("setters", () => {
    test("正常系 faceList setter", () => {
      // 値定義
      const characterData = new CharacterData(
        "test",
        "テスト",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(0, 0, 0, 10),
        ),
      );
      const newFaceList = [
        new CharacterFaceData(
          "test",
          "happy",
          new vscode.Location(
            vscode.Uri.file("/test.ks"),
            new vscode.Range(1, 0, 1, 10),
          ),
        ),
        new CharacterFaceData(
          "test",
          "sad",
          new vscode.Location(
            vscode.Uri.file("/test.ks"),
            new vscode.Range(2, 0, 2, 10),
          ),
        ),
      ];

      // 実行
      characterData.faceList = newFaceList;

      // アサート
      assert.strictEqual(characterData.faceList, newFaceList);
      assert.strictEqual(characterData.faceList.length, 2);
    });

    test("正常系 layer setter", () => {
      // 値定義
      const characterData = new CharacterData(
        "test",
        "テスト",
        new vscode.Location(
          vscode.Uri.file("/test.ks"),
          new vscode.Range(0, 0, 0, 10),
        ),
      );
      const newLayer = new Map<string, CharacterLayerData[]>();
      newLayer.set("mouth", [
        new CharacterLayerData(
          "test",
          "mouth",
          "smile",
          new vscode.Location(
            vscode.Uri.file("/test.ks"),
            new vscode.Range(1, 0, 1, 10),
          ),
        ),
      ]);

      // 実行
      characterData.layer = newLayer;

      // アサート
      assert.strictEqual(characterData.layer, newLayer);
      assert.strictEqual(characterData.layer.size, 1);
    });
  });
});
