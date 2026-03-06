import * as vscode from "vscode";

export class TyranoReferenceProvider {
  constructor() {}

  provideReferences(
    /* eslint-disable @typescript-eslint/no-unused-vars */
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.ReferenceContext,
    token: vscode.CancellationToken,
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): vscode.Location[] | null | undefined {
    return null; //未定義の場合null
  }
}
