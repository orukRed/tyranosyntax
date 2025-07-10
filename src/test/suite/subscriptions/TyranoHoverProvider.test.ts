// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";

suite("TyranoHoverProvider.provideHover関数", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("正常系 正しくホバーが表示される", () => {});

  test("異常系 存在しないタグへのホバー（ホバーが表示されない）", () => {});
});
