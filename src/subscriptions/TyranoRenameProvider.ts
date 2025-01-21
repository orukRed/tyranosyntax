import * as vscode from "vscode";
import { TextDocument } from "vscode-languageserver-textdocument";
import { WorkspaceEdit, Position, Range } from "vscode-languageserver/node";
import * as path from "path";

export class TyranoRenameProvider implements vscode.RenameProvider {
  constructor() {}

  /**
   * リネーム操作が可能かどうかを確認し、可能な場合はリネーム対象の範囲を返します
   *
   * @param document 対象のドキュメント
   * @param position カーソル位置
   * @returns リネーム可能な場合は範囲を、不可能な場合はnullを返します
   */
  prepareRename(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<
    vscode.Range | { range: vscode.Range; placeholder: string }
  > {
    const text = document.getText();
    const offset = document.offsetAt(position);
    const wordRegex = /[a-zA-Z0-9_$.]+/g;
    let match;

    // カーソル位置の単語を検索
    while ((match = wordRegex.exec(text)) !== null) {
      if (match.index <= offset && offset <= match.index + match[0].length) {
        const word = match[0];

        // TyranoScript変数（f.、sf.、tf.で始まる）かどうかをチェック
        // マクロ定義のname属性かどうかをチェック
        const lineStart = text.lastIndexOf("\n", match.index) + 1;
        const lineEnd = text.indexOf("\n", match.index);
        const currentLine = text.substring(
          lineStart,
          lineEnd !== -1 ? lineEnd : text.length,
        );
        const isMacroName = /(@macro|\[macro)\s+name\s*=\s*["'].*["']/.test(
          currentLine,
        );

        // TyranoScript変数（f.、sf.、tf.で始まる）またはマクロ名の場合のみリネーム可能
        if (
          /^(f\.|sf\.|tf\.)?[a-zA-Z0-9_$]+$/.test(word) ||
          isMacroName ||
          (isMacroName && currentLine.includes(`name="${word}"`)) ||
          currentLine.includes(`name='${word}'`)
        ) {
          return new vscode.Range(
            document.positionAt(match.index),
            document.positionAt(match.index + match[0].length),
          );
        }
        break;
      }
    }

    return null;
  }

  /**
   * カーソル位置の単語とその種類（マクロ名かどうか）を取得します
   */
  private getTargetWordInfo(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): { targetWord: string; isMacroName: boolean } | null {
    const text = document.getText();
    const offset = document.offsetAt(position);
    const wordRegex = /[a-zA-Z0-9_$.]+/g;
    let match;

    while ((match = wordRegex.exec(text)) !== null) {
      if (match.index <= offset && offset <= match.index + match[0].length) {
        const targetWord = match[0];
        const lineStart = text.lastIndexOf("\n", match.index) + 1;
        const lineEnd = text.indexOf("\n", match.index);
        const currentLine = text.substring(
          lineStart,
          lineEnd !== -1 ? lineEnd : text.length,
        );
        const isMacroName = /(@macro|\[macro)\s+name\s*=\s*["'].*["']/.test(
          currentLine,
        );
        return { targetWord, isMacroName };
      }
    }
    return null;
  }

  /**
   * マクロ名に関する変更をWorkspaceEditに追加します
   */
  private addMacroRenameEdits(
    workspaceEdit: vscode.WorkspaceEdit,
    fileUri: vscode.Uri,
    fileDocument: vscode.TextDocument,
    targetWord: string,
    newName: string,
  ): void {
    const fileText = fileDocument.getText();
    const macroPatterns = [
      new RegExp(
        `(@macro|\\[macro)\\s+name\\s*=\\s*["']${targetWord}["']`,
        "g",
      ),
      // new RegExp(`\\[${targetWord}\\]`, "g"),
      new RegExp(`\\[${targetWord}`, "g"),
      new RegExp(`@${targetWord}`, "g"),
    ];

    for (const pattern of macroPatterns) {
      let macroMatch;
      while ((macroMatch = pattern.exec(fileText)) !== null) {
        const matchStart = pattern.toString().includes("name")
          ? macroMatch.index + macroMatch[0].indexOf(targetWord)
          : macroMatch.index + 1;
        const matchLength = targetWord.length;

        workspaceEdit.replace(
          fileUri,
          new vscode.Range(
            fileDocument.positionAt(matchStart),
            fileDocument.positionAt(matchStart + matchLength),
          ),
          newName,
        );
      }
    }
  }

  /**
   * 変数名に関する変更をWorkspaceEditに追加します
   */
  private addVariableRenameEdits(
    workspaceEdit: vscode.WorkspaceEdit,
    fileUri: vscode.Uri,
    fileDocument: vscode.TextDocument,
    targetWord: string,
    newName: string,
  ): void {
    const prefixMatch = targetWord.match(/^(f\.|sf\.|tf\.)?(.+)$/);
    if (!prefixMatch) {
      return;
    }

    const [, prefix = "", baseName] = prefixMatch;
    const fileText = fileDocument.getText();
    const searchPattern = new RegExp(`(f\\.|sf\\.|tf\\.)?${baseName}`, "g");
    let match;

    while ((match = searchPattern.exec(fileText)) !== null) {
      const matchedPrefix = match[1] || "";
      if (matchedPrefix === prefix) {
        workspaceEdit.replace(
          fileUri,
          new vscode.Range(
            fileDocument.positionAt(match.index),
            fileDocument.positionAt(match.index + match[0].length),
          ),
          newName,
        );
      }
    }
  }

  /**
   * Provide an edit that describes changes that have to be made to one
   * or many resources to rename a symbol to a different name.
   *
   * @param document The document in which the command was invoked.
   * @param position The position at which the command was invoked.
   * @param newName The new name of the symbol.
   * @return A workspace edit or null/undefined if the rename cannot be performed.
   */
  async provideRenameEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    newName: string,
    token: vscode.CancellationToken,
  ): Promise<vscode.WorkspaceEdit> {
    const workspaceEdit = new vscode.WorkspaceEdit();

    // カーソル位置の単語情報を取得
    const wordInfo = this.getTargetWordInfo(document, position);
    if (!wordInfo) {
      return workspaceEdit;
    }

    const { targetWord, isMacroName } = wordInfo;

    // ワークスペース内のすべての.ksファイルを取得
    const ksFiles = await vscode.workspace.findFiles("**/*.ks");

    // 各ファイルに対して変更を適用
    for (const fileUri of ksFiles) {
      const fileDocument = await vscode.workspace.openTextDocument(fileUri);

      if (isMacroName) {
        this.addMacroRenameEdits(
          workspaceEdit,
          fileUri,
          fileDocument,
          targetWord,
          newName,
        );
      } else {
        this.addVariableRenameEdits(
          workspaceEdit,
          fileUri,
          fileDocument,
          targetWord,
          newName,
        );
      }
    }

    return workspaceEdit; //cg_image_buttonをリネームした時、workSpaceEditの中にtyrano.ksが2つある
  }
}
