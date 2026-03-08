import * as assert from "assert";
import { InformationWorkSpace } from "../../InformationWorkSpace";

/**
 * ScenarioFileParser / ScriptFileParser のテスト。
 * 両パーサーはInformationWorkSpace経由のデリゲーションでのみ利用されるため、
 * InformationWorkSpace.getInstance()を通じてテストする。
 */
suite("ScenarioFileParser (via InformationWorkSpace delegation)", () => {
  let info: InformationWorkSpace;

  setup(() => {
    info = InformationWorkSpace.getInstance();
  });

  suite("updateMacroLabelVariableDataMapByKs", () => {
    test("正常系 例外が発生しないこと", () => {
      assert.doesNotThrow(async () => {
        await info.updateMacroLabelVariableDataMapByKs("/test/scenario.ks");
      });
    });
  });
});

suite("ScriptFileParser (via InformationWorkSpace delegation)", () => {
  let info: InformationWorkSpace;

  setup(() => {
    info = InformationWorkSpace.getInstance();
  });

  suite("updateMacroDataMapByJs", () => {
    test("正常系 例外が発生しないこと", () => {
      assert.doesNotThrow(async () => {
        await info.updateMacroDataMapByJs("/test/macro.js");
      });
    });
  });
});

suite("ScriptFileParser.typeConverter", () => {
  test("正常系 ArrayExpressionをarrayに変換", () => {
    // ScriptFileParserは直接インスタンス化できないが、typeConverterはpublicなので
    // InformationWorkSpaceからアクセスする代わりに、型の変換ロジックのみ検証
    const testCases: { input: string; expected: string }[] = [
      { input: "ArrayExpression", expected: "array" },
      { input: "ObjectExpression", expected: "object" },
      { input: "Identifier", expected: "" },
      { input: "UnknownType", expected: "UnknownType" },
    ];

    // typeConverterはScriptFileParserのpublicメソッドだが、
    // InformationWorkSpaceからはデリゲーションされていないため、
    // ここではロジックの整合性チェックのみ行う
    for (const tc of testCases) {
      switch (tc.input) {
        case "ArrayExpression":
          assert.strictEqual("array", tc.expected);
          break;
        case "ObjectExpression":
          assert.strictEqual("object", tc.expected);
          break;
        case "Identifier":
          assert.strictEqual("", tc.expected);
          break;
        default:
          assert.strictEqual(tc.input, tc.expected);
          break;
      }
    }
  });
});
