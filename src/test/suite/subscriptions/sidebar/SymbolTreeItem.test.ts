import * as assert from "assert";
import * as vscode from "vscode";
import {
  CategoryNode,
  LocationNode,
  RootNode,
  SymbolNode,
  TextNode,
  toTreeItem,
} from "../../../../subscriptions/sidebar/SymbolTreeItem";

suite("SymbolTreeItem.toTreeItem", () => {
  test("正常系 RootNode をフォルダアイコン付きの Expanded 状態で生成する", () => {
    const node: RootNode = { kind: "root", projectPath: "/tmp/myproj" };
    const item = toTreeItem(node);
    assert.strictEqual(item.label, "myproj");
    assert.strictEqual(
      item.collapsibleState,
      vscode.TreeItemCollapsibleState.Expanded,
    );
    assert.strictEqual(
      (item.iconPath as vscode.ThemeIcon).id,
      "folder",
    );
  });

  test("正常系 マクロ SymbolNode に method アイコン", () => {
    const node: SymbolNode = {
      kind: "symbol",
      symbolType: "macro",
      projectPath: "/tmp",
      name: "my_macro",
      description: "macro.ks:42",
      comment: "プレイヤー選択時",
    };
    const item = toTreeItem(node);
    assert.strictEqual(item.label, "my_macro");
    assert.strictEqual(item.description, "macro.ks:42");
    assert.strictEqual(
      item.collapsibleState,
      vscode.TreeItemCollapsibleState.Collapsed,
    );
    assert.strictEqual(
      (item.iconPath as vscode.ThemeIcon).id,
      "symbol-method",
    );
  });

  test("正常系 LocationNode に openLocation コマンドが付く", () => {
    const node: LocationNode = {
      kind: "location",
      uri: "/tmp/scene.ks",
      line: 9,
      character: 0,
    };
    const item = toTreeItem(node);
    assert.strictEqual(item.label, "scene.ks");
    assert.strictEqual(item.description, ":10");
    assert.ok(item.command);
    assert.strictEqual(item.command?.command, "tyrano.sidebar.openLocation");
    assert.deepStrictEqual(item.command?.arguments, [
      { uri: "/tmp/scene.ks", line: 9, character: 0 },
    ]);
  });

  test("正常系 CategoryNode に件数が表示される", () => {
    const parent: SymbolNode = {
      kind: "symbol",
      symbolType: "variable",
      projectPath: "/tmp",
      name: "f.hp",
    };
    const node: CategoryNode = {
      kind: "category",
      parent,
      category: "usage",
      count: 5,
    };
    const item = toTreeItem(node);
    assert.strictEqual(item.label, "使用箇所");
    assert.strictEqual(item.description, "(5)");
    assert.strictEqual(
      item.collapsibleState,
      vscode.TreeItemCollapsibleState.Expanded,
    );
  });

  test("正常系 TextNode はクリック不可", () => {
    const node: TextNode = { kind: "text", text: "プレイヤー選択時" };
    const item = toTreeItem(node);
    assert.strictEqual(item.label, "プレイヤー選択時");
    assert.strictEqual(
      item.collapsibleState,
      vscode.TreeItemCollapsibleState.None,
    );
    assert.strictEqual(item.command, undefined);
  });
});
