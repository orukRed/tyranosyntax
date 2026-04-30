import * as path from "path";
import * as vscode from "vscode";

/**
 * サイドバー TreeView 用の共通ノード型。
 * Macro/Variable/Character いずれの Provider でもこの型を返す。
 */
export type SidebarNode =
  | RootNode
  | SymbolNode
  | CategoryNode
  | LocationNode
  | TextNode;

export interface RootNode {
  kind: "root";
  projectPath: string;
}

export interface SymbolNode {
  kind: "symbol";
  symbolType: "macro" | "variable" | "character";
  projectPath: string;
  name: string;
  /** description: マクロは定義ファイル名:行、変数は kind、キャラは jname */
  description?: string;
  /** マクロのコメント本文（複数行）。空のときはコメントカテゴリを出さない */
  comment?: string;
}

export interface CategoryNode {
  kind: "category";
  parent: SymbolNode;
  category: "definition" | "usage" | "comment" | "face" | "layer";
  count?: number;
}

export interface LocationNode {
  kind: "location";
  uri: string;
  line: number;
  character: number;
  /** 補助情報（例: 表情名、レイヤー id） */
  detail?: string;
}

export interface TextNode {
  kind: "text";
  text: string;
}

/** TreeItem 生成 */
export function toTreeItem(node: SidebarNode): vscode.TreeItem {
  switch (node.kind) {
    case "root": {
      const item = new vscode.TreeItem(
        path.basename(node.projectPath) || node.projectPath,
        vscode.TreeItemCollapsibleState.Expanded,
      );
      item.tooltip = node.projectPath;
      item.iconPath = new vscode.ThemeIcon("folder");
      item.contextValue = "tyranoSidebar.root";
      return item;
    }
    case "symbol": {
      const item = new vscode.TreeItem(
        node.name,
        vscode.TreeItemCollapsibleState.Collapsed,
      );
      if (node.description) {
        item.description = node.description;
      }
      if (node.comment) {
        item.tooltip = new vscode.MarkdownString(
          "```\n" + node.comment + "\n```",
        );
      }
      item.iconPath = new vscode.ThemeIcon(symbolIconId(node.symbolType));
      item.contextValue = `tyranoSidebar.symbol.${node.symbolType}`;
      return item;
    }
    case "category": {
      const label = categoryLabel(node.category);
      const item = new vscode.TreeItem(
        label,
        vscode.TreeItemCollapsibleState.Expanded,
      );
      if (typeof node.count === "number") {
        item.description = `(${node.count})`;
      }
      item.iconPath = new vscode.ThemeIcon(categoryIconId(node.category));
      item.contextValue = `tyranoSidebar.category.${node.category}`;
      return item;
    }
    case "location": {
      const fileName = path.basename(node.uri);
      const item = new vscode.TreeItem(
        fileName,
        vscode.TreeItemCollapsibleState.None,
      );
      const detail = node.detail ? `${node.detail} ` : "";
      item.description = `${detail}:${node.line + 1}`;
      item.tooltip = `${node.uri}:${node.line + 1}`;
      item.iconPath = new vscode.ThemeIcon("go-to-file");
      item.command = {
        command: "tyrano.sidebar.openLocation",
        title: "Open Location",
        arguments: [
          {
            uri: node.uri,
            line: node.line,
            character: node.character,
          },
        ],
      };
      item.contextValue = "tyranoSidebar.location";
      return item;
    }
    case "text": {
      const item = new vscode.TreeItem(
        node.text,
        vscode.TreeItemCollapsibleState.None,
      );
      item.iconPath = new vscode.ThemeIcon("comment");
      item.contextValue = "tyranoSidebar.text";
      return item;
    }
  }
}

function symbolIconId(symbolType: SymbolNode["symbolType"]): string {
  switch (symbolType) {
    case "macro":
      return "symbol-method";
    case "variable":
      return "symbol-variable";
    case "character":
      return "person";
  }
}

function categoryLabel(category: CategoryNode["category"]): string {
  switch (category) {
    case "definition":
      return "定義箇所";
    case "usage":
      return "使用箇所";
    case "comment":
      return "コメント";
    case "face":
      return "表情";
    case "layer":
      return "レイヤー";
  }
}

function categoryIconId(category: CategoryNode["category"]): string {
  switch (category) {
    case "definition":
      return "symbol-class";
    case "usage":
      return "references";
    case "comment":
      return "comment";
    case "face":
      return "smiley";
    case "layer":
      return "layers";
  }
}
