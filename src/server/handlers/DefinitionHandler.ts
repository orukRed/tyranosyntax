/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Location,
  DefinitionParams,
} from "vscode-languageserver/node";
import { URI } from "vscode-uri";

import { ServerContext } from "../ServerContext";
import { getLineText } from "../ServerUtilities";

export function register(ctx: ServerContext): void {
  const { connection, documents, infoWs, parser } = ctx;

  connection.onDefinition(
    async (params: DefinitionParams): Promise<Location | null> => {
      const document = documents.get(params.textDocument.uri);
      if (!document) return null;

      const projectPath = infoWs.getProjectPathByFilePath(
        URI.parse(document.uri).fsPath,
      );
      const lineText = getLineText(document, params.position.line);
      const parsedData = parser.parseText(lineText);
      const tagIndex = parser.getIndex(parsedData, params.position.character);
      if (tagIndex < 0) return null;

      const macroName = parsedData[tagIndex]["name"];
      const projectMacros = infoWs.defineMacroMap.get(projectPath);
      if (!projectMacros) return null;

      const retMacroData = Array.from(projectMacros.values()).find(
        (macro) => macro.macroName === macroName,
      );
      return retMacroData?.location ?? null;
    },
  );
}
