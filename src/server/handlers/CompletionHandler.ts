/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CompletionItem,
  CompletionItemKind,
  MarkupKind,
  Position,
  CompletionParams,
  InsertTextFormat,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import * as fs from "fs";
import * as path from "path";

import { ServerContext } from "../ServerContext";
import { getLineText } from "../ServerUtilities";
import { TyranoLogger, ErrorLevel } from "../TyranoLogger";

export function register(ctx: ServerContext): void {
  const { connection, documents, infoWs, parser } = ctx;

  connection.onCompletion(
    async (params: CompletionParams): Promise<CompletionItem[] | null> => {
      try {
        const document = documents.get(params.textDocument.uri);
        if (!document) return null;

        const serverConfig = ctx.getServerConfig();
        const projectPath = infoWs.getProjectPathByFilePath(
          URI.parse(document.uri).fsPath,
        );
        const position = params.position;
        const lineText = getLineText(document, position.line);
        const parsedData = parser.parseText(lineText);
        const tagIndex = parser.getIndex(parsedData, position.character);

        const leftSideText =
          parsedData[tagIndex] !== undefined
            ? lineText.substring(
                parsedData[tagIndex]["column"],
                position.character,
              )
            : undefined;
        const lineTagName = parsedData[tagIndex]?.["name"];

        const PARAM_REGEXP = /(\S)+="(?![\s\S]*")/g;
        const VARIABLE_REGEXP = /&?(f\.|sf\.|tf\.|mp\.)(\S)*$/;
        const SHARP_REGEXP = /\s*#.*$/;

        const regExpResult = leftSideText?.match(PARAM_REGEXP);
        const lineParamName = regExpResult?.[0]
          ?.replace('"', "")
          .replace("=", "")
          .trim();

        const tagParams = serverConfig.tagParameter || {};
        const paramInfo =
          (lineParamName !== undefined &&
            tagParams[lineTagName]?.[lineParamName]) ||
          undefined;
        const variableValue = leftSideText
          ? VARIABLE_REGEXP.exec(leftSideText)
          : null;

        const characterOperationTagList = [
          "chara_ptext",
          "chara_config",
          "chara_show",
          "chara_hide",
          "chara_delete",
          "chara_mod",
          "chara_move",
          "chara_face",
          "chara_layer",
          "chara_layer_mod",
          "chara_part",
          "chara_part_reset",
        ];
        const nameParameterList = ["name", "ptext"];
        const layerParts = findLayerParts(
          infoWs,
          projectPath,
          tagIndex,
          parsedData,
        );

        // # character name completion
        if (
          typeof leftSideText === "string" &&
          SHARP_REGEXP.test(leftSideText)
        ) {
          return completionNameParameter(infoWs, projectPath);
        }
        // Variable completion
        if (variableValue) {
          const variableKind = variableValue[0].split(".")[0].replace("&", "");
          const variableName = getVariableName(variableValue[0]);
          if (variableName) {
            const variableObject = findVariableObject(
              infoWs,
              projectPath,
              variableName,
            );
            if (variableObject) {
              const splitVariable = variableValue[0].split(".");
              return completionNestVariable(variableObject, splitVariable);
            }
          }
          return completionVariable(infoWs, projectPath, variableKind);
        }
        // Target label completion
        if (
          parsedData[tagIndex] !== undefined &&
          lineTagName !== undefined &&
          lineParamName === "target"
        ) {
          return completionLabel(
            infoWs,
            projectPath,
            parsedData[tagIndex]["pm"]["storage"],
            document,
          );
        }
        // Character name parameter
        if (
          parsedData[tagIndex] !== undefined &&
          lineTagName !== undefined &&
          lineParamName !== undefined &&
          characterOperationTagList.includes(parsedData[tagIndex]["name"]) &&
          nameParameterList.includes(lineParamName)
        ) {
          return completionNameParameter(infoWs, projectPath);
        }
        // face parameter
        if (
          parsedData[tagIndex] !== undefined &&
          lineTagName !== undefined &&
          lineParamName === "face" &&
          characterOperationTagList.includes(parsedData[tagIndex]["name"])
        ) {
          return completionFaceParameter(
            infoWs,
            projectPath,
            parsedData[tagIndex]["pm"]["name"],
          );
        }
        // part parameter
        if (
          parsedData[tagIndex] !== undefined &&
          lineTagName !== undefined &&
          lineParamName === "part" &&
          characterOperationTagList.includes(parsedData[tagIndex]["name"])
        ) {
          return completionPartParameter(
            infoWs,
            projectPath,
            parsedData[tagIndex]["pm"]["name"],
          );
        }
        // id parameter / layer parts
        if (
          parsedData[tagIndex] !== undefined &&
          lineTagName !== undefined &&
          lineParamName !== undefined &&
          characterOperationTagList.includes(parsedData[tagIndex]["name"]) &&
          parsedData[tagIndex]["pm"]["name"] &&
          (layerParts.includes(lineParamName) || lineParamName === "id")
        ) {
          return completionIdParameter(
            infoWs,
            projectPath,
            parsedData[tagIndex]["pm"]["name"],
            lineParamName,
          );
        }
        // Resource completion
        if (
          parsedData[tagIndex] !== undefined &&
          lineTagName !== undefined &&
          lineParamName !== undefined &&
          paramInfo !== undefined
        ) {
          return completionResource(
            infoWs,
            projectPath,
            paramInfo.type,
            projectPath + infoWs.pathDelimiter + (paramInfo.path || ""),
            paramInfo,
          );
        }
        // Tag completion (empty line or text)
        if (
          parsedData === undefined ||
          parsedData[tagIndex] === undefined ||
          !parsedData[tagIndex]["name"]
        ) {
          return completionTag(infoWs, serverConfig, projectPath, lineText, position);
        }
        // Parameter completion (inside a tag)
        const isTagSentence =
          lineTagName === "text" || lineTagName === undefined ? false : true;
        if (isTagSentence) {
          return completionParameter(
            infoWs,
            projectPath,
            lineTagName,
            parsedData[tagIndex]["pm"],
            parsedData[tagIndex]["pm"]["name"],
            lineText,
            position,
          );
        }
        return completionTag(infoWs, serverConfig, projectPath, lineText, position);
      } catch (error) {
        TyranoLogger.print("Completion failed", ErrorLevel.ERROR);
        TyranoLogger.printStackTrace(error);
        return null;
      }
    },
  );
}

// ── Completion helpers ──

function getVariableName(variableValue0: string): string {
  const variablePrefixList = ["f", "sf", "tf", "mp"];
  const variableNameBase = variableValue0.startsWith("&")
    ? variableValue0.substring(1)
    : variableValue0;
  for (const prefix of variablePrefixList) {
    if (variableNameBase.startsWith(prefix)) {
      const withoutPrefix = variableNameBase.substring(prefix.length);
      return withoutPrefix.split(".")[1] || "";
    }
  }
  return "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findVariableObject(
  infoWs: any,
  projectPath: string,
  variableName: string,
): any | undefined {
  const variableDataMap = infoWs.variableMap.get(projectPath);
  if (variableDataMap) {
    for (const [, value] of variableDataMap) {
      if (value.name === variableName) return value;
    }
  }
  return undefined;
}

function findLayerParts(
  infoWs: any,
  projectPath: string,
  tagIndex: number,
  parsedData: any[],
): string[] {
  try {
    const characterData = infoWs.characterMap
      .get(projectPath)
      ?.find((cd: any) => cd.name === parsedData[tagIndex]?.["pm"]?.["name"]);
    return characterData?.layer ? [...characterData.layer.keys()] : [];
  } catch {
    return [];
  }
}

function completionNameParameter(
  infoWs: any,
  projectPath: string,
): CompletionItem[] | null {
  const characterDataList = infoWs.characterMap.get(projectPath);
  if (!characterDataList) return null;
  return characterDataList.map((cd: any) => ({
    label: cd.name,
    kind: CompletionItemKind.Variable,
    insertText: cd.name,
  }));
}

function completionFaceParameter(
  infoWs: any,
  projectPath: string,
  nameParamValue: string,
): CompletionItem[] | null {
  const characterDataList = infoWs.characterMap.get(projectPath);
  if (!characterDataList || !nameParamValue) return null;
  const faceList = characterDataList.find(
    (cd: any) => cd.name === nameParamValue,
  )?.faceList;
  if (!faceList) return null;
  return faceList.map((fd: any) => ({
    label: fd.face,
    kind: CompletionItemKind.Variable,
    insertText: fd.face,
    detail: `${fd.name}に定義されているface`,
  }));
}

function completionPartParameter(
  infoWs: any,
  projectPath: string,
  nameParamValue: string,
): CompletionItem[] | null {
  const characterDataList = infoWs.characterMap.get(projectPath);
  if (!characterDataList || !nameParamValue) return null;
  const layerMap = characterDataList.find(
    (cd: any) => cd.name === nameParamValue,
  )?.layer;
  if (!layerMap) return null;
  return [...layerMap.keys()].map((part: string) => ({
    label: part,
    kind: CompletionItemKind.Variable,
    insertText: part,
    detail: `${nameParamValue}に定義されているpart`,
  }));
}

function completionIdParameter(
  infoWs: any,
  projectPath: string,
  nameParamValue: string,
  partName: string,
): CompletionItem[] | null {
  const characterDataList = infoWs.characterMap.get(projectPath);
  if (!characterDataList || !nameParamValue) return null;
  const layerMap = characterDataList.find(
    (cd: any) => cd.name === nameParamValue,
  )?.layer;
  if (!layerMap) return null;
  const layerDataList = layerMap.get(partName);
  if (!layerDataList) return null;
  return layerDataList.map((ld: any) => ({
    label: ld.id,
    kind: CompletionItemKind.Variable,
    insertText: ld.id,
    detail: `${nameParamValue}の${partName}に定義されているid`,
  }));
}

function completionLabel(
  infoWs: any,
  projectPath: string,
  storage: string | undefined,
  document: TextDocument,
): CompletionItem[] {
  const completions: CompletionItem[] = [];
  const documentFsPath = URI.parse(document.uri).fsPath;
  infoWs.labelMap.forEach((labels: any, key: string) => {
    const labelProjectPath = infoWs.getProjectPathByFilePath(key);
    if (projectPath === labelProjectPath) {
      labels.forEach((value: any) => {
        const storagePath =
          storage === undefined
            ? documentFsPath
            : projectPath +
              infoWs.DATA_DIRECTORY +
              infoWs.DATA_SCENARIO +
              infoWs.pathDelimiter +
              storage;
        if (
          infoWs.isSamePath(URI.parse(value.location.uri).fsPath, storagePath)
        ) {
          completions.push({
            label: value.name,
            kind: CompletionItemKind.Interface,
            insertText: "*" + value.name,
            documentation: {
              kind: MarkupKind.Markdown,
              value: `${value.description}`,
            },
          });
        }
      });
    }
  });
  return completions;
}

function completionNestVariable(
  variableObject: any,
  splitVariable: string[],
): CompletionItem[] {
  splitVariable.pop();
  const completions: CompletionItem[] = [];
  if (splitVariable[0].startsWith("&")) {
    splitVariable[0] = splitVariable[0].substring(1);
  }
  let sentence = `${splitVariable[0]}.${splitVariable[1]}`;

  if (splitVariable.length === 2) {
    variableObject.nestVariableData.forEach((value: any) => {
      completions.push({
        label: `${value.name}`,
        filterText: `${sentence}.${value.name}`,
        kind: CompletionItemKind.Variable,
        insertText: `${sentence}.${value.name}`,
        detail: `${sentence}.${value.name}`,
      });
    });
    return completions;
  }

  for (let i = 2; i < splitVariable.length; i++) {
    const temp = variableObject.nestVariableData.find(
      (v: any) => v.name === splitVariable[i],
    );
    if (temp) {
      sentence += `.${temp.name}`;
      variableObject = temp;
    } else {
      return completions;
    }
    if (i === splitVariable.length - 1) {
      variableObject.nestVariableData.forEach((value: any) => {
        completions.push({
          label: `${value.name}`,
          filterText: `${sentence}.${value.name}`,
          kind: CompletionItemKind.Variable,
          insertText: `${sentence}.${value.name}`,
          detail: `${sentence}.${value.name}`,
        });
      });
    }
  }
  return completions;
}

function completionVariable(
  infoWs: any,
  projectPath: string,
  variableKind: string,
): CompletionItem[] {
  const completions: CompletionItem[] = [];
  infoWs.variableMap.forEach((_variable: any, key: string) => {
    if (key === projectPath) {
      infoWs.variableMap.get(key)?.forEach((value: any) => {
        if (value.kind === variableKind) {
          completions.push({
            label: value.kind + "." + value.name,
            kind: CompletionItemKind.Variable,
            insertText: value.kind + "." + value.name,
          });
        }
      });
    }
  });
  return completions;
}

function completionResource(
  infoWs: any,
  projectPath: string,
  requireResourceType: string | string[],
  referencePath: string,
  paramConfig?: any,
): CompletionItem[] {
  const completions: CompletionItem[] = [];
  const typeArray = Array.isArray(requireResourceType)
    ? requireResourceType
    : [requireResourceType];

  // enum type
  if (typeArray.includes("enum") && paramConfig?.values) {
    paramConfig.values.forEach((value: string) => {
      completions.push({
        label: value,
        kind: CompletionItemKind.Enum,
        insertText: value,
      });
    });
  }

  // layer type
  if (typeArray.includes("layer")) {
    const configValues = getConfigValues(projectPath);
    for (let i = 0; i <= configValues.numCharacterLayers; i++) {
      completions.push({
        label: i.toString(),
        kind: CompletionItemKind.Value,
        insertText: i.toString(),
      });
    }
    for (let i = 0; i <= configValues.numMessageLayers; i++) {
      const messageLayer = `message${i}`;
      completions.push({
        label: messageLayer,
        kind: CompletionItemKind.Value,
        insertText: messageLayer,
      });
    }
  }

  // Resource files
  infoWs.resourceFileMap.forEach((resourcesMap: any, key: string) => {
    if (projectPath === key) {
      resourcesMap.forEach((resource: any) => {
        if (typeArray.includes(resource.resourceType)) {
          const referenceFilePath = path
            .relative(referencePath, resource.filePath)
            .replace(/\\/g, "/");
          const displayLabel = resource.filePath
            .replace(
              projectPath + infoWs.DATA_DIRECTORY + infoWs.pathDelimiter,
              "",
            )
            .replace(/\\/g, "/");
          const absoluteImagePath = URI.file(resource.filePath).toString();

          completions.push({
            label: displayLabel,
            kind: CompletionItemKind.File,
            insertText: referenceFilePath,
            documentation: {
              kind: MarkupKind.Markdown,
              value: `${referenceFilePath}\n\n![preview](${absoluteImagePath})`,
            },
          });
        }
      });
    }
  });
  return completions;
}

function completionTag(
  infoWs: any,
  serverConfig: any,
  projectPath: string,
  lineText: string,
  position: Position,
): CompletionItem[] {
  const completions: CompletionItem[] = [];
  const suggestionsByTag = infoWs.suggestions.get(projectPath) as any;
  if (!suggestionsByTag) return completions;

  const beforeCursor = lineText.substring(0, position.character);
  const hasAtSymbol = beforeCursor.includes("@");
  const lastOpenBracket = beforeCursor.lastIndexOf("[");
  const lastCloseBracket = beforeCursor.lastIndexOf("]");
  const isInsideBrackets =
    lastOpenBracket > lastCloseBracket && lastOpenBracket !== -1;
  const inputType = serverConfig.completionTagInputType || "[ ]";

  for (const suggestion of Object.values(suggestionsByTag) as any[]) {
    if (!suggestion.name) continue;
    const { name, description } = suggestion;
    const textLabel = name.toString();

    let insertText: string;
    if (hasAtSymbol) {
      insertText = `${textLabel} `;
    } else if (isInsideBrackets) {
      insertText = `${textLabel} `;
    } else {
      insertText = inputType === "@" ? `@${textLabel} ` : `[${textLabel} ]`;
    }

    completions.push({
      label: textLabel,
      kind: CompletionItemKind.Class,
      insertText: insertText,
      documentation: {
        kind: MarkupKind.Markdown,
        value: description || "",
      },
    });
  }
  return completions;
}

function completionParameter(
  infoWs: any,
  projectPath: string,
  selectedTag: string,
  parameters: object,
  nameParamValue: string,
  lineText: string,
  position: Position,
): CompletionItem[] {
  const completions: CompletionItem[] = [];
  const charBeforeCursor =
    position.character > 0 ? lineText.charAt(position.character - 1) : "";
  const charAfterCursor =
    position.character < lineText.length
      ? lineText.charAt(position.character)
      : "";

  const suggestions = JSON.parse(
    JSON.stringify(infoWs.suggestions.get(projectPath) || {}),
  ) as any;
  const partList = getPartListFromCharacterData(
    infoWs,
    projectPath,
    nameParamValue,
  );

  for (const item in suggestions) {
    const tagName = suggestions[item]["name"]?.toString();
    if (selectedTag === tagName) {
      if (selectedTag === "chara_part") {
        partList.forEach((part: string) => {
          suggestions[item]["parameters"].push({
            name: part,
            description: "chara_layerタグのpartパラメータで指定した値",
            required: false,
          });
        });
      }
      for (const item2 of suggestions[item]["parameters"]) {
        if (!(item2["name"] in parameters)) {
          let detailText = "";
          if (!item2["detail"]) {
            detailText = item2["required"] ? "（必須）" : "";
          } else {
            detailText = item2["detail"];
          }

          const spacePrefix = charBeforeCursor === '"' ? " " : "";
          const spaceSuffix = charAfterCursor !== "" ? " " : "";
          completions.push({
            label: item2["name"],
            detail: detailText,
            insertText: spacePrefix + item2["name"] + '="$1"' + spaceSuffix,
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: {
              kind: MarkupKind.Markdown,
              value: item2["description"] || "",
            },
            kind: CompletionItemKind.Function,
            command: {
              command: "editor.action.triggerSuggest",
              title: "Re-trigger",
            },
          });
        }
      }
    }
  }
  return completions;
}

function getPartListFromCharacterData(
  infoWs: any,
  projectPath: string,
  nameParamValue: string,
): string[] {
  const characterDataList = infoWs.characterMap.get(projectPath);
  if (!characterDataList || !nameParamValue) return [];
  const layerMap = characterDataList.find(
    (cd: any) => cd.name === nameParamValue,
  )?.layer;
  return layerMap ? [...layerMap.keys()] : [];
}

function getConfigValues(projectPath: string): {
  numCharacterLayers: number;
  numMessageLayers: number;
} {
  const configPath = path.join(projectPath, "data", "system", "Config.tjs");
  const defaultValues = { numCharacterLayers: 3, numMessageLayers: 2 };
  try {
    if (!fs.existsSync(configPath)) return defaultValues;
    const configContent = fs.readFileSync(configPath, "utf-8");
    const numCharacterLayers =
      extractConfigValue(configContent, "numCharacterLayers") ??
      defaultValues.numCharacterLayers;
    const numMessageLayers =
      extractConfigValue(configContent, "numMessageLayers") ??
      defaultValues.numMessageLayers;
    return { numCharacterLayers, numMessageLayers };
  } catch {
    return defaultValues;
  }
}

function extractConfigValue(content: string, paramName: string): number | null {
  const regex = new RegExp(`;\\s*${paramName}\\s*=\\s*(\\d+)\\s*;`, "m");
  const match = content.match(regex);
  return match ? parseInt(match[1], 10) : null;
}
