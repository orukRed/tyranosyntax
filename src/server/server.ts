/* eslint-disable no-control-regex */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  DidChangeConfigurationNotification,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import * as fs from "fs";

import {
  TyranoInitializationOptions,
  TyranoNotifications,
  FileChangedParams,
} from "../shared/protocol";
import { TyranoLogger, ErrorLevel } from "./TyranoLogger";
import { InformationExtension } from "./InformationExtension";
import { InformationWorkSpace } from "./InformationWorkSpace";
import { Parser } from "./Parser";
import { CrossFileContextManager } from "./CrossFileContextManager";
import { ServerContext } from "./ServerContext";

// ── Handler registrations ──
import { register as registerHover } from "./handlers/HoverHandler";
import { register as registerCompletion } from "./handlers/CompletionHandler";
import { register as registerDocumentSymbol } from "./handlers/DocumentSymbolHandler";
import { register as registerDefinition } from "./handlers/DefinitionHandler";
import { register as registerRename } from "./handlers/RenameHandler";
import { register as registerReferences } from "./handlers/ReferencesHandler";
import { register as registerCustomRequests } from "./handlers/CustomRequestHandler";
import {
  createRunDiagnosticForFile,
  runDiagnostics,
} from "./handlers/DiagnosticsHandler";

// ── Connection & Documents ──
const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// ── Core singletons ──
const infoWs = InformationWorkSpace.getInstance();
const parser = Parser.getInstance();
const crossFileCtx = new CrossFileContextManager();

// ── Server configuration (populated from initializationOptions) ──
let serverConfig: TyranoInitializationOptions;

// ── Build shared context ──
const ctx: ServerContext = {
  connection,
  documents,
  infoWs,
  parser,
  crossFileCtx,
  getServerConfig: () => serverConfig,
};

// ── Diagnostic helper ──
const runDiagnosticForFile = createRunDiagnosticForFile(ctx);

// ══════════════════════════════════════════════════
//  Register all handlers
// ══════════════════════════════════════════════════
registerHover(ctx);
registerCompletion(ctx);
registerDocumentSymbol(ctx);
registerDefinition(ctx);
registerRename(ctx);
registerReferences(ctx);
registerCustomRequests(ctx);

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
  } catch (error) {
    TyranoLogger.print("Initialization failed", ErrorLevel.ERROR);
    TyranoLogger.printStackTrace(error);
  }

  // クライアントに初期化完了を通知（後続処理の失敗に関わらず送信する）
  const projectNames = infoWs
    .getTyranoScriptProjectRootPaths()
    .map((p) => p.split(/[\\/]/).pop() || p);
  connection.sendNotification(TyranoNotifications.InitializationComplete, {
    projectNames,
  });

  // Initialize CrossFileContextManager
  try {
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
      await runDiagnostics(ctx, projectPath + infoWs.pathDelimiter);
    }
  } catch (error) {
    TyranoLogger.print("Post-initialization failed", ErrorLevel.ERROR);
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

// ── Start ──
documents.listen(connection);
connection.listen();
