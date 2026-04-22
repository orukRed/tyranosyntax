import * as vscode from "vscode";

/**
 * サイドバーのWelcome Viewを表示するための空のTreeDataProvider。
 * 実際のUIはpackage.jsonのviewsWelcomeで定義されたボタンで構成される。
 */
export class TyranoSidebarProvider implements vscode.TreeDataProvider<void> {
  getTreeItem(): vscode.TreeItem {
    return new vscode.TreeItem("");
  }

  getChildren(): void[] {
    return [];
  }
}
