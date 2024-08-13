import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { TyranoCreateTagByShortcutKey } from "../../../subscriptions/TyranoCreateTagByShortcutKey";
// import * as myExtension from '../../extension';

suite("TyranoCreateTagByShortcutKey.KeyPushShiftEnter関数", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("正常系", () => {
    //値定義
    const ctby = new TyranoCreateTagByShortcutKey();
    const excepted = true;

    //実行
    const actual = ctby.KeyPushShiftEnter();

    //アサート
    assert.strictEqual(actual, excepted);
  });
});

suite("TyranoCreateTagByShortcutKey.KeyPushCtrlEnter関数", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("正常系", () => {
    //値定義
    const ctby = new TyranoCreateTagByShortcutKey();
    const excepted = true;

    //実行
    const actual = ctby.KeyPushCtrlEnter();

    //アサート
    assert.strictEqual(actual, excepted);
  });
});

suite("TyranoCreateTagByShortcutKey.KeyPushAltEnter関数", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("正常系", () => {
    //値定義
    const ctby = new TyranoCreateTagByShortcutKey();
    const excepted = true;

    //実行
    const actual = ctby.KeyPushAltEnter();

    //アサート
    assert.strictEqual(actual, excepted);
  });
});
