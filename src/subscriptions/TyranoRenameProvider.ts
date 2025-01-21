import * as vscode from "vscode";
import { TextDocument } from "vscode-languageserver-textdocument";
import { WorkspaceEdit, Position, Range } from "vscode-languageserver/node";

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
   * Provide an edit that describes changes that have to be made to one
   * or many resources to rename a symbol to a different name.
   *
   * @param document The document in which the command was invoked.
   * @param position The position at which the command was invoked.
   * @param newName The new name of the symbol.
   * @return A workspace edit or null/undefined if the rename cannot be performed.
   */
  provideRenameEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    newName: string,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.WorkspaceEdit> {
    const workspaceEdit = new vscode.WorkspaceEdit();

    // カーソル位置の単語を取得
    const text = document.getText();
    const offset = document.offsetAt(position);
    const wordRegex = /[a-zA-Z0-9_$.]+/g;
    let match;
    let targetWord = "";
    let isMacroName = false;

    while ((match = wordRegex.exec(text)) !== null) {
      if (match.index <= offset && offset <= match.index + match[0].length) {
        targetWord = match[0];
        // マクロ定義のname属性かどうかをチェック
        const lineStart = text.lastIndexOf("\n", match.index) + 1;
        const lineEnd = text.indexOf("\n", match.index);
        const currentLine = text.substring(
          lineStart,
          lineEnd !== -1 ? lineEnd : text.length,
        );
        isMacroName = /(@macro|\[macro)\s+name\s*=\s*["'].*["']/.test(
          currentLine,
        );
        break;
      }
    }
    if (!targetWord) {
      return workspaceEdit;
    }

    if (isMacroName) {
      // マクロ名の場合は、マクロ定義とマクロ呼び出しの両方を検索して置換
      const macroPatterns = [
        // マクロ定義のパターン
        new RegExp(
          `(@macro|\\[macro)\\s+name\\s*=\\s*["']${targetWord}["']`,
          "g",
        ),
        // マクロ呼び出しのパターン
        new RegExp(`\\[${targetWord}\\]`, "g"),
      ];

      for (const pattern of macroPatterns) {
        let macroMatch;
        while ((macroMatch = pattern.exec(text)) !== null) {
          // マクロ定義の場合は name="..." の中のマクロ名部分だけを置換
          const matchStart = pattern.toString().includes("name")
            ? macroMatch.index + macroMatch[0].indexOf(targetWord)
            : macroMatch.index + 1; // マクロ呼び出しの場合は [ の次の文字から
          const matchLength = pattern.toString().includes("name")
            ? targetWord.length
            : targetWord.length;

          workspaceEdit.replace(
            document.uri,
            new vscode.Range(
              document.positionAt(matchStart),
              document.positionAt(matchStart + matchLength),
            ),
            newName,
          );
        }
      }
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
        workspaceEdit.replace(
          document.uri,
          new vscode.Range(
            document.positionAt(match.index),
            document.positionAt(match.index + match[0].length),
          ),
          newName,
        );
      }
    }

    return workspaceEdit;
  }
}
