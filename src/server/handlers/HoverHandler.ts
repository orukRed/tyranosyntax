/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Hover,
  MarkupKind,
  HoverParams,
  Position,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import * as path from "path";

import { ServerContext } from "../ServerContext";
import {
  getLineText,
  getWordRangeAtPosition,
  loadTooltipData,
  createTagMarkdown,
} from "../ServerUtilities";

export function register(ctx: ServerContext): void {
  const { connection, documents, infoWs } = ctx;

  connection.onHover(async (params: HoverParams): Promise<Hover | null> => {
    try {
      const document = documents.get(params.textDocument.uri);
      if (!document) return null;

      const fsPath = URI.parse(document.uri).fsPath;
      const projectPath = infoWs.getProjectPathByFilePath(fsPath);
      const position = params.position;
      const lineText = getLineText(document, position.line);

      // Check parameter hover (param="value" pattern)
      const paramHoverRegex = /\w+="[^"]*"/g;
      let paramMatch: RegExpExecArray | null;
      while ((paramMatch = paramHoverRegex.exec(lineText)) !== null) {
        const start = paramMatch.index;
        const end = start + paramMatch[0].length;
        if (position.character >= start && position.character <= end) {
          return handleParameterHover(
            ctx,
            document,
            position,
            projectPath,
            lineText,
          );
        }
      }

      // Check tag hover
      const tagRegExp = /(\[||@)(\w+)(\s*)/;
      const wordRange = getWordRangeAtPosition(
        lineText,
        position.character,
        tagRegExp,
      );
      if (!wordRange) return null;

      const matchedText = lineText.substring(wordRange.start, wordRange.end);
      const matcher = matchedText.match(tagRegExp);
      if (!matcher) return null;

      const tagName = matcher[2];
      const tooltipData = loadTooltipData();
      if (!tooltipData || !tooltipData[tagName]) return null;

      const markdownContent = createTagMarkdown(tooltipData[tagName]);
      if (!markdownContent) return null;

      return {
        contents: { kind: MarkupKind.Markdown, value: markdownContent },
      };
    } catch {
      return null;
    }
  });
}

function handleParameterHover(
  ctx: ServerContext,
  _document: TextDocument,
  position: Position,
  projectPath: string,
  lineText: string,
): Hover | null {
  const { parser } = ctx;
  const serverConfig = ctx.getServerConfig();

  const tagRegex = /([@[])(\w+)(?:\s+(?:[^\]"]|"[^"]*")*)?]?/;
  const tagMatch = lineText.match(tagRegex);
  if (!tagMatch) return null;

  const fullTag = tagMatch[0];
  const tag = tagMatch[2];
  const parsedData = parser.parseText(fullTag);
  if (!parsedData || parsedData.length === 0) return null;

  const parsedTag = parsedData[0];

  // Find which parameter the cursor is in
  const paramRegex = /(\w+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  let paramName = "";
  let paramValue = "";
  while ((match = paramRegex.exec(lineText)) !== null) {
    if (
      position.character >= match.index &&
      position.character <= match.index + match[0].length
    ) {
      paramName = match[1];
      paramValue = match[2];
      break;
    }
  }
  if (!paramName) return null;

  // Check if it's an image parameter
  const tagParams = serverConfig.tagParameter || {};
  let defaultPath = "";
  if (parsedTag.pm && parsedTag.pm.folder) {
    defaultPath = "data/" + parsedTag.pm.folder;
  } else if (tagParams[tag] && tagParams[tag][paramName]) {
    defaultPath = tagParams[tag][paramName]["path"] || "";
  }

  const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"];
  const hasImageExtension = imageExtensions.some((ext) =>
    paramValue.toLowerCase().endsWith(ext),
  );

  if (defaultPath && paramValue && hasImageExtension) {
    const absoluteImagePath = URI.file(
      path.join(projectPath, defaultPath, paramValue),
    ).toString();
    const relativePathFromRoot = path.join(defaultPath, paramValue);
    const md = `${relativePathFromRoot}\n\n![preview](${absoluteImagePath})`;
    return { contents: { kind: MarkupKind.Markdown, value: md } };
  }

  // Fall back to tag documentation
  const tooltipData = loadTooltipData();
  if (tooltipData && tooltipData[tag]) {
    const markdownContent = createTagMarkdown(tooltipData[tag]);
    if (markdownContent) {
      return {
        contents: { kind: MarkupKind.Markdown, value: markdownContent },
      };
    }
  }
  return null;
}
