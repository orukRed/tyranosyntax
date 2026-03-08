/* eslint-disable @typescript-eslint/no-explicit-any */
import { Position } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { InformationExtension } from "./InformationExtension";
import * as fs from "fs";
import * as path from "path";

export function getLineText(document: TextDocument, line: number): string {
  const startOffset = document.offsetAt(Position.create(line, 0));
  const endOffset = document.offsetAt(Position.create(line + 1, 0));
  const text = document.getText().substring(startOffset, endOffset);
  return text.replace(/\r?\n$/, "");
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getWordRangeAtPosition(
  lineText: string,
  character: number,
  regex: RegExp,
): { start: number; end: number } | null {
  let match;
  const globalRegex = new RegExp(regex.source, "g");
  while ((match = globalRegex.exec(lineText)) !== null) {
    if (
      character >= match.index &&
      character <= match.index + match[0].length
    ) {
      return { start: match.index, end: match.index + match[0].length };
    }
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tooltipDataCache: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadTooltipData(): any {
  if (tooltipDataCache) return tooltipDataCache;
  try {
    const fileName =
      InformationExtension.language === "ja"
        ? "tyrano.Tooltip.json"
        : "en.tyrano.Tooltip.json";
    const tooltipPath = path.join(
      InformationExtension.path!,
      "Tooltip",
      fileName,
    );
    tooltipDataCache = JSON.parse(fs.readFileSync(tooltipPath, "utf8"));
    return tooltipDataCache;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createTagMarkdown(textValue: any): string | null {
  if (!textValue || !textValue["description"]) return null;
  const textCopy = [...textValue["description"]];
  const backQuoteStartIndex = textCopy.indexOf("[パラメータ]");
  if (backQuoteStartIndex >= 0) {
    textCopy.splice(backQuoteStartIndex, 0, "```tyrano");
    textCopy.push("```");
  }
  return `### ${textValue["prefix"]}\n\n${textCopy.join("  \n")}`;
}
