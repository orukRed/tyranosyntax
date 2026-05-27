import * as vscode from "vscode";

const ISCRIPT_START = /^(\[\s*iscript\b|@iscript\b)/i;
const ISCRIPT_END = /^(\[\s*endscript\b|@endscript\b)/i;

/**
 * 指定行が [iscript]〜[endscript] ブロックの内側かどうかを判定する。
 * iscript / endscript のタグ行そのものは tyrano 行（外側）として扱う。
 */
export function isInsideIscript(
  document: vscode.TextDocument,
  lineNo: number,
): boolean {
  const current = document.lineAt(lineNo).text.trim();
  if (ISCRIPT_START.test(current) || ISCRIPT_END.test(current)) {
    return false;
  }
  let inside = false;
  for (let i = 0; i < lineNo; i++) {
    const trimmed = document.lineAt(i).text.trim();
    if (!inside) {
      if (ISCRIPT_START.test(trimmed)) {
        inside = true;
      }
    } else if (ISCRIPT_END.test(trimmed)) {
      inside = false;
    }
  }
  return inside;
}

// tyrano 言語の lineComment を一時的に上書きするための Disposable。
let commentConfig: vscode.Disposable | undefined;

function setLineComment(token: string): void {
  commentConfig?.dispose();
  commentConfig = vscode.languages.setLanguageConfiguration("tyrano", {
    comments: { lineComment: token, blockComment: ["/*", "*/"] },
  });
}

/**
 * Ctrl+/ 用の行コメント切替。
 * iscript ブロック内ではカーソル位置に応じて lineComment を "//" に切り替えてから、
 * VS Code 標準のトグルコマンドを実行する。それ以外は ";"（従来どおり）。
 */
export async function toggleLineComment(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (editor?.document.languageId === "tyrano") {
    const lineNo = editor.selection.active.line;
    setLineComment(isInsideIscript(editor.document, lineNo) ? "//" : ";");
  }
  await vscode.commands.executeCommand("editor.action.commentLine");
}
