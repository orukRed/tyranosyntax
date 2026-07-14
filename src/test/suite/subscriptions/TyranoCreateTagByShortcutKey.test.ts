import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { TyranoCreateTagByShortcutKey } from "../../../subscriptions/TyranoCreateTagByShortcutKey";

/** エディタのedit()は非同期のため、挿入が反映されるまでポーリングで待つ */
const waitForText = async (
  document: vscode.TextDocument,
  expected: string,
  timeoutMs = 3000,
): Promise<boolean> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (document.getText().includes(expected)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return document.getText().includes(expected);
};

/** untitledのtyranoドキュメントを開いてアクティブにする */
const openTyranoEditor = async (): Promise<vscode.TextEditor> => {
  const document = await vscode.workspace.openTextDocument({
    language: "tyrano",
    content: "",
  });
  return vscode.window.showTextDocument(document);
};

suite("TyranoCreateTagByShortcutKey.KeyPushShiftEnter関数", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("正常系 設定されたタグが挿入されtrueを返す", async () => {
    const editor = await openTyranoEditor();
    try {
      const expected = vscode.workspace
        .getConfiguration()
        .get<string>("TyranoScript syntax.keyboard.shift + enter")!;
      assert.ok(expected, "設定のデフォルト値が取得できるべき");

      const result = TyranoCreateTagByShortcutKey.KeyPushShiftEnter();

      assert.strictEqual(result, true);
      assert.ok(
        await waitForText(editor.document, expected),
        `"${expected}"が挿入されるべき (actual: "${editor.document.getText()}")`,
      );
    } finally {
      await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    }
  });

  test("異常系 エディタが無い場合はfalseを返す", async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");

    const result = TyranoCreateTagByShortcutKey.KeyPushShiftEnter();

    assert.strictEqual(result, false);
  });
});

suite("TyranoCreateTagByShortcutKey.KeyPushCtrlEnter関数", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("正常系 設定されたタグが挿入されtrueを返す", async () => {
    const editor = await openTyranoEditor();
    try {
      const expected = vscode.workspace
        .getConfiguration()
        .get<string>("TyranoScript syntax.keyboard.ctrl + enter(cmd + enter)")!;
      assert.ok(expected, "設定のデフォルト値が取得できるべき");

      const result = TyranoCreateTagByShortcutKey.KeyPushCtrlEnter();

      assert.strictEqual(result, true);
      assert.ok(
        await waitForText(editor.document, expected),
        `"${expected}"が挿入されるべき (actual: "${editor.document.getText()}")`,
      );
    } finally {
      await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    }
  });

  test("異常系 エディタが無い場合はfalseを返す", async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");

    const result = TyranoCreateTagByShortcutKey.KeyPushCtrlEnter();

    assert.strictEqual(result, false);
  });
});

suite("TyranoCreateTagByShortcutKey.KeyPushAltEnter関数", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("正常系 設定されたタグが挿入されtrueを返す", async () => {
    const editor = await openTyranoEditor();
    try {
      const expected = vscode.workspace
        .getConfiguration()
        .get<string>(
          "TyranoScript syntax.keyboard.alt + enter(option + enter)",
        )!;
      assert.ok(expected, "設定のデフォルト値が取得できるべき");

      const result = TyranoCreateTagByShortcutKey.KeyPushAltEnter();

      assert.strictEqual(result, true);
      assert.ok(
        await waitForText(editor.document, expected),
        `"${expected}"が挿入されるべき (actual: "${editor.document.getText()}")`,
      );
    } finally {
      await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    }
  });

  test("異常系 エディタが無い場合はfalseを返す", async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");

    const result = TyranoCreateTagByShortcutKey.KeyPushAltEnter();

    assert.strictEqual(result, false);
  });
});
