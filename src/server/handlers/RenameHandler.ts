/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Range,
  PrepareRenameParams,
  RenameParams,
  WorkspaceEdit,
  TextEdit,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";

import { ServerContext } from "../ServerContext";
import { getLineText, escapeRegExp } from "../ServerUtilities";

export function register(ctx: ServerContext): void {
  const { connection, documents, infoWs } = ctx;

  connection.onPrepareRename(
    async (params: PrepareRenameParams): Promise<Range | null> => {
      const document = documents.get(params.textDocument.uri);
      if (!document) return null;

      const lineText = getLineText(document, params.position.line).trim();
      if (lineText.startsWith("*") || lineText.startsWith(";")) return null;

      const text = document.getText();
      const offset = document.offsetAt(params.position);
      const wordInfo = findWordAtOffset(text, offset);
      if (!wordInfo) return null;

      const { word, index, currentLine, isMacroName } = wordInfo;
      if (
        /^(f\.|sf\.|tf\.)?[a-zA-Z0-9_$]+$/.test(word) ||
        isMacroName ||
        (isMacroName && currentLine.includes(`name="${word}"`)) ||
        currentLine.includes(`name='${word}'`)
      ) {
        return Range.create(
          document.positionAt(index),
          document.positionAt(index + word.length),
        );
      }
      return null;
    },
  );

  connection.onRenameRequest(
    async (params: RenameParams): Promise<WorkspaceEdit> => {
      const document = documents.get(params.textDocument.uri);
      if (!document) return { changes: {} };

      const text = document.getText();
      const offset = document.offsetAt(params.position);
      const wordInfo = findWordAtOffset(text, offset);
      if (!wordInfo) return { changes: {} };

      const { word: targetWord, isMacroName } = wordInfo;
      const newName = params.newName;
      const changes: { [uri: string]: TextEdit[] } = {};

      if (targetWord.startsWith("tf.")) {
        // tf variables: only current file
        changes[document.uri] = getVariableRenameEdits(
          document.getText(),
          targetWord,
          newName,
        );
        return { changes };
      }

      // All .ks files in the workspace
      for (const [fsPath, scenarioDoc] of infoWs.scenarioFileMap) {
        const fileUri = URI.file(fsPath).toString();
        const fileText = scenarioDoc.getText();

        if (isMacroName) {
          const edits = getMacroRenameEdits(fileText, targetWord, newName);
          if (edits.length > 0) changes[fileUri] = edits;
        } else {
          const edits = getVariableRenameEdits(fileText, targetWord, newName);
          if (edits.length > 0) changes[fileUri] = edits;
        }
      }

      return { changes };
    },
  );
}

function findWordAtOffset(
  text: string,
  offset: number,
): {
  word: string;
  index: number;
  currentLine: string;
  isMacroName: boolean;
} | null {
  const WORD_REGEX = /[a-zA-Z0-9_$.]+/g;
  const MACRO_NAME_REGEX = /(@macro|\[macro)\s+name\s*=\s*["'].*["']/;
  let match;
  while ((match = WORD_REGEX.exec(text)) !== null) {
    if (match.index <= offset && offset <= match.index + match[0].length) {
      const lineStart = text.lastIndexOf("\n", match.index) + 1;
      const lineEnd = text.indexOf("\n", match.index);
      const currentLine = text.substring(
        lineStart,
        lineEnd !== -1 ? lineEnd : text.length,
      );
      const isMacroName = MACRO_NAME_REGEX.test(currentLine);
      return {
        word: match[0],
        index: match.index,
        currentLine,
        isMacroName,
      };
    }
  }
  return null;
}

function getMacroRenameEdits(
  fileText: string,
  targetWord: string,
  newName: string,
): TextEdit[] {
  const edits: TextEdit[] = [];
  const macroPatterns = [
    new RegExp(
      `(@macro|\\[macro)\\s+name\\s*=\\s*["']${escapeRegExp(targetWord)}["']`,
      "g",
    ),
    new RegExp(`\\[${escapeRegExp(targetWord)}(\\s|\\])`, "g"),
    new RegExp(`@${escapeRegExp(targetWord)}(\\s|$)`, "g"),
  ];

  const tmpDoc = TextDocument.create("file:///tmp", "tyrano", 0, fileText);

  for (const pattern of macroPatterns) {
    let macroMatch;
    while ((macroMatch = pattern.exec(fileText)) !== null) {
      const matchStart = pattern.toString().includes("name")
        ? macroMatch.index + macroMatch[0].indexOf(targetWord)
        : macroMatch.index + 1;
      const matchEnd = matchStart + targetWord.length;
      edits.push(
        TextEdit.replace(
          Range.create(
            tmpDoc.positionAt(matchStart),
            tmpDoc.positionAt(matchEnd),
          ),
          newName,
        ),
      );
    }
  }
  return edits;
}

function getVariableRenameEdits(
  fileText: string,
  targetWord: string,
  newName: string,
): TextEdit[] {
  const edits: TextEdit[] = [];
  const prefixMatch = targetWord.match(/^(f\.|sf\.|tf\.)?(.+)$/);
  if (!prefixMatch) return edits;

  const [, prefix = "", baseName] = prefixMatch;
  const searchPattern = new RegExp(
    `(f\\.|sf\\.|tf\\.)?${escapeRegExp(baseName)}`,
    "g",
  );
  const tmpDoc = TextDocument.create("file:///tmp", "tyrano", 0, fileText);

  let match;
  while ((match = searchPattern.exec(fileText)) !== null) {
    const matchedPrefix = match[1] || "";
    if (matchedPrefix === prefix) {
      edits.push(
        TextEdit.replace(
          Range.create(
            tmpDoc.positionAt(match.index),
            tmpDoc.positionAt(match.index + match[0].length),
          ),
          newName,
        ),
      );
    }
  }
  return edits;
}
