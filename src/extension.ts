//拡張機能のエントリポイント (LSP Client)

import * as vscode from "vscode";
import * as path from "path";
import { ExtensionContext } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

import { TyranoCreateTagByShortcutKey } from "./subscriptions/TyranoCreateTagByShortcutKey";
import { TyranoPreview } from "./subscriptions/TyranoPreview";
import { TyranoFlowchart } from "./subscriptions/TyranoFlowchart";
import { TyranoAddRAndPCommand } from "./subscriptions/TyranoAddRAndPCommand";
import {
  registerEmbeddedJavaScriptSupport,
  cleanupEmbeddedJavaScript,
} from "./embeddedJavaScriptSupport";
import {
  TyranoInitializationOptions,
  TyranoNotifications,
  TyranoRequests,
  FileChangedParams,
  ResolveJumpTargetParams,
  ResolveJumpTargetResult,
} from "./shared/protocol";
import { TyranoLogger } from "./TyranoLogger";

export const previewPanel: undefined | vscode.WebviewPanel = undefined;
export const flowchartPanel: undefined | vscode.WebviewPanel = undefined;

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  // [iscript]〜[endscript] ブロック内での JavaScript 補完・ホバー・定義ジャンプ等のサポート
  registerEmbeddedJavaScriptSupport(context);

  // ── LSP サーバーモジュール ──
  const serverModule = context.asAbsolutePath(
    path.join("out", "server", "server.js"),
  );

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ["--nolazy", "--inspect=6009"] },
    },
  };

  // ── 設定値を収集して initializationOptions に渡す ──
  const config = vscode.workspace.getConfiguration();
  const initOptions: TyranoInitializationOptions = {
    extensionPath: context.extensionPath,
    language:
      config.get<string>("TyranoScript syntax.language") || "ja",
    workspaceRoot:
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "",
    isParsePluginFolder:
      config.get<boolean>("TyranoScript syntax.parser.read_plugin") ??
      true,
    resourceExtensions:
      config.get<object>("TyranoScript syntax.resource.extension") || {},
    pluginTags:
      config.get<object>("TyranoScript syntax.plugin.parameter") || {},
    tagParameter:
      config.get("TyranoScript syntax.tag.parameter") || {},
    outlineTags:
      config.get<string[]>("TyranoScript syntax.outline.tag") || [],
    outlineComment:
      config.get<string[]>("TyranoScript syntax.outline.comment") || [],
    outlineBlockComment:
      config.get<boolean>(
        "TyranoScript syntax.outline.blockComment",
      ) ?? true,
    completionTagInputType:
      config.get<string>(
        "TyranoScript syntax.completionTag.inputType",
      ) || "[ ]",
    autoDiagnosticEnabled:
      config.get<boolean>(
        "TyranoScript syntax.autoDiagnostic.isEnabled",
      ) ?? true,
    executeDiagnostic:
      config.get("TyranoScript syntax.execute.diagnostic") || {},
    loggerEnabled:
      config.get<boolean>("TyranoScript syntax.logger.enabled") ??
      false,
    tyranoBuilderEnabled:
      config.get<boolean>(
        "TyranoScript syntax.tyranoBuilder.enabled",
      ) ?? false,
    tyranoBuilderSkipTags:
      config.get<string[]>(
        "TyranoScript syntax.tyranoBuilder.skipTags",
      ) || [],
    tyranoBuilderSkipParameters:
      config.get("TyranoScript syntax.tyranoBuilder.skipParameters") ||
      {},
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "tyrano" }],
    initializationOptions: initOptions,
  };

  client = new LanguageClient(
    "tyranoScriptLanguageServer",
    "TyranoScript Language Server",
    serverOptions,
    clientOptions,
  );

  // ── フローチャート・プレビューにクライアント/パスを設定 ──
  TyranoFlowchart.client = client;
  TyranoFlowchart.extensionPath = context.extensionPath;
  TyranoPreview.extensionPath = context.extensionPath;

  // ── クライアント側コマンド登録 ──

  // ショートカットキー
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "tyrano.shiftEnter",
      TyranoCreateTagByShortcutKey.KeyPushShiftEnter,
    ),
    vscode.commands.registerCommand(
      "tyrano.ctrlEnter",
      TyranoCreateTagByShortcutKey.KeyPushCtrlEnter,
    ),
    vscode.commands.registerCommand(
      "tyrano.altEnter",
      TyranoCreateTagByShortcutKey.KeyPushAltEnter,
    ),
  );

  // [r][p] 追加コマンド
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "tyrano.addRAndP",
      TyranoAddRAndPCommand.execute,
    ),
  );

  // プレビュー
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "tyrano.preview",
      TyranoPreview.createWindow,
    ),
  );

  // フローチャート
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "tyrano.flowchart",
      TyranoFlowchart.openFlowchart,
    ),
  );

  // ジャンプコマンド (LSP custom request を利用)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "tyrano.jumpToDestination",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const position = editor.selection.active;

        const params: ResolveJumpTargetParams = {
          uri: document.uri.toString(),
          line: position.line,
          character: position.character,
        };

        try {
          const result = await client.sendRequest<
            ResolveJumpTargetResult | null
          >(TyranoRequests.ResolveJumpTarget, params);

          if (!result) {
            vscode.window.showWarningMessage(
              "現在選択しているタグはジャンプ対象ではありません。",
            );
            return;
          }

          const targetUri = vscode.Uri.parse(result.targetUri);
          const targetDoc =
            await vscode.workspace.openTextDocument(targetUri);
          const pos = new vscode.Position(
            result.targetLine,
            result.targetCharacter,
          );
          const activeEditor =
            await vscode.window.showTextDocument(targetDoc, {
              preview: true,
            });
          activeEditor.selection = new vscode.Selection(pos, pos);
          activeEditor.revealRange(
            new vscode.Range(pos, pos),
            vscode.TextEditorRevealType.InCenter,
          );
        } catch {
          vscode.window.showErrorMessage(
            "ジャンプ先の解決中にエラーが発生しました。",
          );
        }
      },
    ),
  );

  // 手動診断コマンド（サーバー側で処理されるため、ファイル変更通知を送る）
  context.subscriptions.push(
    vscode.commands.registerCommand("tyrano.diagnostic", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !editor.document.fileName.endsWith(".ks")) return;

      const params: FileChangedParams = {
        uri: editor.document.uri.toString(),
        type: "changed",
        fileType: "scenario",
      };
      client.sendNotification(
        TyranoNotifications.FileChanged,
        params,
      );
    }),
  );

  // ── ファイルウォッチャー（サーバーに通知を送信） ──
  const scenarioWatcher = vscode.workspace.createFileSystemWatcher(
    "**/*.ks",
    false,
    false,
    false,
  );
  scenarioWatcher.onDidCreate((e) =>
    sendFileChanged(e, "created", "scenario"),
  );
  scenarioWatcher.onDidChange((e) =>
    sendFileChanged(e, "changed", "scenario"),
  );
  scenarioWatcher.onDidDelete((e) =>
    sendFileChanged(e, "deleted", "scenario"),
  );

  const scriptWatcher = vscode.workspace.createFileSystemWatcher(
    "**/*.js",
    false,
    false,
    false,
  );
  scriptWatcher.onDidCreate((e) =>
    sendFileChanged(e, "created", "script"),
  );
  scriptWatcher.onDidChange((e) =>
    sendFileChanged(e, "changed", "script"),
  );
  scriptWatcher.onDidDelete((e) =>
    sendFileChanged(e, "deleted", "script"),
  );

  // Resource file watcher
  const resourceExtensions =
    config.get<object>("TyranoScript syntax.resource.extension") || {};
  const extList = Object.values(resourceExtensions).flat();
  if (extList.length > 0) {
    const resourceGlob = `**/*{${extList.join(",")}}`;
    const resourceWatcher = vscode.workspace.createFileSystemWatcher(
      resourceGlob,
      false,
      true,
      false,
    );
    resourceWatcher.onDidCreate((e) =>
      sendFileChanged(e, "created", "resource"),
    );
    resourceWatcher.onDidDelete((e) =>
      sendFileChanged(e, "deleted", "resource"),
    );
    context.subscriptions.push(resourceWatcher);
  }

  context.subscriptions.push(scenarioWatcher, scriptWatcher);

  // カーソル移動時のイベント登録（プレビュー用）
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(async (_e) => {
      await TyranoPreview.triggerHotReload();
    }),
  );

  // ── LSPサーバー起動 ──
  const run = async () => {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "TyranoScript_syntaxの初期化中...",
        cancellable: false,
      },
      async () => {
        try {
          await client.start();
          const projectName =
            vscode.workspace.workspaceFolders?.[0]?.name || "プロジェクト";
          vscode.window.showInformationMessage(
            `${projectName}の初期化が完了しました`,
          );
        } catch (_error) {
          TyranoLogger.printStackTrace(_error);
          vscode.window.showErrorMessage(
            "TyranoScript syntax初期化中にエラーが発生しました。",
          );
        }
      },
    );
  };
  run();
}

function sendFileChanged(
  uri: vscode.Uri,
  type: "created" | "changed" | "deleted",
  fileType: "scenario" | "script" | "resource",
): void {
  if (!client) return;
  const params: FileChangedParams = {
    uri: uri.toString(),
    type,
    fileType,
  };
  client.sendNotification(TyranoNotifications.FileChanged, params);
}

export async function deactivate(): Promise<void> {
  cleanupEmbeddedJavaScript();
  if (client) {
    await client.stop();
  }
}
