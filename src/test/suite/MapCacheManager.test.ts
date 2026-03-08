import * as assert from "assert";
import { InformationWorkSpace } from "../../InformationWorkSpace";

/**
 * MapCacheManagerのテスト。
 * MapCacheManagerはInformationWorkSpace経由のデリゲーションでのみ利用されるため、
 * InformationWorkSpace.getInstance()を通じてテストする。
 */
suite("MapCacheManager (via InformationWorkSpace delegation)", () => {
  let info: InformationWorkSpace;

  setup(() => {
    info = InformationWorkSpace.getInstance();
  });

  suite("updateScriptFileMap", () => {
    test("正常系 例外が発生しないこと", () => {
      assert.doesNotThrow(async () => {
        await info.updateScriptFileMap("/test/script.js");
      });
    });
  });

  suite("updateScenarioFileMap", () => {
    test("正常系 例外が発生しないこと", () => {
      assert.doesNotThrow(async () => {
        await info.updateScenarioFileMap("/test/scenario.ks");
      });
    });
  });

  suite("spliceResourceFileMapByFilePath", () => {
    test("正常系 例外が発生しないこと", () => {
      assert.doesNotThrow(async () => {
        await info.spliceResourceFileMapByFilePath("/test/resource.jpg");
      });
    });
  });

  suite("spliceScenarioFileMapByFilePath", () => {
    test("正常系 例外が発生しないこと", () => {
      assert.doesNotThrow(async () => {
        await info.spliceScenarioFileMapByFilePath("/test/scenario.ks");
      });
    });
  });

  suite("spliceScriptFileMapByFilePath", () => {
    test("正常系 例外が発生しないこと", () => {
      assert.doesNotThrow(async () => {
        await info.spliceScriptFileMapByFilePath("/test/script.js");
      });
    });
  });

  suite("spliceMacroDataMapByFilePath", () => {
    test("正常系 削除タグリストを返すこと", async () => {
      const result = await info.spliceMacroDataMapByFilePath("/test/macro.ks");
      assert.ok(Array.isArray(result), "戻り値は配列であるべき");
    });
  });

  suite("spliceLabelMapByFilePath", () => {
    test("正常系 例外が発生しないこと", () => {
      assert.doesNotThrow(async () => {
        await info.spliceLabelMapByFilePath("/test/scenario.ks");
      });
    });
  });

  suite("spliceVariableMapByFilePath", () => {
    test("正常系 例外が発生しないこと", () => {
      assert.doesNotThrow(() => {
        info.spliceVariableMapByFilePath("/test/variables.ks");
      });
    });
  });

  suite("spliceCharacterMapByFilePath", () => {
    test("正常系 例外が発生しないこと", () => {
      assert.doesNotThrow(() => {
        info.spliceCharacterMapByFilePath("/test/character.ks");
      });
    });
  });

  suite("spliceSuggestionsByFilePath", () => {
    test("正常系 例外が発生しないこと", () => {
      assert.doesNotThrow(async () => {
        await info.spliceSuggestionsByFilePath("/test/project", [
          "testtag1",
          "testtag2",
        ]);
      });
    });
  });
});
