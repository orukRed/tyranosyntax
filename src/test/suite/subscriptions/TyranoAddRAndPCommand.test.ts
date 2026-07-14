/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import { TyranoAddRAndPCommand } from "../../../subscriptions/TyranoAddRAndPCommand";

/**
 * executeは確認ダイアログ（モーダル）の応答後に編集を行うため、
 * showInformationMessageをスタブして応答を注入する。
 * vscodeネームスペースへの代入が禁止されている環境ではundefinedを返す。
 */
const stubConfirmDialog = (answer: string): (() => void) | undefined => {
  const win = vscode.window as any;
  const original = win.showInformationMessage;
  try {
    win.showInformationMessage = () => Promise.resolve(answer);
  } catch {
    return undefined;
  }
  if (win.showInformationMessage === original) {
    return undefined;
  }
  return () => {
    win.showInformationMessage = original;
  };
};

/** ドキュメントのテキストが条件を満たすまでポーリングで待つ */
const waitFor = async (
  predicate: () => boolean,
  timeoutMs = 3000,
): Promise<boolean> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return predicate();
};

const openTyranoEditor = async (content: string): Promise<vscode.TextEditor> => {
  const document = await vscode.workspace.openTextDocument({
    language: "tyrano",
    content,
  });
  return vscode.window.showTextDocument(document);
};

suite("TyranoAddRAndPCommand", () => {
  vscode.window.showInformationMessage("Start TyranoAddRAndPCommand tests.");

  suite("execute", () => {
    test("正常系 テキスト行に[r]と[p]が付与される", async function () {
      this.timeout(10000);
      const restore = stubConfirmDialog("はい");
      if (!restore) {
        this.skip();
        return;
      }
      try {
        // 1行目: 次が非空行 → [r]
        // 2行目: 次が空行 → [p]
        // 4行目(最終行): → [p]
        const editor = await openTyranoEditor(
          "一行目のテキスト\n二行目のテキスト\n\n最後のテキスト",
        );

        TyranoAddRAndPCommand.execute();

        const applied = await waitFor(() =>
          editor.document.getText().includes("[r]"),
        );
        assert.ok(applied, "編集が適用されるべき");
        assert.strictEqual(
          editor.document.getText(),
          "一行目のテキスト[r]\n二行目のテキスト[p]\n\n最後のテキスト[p]",
        );
      } finally {
        restore();
        await vscode.commands.executeCommand(
          "workbench.action.closeAllEditors",
        );
      }
    });

    test("正常系 タグ行・コメント行・ラベル行は変更されない", async function () {
      this.timeout(10000);
      const restore = stubConfirmDialog("はい");
      if (!restore) {
        this.skip();
        return;
      }
      try {
        const content =
          '@bg storage="a.jpg"\n[wait time=100]\n;コメント\n#キャラ名\n*label\nテキスト';
        const editor = await openTyranoEditor(content);

        TyranoAddRAndPCommand.execute();

        const applied = await waitFor(() =>
          editor.document.getText().includes("テキスト[p]"),
        );
        assert.ok(applied, "編集が適用されるべき");
        assert.strictEqual(
          editor.document.getText(),
          '@bg storage="a.jpg"\n[wait time=100]\n;コメント\n#キャラ名\n*label\nテキスト[p]',
          "@ [ ; # * で始まる行は変更されないべき",
        );
      } finally {
        restore();
        await vscode.commands.executeCommand(
          "workbench.action.closeAllEditors",
        );
      }
    });

    test("正常系 いいえを選択した場合はテキストが変更されない", async function () {
      this.timeout(10000);
      const restore = stubConfirmDialog("いいえ");
      if (!restore) {
        this.skip();
        return;
      }
      try {
        const content = "一行目のテキスト\n二行目のテキスト";
        const editor = await openTyranoEditor(content);

        TyranoAddRAndPCommand.execute();

        // 編集が発生しないことの確認のため少し待つ
        await new Promise((resolve) => setTimeout(resolve, 300));
        assert.strictEqual(
          editor.document.getText(),
          content,
          "いいえ選択時はテキストが変更されないべき",
        );
      } finally {
        restore();
        await vscode.commands.executeCommand(
          "workbench.action.closeAllEditors",
        );
      }
    });

    test("異常系 エディタが無い場合は例外にならない", async () => {
      await vscode.commands.executeCommand("workbench.action.closeAllEditors");
      assert.doesNotThrow(() => {
        TyranoAddRAndPCommand.execute();
      });
    });
  });

  suite("class structure", () => {
    test("正常系 executeはstaticメソッドである", () => {
      assert.strictEqual(typeof TyranoAddRAndPCommand.execute, "function");
      const instance = new TyranoAddRAndPCommand();
      assert.strictEqual(
        (instance as any).execute,
        undefined,
        "executeはインスタンスメソッドではなくstaticメソッドであるべき",
      );
    });
  });
});
