import * as vscode from "vscode";
import { TextDocument } from "vscode-languageserver-textdocument";
import { WorkspaceEdit, Position } from "vscode-languageserver/node";

export class TyranoRenameProvider {
  constructor() {}

  /**
   * Provide an edit that describes changes that have to be made to one
   * or many resources to rename a symbol to a different name.
   *
   * @param document The document in which the command was invoked.
   * @param position The position at which the command was invoked.
   * @param newName The new name of the symbol.
   * @return A workspace edit or null/undefined if the rename cannot be performed.
   */
  provideRenameEdits(
    document: TextDocument,
    position: Position,
    newName: string,
  ): WorkspaceEdit {
    const workspaceEdit: WorkspaceEdit = {
      changes: {},
    };

    // カーソル位置の単語を取得
    const text = document.getText();
    const offset = document.offsetAt(position);
    const wordRegex = /[a-zA-Z0-9_$.]+/g;
    let match;
    let targetWord = "";

    while ((match = wordRegex.exec(text)) !== null) {
      if (match.index <= offset && offset <= match.index + match[0].length) {
        targetWord = match[0];
        break;
      }
    }

    if (!targetWord) {
      return workspaceEdit;
    }

    // プレフィックスとベース名を分離
    const prefixMatch = targetWord.match(/^(f\.|sf\.|tf\.)?(.+)$/);
    if (!prefixMatch) {
      return workspaceEdit;
    }

    const [, prefix = "", baseName] = prefixMatch;

    // 同じベース名を持つ変数を検索して置換
    const searchPattern = new RegExp(`(f\\.|sf\\.|tf\\.)?${baseName}`, "g");

    while ((match = searchPattern.exec(text)) !== null) {
      const matchedPrefix = match[1] || "";
      // プレフィックスが同じ場合のみ変更
      if (matchedPrefix === prefix) {
        if (!workspaceEdit.changes![document.uri]) {
          workspaceEdit.changes![document.uri] = [];
        }
        workspaceEdit.changes![document.uri].push({
          range: {
            start: document.positionAt(match.index),
            end: document.positionAt(match.index + match[0].length),
          },
          newText: newName,
        });
      }
    }

    return workspaceEdit;
  }
}
