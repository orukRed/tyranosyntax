/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DocumentSymbol,
  SymbolKind,
  Range,
  DocumentSymbolParams,
} from "vscode-languageserver/node";

import { ServerContext } from "../ServerContext";
import { getLineText } from "../ServerUtilities";

export function register(ctx: ServerContext): void {
  const { connection, documents } = ctx;

  connection.onDocumentSymbol(
    (params: DocumentSymbolParams): DocumentSymbol[] => {
      const document = documents.get(params.textDocument.uri);
      if (!document) return [];

      const serverConfig = ctx.getServerConfig();
      const symbols: DocumentSymbol[] = [];
      let commentFlag = false;

      const outlineTags: string[] = serverConfig.outlineTags || [];
      const commentStrings: string[] = serverConfig.outlineComment || [];
      const blockCommentEnabled: boolean =
        serverConfig.outlineBlockComment ?? true;

      const REGEX_VARIABLE =
        /\b(f\.|sf\.|tf\.|mp\.)([a-zA-Z_ぁ-んァ-ヶ一-龠Ａ-Ｚａ-ｚ]+)(([0-9a-zA-Z_ぁ-んァ-ヶ一-龠０-９Ａ-Ｚａ-ｚ]*))\b/;

      for (let i = 0; i < document.lineCount; i++) {
        const lineText = getLineText(document, i);
        const lineRange = Range.create(i, 0, i, lineText.length);

        // Block comment tracking
        if (blockCommentEnabled) {
          if (lineText.includes("/*")) commentFlag = true;
          if (lineText.includes("*/")) commentFlag = false;
        }

        // Comment lines
        if (
          lineText.startsWith(";") ||
          lineText.trimStart().startsWith("//") ||
          commentFlag
        ) {
          if (isCommentOutLine(lineText, commentStrings)) {
            symbols.push(
              DocumentSymbol.create(
                getCommentText(lineText),
                "Comment",
                SymbolKind.Enum,
                lineRange,
                lineRange,
              ),
            );
          }
          continue;
        }

        // Tag outline
        if (isTagOutline(lineText, outlineTags)) {
          symbols.push(
            DocumentSymbol.create(
              lineText,
              "Component",
              SymbolKind.Class,
              lineRange,
              lineRange,
            ),
          );
        }

        // Variable outline
        if (lineText.search(REGEX_VARIABLE) !== -1) {
          const outlineText = lineText.match(REGEX_VARIABLE)![0];
          symbols.push(
            DocumentSymbol.create(
              outlineText,
              "Component",
              SymbolKind.Variable,
              lineRange,
              lineRange,
            ),
          );
        }

        // Label outline
        if (/^\*[0-9a-zA-Z\\-_]+/.test(lineText)) {
          symbols.push(
            DocumentSymbol.create(
              lineText,
              "Component",
              SymbolKind.Function,
              lineRange,
              lineRange,
            ),
          );
        }

        // Comment outline
        if (isCommentOutLine(lineText, commentStrings)) {
          symbols.push(
            DocumentSymbol.create(
              getCommentText(lineText),
              "Comment",
              SymbolKind.Enum,
              lineRange,
              lineRange,
            ),
          );
        }
      }
      return symbols;
    },
  );
}

function isTagOutline(text: string, outlineTags: string[]): boolean {
  if (!outlineTags || outlineTags.length === 0) return false;
  const REGEX = /((\w+))\s*((\S*)="?(\w*)"?)*()/;
  const matcher = text.match(REGEX);
  if (!matcher) return false;
  return outlineTags.includes(matcher[1]);
}

function isCommentOutLine(text: string, commentStrings: string[]): boolean {
  if (!commentStrings || commentStrings.length === 0) return false;
  return commentStrings.some((cs) => {
    const escaped = cs.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const semicolonRegex = new RegExp(`^\\s*;\\s*${escaped}`);
    const slashRegex = new RegExp(`^\\s*//\\s*${escaped}`);
    return semicolonRegex.test(text) || slashRegex.test(text);
  });
}

function getCommentText(text: string): string {
  if (text.includes(";")) return text.replace(";", "").trim();
  if (text.includes("//")) return text.replace("//", "").trim();
  return text.trim();
}
