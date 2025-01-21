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

    // 同じドキュメント内の同じ文字列を全て置換
    const text = document.getText();
    const pattern = new RegExp(position.toString(), "g");
    let match;

    while ((match = pattern.exec(text)) !== null) {
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

    return workspaceEdit;
  }
}
