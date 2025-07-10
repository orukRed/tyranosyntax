import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../../extension';

suite("TyranoCreateTagByShortcutKey.KeyPushShiftEnter関数", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("正常系", () => {
    assert.ok(true);
  });
});

suite("TyranoCreateTagByShortcutKey.KeyPushCtrlEnter関数", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("正常系", () => {});
});

suite("TyranoCreateTagByShortcutKey.KeyPushAltEnter関数", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("正常系", () => {});
});
