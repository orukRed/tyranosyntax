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

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      renameProvider: true,
      // 他の機能もここで宣言できます
    }
  };
  return result;
});

// リネーム機能の実装
connection.onRenameRequest((params: RenameParams): WorkspaceEdit => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return { changes: {} };
  }

  // ここでリネーム処理を実装
  const workspaceEdit: WorkspaceEdit = {
    changes: {}
  };

  // 例: 同じドキュメント内の同じ文字列を全て置換
  const text = document.getText();
  const pattern = new RegExp(params.position.toString(), 'g');
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (!workspaceEdit.changes![params.textDocument.uri]) {
      workspaceEdit.changes![params.textDocument.uri] = [];
    }
    workspaceEdit.changes![params.textDocument.uri].push({
      range: {
        start: document.positionAt(match.index),
        end: document.positionAt(match.index + match[0].length)
      },
      newText: params.newName
    });
  }

  return workspaceEdit;
});

// Listen on the text document manager and connection
documents.listen(connection);
connection.listen();
