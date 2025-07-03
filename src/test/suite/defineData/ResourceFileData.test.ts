import * as assert from "assert";
import { ResourceFileData } from "../../../defineData/ResourceFileData";

suite("ResourceFileData", () => {
  suite("constructor", () => {
    test("正常系 基本的なコンストラクタ", () => {
      // 値定義
      const filePath = "/data/bgimage/test.png";
      const resourceType = "image";

      // 実行
      const resourceData = new ResourceFileData(filePath, resourceType);

      // アサート
      assert.strictEqual(resourceData.filePath, filePath);
      assert.strictEqual(resourceData.resourceType, resourceType);
      assert.strictEqual(resourceData.fileName, "test.png");
    });

    test("正常系 Windowsパス区切り文字", () => {
      // 値定義
      const filePath = "\\data\\bgimage\\background.jpg";
      const resourceType = "image";

      // 実行
      const resourceData = new ResourceFileData(filePath, resourceType);

      // アサート
      assert.strictEqual(resourceData.filePath, filePath);
      assert.strictEqual(resourceData.resourceType, resourceType);
      assert.strictEqual(resourceData.fileName, "background.jpg");
    });

    test("正常系 サブディレクトリのファイル", () => {
      // 値定義
      const filePath = "/data/sound/bgm/theme.mp3";
      const resourceType = "sound";

      // 実行
      const resourceData = new ResourceFileData(filePath, resourceType);

      // アサート
      assert.strictEqual(resourceData.filePath, filePath);
      assert.strictEqual(resourceData.resourceType, resourceType);
      assert.strictEqual(resourceData.fileName, "theme.mp3");
    });

    test("正常系 日本語ファイル名", () => {
      // 値定義
      const filePath = "/data/image/キャラクター/主人公.png";
      const resourceType = "image";

      // 実行
      const resourceData = new ResourceFileData(filePath, resourceType);

      // アサート
      assert.strictEqual(resourceData.filePath, filePath);
      assert.strictEqual(resourceData.resourceType, resourceType);
      assert.strictEqual(resourceData.fileName, "主人公.png");
    });

    test("正常系 特殊文字を含むファイル名", () => {
      // 値定義
      const filePath = "/data/image/char_01-bg.test_v2.png";
      const resourceType = "image";

      // 実行
      const resourceData = new ResourceFileData(filePath, resourceType);

      // アサート
      assert.strictEqual(resourceData.filePath, filePath);
      assert.strictEqual(resourceData.resourceType, resourceType);
      assert.strictEqual(resourceData.fileName, "char_01-bg.test_v2.png");
    });

    test("正常系 パス区切り文字なしのファイル", () => {
      // 値定義
      const filePath = "singlefile.txt";
      const resourceType = "text";

      // 実行
      const resourceData = new ResourceFileData(filePath, resourceType);

      // アサート
      assert.strictEqual(resourceData.filePath, filePath);
      assert.strictEqual(resourceData.resourceType, resourceType);
      assert.strictEqual(resourceData.fileName, "singlefile.txt");
    });

    test("正常系 異なるリソースタイプ", () => {
      // 値定義
      const testCases = [
        { filePath: "/data/video/intro.mp4", resourceType: "video", expectedName: "intro.mp4" },
        { filePath: "/data/scenario/chapter1.ks", resourceType: "scenario", expectedName: "chapter1.ks" },
        { filePath: "/data/others/script.js", resourceType: "script", expectedName: "script.js" },
        { filePath: "/data/3d/model.gltf", resourceType: "3d", expectedName: "model.gltf" },
        { filePath: "/style/main.css", resourceType: "css", expectedName: "main.css" }
      ];

      testCases.forEach(testCase => {
        // 実行
        const resourceData = new ResourceFileData(testCase.filePath, testCase.resourceType);

        // アサート
        assert.strictEqual(resourceData.filePath, testCase.filePath, `filePath should match for ${testCase.resourceType}`);
        assert.strictEqual(resourceData.resourceType, testCase.resourceType, `resourceType should match for ${testCase.resourceType}`);
        assert.strictEqual(resourceData.fileName, testCase.expectedName, `fileName should match for ${testCase.resourceType}`);
      });
    });

    test("正常系 空文字列のリソースタイプ", () => {
      // 値定義
      const filePath = "/data/unknown/file.ext";
      const resourceType = "";

      // 実行
      const resourceData = new ResourceFileData(filePath, resourceType);

      // アサート
      assert.strictEqual(resourceData.filePath, filePath);
      assert.strictEqual(resourceData.resourceType, resourceType);
      assert.strictEqual(resourceData.fileName, "file.ext");
    });
  });

  suite("getters", () => {
    test("正常系 全てのプロパティが読み取り専用", () => {
      // 値定義
      const filePath = "/test/path/testfile.png";
      const resourceType = "image";
      const resourceData = new ResourceFileData(filePath, resourceType);

      // アサート - getterが存在し、値が正しく取得できることを確認
      assert.strictEqual(resourceData.fileName, "testfile.png");
      assert.strictEqual(resourceData.filePath, filePath);
      assert.strictEqual(resourceData.resourceType, resourceType);

      // setterが存在しないことを確認（読み取り専用）
      assert.strictEqual((resourceData as any).fileName = "newname", "newname");
      assert.strictEqual(resourceData.fileName, "testfile.png", "fileNameは変更されないべき");
    });
  });
});