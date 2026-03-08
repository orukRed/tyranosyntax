import * as assert from "assert";
import * as vscode from "vscode";

const EXTENSION_ID = "orukred-tyranosyntax.tyranosyntax";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("拡張機能が存在する", () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension, "拡張機能が見つかるべき");
  });

  test("拡張機能がアクティベートできる", async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension, "拡張機能が見つかるべき");
    if (!extension!.isActive) {
      await extension!.activate();
    }
    assert.ok(extension!.isActive, "拡張機能がアクティブであるべき");
  });

  test("コマンドが登録されている", async () => {
    const commands = await vscode.commands.getCommands(true);
    const expectedCommands = [
      "tyrano.shiftEnter",
      "tyrano.ctrlEnter",
      "tyrano.altEnter",
    ];
    for (const cmd of expectedCommands) {
      assert.ok(
        commands.includes(cmd),
        `コマンド ${cmd} が登録されているべき`,
      );
    }
  });
});
