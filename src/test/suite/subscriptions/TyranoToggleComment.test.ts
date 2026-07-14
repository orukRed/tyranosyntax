/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import {
  isInsideIscript,
  isInsideHtml,
} from "../../../subscriptions/TyranoToggleComment";

/**
 * lineAtのみ実装した簡易モックドキュメント。
 * isInsideIscript/isInsideHtmlはlineAt(i).textしか参照しない。
 */
const makeMockDoc = (lines: string[]): vscode.TextDocument =>
  ({
    lineCount: lines.length,
    lineAt: (lineNo: number) => ({ text: lines[lineNo] ?? "" }),
  }) as any;

suite("TyranoToggleComment.isInsideIscript", () => {
  test("正常系 iscript-endscriptブロック内の行はtrue", () => {
    const doc = makeMockDoc(["[iscript]", "f.hoge = 1;", "[endscript]"]);
    assert.strictEqual(isInsideIscript(doc, 1), true);
  });

  test("正常系 開始タグ行自体はfalse（外側扱い）", () => {
    const doc = makeMockDoc(["[iscript]", "f.hoge = 1;", "[endscript]"]);
    assert.strictEqual(isInsideIscript(doc, 0), false);
  });

  test("正常系 終了タグ行自体はfalse（外側扱い）", () => {
    const doc = makeMockDoc(["[iscript]", "f.hoge = 1;", "[endscript]"]);
    assert.strictEqual(isInsideIscript(doc, 2), false);
  });

  test("正常系 ブロックの前の行はfalse", () => {
    const doc = makeMockDoc(["通常テキスト", "[iscript]", "f.hoge = 1;", "[endscript]"]);
    assert.strictEqual(isInsideIscript(doc, 0), false);
  });

  test("正常系 ブロックの後の行はfalse", () => {
    const doc = makeMockDoc(["[iscript]", "f.hoge = 1;", "[endscript]", "通常テキスト"]);
    assert.strictEqual(isInsideIscript(doc, 3), false);
  });

  test("正常系 @記法のiscript/endscriptにも対応する", () => {
    const doc = makeMockDoc(["@iscript", "f.hoge = 1;", "@endscript"]);
    assert.strictEqual(isInsideIscript(doc, 1), true);
    assert.strictEqual(isInsideIscript(doc, 0), false);
    assert.strictEqual(isInsideIscript(doc, 2), false);
  });

  test("正常系 属性付きの開始タグにも対応する", () => {
    const doc = makeMockDoc(['[iscript cond="f.flag==1"]', "f.hoge = 1;", "[endscript]"]);
    assert.strictEqual(isInsideIscript(doc, 1), true);
  });

  test("正常系 大文字小文字を区別しない", () => {
    const doc = makeMockDoc(["[ISCRIPT]", "f.hoge = 1;", "[EndScript]"]);
    assert.strictEqual(isInsideIscript(doc, 1), true);
  });

  test("正常系 タグ行の先頭空白は無視される", () => {
    const doc = makeMockDoc(["  [iscript]", "f.hoge = 1;", "  [endscript]"]);
    assert.strictEqual(isInsideIscript(doc, 1), true);
    assert.strictEqual(isInsideIscript(doc, 0), false);
  });

  test("正常系 未クローズのブロックでは開始タグ以降がtrue", () => {
    const doc = makeMockDoc(["[iscript]", "f.hoge = 1;", "f.fuga = 2;"]);
    assert.strictEqual(isInsideIscript(doc, 1), true);
    assert.strictEqual(isInsideIscript(doc, 2), true);
  });

  test("正常系 閉じたブロックの後の2つ目のブロックも判定できる", () => {
    const doc = makeMockDoc([
      "[iscript]",
      "f.hoge = 1;",
      "[endscript]",
      "通常テキスト",
      "[iscript]",
      "f.fuga = 2;",
      "[endscript]",
    ]);
    assert.strictEqual(isInsideIscript(doc, 3), false);
    assert.strictEqual(isInsideIscript(doc, 5), true);
  });

  test("異常系 ブロックが無いドキュメントは常にfalse", () => {
    const doc = makeMockDoc(["通常テキスト", "[bg storage=\"a.jpg\"]"]);
    assert.strictEqual(isInsideIscript(doc, 0), false);
    assert.strictEqual(isInsideIscript(doc, 1), false);
  });
});

suite("TyranoToggleComment.isInsideHtml", () => {
  test("正常系 html-endhtmlブロック内の行はtrue", () => {
    const doc = makeMockDoc(["[html]", "<b>強調</b>", "[endhtml]"]);
    assert.strictEqual(isInsideHtml(doc, 1), true);
  });

  test("正常系 開始・終了タグ行自体はfalse（外側扱い）", () => {
    const doc = makeMockDoc(["[html]", "<b>強調</b>", "[endhtml]"]);
    assert.strictEqual(isInsideHtml(doc, 0), false);
    assert.strictEqual(isInsideHtml(doc, 2), false);
  });

  test("正常系 @記法のhtml/endhtmlにも対応する", () => {
    const doc = makeMockDoc(["@html", "<b>強調</b>", "@endhtml"]);
    assert.strictEqual(isInsideHtml(doc, 1), true);
  });

  test("正常系 iscriptブロック内の行はhtml判定ではfalse", () => {
    const doc = makeMockDoc(["[iscript]", "f.hoge = 1;", "[endscript]"]);
    assert.strictEqual(isInsideHtml(doc, 1), false);
  });
});
