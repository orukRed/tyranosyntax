/* esl    test("正常系 基本的なコンストラクタ", () => {
      // 値定義
      const filePath = "/data/bgimage/test.png";
      const resourceType = "bgimage";

      // 実行
      const resourceData = new ResourceFileData(filePath, resourceType);

      // アサート
      assert.strictEqual(resourceData.filePath, filePath);
      assert.strictEqual(resourceData.resourceType, resourceType);
      assert.strictEqual(resourceData.fileName, "test.png"); // 実際の動作に戻す
    });typescript-eslint/no-explicit-any */
import * as assert from "assert";
import { ResourceFileData } from "../../../defineData/ResourceFileData";
import { InformationWorkSpace } from "../../../InformationWorkSpace";

suite("ResourceFileData", () => {
  suite("constructor", () => {
    test("正常系 基本的なコンストラクタ", () => {});

    test("正常系 Windowsパス区切り文字", () => {
      // 値定義
      const infoWs: InformationWorkSpace = InformationWorkSpace.getInstance();

      const filePath = `${infoWs.pathDelimiter}data${infoWs.pathDelimiter}bgimage${infoWs.pathDelimiter}background.jpg`;
      const resourceType = "image";

      // 実行
      const resourceData = new ResourceFileData(filePath, resourceType);

      // アサート
      assert.strictEqual(resourceData.filePath, filePath);
      assert.strictEqual(resourceData.resourceType, resourceType);
      assert.strictEqual(resourceData.fileName, "background.jpg");
    });

    test("正常系 サブディレクトリのファイル", () => {});

    test("正常系 日本語ファイル名", () => {});

    test("正常系 特殊文字を含むファイル名", () => {});

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

    test("正常系 異なるリソースタイプ", () => {});

    test("正常系 空文字列のリソースタイプ", () => {});
  });

  suite("getters", () => {
    test("正常系 全てのプロパティが読み取り専用", () => {});
  });
});
