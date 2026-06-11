import * as assert from "assert";
import { formatText } from "../../subscriptions/TyranoFormatter";

async function fmt(input: string): Promise<string> {
  return (await formatText(input)).text;
}

suite("TyranoFormatter.formatText", () => {
  test("macro の中身を2スペースでインデントする", async () => {
    const input = ['[macro name="x"]', '[bg storage="a.jpg"]', "[endmacro]"].join(
      "\n",
    );
    const expected = [
      '[macro name="x"]',
      '  [bg storage="a.jpg"]',
      "[endmacro]",
    ].join("\n");
    assert.strictEqual(await fmt(input), expected);
  });

  test("ネストは段ごとに加算される（4スペース）", async () => {
    const input = [
      '[macro name="x"]',
      '[if exp="f.a"]',
      "[bg]",
      "[endif]",
      "[endmacro]",
    ].join("\n");
    const expected = [
      '[macro name="x"]',
      '  [if exp="f.a"]',
      "    [bg]",
      "  [endif]",
      "[endmacro]",
    ].join("\n");
    assert.strictEqual(await fmt(input), expected);
  });

  test("if/elsif/else/endif の中間タグは if と同じ深さに出力する", async () => {
    const input = [
      '[if exp="f.a==1"]',
      '[bg storage="a"]',
      '[elsif exp="f.a==2"]',
      '[bg storage="b"]',
      "[else]",
      '[bg storage="c"]',
      "[endif]",
    ].join("\n");
    const expected = [
      '[if exp="f.a==1"]',
      '  [bg storage="a"]',
      '[elsif exp="f.a==2"]',
      '  [bg storage="b"]',
      "[else]",
      '  [bg storage="c"]',
      "[endif]",
    ].join("\n");
    assert.strictEqual(await fmt(input), expected);
  });

  test("対になる各種タグでインデント/デデントされる", async () => {
    const pairs: [string, string][] = [
      ["nowait", "endnowait"],
      ["link", "endlink"],
      ["vibrate", "vibrate_stop"],
      ["keyframe", "endkeyframe"],
      ["kanim", "stop_kanim"],
      ["speak_on", "speak_off"],
      ["3d_event_start", "3d_event_stop"],
    ];
    for (const [start, end] of pairs) {
      const input = [`[${start}]`, "[bg]", `[${end}]`].join("\n");
      const expected = [`[${start}]`, "  [bg]", `[${end}]`].join("\n");
      assert.strictEqual(await fmt(input), expected, `pair ${start}/${end}`);
    }
  });

  test("@記法でも同様にインデントされる", async () => {
    const input = ['@macro name="x"', '@bg storage="a"', "@endmacro"].join("\n");
    const expected = [
      '@macro name="x"',
      '  @bg storage="a"',
      "@endmacro",
    ].join("\n");
    assert.strictEqual(await fmt(input), expected);
  });

  test("iscript 内は JavaScript として整形され再インデントされる", async () => {
    const input = ["[iscript]", "f.a=1", "[endscript]"].join("\n");
    const expected = ["[iscript]", "  f.a = 1;", "[endscript]"].join("\n");
    assert.strictEqual(await fmt(input), expected);
  });

  test("@iscript 内も JavaScript として整形される", async () => {
    const input = ["@iscript", "f.a=1", "@endscript"].join("\n");
    const expected = ["@iscript", "  f.a = 1;", "@endscript"].join("\n");
    assert.strictEqual(await fmt(input), expected);
  });

  test("html 内は HTML として整形され再インデントされる", async () => {
    const input = ["[html]", '<div    id="x">hi</div>', "[endhtml]"].join("\n");
    const expected = ["[html]", '  <div id="x">hi</div>', "[endhtml]"].join(
      "\n",
    );
    assert.strictEqual(await fmt(input), expected);
  });

  test("空の iscript ブロックは内側を出力しない", async () => {
    const input = ["[iscript]", "[endscript]"].join("\n");
    const expected = ["[iscript]", "[endscript]"].join("\n");
    assert.strictEqual(await fmt(input), expected);
  });

  test("prettier が失敗しても元内容を保持し警告を返す", async () => {
    const input = ["[iscript]", "this is (((not valid js", "[endscript]"].join(
      "\n",
    );
    const { text, warnings } = await formatText(input);
    const expected = [
      "[iscript]",
      "  this is (((not valid js",
      "[endscript]",
    ].join("\n");
    assert.strictEqual(text, expected);
    assert.strictEqual(warnings.length, 1);
  });

  test("[p] / @p を含む行の後に空行は挿入されない", async () => {
    const input = ["おはよう[p]", "[bg]", "@p", "[bg]"].join("\n");
    assert.strictEqual(await fmt(input), input);
  });

  test("同一行に開始＋終了タグがある場合は深さを変えない", async () => {
    const input = ["[nowait][endnowait]", "[bg]"].join("\n");
    assert.strictEqual(await fmt(input), input);
  });

  test("未クローズのブロックでもクラッシュしない", async () => {
    const input = ['[macro name="x"]', "[bg]"].join("\n");
    const expected = ['[macro name="x"]', "  [bg]"].join("\n");
    assert.strictEqual(await fmt(input), expected);
  });

  test("余分な終了タグでも負のインデントにならない", async () => {
    const input = ["[endif]", "[bg]"].join("\n");
    assert.strictEqual(await fmt(input), input);
  });

  test("CRLF を保持する", async () => {
    const input = "[macro]\r\n[bg]\r\n[endmacro]";
    const expected = "[macro]\r\n  [bg]\r\n[endmacro]";
    assert.strictEqual(await fmt(input), expected);
  });

  test("BOM を保持する", async () => {
    const input = "﻿[bg]";
    assert.strictEqual(await fmt(input), "﻿[bg]");
  });

  test("末尾改行の有無を保持する", async () => {
    assert.strictEqual(await fmt("[bg]\n"), "[bg]\n");
    assert.strictEqual(await fmt("[bg]"), "[bg]");
  });

  test("タグ行の末尾空白を除去する", async () => {
    assert.strictEqual(await fmt("[bg]   "), "[bg]");
  });

  test("空行はインデントしない", async () => {
    const input = ["[macro]", "", "[bg]", "[endmacro]"].join("\n");
    const expected = ["[macro]", "", "  [bg]", "[endmacro]"].join("\n");
    assert.strictEqual(await fmt(input), expected);
  });

  test("ブロック内のコメント/ラベル/キャラ名もインデントする", async () => {
    const input = [
      "[macro]",
      ";comment",
      "*label",
      "#chara",
      "[bg]",
      "[endmacro]",
    ].join("\n");
    const expected = [
      "[macro]",
      "  ;comment",
      "  *label",
      "  #chara",
      "  [bg]",
      "[endmacro]",
    ].join("\n");
    assert.strictEqual(await fmt(input), expected);
  });

  test("/* */ ブロックコメント内はタグ深さに影響しない", async () => {
    const input = ["/*", "[macro]", "[endmacro]", "*/", "[bg]"].join("\n");
    assert.strictEqual(await fmt(input), input);
  });

  test("タグのないテキストのみのファイル", async () => {
    const input = ["これはテキスト", "複数行"].join("\n");
    assert.strictEqual(await fmt(input), input);
  });

  test("冪等性: 2回フォーマットしても結果が変わらない", async () => {
    const input = [
      '[macro name="x"]',
      "おはよう[p]",
      '[if exp="f.a"]',
      "[iscript]",
      "f.a=1",
      "[endscript]",
      "[endif]",
      "[endmacro]",
    ].join("\n");
    const once = await fmt(input);
    const twice = await fmt(once);
    assert.strictEqual(twice, once);
  });
});
