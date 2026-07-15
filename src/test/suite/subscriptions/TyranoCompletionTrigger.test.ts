import * as assert from "assert";
import {
  AUTO_COMPLETION_TRIGGER_CHARACTERS,
  getCompletionTriggerCharacters,
  shouldTriggerCompletionAutomatically,
} from "../../../subscriptions/TyranoCompletionTrigger";

suite("TyranoCompletionTrigger", () => {
  suite("getCompletionTriggerCharacters", () => {
    test("自動補完が有効ならトリガー文字を返す", () => {
      const triggerCharacters = getCompletionTriggerCharacters(true);
      assert.deepStrictEqual(triggerCharacters, [
        ...AUTO_COMPLETION_TRIGGER_CHARACTERS,
      ]);
      assert.ok(triggerCharacters.includes("b"));
      assert.ok(triggerCharacters.includes("g"));
    });

    test("自動補完が無効ならトリガー文字を返さない", () => {
      assert.deepStrictEqual(getCompletionTriggerCharacters(false), []);
    });
  });

  suite("shouldTriggerCompletionAutomatically", () => {
    test("タグ開始文字では自動補完する", () => {
      assert.strictEqual(shouldTriggerCompletionAutomatically("[", "["), true);
      assert.strictEqual(
        shouldTriggerCompletionAutomatically("  @", "@"),
        true,
      );
    });

    test("行頭でタグ名だけを入力した場合も自動補完する", () => {
      assert.strictEqual(shouldTriggerCompletionAutomatically("b", "b"), true);
      assert.strictEqual(shouldTriggerCompletionAutomatically("bg", "g"), true);
      assert.strictEqual(
        shouldTriggerCompletionAutomatically("  3d_", "_"),
        true,
      );
    });

    test("本文途中の英数字では自動補完しない", () => {
      assert.strictEqual(
        shouldTriggerCompletionAutomatically("本文b", "b"),
        false,
      );
      assert.strictEqual(
        shouldTriggerCompletionAutomatically("text b", "b"),
        false,
      );
    });

    test("タグ内の空白と引用符では自動補完する", () => {
      assert.strictEqual(
        shouldTriggerCompletionAutomatically("[bg ", " "),
        true,
      );
      assert.strictEqual(
        shouldTriggerCompletionAutomatically('[bg storage="', '"'),
        true,
      );
      assert.strictEqual(
        shouldTriggerCompletionAutomatically("@bg ", " "),
        true,
      );
    });

    test("本文中の空白と引用符では自動補完しない", () => {
      assert.strictEqual(
        shouldTriggerCompletionAutomatically("本文 ", " "),
        false,
      );
      assert.strictEqual(
        shouldTriggerCompletionAutomatically('本文"', '"'),
        false,
      );
    });

    test("変数のドットでは自動補完する", () => {
      assert.strictEqual(
        shouldTriggerCompletionAutomatically('[eval exp="f.', "."),
        true,
      );
      assert.strictEqual(
        shouldTriggerCompletionAutomatically('[eval exp="sf.user.', "."),
        true,
      );
      assert.strictEqual(
        shouldTriggerCompletionAutomatically("本文.", "."),
        false,
      );
    });

    test("ラベルとキャラクター名は行頭だけ自動補完する", () => {
      assert.strictEqual(shouldTriggerCompletionAutomatically(" *", "*"), true);
      assert.strictEqual(shouldTriggerCompletionAutomatically(" #", "#"), true);
      assert.strictEqual(
        shouldTriggerCompletionAutomatically("本文 *", "*"),
        false,
      );
      assert.strictEqual(
        shouldTriggerCompletionAutomatically("本文 #", "#"),
        false,
      );
    });
  });
});
