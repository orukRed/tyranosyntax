//XXX:未使用 LSPでの実装にしたかったけど、いったんvscode-apiでの実装にする


import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  RenameParams,
  WorkspaceEdit,
  PrepareRenameParams,
  TextDocumentIdentifier,
  URI,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { TyranoRenameProvider } from "../subscriptions/deprecate/TyranoRenameProvider";
import * as fs from "fs";
import * as path from "path";
import { workspace } from "vscode";

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
      renameProvider: {
        prepareProvider: true,
      },
      // 他の機能もここで宣言できます
    },
  };
  return result;
});

// ワークスペース内の全ての.ksファイルを取得する関数
async function getAllKsFiles(workspacePath: string): Promise<string[]> {
  const results: string[] = [];
  //すべての.ksファイル取得
  const files = fs.readdirSync(workspacePath);
  for (const file of files) {
    const fullPath = path.join(workspacePath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllKsFiles(fullPath);
    } else if (file.endsWith(".ks")) {
      results.push(fullPath);
    }
  }

  return results;
}

// リネーム機能の実装
connection.onRenameRequest(
  async (params: RenameParams): Promise<WorkspaceEdit> => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return { changes: {} };
    }

    // 現在のドキュメントに対するリネーム編集を取得
    const workspaceEdit = renameProvider.provideRenameEdits(
      document,
      params.position,
      params.newName,
    );

    try {
      // ワークスペースのルートパスを取得
      const workspacePath = decodeURIComponent(
        path.dirname(document.uri.replace("file://", "")),
      );

      // 全ての.ksファイルを取得
      const allKsFiles = await getAllKsFiles(workspacePath);

      // 各ファイルに対してリネーム処理を実行
      for (const filePath of allKsFiles) {
        // 現在のドキュメントはスキップ（既に処理済み）
        if (filePath === document.uri.replace("file://", "")) {
          continue;
        }

        // ファイルの内容を読み込む
        const content = fs.readFileSync(filePath, "utf-8");
        const fileDocument = TextDocument.create(
          `file://${filePath}`,
          "tyranoscript",
          1,
          content,
        );

        // リネーム編集を取得
        const fileEdit = renameProvider.provideRenameEdits(
          fileDocument,
          params.position,
          params.newName,
        );

        // 編集内容をマージ
        if (fileEdit.changes) {
          workspaceEdit.changes = {
            ...workspaceEdit.changes,
            ...fileEdit.changes,
          };
        }
      }
    } catch (error) {
      console.error("Error during rename operation:", error);
    }

    return workspaceEdit;
  },
);

// prepareRenameハンドラーの追加
connection.onPrepareRename((params: PrepareRenameParams) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  return renameProvider.prepareRename(document, params.position);
});

// Listen on the text document manager and connection
documents.listen(connection);
connection.listen();
