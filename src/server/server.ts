import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  RenameParams,
  WorkspaceEdit,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { TyranoRenameProvider } from "../subscriptions/TyranoRenameProvider";

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Create rename provider instance
const renameProvider = new TyranoRenameProvider();

connection.onInitialize((params: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      renameProvider: true,
      // 他の機能もここで宣言できます
    },
  };
  return result;
});

// リネーム機能の実装
connection.onRenameRequest((params: RenameParams): WorkspaceEdit => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return { changes: {} };
  }

  return renameProvider.provideRenameEdits(
    document,
    params.position,
    params.newName,
  );
});

// Listen on the text document manager and connection
documents.listen(connection);
connection.listen();
