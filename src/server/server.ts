import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  DidChangeConfigurationNotification,
  CompletionItem,
  CompletionItemKind,
  Hover,
  MarkupKind,
  DocumentSymbol,
  SymbolKind,
  Location,
  Range,
  Position,
  Diagnostic,
  DiagnosticSeverity,
  CompletionParams,
  DocumentSymbolParams,
  HoverParams,
  DefinitionParams,
  RenameParams,
  PrepareRenameParams,
  WorkspaceEdit,
  TextEdit,
  ReferenceParams,
  InsertTextFormat,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import * as fs from "fs";
import * as path from "path";

import {
  TyranoInitializationOptions,
  TyranoRequests,
  ResolveJumpTargetParams,
  ResolveJumpTargetResult,
  TyranoNotifications,
  FileChangedParams,
  GetTransitionDataParams,
  GetScenarioListResult,
} from "../shared/protocol";
import { TyranoLogger, ErrorLevel } from "./TyranoLogger";
import { InformationExtension } from "./InformationExtension";
import { InformationWorkSpace } from "./InformationWorkSpace";
import { Parser } from "./Parser";
import { CrossFileContextManager } from "./CrossFileContextManager";

// ── Connection & Documents ──
const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// ── Core singletons ──
const infoWs = InformationWorkSpace.getInstance();
const parser = Parser.getInstance();
const crossFileCtx = new CrossFileContextManager();

// ── Server configuration (populated from initializationOptions) ──
let serverConfig: TyranoInitializationOptions;

// ── Diagnostic state ──
let isDiagnosing = false;

// ══════════════════════════════════════════════════
//  Initialization
// ══════════════════════════════════════════════════
connection.onInitialize((params: InitializeParams): InitializeResult => {
  serverConfig = params.initializationOptions as TyranoInitializationOptions;

  // Initialize logger
  TyranoLogger.initialize(connection);
  TyranoLogger.setEnabled(serverConfig.loggerEnabled);
  TyranoLogger.print("LSP Server onInitialize");

  // Initialize extension info
  InformationExtension.initialize(
    serverConfig.extensionPath,
    serverConfig.language,
  );

  // Initialize InformationWorkSpace
  infoWs.initialize({
    workspaceRoot: serverConfig.workspaceRoot,
    isParsePluginFolder: serverConfig.isParsePluginFolder,
    resourceExtensions: serverConfig.resourceExtensions,
    pluginTags: serverConfig.pluginTags,
  });
  infoWs.extensionPath = serverConfig.extensionPath;

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        triggerCharacters: ["."],
        resolveProvider: false,
      },
      hoverProvider: true,
      documentSymbolProvider: true,
      definitionProvider: true,
      renameProvider: {
        prepareProvider: true,
      },
      referencesProvider: true,
    },
  };
});

connection.onInitialized(async () => {
  TyranoLogger.print("LSP Server onInitialized");

  // Register for configuration changes
  connection.client.register(
    DidChangeConfigurationNotification.type,
    undefined,
  );

  // Initialize maps (load all project files)
  try {
    await infoWs.initializeMaps();
    TyranoLogger.print("InformationWorkSpace maps initialized");

    // Initialize CrossFileContextManager
    const dataDirectories: string[] = [];
    for (const projectPath of infoWs.getTyranoScriptProjectRootPaths()) {
      const dataDir = projectPath + infoWs.DATA_DIRECTORY;
      if (fs.existsSync(dataDir)) {
        dataDirectories.push(dataDir);
      }
    }
    await crossFileCtx.init(dataDirectories);
    TyranoLogger.print("CrossFileContextManager initialized");

    // Run initial diagnostics for all projects
    for (const projectPath of infoWs.getTyranoScriptProjectRootPaths()) {
      await runDiagnostics(projectPath + infoWs.pathDelimiter);
    }
  } catch (error) {
    TyranoLogger.print("Initialization failed", ErrorLevel.ERROR);
    TyranoLogger.printStackTrace(error);
  }
});

// ══════════════════════════════════════════════════
//  Configuration Change
// ══════════════════════════════════════════════════
connection.onDidChangeConfiguration((_change) => {
  TyranoLogger.print("Configuration changed notification received");
});

// ══════════════════════════════════════════════════
//  Document Events
// ══════════════════════════════════════════════════
documents.onDidChangeContent(async (change) => {
  const fsPath = URI.parse(change.document.uri).fsPath;

  // Update cross-file JS context
  crossFileCtx.updateFromText(fsPath, change.document.getText());

  // Update scenario file map with the live document
  if (fsPath.endsWith(".ks")) {
    infoWs.scenarioFileMap.set(fsPath, change.document);

    // Run diagnostics if auto-diagnostic is enabled
    if (serverConfig.autoDiagnosticEnabled) {
      await runDiagnosticForFile(fsPath);
    }
  }
});

documents.onDidSave(async (change) => {
  const fsPath = URI.parse(change.document.uri).fsPath;
  if (fsPath.endsWith(".ks")) {
    await infoWs.updateScenarioFileMap(fsPath);
    await infoWs.updateMacroLabelVariableDataMapByKs(fsPath);
    await runDiagnosticForFile(fsPath);
  }
});

// ══════════════════════════════════════════════════
//  File Change Notifications (from client)
// ══════════════════════════════════════════════════
connection.onNotification(
  TyranoNotifications.FileChanged,
  async (params: FileChangedParams) => {
    const fsPath = URI.parse(params.uri).fsPath;
    TyranoLogger.print(
      `File changed: ${params.type} ${params.fileType} ${fsPath}`,
    );

    if (params.fileType === "scenario") {
      if (params.type === "deleted") {
        await infoWs.spliceScenarioFileMapByFilePath(fsPath);
        await infoWs.spliceMacroDataMapByFilePath(fsPath);
        await infoWs.spliceLabelMapByFilePath(fsPath);
        await infoWs.spliceVariableMapByFilePath(fsPath);
        await infoWs.spliceCharacterMapByFilePath(fsPath);
        await infoWs.spliceTransitionMapByFilePath(fsPath);
        crossFileCtx.removeFile(fsPath);
      } else {
        await infoWs.updateScenarioFileMap(fsPath);
        await infoWs.updateMacroLabelVariableDataMapByKs(fsPath);
        crossFileCtx.loadFileFromDisk(fsPath);
      }
    } else if (params.fileType === "script") {
      if (params.type === "deleted") {
        await infoWs.spliceScriptFileMapByFilePath(fsPath);
        await infoWs.spliceMacroDataMapByFilePath(fsPath);
        await infoWs.spliceVariableMapByFilePath(fsPath);
      } else {
        await infoWs.updateScriptFileMap(fsPath);
        await infoWs.updateMacroDataMapByJs(fsPath);
      }
    } else if (params.fileType === "resource") {
      if (params.type === "deleted") {
        await infoWs.spliceResourceFileMapByFilePath(fsPath);
      } else if (params.type === "created") {
        await infoWs.addResourceFileMap(fsPath);
      }
    }
  },
);

// ══════════════════════════════════════════════════
//  Hover
// ══════════════════════════════════════════════════
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

function handleParameterHover(
  _document: TextDocument,
  position: Position,
  projectPath: string,
  lineText: string,
): Hover | null {
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

// ══════════════════════════════════════════════════
//  Completion
// ══════════════════════════════════════════════════
connection.onCompletion(
  async (params: CompletionParams): Promise<CompletionItem[] | null> => {
    try {
      const document = documents.get(params.textDocument.uri);
      if (!document) return null;

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
      const layerParts = findLayerParts(projectPath, tagIndex, parsedData);

      // # character name completion
      if (
        typeof leftSideText === "string" &&
        SHARP_REGEXP.test(leftSideText)
      ) {
        return completionNameParameter(projectPath);
      }
      // Variable completion
      if (variableValue) {
        const variableKind = variableValue[0]
          .split(".")[0]
          .replace("&", "");
        const variableName = getVariableName(variableValue[0]);
        if (variableName) {
          const variableObject = findVariableObject(
            projectPath,
            variableName,
          );
          if (variableObject) {
            const splitVariable = variableValue[0].split(".");
            return completionNestVariable(variableObject, splitVariable);
          }
        }
        return completionVariable(projectPath, variableKind);
      }
      // Target label completion
      if (
        parsedData[tagIndex] !== undefined &&
        lineTagName !== undefined &&
        lineParamName === "target"
      ) {
        return completionLabel(
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
        return completionNameParameter(projectPath);
      }
      // face parameter
      if (
        parsedData[tagIndex] !== undefined &&
        lineTagName !== undefined &&
        lineParamName === "face" &&
        characterOperationTagList.includes(parsedData[tagIndex]["name"])
      ) {
        return completionFaceParameter(
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
          projectPath,
          paramInfo.type,
          projectPath +
            infoWs.pathDelimiter +
            (paramInfo.path || ""),
          paramInfo,
        );
      }
      // Tag completion (empty line or text)
      if (
        parsedData === undefined ||
        parsedData[tagIndex] === undefined ||
        !parsedData[tagIndex]["name"]
      ) {
        return completionTag(projectPath, lineText, position);
      }
      // Parameter completion (inside a tag)
      const isTagSentence =
        lineTagName === "text" || lineTagName === undefined ? false : true;
      if (isTagSentence) {
        return completionParameter(
          lineTagName,
          parsedData[tagIndex]["pm"],
          projectPath,
          parsedData[tagIndex]["pm"]["name"],
          lineText,
          position,
        );
      }
      return completionTag(projectPath, lineText, position);
    } catch (error) {
      TyranoLogger.print("Completion failed", ErrorLevel.ERROR);
      TyranoLogger.printStackTrace(error);
      return null;
    }
  },
);

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
  projectPath: string,
  tagIndex: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsedData: any[],
): string[] {
  try {
    const characterData = infoWs.characterMap
      .get(projectPath)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.find(
        (cd: any) => cd.name === parsedData[tagIndex]?.["pm"]?.["name"],
      );
    return characterData?.layer ? [...characterData.layer.keys()] : [];
  } catch {
    return [];
  }
}

function completionNameParameter(
  projectPath: string,
): CompletionItem[] | null {
  const characterDataList = infoWs.characterMap.get(projectPath);
  if (!characterDataList) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return characterDataList.map((cd: any) => ({
    label: cd.name,
    kind: CompletionItemKind.Variable,
    insertText: cd.name,
  }));
}

function completionFaceParameter(
  projectPath: string,
  nameParamValue: string,
): CompletionItem[] | null {
  const characterDataList = infoWs.characterMap.get(projectPath);
  if (!characterDataList || !nameParamValue) return null;
  const faceList = characterDataList.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cd: any) => cd.name === nameParamValue,
  )?.faceList;
  if (!faceList) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return faceList.map((fd: any) => ({
    label: fd.face,
    kind: CompletionItemKind.Variable,
    insertText: fd.face,
    detail: `${fd.name}に定義されているface`,
  }));
}

function completionPartParameter(
  projectPath: string,
  nameParamValue: string,
): CompletionItem[] | null {
  const characterDataList = infoWs.characterMap.get(projectPath);
  if (!characterDataList || !nameParamValue) return null;
  const layerMap = characterDataList.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  projectPath: string,
  nameParamValue: string,
  partName: string,
): CompletionItem[] | null {
  const characterDataList = infoWs.characterMap.get(projectPath);
  if (!characterDataList || !nameParamValue) return null;
  const layerMap = characterDataList.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cd: any) => cd.name === nameParamValue,
  )?.layer;
  if (!layerMap) return null;
  const layerDataList = layerMap.get(partName);
  if (!layerDataList) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return layerDataList.map((ld: any) => ({
    label: ld.id,
    kind: CompletionItemKind.Variable,
    insertText: ld.id,
    detail: `${nameParamValue}の${partName}に定義されているid`,
  }));
}

function completionLabel(
  projectPath: string,
  storage: string | undefined,
  document: TextDocument,
): CompletionItem[] {
  const completions: CompletionItem[] = [];
  const documentFsPath = URI.parse(document.uri).fsPath;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  infoWs.labelMap.forEach((labels: any, key: string) => {
    const labelProjectPath = infoWs.getProjectPathByFilePath(key);
    if (projectPath === labelProjectPath) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          infoWs.isSamePath(
            URI.parse(value.location.uri).fsPath,
            storagePath,
          )
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  projectPath: string,
  variableKind: string,
): CompletionItem[] {
  const completions: CompletionItem[] = [];
  infoWs.variableMap.forEach((_variable, key) => {
    if (key === projectPath) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  projectPath: string,
  requireResourceType: string | string[],
  referencePath: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  infoWs.resourceFileMap.forEach((resourcesMap: any, key: string) => {
    if (projectPath === key) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resourcesMap.forEach((resource: any) => {
        if (typeArray.includes(resource.resourceType)) {
          const referenceFilePath = path
            .relative(referencePath, resource.filePath)
            .replace(/\\/g, "/");
          const displayLabel = resource.filePath
            .replace(
              projectPath +
                infoWs.DATA_DIRECTORY +
                infoWs.pathDelimiter,
              "",
            )
            .replace(/\\/g, "/");
          const absoluteImagePath = URI.file(
            resource.filePath,
          ).toString();

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
  projectPath: string,
  lineText: string,
  position: Position,
): CompletionItem[] {
  const completions: CompletionItem[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const suggestionsByTag = infoWs.suggestions.get(projectPath) as any;
  if (!suggestionsByTag) return completions;

  const beforeCursor = lineText.substring(0, position.character);
  const hasAtSymbol = beforeCursor.includes("@");
  const lastOpenBracket = beforeCursor.lastIndexOf("[");
  const lastCloseBracket = beforeCursor.lastIndexOf("]");
  const isInsideBrackets =
    lastOpenBracket > lastCloseBracket && lastOpenBracket !== -1;
  const inputType = serverConfig.completionTagInputType || "[ ]";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      insertText =
        inputType === "@" ? `@${textLabel} ` : `[${textLabel} ]`;
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
  selectedTag: string,
  parameters: object,
  projectPath: string,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;
  const partList = getPartListFromCharacterData(
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
            description:
              "chara_layerタグのpartパラメータで指定した値",
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
            insertText:
              spacePrefix +
              item2["name"] +
              '="$1"' +
              spaceSuffix,
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
  projectPath: string,
  nameParamValue: string,
): string[] {
  const characterDataList = infoWs.characterMap.get(projectPath);
  if (!characterDataList || !nameParamValue) return [];
  const layerMap = characterDataList.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cd: any) => cd.name === nameParamValue,
  )?.layer;
  return layerMap ? [...layerMap.keys()] : [];
}

function getConfigValues(projectPath: string): {
  numCharacterLayers: number;
  numMessageLayers: number;
} {
  const configPath = path.join(
    projectPath,
    "data",
    "system",
    "Config.tjs",
  );
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

function extractConfigValue(
  content: string,
  paramName: string,
): number | null {
  const regex = new RegExp(`;\\s*${paramName}\\s*=\\s*(\\d+)\\s*;`, "m");
  const match = content.match(regex);
  return match ? parseInt(match[1], 10) : null;
}

// ══════════════════════════════════════════════════
//  Document Symbols (Outline)
// ══════════════════════════════════════════════════
connection.onDocumentSymbol(
  (params: DocumentSymbolParams): DocumentSymbol[] => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];

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

function isTagOutline(text: string, outlineTags: string[]): boolean {
  if (!outlineTags || outlineTags.length === 0) return false;
  const REGEX = /((\w+))\s*((\S*)="?(\w*)"?)*()/;
  const matcher = text.match(REGEX);
  if (!matcher) return false;
  return outlineTags.includes(matcher[1]);
}

function isCommentOutLine(
  text: string,
  commentStrings: string[],
): boolean {
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

// ══════════════════════════════════════════════════
//  Definition
// ══════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════
//  Rename
// ══════════════════════════════════════════════════
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
        const edits = getVariableRenameEdits(
          fileText,
          targetWord,
          newName,
        );
        if (edits.length > 0) changes[fileUri] = edits;
      }
    }

    return { changes };
  },
);

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
  const MACRO_NAME_REGEX =
    /(@macro|\[macro)\s+name\s*=\s*["'].*["']/;
  let match;
  while ((match = WORD_REGEX.exec(text)) !== null) {
    if (
      match.index <= offset &&
      offset <= match.index + match[0].length
    ) {
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

  const tmpDoc = TextDocument.create(
    "file:///tmp",
    "tyrano",
    0,
    fileText,
  );

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
  const tmpDoc = TextDocument.create(
    "file:///tmp",
    "tyrano",
    0,
    fileText,
  );

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

// ══════════════════════════════════════════════════
//  References (stub)
// ══════════════════════════════════════════════════
connection.onReferences(
  (_params: ReferenceParams): Location[] | null => {
    return null;
  },
);

// ══════════════════════════════════════════════════
//  Custom Requests
// ══════════════════════════════════════════════════
connection.onRequest(
  TyranoRequests.ResolveJumpTarget,
  async (
    params: ResolveJumpTargetParams,
  ): Promise<ResolveJumpTargetResult | null> => {
    try {
      const fsPath = URI.parse(params.uri).fsPath;
      const projectPath = infoWs.getProjectPathByFilePath(fsPath);

      // Get the document (from open docs or scenario map)
      const doc =
        documents.get(params.uri) ||
        infoWs.scenarioFileMap.get(fsPath);
      if (!doc) return null;

      const lineText = getLineText(doc, params.line);
      const parsedData = parser.parseText(lineText);
      const tagIndex = parser.getIndex(parsedData, params.character);
      if (tagIndex < 0) return null;

      const tagData = parsedData[tagIndex];
      const storage =
        tagData["pm"]["storage"] || tagData["pm"]["file"];
      const target = tagData["pm"]["target"];

      // Determine file to jump to
      let targetFsPath: string;
      if (storage) {
        const tagParams = serverConfig.tagParameter || {};
        const tagName = tagData["name"];
        let basePath = "";

        if (tagParams[tagName]) {
          for (const param of Object.values(tagParams[tagName])) {
            if (param.path) {
              basePath = param.path;
              break;
            }
          }
        }
        if (!basePath) basePath = "data/scenario";
        targetFsPath = path.join(projectPath, basePath, storage);
      } else {
        targetFsPath = fsPath;
      }

      // Find target label line
      let targetLine = 0;
      if (target) {
        const targetLabel = target.replace("*", "");
        try {
          const targetContent = fs.readFileSync(
            targetFsPath,
            "utf-8",
          );
          const targetParsedData = parser.parseText(targetContent);
          for (const data of targetParsedData) {
            if (
              data["name"] === "label" &&
              data["pm"]["label_name"] === targetLabel
            ) {
              targetLine = data["pm"]["line"];
              break;
            }
          }
        } catch {
          /* file not found, default to line 0 */
        }
      }

      return {
        targetUri: URI.file(targetFsPath).toString(),
        targetLine: targetLine,
        targetCharacter: 0,
      };
    } catch (error) {
      TyranoLogger.print(
        "ResolveJumpTarget failed",
        ErrorLevel.ERROR,
      );
      TyranoLogger.printStackTrace(error);
      return null;
    }
  },
);

// ── GetTransitionData ──
connection.onRequest(
  TyranoRequests.GetTransitionData,
  (params: { scenarioFilePath: string }) => {
    const normalizedFilePath = params.scenarioFilePath.replace(/\\\\/g, "\\");
    const transitionData = infoWs.transitionMap.get(normalizedFilePath);
    if (!transitionData) {
      return null;
    }
    const projectPath =
      infoWs.getProjectPathByFilePath(normalizedFilePath);
    const projectName = projectPath.split(/[\\/]/).pop() || "";
    return { transitionData, projectName };
  },
);

// ── GetScenarioList ──
connection.onRequest(TyranoRequests.GetScenarioList, () => {
  const scenarioList = Array.from(infoWs.transitionMap.keys());
  const rootPathList = infoWs.getTyranoScriptProjectRootPaths();

  const data: {
    [key: string]: { fullPath: string; scenarioName: string }[];
  } = {};
  for (const rootPath of rootPathList) {
    const projectName = rootPath.split(/[\\/]/).pop();
    if (projectName) {
      data[projectName] = [];
    }
  }
  for (const scenarioPath of scenarioList) {
    for (const rootPath of rootPathList) {
      const projectName = rootPath.split(/[\\/]/).pop();
      if (scenarioPath.includes(rootPath) && projectName) {
        const sep = rootPath.includes("/") ? "/" : "\\";
        const relativePath = scenarioPath.replace(rootPath + sep, "");
        data[projectName].push({
          fullPath: scenarioPath,
          scenarioName: relativePath,
        });
      }
    }
  }
  return { scenarioList: data };
});

// ══════════════════════════════════════════════════
//  Diagnostics
// ══════════════════════════════════════════════════
async function runDiagnosticForFile(fileName: string): Promise<void> {
  if (!fileName.endsWith(".ks") || isDiagnosing) return;
  isDiagnosing = true;
  try {
    await infoWs.updateScenarioFileMap(fileName);
    await infoWs.updateMacroLabelVariableDataMapByKs(fileName);
    await runDiagnostics(fileName);
  } catch (error) {
    TyranoLogger.print("Diagnostic failed", ErrorLevel.ERROR);
    TyranoLogger.printStackTrace(error);
  } finally {
    isDiagnosing = false;
  }
}

async function runDiagnostics(_triggerFileName: string): Promise<void> {
  const executeDiagnostic = serverConfig.executeDiagnostic || {};
  const tyranoBuilderEnabled = serverConfig.tyranoBuilderEnabled || false;
  const tyranoBuilderSkipTags = serverConfig.tyranoBuilderSkipTags || [];
  const tyranoBuilderSkipParameters =
    serverConfig.tyranoBuilderSkipParameters || {};

  for (const [filePath, scenarioDocument] of infoWs.scenarioFileMap) {
    const projectPath = infoWs.getProjectPathByFilePath(filePath);
    if (!projectPath) continue;
    if (infoWs.isSkipParse(filePath, projectPath)) continue;

    const diagnostics: Diagnostic[] = [];
    const parsedData = parser.parseText(scenarioDocument.getText());

    for (const data of parsedData) {
      if (data["name"] === "comment" || data["name"] === "text")
        continue;

      // Undefined macro check
      if (isExecDiag(executeDiagnostic, "undefinedMacro")) {
        checkUndefinedMacro(
          data,
          projectPath,
          filePath,
          scenarioDocument,
          diagnostics,
          tyranoBuilderEnabled,
          tyranoBuilderSkipTags,
        );
      }

      // Label name check
      if (isExecDiag(executeDiagnostic, "labelName")) {
        checkLabelName(data, scenarioDocument, diagnostics);
      }

      // Undefined parameter check
      if (isExecDiag(executeDiagnostic, "undefinedParameter")) {
        checkUndefinedParameter(
          data,
          projectPath,
          scenarioDocument,
          diagnostics,
          tyranoBuilderEnabled,
          tyranoBuilderSkipTags,
          tyranoBuilderSkipParameters,
        );
      }

      // Missing ampersand in variable check
      if (
        isExecDiag(executeDiagnostic, "missingAmpersandInVariable")
      ) {
        checkMissingAmpersandInVariable(
          data,
          scenarioDocument,
          diagnostics,
        );
      }
    }

    // Missing scenarios and labels check
    if (isExecDiag(executeDiagnostic, "missingScenariosAndLabels")) {
      checkMissingScenariosAndLabels(
        parsedData,
        projectPath,
        filePath,
        scenarioDocument,
        diagnostics,
        tyranoBuilderEnabled,
      );
    }

    // jump/call in if statement check
    if (isExecDiag(executeDiagnostic, "jumpAndCallInIfStatement")) {
      checkJumpAndCallInIfStatement(
        parsedData,
        scenarioDocument,
        diagnostics,
      );
    }

    // Macro duplicate check
    if (isExecDiag(executeDiagnostic, "macroDuplicate")) {
      checkMacroDuplicate(projectPath, filePath, diagnostics);
    }

    // Parameter spacing check
    if (isExecDiag(executeDiagnostic, "parameterSpacing")) {
      checkParameterSpacing(scenarioDocument, diagnostics);
    }

    // Send diagnostics
    connection.sendDiagnostics({
      uri: URI.file(filePath).toString(),
      diagnostics,
    });
  }
}

function isExecDiag(
  executeDiagnostic: { [key: string]: boolean },
  key: string,
): boolean {
  return executeDiagnostic[key] === true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkUndefinedMacro(
  data: any,
  projectPath: string,
  _filePath: string,
  doc: TextDocument,
  diagnostics: Diagnostic[],
  tyranoBuilderEnabled: boolean,
  tyranoBuilderSkipTags: string[],
): void {
  if (
    data["name"] === "label" ||
    data["name"] === "comment" ||
    data["name"] === "text"
  )
    return;
  if (
    tyranoBuilderEnabled &&
    tyranoBuilderSkipTags.includes(data["name"])
  )
    return;

  const suggestions = infoWs.suggestions.get(projectPath);
  if (!suggestions) return;

  const projectMacros = infoWs.defineMacroMap.get(projectPath);
  const isMacro = projectMacros
    ? Array.from(projectMacros.values()).some(
        (m) => m.macroName === data["name"],
      )
    : false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isTag = (suggestions as any)[data["name"]] !== undefined;

  if (!isMacro && !isTag) {
    const lineText = getLineText(doc, data["line"]);
    const tagFirstIndex = lineText.indexOf(data["name"]);
    if (tagFirstIndex >= 0) {
      const range = Range.create(
        data["line"],
        tagFirstIndex,
        data["line"],
        tagFirstIndex + data["name"].length,
      );
      diagnostics.push(
        Diagnostic.create(
          range,
          `[${data["name"]}]は定義されていないタグ、もしくはマクロです。`,
          DiagnosticSeverity.Error,
        ),
      );
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkLabelName(
  data: any,
  _doc: TextDocument,
  diagnostics: Diagnostic[],
): void {
  if (data["name"] !== "label" || data["pm"]["is_in_comment"] === true)
    return;
  const labelName = data["pm"]["label_name"];
  if (!labelName) return;

  const range = Range.create(
    Position.create(data["pm"]["line"], 0),
    Position.create(data["pm"]["line"], labelName.length + 1),
  );

  if (/^\d/.test(labelName)) {
    diagnostics.push(
      Diagnostic.create(
        range,
        `ラベル名 "${labelName}" は数字から始まっており、非推奨の可能性があります。`,
        DiagnosticSeverity.Warning,
      ),
    );
    return;
  }
  if (/\s/.test(labelName)) {
    diagnostics.push(
      Diagnostic.create(
        range,
        `ラベル名 "${labelName}" に空白文字が含まれています。空白文字は非推奨です。`,
        DiagnosticSeverity.Warning,
      ),
    );
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(labelName)) {
    if (/[^\x01-\x7E]/.test(labelName)) {
      diagnostics.push(
        Diagnostic.create(
          range,
          `ラベル名 "${labelName}" に日本語などの2バイト文字が含まれています。半角英数字とアンダースコアの使用を推奨します。`,
          DiagnosticSeverity.Warning,
        ),
      );
    } else {
      diagnostics.push(
        Diagnostic.create(
          range,
          `ラベル名 "${labelName}" に使用できない文字が含まれてる可能性があります。半角英数字とアンダースコアのみ使用可能です。`,
          DiagnosticSeverity.Warning,
        ),
      );
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkMissingScenariosAndLabels(
  parsedData: any[],
  projectPath: string,
  filePath: string,
  scenarioDocument: TextDocument,
  diagnostics: Diagnostic[],
  tyranoBuilderEnabled: boolean,
): void {
  for (const data of parsedData) {
    if (
      data["name"] === "comment" ||
      data["name"] === "text" ||
      data["name"] === "label"
    )
      continue;

    // storage check
    if (data["pm"]["storage"] !== undefined) {
      const range = getParameterRange(
        "storage",
        data["pm"]["storage"],
        data,
        scenarioDocument,
      );
      if (isExistPercentAtBeginning(data["pm"]["storage"])) continue;
      if (isValueIsIncludeVariable(data["pm"]["storage"])) {
        if (!isExistAmpersandAtBeginning(data["pm"]["storage"])) {
          diagnostics.push(
            Diagnostic.create(
              range,
              "パラメータに変数を使う場合は先頭に'&'が必要です。",
              DiagnosticSeverity.Error,
            ),
          );
          continue;
        }
      } else {
        if (
          !fs.existsSync(
            infoWs.convertToAbsolutePathFromRelativePath(
              projectPath +
                infoWs.DATA_DIRECTORY +
                infoWs.DATA_SCENARIO +
                infoWs.pathDelimiter +
                data["pm"]["storage"],
            ),
          )
        ) {
          diagnostics.push(
            Diagnostic.create(
              range,
              data["pm"]["storage"] +
                "は存在しないファイルです。",
              DiagnosticSeverity.Error,
            ),
          );
          continue;
        }
      }
    }

    // target check
    if (data["pm"]["target"] !== undefined) {
      const range = getParameterRange(
        "target",
        data["pm"]["target"],
        data,
        scenarioDocument,
      );
      if (isExistPercentAtBeginning(data["pm"]["target"])) continue;
      if (isValueIsIncludeVariable(data["pm"]["target"])) {
        if (!isExistAmpersandAtBeginning(data["pm"]["target"])) {
          diagnostics.push(
            Diagnostic.create(
              range,
              "パラメータに変数を使う場合は先頭に'&'が必要です。",
              DiagnosticSeverity.Error,
            ),
          );
          continue;
        }
      } else if (
        !isValueIsIncludeVariable(data["pm"]["storage"])
      ) {
        data["pm"]["target"] = data["pm"]["target"].replace(
          "*",
          "",
        );
        const storageFsPath =
          data["pm"]["storage"] === undefined
            ? filePath
            : infoWs.convertToAbsolutePathFromRelativePath(
                projectPath +
                  infoWs.DATA_DIRECTORY +
                  infoWs.DATA_SCENARIO +
                  infoWs.pathDelimiter +
                  data["pm"]["storage"],
              );

        const storageDoc =
          infoWs.scenarioFileMap.get(storageFsPath);
        if (!storageDoc) {
          diagnostics.push(
            Diagnostic.create(
              range,
              data["pm"]["target"] +
                "ファイル解析中に下線の箇所でエラーが発生しました。開発者への報告をお願いします。",
              DiagnosticSeverity.Error,
            ),
          );
          continue;
        }
        const storageParsedData = parser.parseText(
          storageDoc.getText(),
        );
        let isLabelExist = false;
        for (const storageData of storageParsedData) {
          if (
            storageData["pm"]["label_name"] ===
            data["pm"]["target"]
          ) {
            isLabelExist = true;
            break;
          }
        }
        if (
          !isLabelExist &&
          !(
            tyranoBuilderEnabled &&
            data["pm"]["target"] === ""
          )
        ) {
          diagnostics.push(
            Diagnostic.create(
              range,
              data["pm"]["target"] +
                "は存在しないラベルです。",
              DiagnosticSeverity.Error,
            ),
          );
        }
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkJumpAndCallInIfStatement(
  parsedData: any[],
  doc: TextDocument,
  diagnostics: Diagnostic[],
): void {
  let isInIf = false;
  for (const data of parsedData) {
    if (data["name"] === "comment") continue;
    if (data["name"] === "if") isInIf = true;
    if (data["name"] === "endif") isInIf = false;

    if (
      isInIf &&
      (data["name"] === "jump" || data["name"] === "call")
    ) {
      const lineText = getLineText(doc, data["line"]);
      const tagFirstIndex = lineText.indexOf(data["name"]);
      const tagLastIndex =
        tagFirstIndex + sumStringLengthsInObject(data["pm"]);
      const range = Range.create(
        data["line"],
        tagFirstIndex,
        data["line"],
        tagLastIndex,
      );
      diagnostics.push(
        Diagnostic.create(
          range,
          `ifの中での${data["name"]}は正常に動作しない可能性があります。[${data["name"]} cond="条件式"]に置き換えることを推奨します。`,
          DiagnosticSeverity.Warning,
        ),
      );
    }
  }
}

function checkMacroDuplicate(
  projectPath: string,
  filePath: string,
  diagnostics: Diagnostic[],
): void {
  const defineMacroMap = infoWs.defineMacroMap.get(projectPath);
  if (!defineMacroMap) return;

  const allMacros = Array.from(defineMacroMap.values());
  const macroNameCounts: Record<string, number> = {};
  for (const item of allMacros) {
    macroNameCounts[item.macroName] =
      (macroNameCounts[item.macroName] || 0) + 1;
  }
  const duplicateMacroNames = Object.keys(macroNameCounts).filter(
    (name) => macroNameCounts[name] > 1,
  );
  const duplicatesInFile = allMacros.filter(
    (m) =>
      duplicateMacroNames.includes(m.macroName) &&
      m.location &&
      URI.parse(m.location.uri).fsPath === filePath,
  );

  for (const macro of duplicatesInFile) {
    if (macro.location) {
      const end = Position.create(
        macro.location.range.start.line,
        macro.location.range.end.character +
          macro.macroName.length +
          `macro name="${macro.macroName}"`.length,
      );
      const range = Range.create(macro.location.range.start, end);
      diagnostics.push(
        Diagnostic.create(
          range,
          `マクロ名 "${macro.macroName}" が重複しています。同じ名前のマクロが他の箇所で定義されています。`,
          DiagnosticSeverity.Warning,
        ),
      );
    }
  }
}

function checkParameterSpacing(
  doc: TextDocument,
  diagnostics: Diagnostic[],
): void {
  const text = doc.getText();
  const lines = text.split("\n");

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber];
    const missingSpacePatterns = [
      /"([a-zA-Z_][a-zA-Z0-9_]*\s*=)/g,
      /'([a-zA-Z_][a-zA-Z0-9_]*\s*=)/g,
      /`([a-zA-Z_][a-zA-Z0-9_]*\s*=)/g,
    ];

    for (const pattern of missingSpacePatterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const paramName = match[1].replace(/\s*=/, "");
        const errorStartIndex = match.index;
        const range = Range.create(
          lineNumber,
          errorStartIndex,
          lineNumber,
          errorStartIndex + paramName.length,
        );
        diagnostics.push(
          Diagnostic.create(
            range,
            "パラメータ間に半角スペースがありません。パラメータ間は半角スペースで区切ってください。",
            DiagnosticSeverity.Error,
          ),
        );
      }
      pattern.lastIndex = 0;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkUndefinedParameter(
  data: any,
  projectPath: string,
  doc: TextDocument,
  diagnostics: Diagnostic[],
  tyranoBuilderEnabled: boolean,
  tyranoBuilderSkipTags: string[],
  tyranoBuilderSkipParameters: { [tag: string]: string[] },
): void {
  const tagName = data["name"];
  if (
    tyranoBuilderEnabled &&
    tyranoBuilderSkipTags.includes(tagName)
  )
    return;

  const tagParameters = data["pm"];
  if (!tagParameters || typeof tagParameters !== "object") return;

  const suggestions = infoWs.suggestions.get(projectPath);
  if (!suggestions || !(suggestions as any)[tagName]) return; // eslint-disable-line @typescript-eslint/no-explicit-any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tagDefinition = (suggestions as any)[tagName];
  if (
    !tagDefinition.parameters ||
    !Array.isArray(tagDefinition.parameters)
  )
    return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validParameterNames = tagDefinition.parameters.map(
    (param: any) => param.name,
  );
  validParameterNames.push("cond");

  let charaName = "";
  if (tagName === "chara_part") {
    charaName = data["pm"]["name"];
    const characterDataArray = infoWs.characterMap
      .get(projectPath)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.filter((cd: any) => cd.name === charaName);
    if (characterDataArray) {
      const layerKeys = new Set<string>();
      for (const characterData of characterDataArray) {
        for (const [, partDataArray] of characterData.layer) {
          for (const partData of partDataArray) {
            layerKeys.add(partData.part);
          }
        }
      }
      validParameterNames.push(...layerKeys);
    }
  }

  for (const paramName in tagParameters) {
    if (paramName === "*") continue;
    if (!validParameterNames.includes(paramName)) {
      if (
        tyranoBuilderEnabled &&
        tyranoBuilderSkipParameters[tagName]?.includes(paramName)
      )
        continue;
      const range = getParameterRange(
        paramName,
        tagParameters[paramName],
        data,
        doc,
      );

      if (tagName === "chara_part") {
        diagnostics.push(
          Diagnostic.create(
            range,
            `タグ[${tagName}]のキャラ${charaName}には"${paramName}"パラメータが存在しません。chara_showやchara_layerタグを見直してください。`,
            DiagnosticSeverity.Error,
          ),
        );
      } else {
        diagnostics.push(
          Diagnostic.create(
            range,
            `タグ[${tagName}]のパラメータ "${paramName}" はタグ "${tagName}" に定義されていません。`,
            DiagnosticSeverity.Error,
          ),
        );
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkMissingAmpersandInVariable(
  data: any,
  doc: TextDocument,
  diagnostics: Diagnostic[],
): void {
  const tagName = data["name"];
  if (!tagName || tagName === "text" || tagName === "comment") return;

  const tagParameters = data["pm"];
  if (!tagParameters || typeof tagParameters !== "object") return;

  for (const paramName in tagParameters) {
    if (
      paramName === "exp" ||
      paramName === "cond" ||
      paramName === "preexp"
    )
      continue;
    if (
      (tagName === "edit" && paramName === "name") ||
      (tagName === "dialog" && paramName === "name")
    )
      continue;

    const paramValue = tagParameters[paramName];
    if (typeof paramValue !== "string") continue;

    if (isValueIsIncludeVariable(paramValue)) {
      if (
        !isExistAmpersandAtBeginning(paramValue) &&
        !isExistPercentAtBeginning(paramValue)
      ) {
        const range = getParameterRange(
          paramName,
          paramValue,
          data,
          doc,
        );
        diagnostics.push(
          Diagnostic.create(
            range,
            `タグ[${tagName}]のパラメータ"${paramName}"で変数を使用する場合は値の先頭に&、もしくはマクロで渡された変数なら%を付ける必要があります。例: ${paramName}="&${paramValue}"`,
            DiagnosticSeverity.Warning,
          ),
        );
      }
    }
  }
}

// ── Diagnostic helpers ──

function isExistAmpersandAtBeginning(value: string): boolean {
  return value.indexOf("&") === 0;
}

function isExistPercentAtBeginning(value: string): boolean {
  return value.indexOf("%") === 0;
}

function isValueIsIncludeVariable(value: string): boolean {
  if (value === undefined) return false;
  return !!(
    value.match(/f\.[a-zA-Z_]\w*/) ||
    value.match(/sf\.[a-zA-Z_]\w*/) ||
    value.match(/tf\.[a-zA-Z_]\w*/) ||
    value.match(/mp\.[a-zA-Z_]\w*/)
  );
}

function sumStringLengthsInObject(obj: object): number {
  let totalLength = 0;
  const value = 4;
  const firstValue = 2;
  totalLength += firstValue;
  for (const key in obj) {
    if (typeof key === "string") totalLength += key.length;
    if (typeof obj[key] === "string") totalLength += obj[key].length;
    totalLength += value;
  }
  return totalLength;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getParameterRange(
  paramName: string,
  _paramValue: string,
  data: any,
  document: TextDocument,
): Range {
  try {
    const lineText = getLineText(document, data["line"]);
    const escapedParamName = escapeRegExp(paramName);
    const patterns = [
      new RegExp(`\\b${escapedParamName}\\s*=\\s*"[^"]*"`),
      new RegExp(`\\b${escapedParamName}\\s*=\\s*'[^']*'`),
      new RegExp(`\\b${escapedParamName}\\s*=\\s*[^\\s\\]]+`),
    ];

    for (const pattern of patterns) {
      const match = lineText.match(pattern);
      if (match && match.index !== undefined) {
        return Range.create(
          data["line"],
          match.index,
          data["line"],
          match.index + match[0].length,
        );
      }
    }

    // Fallback: whole line
    const firstNonWhitespace =
      lineText.length - lineText.trimStart().length;
    return Range.create(
      data["line"],
      firstNonWhitespace,
      data["line"],
      lineText.length,
    );
  } catch {
    return Range.create(data["line"], 1, data["line"], 2);
  }
}

// ══════════════════════════════════════════════════
//  Utility
// ══════════════════════════════════════════════════
function getLineText(document: TextDocument, line: number): string {
  const startOffset = document.offsetAt(Position.create(line, 0));
  const endOffset = document.offsetAt(
    Position.create(line + 1, 0),
  );
  const text = document.getText().substring(startOffset, endOffset);
  return text.replace(/\r?\n$/, "");
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getWordRangeAtPosition(
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
function loadTooltipData(): any {
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
function createTagMarkdown(textValue: any): string | null {
  if (!textValue || !textValue["description"]) return null;
  const textCopy = [...textValue["description"]];
  const backQuoteStartIndex = textCopy.indexOf("[パラメータ]");
  if (backQuoteStartIndex >= 0) {
    textCopy.splice(backQuoteStartIndex, 0, "```tyrano");
    textCopy.push("```");
  }
  return `### ${textValue["prefix"]}\n\n${textCopy.join("  \n")}`;
}

// ── Start ──
documents.listen(connection);
connection.listen();
