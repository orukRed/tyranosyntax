import * as vscode from "vscode";

export class TyranoRenameProvider {
  constructor() {}

  /**
   * Provide an edit that describes changes that have to be made to one
   * or many resources to rename a symbol to a different name.
   *
   * @param document The document in which the command was invoked.
   * @param position The position at which the command was invoked.
   * @param newName The new name of the symbol. If the given name is not valid, the provider must return a rejected promise.
   * @param token A cancellation token.
   * @return A workspace edit or a thenable that resolves to such. The lack of a result can be
   * signaled by returning `undefined` or `null`.
   */
  provideRenameEdits(
    /* eslint-disable @typescript-eslint/no-unused-vars */
    document: vscode.TextDocument,
    position: vscode.Position,
    newName: string,
    token: vscode.CancellationToken,
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): vscode.WorkspaceEdit | null | undefined {
    // console.log("provideRenameEdits");
    // console.log(`document:${document.fileName}\nposition:${position.line}\nnewName:${newName}\ntoken:${token}\n`);

    return null;
  }
}
