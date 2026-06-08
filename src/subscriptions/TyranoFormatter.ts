import * as vscode from "vscode";
import {
  PAIRED_TAGS,
  END_TO_START,
  MID_TAGS,
  RAW_CAPTURE_TAGS,
  BLANK_AFTER_TAGS,
} from "./TyranoFormatterTags";

/** インデント1段分（半角スペース2つ）。 */
const INDENT_UNIT = "  ";

/** [p] / @p のように直後に空行を入れるタグを検出する正規表現。 */
const BLANK_AFTER_REGEX = new RegExp(
  Array.from(BLANK_AFTER_TAGS)
    .map((t) => `\\[${t}(?=[\\]\\s])|^@${t}(?=$|\\s)`)
    .join("|"),
  "i",
);

/** depth 段分のインデント文字列を返す。 */
function indent(depth: number): string {
  return INDENT_UNIT.repeat(Math.max(0, depth));
}

/**
 * 非空行の共通最小インデント（先頭空白文字数）を取り除く。
 * captureEmbedded 側で改めてインデントが付与されるため、前回付与分をここで
 * 取り除いておくことで、複数回フォーマットしても段が増殖しない（冪等になる）。
 */
function dedentCommon(lines: string[]): string[] {
  let min = Infinity;
  for (const line of lines) {
    if (line.trim() === "") {
      continue;
    }
    const lead = line.length - line.trimStart().length;
    if (lead < min) {
      min = lead;
    }
  }
  if (!Number.isFinite(min) || min === 0) {
    return lines;
  }
  return lines.map((line) => (line.trim() === "" ? line : line.slice(min)));
}

/**
 * 行の先頭タグ名（小文字）を返す。タグでなければ null。
 * @記法は行頭の @tag、[]記法は最初に現れる [tag を対象とする。
 */
function getPrimaryTag(trimmed: string): string | null {
  if (trimmed.startsWith("@")) {
    const m = /^@(\w+)/.exec(trimmed);
    return m ? m[1].toLowerCase() : null;
  }
  const m = /\[\s*(\w+)/.exec(trimmed);
  return m ? m[1].toLowerCase() : null;
}

/** 行が指定タグ（[]記法 or @記法）を含むかどうか。 */
function containsTag(trimmed: string, tag: string): boolean {
  const re = new RegExp(`\\[\\s*${tag}\\b|@${tag}\\b`, "i");
  return re.test(trimmed);
}

/** 行が指定の終了タグ行（行頭が [endTag... もしくは @endTag...）かどうか。 */
function isEndTagLine(trimmed: string, endTag: string): boolean {
  const re = new RegExp(`^(\\[\\s*${endTag}\\b|@${endTag}\\b)`, "i");
  return re.test(trimmed);
}

/**
 * iscript / html ブロックの内側テキストを prettier で整形する。
 * 失敗時は元テキスト（末尾空白のみ除去）を返し、警告を warnings に積む。
 */
async function formatEmbedded(
  innerSource: string,
  parser: "babel" | "html",
  startLineNo: number,
  warnings: string[],
): Promise<string[]> {
  if (innerSource.trim() === "") {
    return [];
  }
  // iscript(JS) 内の行頭 ; コメントを JS の // コメントへ変換する。
  // これにより無効JSが解消し prettier で整形できる。行末/行中の ; は対象外。
  let source = innerSource;
  if (parser === "babel") {
    source = source
      .split(/\r?\n/)
      .map((line) => line.replace(/^(\s*);/, "$1//"))
      .join("\n");
  }
  try {
    // prettier は遅延ロード（拡張の起動を巻き込まないため）
    const prettier = await import("prettier");
    const result = await prettier.format(source, { parser, endOfLine: "lf" });
    return result.replace(/(\r?\n)+$/, "").split(/\r?\n/);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    warnings.push(
      `${startLineNo + 1}行目付近の${parser === "babel" ? "JavaScript" : "HTML"}整形に失敗しました: ${message}`,
    );
    // 整形失敗時は元テキストを返す（; → // 変換も行わない）。
    // 前回付与済みの共通インデントを取り除いてから返すことで、captureEmbedded 側で
    // 再びインデントが付与されても段が増殖せず、複数回フォーマットしても安定する。
    return dedentCommon(innerSource.split(/\r?\n/)).map((l) =>
      l.replace(/\s+$/, ""),
    );
  }
}

/** 整形中に持ち回るインデント深さとブロックコメント状態。 */
interface FormatState {
  depth: number;
  inBlockComment: boolean;
}

/** 入力テキストから BOM・改行種別・末尾改行を取り出す。 */
function analyzeText(text: string): {
  body: string;
  hasBom: boolean;
  eol: string;
  hasFinalNewline: boolean;
} {
  const hasBom = text.charCodeAt(0) === 0xfeff;
  const body = hasBom ? text.slice(1) : text;
  const eol = body.includes("\r\n") ? "\r\n" : "\n";
  const hasFinalNewline = /\r?\n$/.test(body);
  return { body, hasBom, eol, hasFinalNewline };
}

/** ブロックコメント行を処理した場合 true。state を更新する。 */
function handleBlockComment(
  trimmed: string,
  state: FormatState,
  out: string[],
): boolean {
  if (state.inBlockComment) {
    out.push(indent(state.depth) + trimmed);
    if (trimmed.endsWith("*/")) {
      state.inBlockComment = false;
    }
    return true;
  }
  if (trimmed.startsWith("/*")) {
    out.push(indent(state.depth) + trimmed);
    if (!trimmed.endsWith("*/")) {
      state.inBlockComment = true;
    }
    return true;
  }
  return false;
}

/**
 * iscript / html ブロックを取り出して prettier で整形し out へ追加する。
 * 戻り値は消費した最後の行インデックス（終了タグ行 or EOF）。
 */
async function captureEmbedded(
  lines: string[],
  startIndex: number,
  tag: string,
  out: string[],
  state: FormatState,
  warnings: string[],
): Promise<number> {
  const parser = RAW_CAPTURE_TAGS.get(tag)!;
  const endTag = PAIRED_TAGS.get(tag)!;
  const baseDepth = state.depth;

  out.push(indent(baseDepth) + lines[startIndex].trim());

  const inner: string[] = [];
  let j = startIndex + 1;
  let foundEnd = false;
  for (; j < lines.length; j++) {
    if (isEndTagLine(lines[j].trim(), endTag)) {
      foundEnd = true;
      break;
    }
    inner.push(lines[j]);
  }

  const formattedInner = await formatEmbedded(
    inner.join("\n"),
    parser,
    startIndex,
    warnings,
  );
  for (const l of formattedInner) {
    out.push(l === "" ? "" : indent(baseDepth + 1) + l);
  }

  if (foundEnd) {
    out.push(indent(baseDepth) + lines[j].trim());
    return j;
  }
  return lines.length - 1; // 未クローズ：EOF まで消費
}

/** 通常タグ／中間タグ／その他テキスト行を出力し、深さを更新する。 */
function emitTagLine(
  trimmed: string,
  tag: string | null,
  out: string[],
  state: FormatState,
): void {
  if (tag && MID_TAGS.has(tag)) {
    out.push(indent(Math.max(0, state.depth - 1)) + trimmed);
  } else if (tag && END_TO_START.has(tag)) {
    state.depth = Math.max(0, state.depth - 1);
    out.push(indent(state.depth) + trimmed);
  } else if (
    tag &&
    PAIRED_TAGS.has(tag) &&
    !containsTag(trimmed, PAIRED_TAGS.get(tag)!)
  ) {
    out.push(indent(state.depth) + trimmed);
    state.depth++;
  } else {
    out.push(indent(state.depth) + trimmed);
  }
}

/** 1行を処理し、消費した最後の行インデックスを返す。 */
async function processLine(
  lines: string[],
  i: number,
  out: string[],
  state: FormatState,
  warnings: string[],
): Promise<number> {
  const trimmed = lines[i].trim();

  if (handleBlockComment(trimmed, state, out)) {
    return i;
  }
  if (trimmed === "") {
    out.push("");
    return i;
  }

  // コメント・ラベル・キャラ名行：現 depth で出力（深さ・[p]規則の対象外）
  const firstChar = trimmed[0];
  if (firstChar === ";" || firstChar === "*" || firstChar === "#") {
    out.push(indent(state.depth) + trimmed);
    return i;
  }

  const tag = getPrimaryTag(trimmed);

  // iscript / html の開始（同一行に対応終了タグが無い場合のみ raw capture）
  if (
    tag &&
    RAW_CAPTURE_TAGS.has(tag) &&
    !containsTag(trimmed, PAIRED_TAGS.get(tag)!)
  ) {
    return captureEmbedded(lines, i, tag, out, state, warnings);
  }

  emitTagLine(trimmed, tag, out, state);

  // [p] / @p を含む行の直後に空行を1行（連続空行は1行へ正規化）
  if (BLANK_AFTER_REGEX.test(trimmed)) {
    out.push("");
    let last = i;
    while (last + 1 < lines.length && lines[last + 1].trim() === "") {
      last++;
    }
    return last;
  }
  return i;
}

/**
 * TyranoScript シナリオテキストを整形する純粋関数。
 * - 対になるタグの間を半角スペース2つ×ネスト段でインデント
 * - [iscript]〜[endscript] 内を JavaScript、[html]〜[endhtml] 内を HTML として prettier 整形
 * - [p] / @p を含む行の直後に空行を1行だけ入れる
 * prettier が非同期のため async。
 */
export async function formatText(
  text: string,
  eolOverride?: "\r\n" | "\n",
): Promise<{ text: string; warnings: string[] }> {
  const warnings: string[] = [];
  const { body, hasBom, eol: detectedEol, hasFinalNewline } = analyzeText(text);
  // 文書の改行設定（document.eol）が渡された場合はそれを優先し、改行コードを保持する。
  const eol = eolOverride ?? detectedEol;

  const lines = body.split(/\r?\n/);
  if (hasFinalNewline) {
    lines.pop(); // 末尾改行による空要素を除去（最後に復元）
  }

  const out: string[] = [];
  const state: FormatState = { depth: 0, inBlockComment: false };
  for (let i = 0; i < lines.length; i++) {
    i = await processLine(lines, i, out, state, warnings);
  }

  // 末尾の空行を除去（末尾改行は hasFinalNewline で制御、冪等性のため）
  while (out.length > 0 && out[out.length - 1] === "") {
    out.pop();
  }

  let result = out.join(eol);
  if (hasFinalNewline && result !== "") {
    result += eol;
  }
  if (hasBom) {
    result = "﻿" + result;
  }
  return { text: result, warnings };
}

/**
 * VS Code 標準の「ドキュメントのフォーマット」用プロバイダ。
 */
export class TyranoFormattingProvider
  implements vscode.DocumentFormattingEditProvider
{
  public async provideDocumentFormattingEdits(
    document: vscode.TextDocument,
  ): Promise<vscode.TextEdit[]> {
    const original = document.getText();
    const eol = document.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
    const { text, warnings } = await formatText(original, eol);
    if (warnings.length > 0) {
      vscode.window.showWarningMessage(warnings[0]);
    }
    if (text === original) {
      return [];
    }
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(original.length),
    );
    return [vscode.TextEdit.replace(fullRange, text)];
  }
}

/**
 * 「一括フォーマット」コマンド本体。
 * data/scenario 配下の .ks をすべて整形する。
 */
export async function batchFormat(): Promise<void> {
  const answer = await vscode.window.showWarningMessage(
    "全ファイルフォーマットしますか？バックアップとってから実行してください",
    { modal: true },
    "はい",
  );
  if (answer !== "はい") {
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "フォーマット中...",
      cancellable: false,
    },
    async (progress) => {
      const files = await vscode.workspace.findFiles(
        "**/data/scenario/**/*.ks",
      );
      if (files.length === 0) {
        vscode.window.showInformationMessage(
          "フォーマット対象（data/scenario 配下の .ks）が見つかりませんでした。",
        );
        return;
      }
      let formattedCount = 0;
      const allWarnings: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const uri = files[i];
        try {
          const document = await vscode.workspace.openTextDocument(uri);
          const original = document.getText();
          const eol = document.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
          const { text, warnings } = await formatText(original, eol);
          allWarnings.push(...warnings);
          if (text !== original) {
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(
              document.positionAt(0),
              document.positionAt(original.length),
            );
            edit.replace(uri, fullRange, text);
            await vscode.workspace.applyEdit(edit);
            await document.save();
            formattedCount++;
          }
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          allWarnings.push(`${uri.fsPath}: ${message}`);
        }
        progress.report({ message: `${i + 1}/${files.length}` });
      }

      const warnSuffix =
        allWarnings.length > 0 ? `（警告${allWarnings.length}件）` : "";
      vscode.window.showInformationMessage(
        `${formattedCount}件フォーマットしました${warnSuffix}`,
      );
    },
  );
}
