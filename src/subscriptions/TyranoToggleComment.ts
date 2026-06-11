import * as vscode from "vscode";

const ISCRIPT_START = /^(\[\s*iscript\b|@iscript\b)/i;
const ISCRIPT_END = /^(\[\s*endscript\b|@endscript\b)/i;

const HTML_START = /^(\[\s*html\b|@html\b)/i;
const HTML_END = /^(\[\s*endhtml\b|@endhtml\b)/i;

/**
 * 指定行が start〜end のタグで囲まれたブロックの内側かどうかを判定する。
 * 開始 / 終了タグ行そのものはブロックの外側として扱う。
 */
function isInsideBlock(
  document: vscode.TextDocument,
  lineNo: number,
  startTag: RegExp,
  endTag: RegExp,
): boolean {
  const current = document.lineAt(lineNo).text.trim();
  if (startTag.test(current) || endTag.test(current)) {
    return false;
  }
  let inside = false;
  for (let i = 0; i < lineNo; i++) {
    const trimmed = document.lineAt(i).text.trim();
    if (!inside) {
      if (startTag.test(trimmed)) {
        inside = true;
      }
    } else if (endTag.test(trimmed)) {
      inside = false;
    }
  }
  return inside;
}

/**
 * 指定行が [iscript]〜[endscript] ブロックの内側かどうかを判定する。
 * iscript / endscript のタグ行そのものは tyrano 行（外側）として扱う。
 */
export function isInsideIscript(
  document: vscode.TextDocument,
  lineNo: number,
): boolean {
  return isInsideBlock(document, lineNo, ISCRIPT_START, ISCRIPT_END);
}

/**
 * 指定行が [html]〜[endhtml] ブロックの内側かどうかを判定する。
 * html / endhtml のタグ行そのものは tyrano 行（外側）として扱う。
 */
export function isInsideHtml(
  document: vscode.TextDocument,
  lineNo: number,
): boolean {
  return isInsideBlock(document, lineNo, HTML_START, HTML_END);
}

// tyrano 言語の comments 設定を一時的に上書きするための Disposable。
let commentConfig: vscode.Disposable | undefined;

function setComments(comments: vscode.LanguageConfiguration["comments"]): void {
  commentConfig?.dispose();
  commentConfig = vscode.languages.setLanguageConfiguration("tyrano", {
    comments,
  });
}

/**
 * Ctrl+/ 用の行コメント切替。
 * カーソル位置に応じて tyrano 言語の comments 設定を切り替えてから、
 * VS Code 標準のトグルコマンドを実行する。
 * - [html]〜[endhtml] ブロック内: ブロックコメント "<!-- -->"（HTML コメント）
 * - [iscript]〜[endscript] ブロック内: lineComment "//"
 * - それ以外: lineComment ";"（従来どおり）
 *
 * html ブロック内では lineComment を設定しないため、editor.action.commentLine が
 * blockComment にフォールバックし、各行が "<!-- ... -->" でコメントアウトされる。
 */
export async function toggleLineComment(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (editor?.document.languageId === "tyrano") {
    const lineNo = editor.selection.active.line;
    if (isInsideHtml(editor.document, lineNo)) {
      setComments({ blockComment: ["<!--", "-->"] });
    } else if (isInsideIscript(editor.document, lineNo)) {
      setComments({ lineComment: "//", blockComment: ["/*", "*/"] });
    } else {
      setComments({ lineComment: ";", blockComment: ["/*", "*/"] });
    }
  }
  await vscode.commands.executeCommand("editor.action.commentLine");
}
