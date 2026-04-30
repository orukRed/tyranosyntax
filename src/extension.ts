//拡張機能のエントリポイント

import * as vscode from "vscode";
import * as path from "path";
import { ExtensionContext } from "vscode";
import { LanguageClient } from "vscode-languageclient/node";

import { TyranoCreateTagByShortcutKey } from "./subscriptions/TyranoCreateTagByShortcutKey";
import { TyranoHoverProvider } from "./subscriptions/TyranoHoverProvider";
import { TyranoOutlineProvider } from "./subscriptions/TyranoOutlineProvider";
import { TyranoCompletionItemProvider } from "./subscriptions/TyranoCompletionItemProvider";
import { TyranoDiagnostic } from "./subscriptions/TyranoDiagnostic";
import { ErrorLevel, TyranoLogger } from "./TyranoLogger";
import { InformationWorkSpace } from "./InformationWorkSpace";
import { TyranoDefinitionProvider } from "./subscriptions/TyranoDefinitionProvider";
import { TyranoJumpProvider } from "./subscriptions/TyranoJumpProvider";
import { InformationExtension } from "./InformationExtension";
import { TyranoPreview } from "./subscriptions/TyranoPreview";
import { TyranoFlowchart } from "./subscriptions/TyranoFlowchart";
import { TyranoRenameProvider } from "./subscriptions/TyranoRenameProvider";
import { TyranoAddRAndPCommand } from "./subscriptions/TyranoAddRAndPCommand";
import {
  registerEmbeddedJavaScriptSupport,
  cleanupEmbeddedJavaScript,
} from "./embeddedJavaScriptSupport";
import { TyranoDebugConfigProvider } from "./debug/TyranoDebugConfigProvider";
import { TyranoDebugSession } from "./debug/TyranoDebugSession";
import { TyranoSidebarProvider } from "./subscriptions/TyranoSidebarProvider";

const TYRANO_MODE = { scheme: "file", language: "tyrano" };
// Delay in milliseconds to wait for VS Code's file system to sync after external file changes (e.g., git operations)
const FILE_SYNC_DELAY_MS = 100;

export const previewPanel: undefined | vscode.WebviewPanel = undefined;
export const flowchartPanel: undefined | vscode.WebviewPanel = undefined;

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  // // サーバーモジュールのパス
  // const serverModule = context.asAbsolutePath(
  //   path.join('out', 'server', 'server.js')
  // );

  // // サーバーのデバッグオプション
  // const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

  // // サーバーオプションの設定
  // const serverOptions: ServerOptions = {
  //   run: {
  //     module: serverModule,
  //     transport: TransportKind.ipc,
  //     options: { execArgv: [] },
  //   },
  //   debug: {
  //     module: serverModule,
  //     transport: TransportKind.ipc,
  //     options: debugOptions,
  //   },
  // };

  // // クライアントオプションの設定
  // const clientOptions: LanguageClientOptions = {
  //   documentSelector: [{ scheme: 'file', language: 'tyrano' }],
  //   synchronize: {
  //     fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
  //   }
  // };

  // // クライアントの作成と起動
  // client = new LanguageClient(
  //   'tyranoLanguageServer',
  //   'TyranoScript Language Server',
  //   serverOptions,
  //   clientOptions
  // );

  // // 言語サーバーの開始
  // client.start();

  // [iscript]〜[endscript] ブロック内での JavaScript 補完・ホバー・定義ジャンプ等のサポート
  registerEmbeddedJavaScriptSupport(context);

  // サイドバーWelcome Viewの登録
  const sidebarProvider = new TyranoSidebarProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "tyrano-dev-tools",
      sidebarProvider,
    ),
  );
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("tyrano-links", sidebarProvider),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("tyrano.sidebar.debug", () => {
      vscode.debug.startDebugging(undefined, {
        type: "tyranoDebug",
        request: "launch",
        name: "TyranoScript Debug",
      });
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("tyrano.sidebar.preview", () => {
      vscode.commands.executeCommand("tyrano.preview");
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("tyrano.sidebar.flowchart", () => {
      vscode.commands.executeCommand("tyrano.flowchart");
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("tyrano.sidebar.openBugReport", () => {
      vscode.env.openExternal(
        vscode.Uri.parse("https://forms.gle/PnWAzHiN8MYKhUrG6"),
      );
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("tyrano.sidebar.openOfuse", () => {
      vscode.env.openExternal(
        vscode.Uri.parse("https://ofuse.me/orukred/letter"),
      );
    }),
  );
  TyranoLogger.print("TyranoSidebarProvider activate");

  // デバッグアダプターの登録
  const debugConfigProvider = new TyranoDebugConfigProvider();
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider(
      "tyranoDebug",
      debugConfigProvider,
    ),
  );
  context.subscriptions.push(
    vscode.debug.registerDebugAdapterDescriptorFactory("tyranoDebug", {
      createDebugAdapterDescriptor(
        _session: vscode.DebugSession,
      ): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
        return new vscode.DebugAdapterInlineImplementation(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          new TyranoDebugSession(context.extensionPath) as any,
        );
      },
    }),
  );

  const run = async () => {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "TyranoScript_syntaxの初期化中...",
        cancellable: true,
      },
      async (_progress, _token) => {
        InformationExtension.path = context.extensionPath;
        TyranoLogger.print("TyranoScript syntax initialize start.");
        try {
          //登録処理
          //サブスクリプションを登録することで、拡張機能がアンロードされたときにコマンドを解除してくれる
          context.subscriptions.push(
            vscode.languages.registerHoverProvider(
              TYRANO_MODE,
              new TyranoHoverProvider(),
            ),
          );
          TyranoLogger.print("TyranoHoverProvider activate");
          context.subscriptions.push(
            vscode.languages.registerDocumentSymbolProvider(
              TYRANO_MODE,
              new TyranoOutlineProvider(),
            ),
          );
          TyranoLogger.print("TyranoOutlineProvider activate");
          context.subscriptions.push(
            vscode.languages.registerCompletionItemProvider(
              TYRANO_MODE,
              new TyranoCompletionItemProvider(),
              ".",
            ),
          );
          TyranoLogger.print("TyranoCompletionItemProvider activate");

          //ショートカットコマンドの登録
          const _ctbs = new TyranoCreateTagByShortcutKey();
          context.subscriptions.push(
            vscode.commands.registerCommand(
              "tyrano.shiftEnter",
              TyranoCreateTagByShortcutKey.KeyPushShiftEnter,
            ),
          );
          context.subscriptions.push(
            vscode.commands.registerCommand(
              "tyrano.ctrlEnter",
              TyranoCreateTagByShortcutKey.KeyPushCtrlEnter,
            ),
          );
          context.subscriptions.push(
            vscode.commands.registerCommand(
              "tyrano.altEnter",
              TyranoCreateTagByShortcutKey.KeyPushAltEnter,
            ),
          );
          TyranoLogger.print("TyranoCreateTagByShortcutKey activate");

          // [r][p]を追加するコマンドの登録
          context.subscriptions.push(
            vscode.commands.registerCommand(
              "tyrano.addRAndP",
              TyranoAddRAndPCommand.execute,
            ),
          );
          TyranoLogger.print("TyranoAddRAndPCommand activate");

          context.subscriptions.push(
            vscode.commands.registerCommand(
              "tyrano.preview",
              TyranoPreview.createWindow,
            ),
          );
          TyranoLogger.print("TyranoPreview activate");
          context.subscriptions.push(
            vscode.commands.registerCommand(
              "tyrano.flowchart",
              TyranoFlowchart.openFlowchart,
            ),
          );
          TyranoLogger.print("TyranoFlowchart activate");

          const infoWs: InformationWorkSpace =
            InformationWorkSpace.getInstance();
          //診断機能の登録
          //ワークスペースを開いてる && index.htmlがある時のみ診断機能使用OK
          if (vscode.workspace.workspaceFolders !== undefined) {
            TyranoLogger.print("workspace is opening");

            const tyranoDiagnostic = new TyranoDiagnostic();

            await infoWs.initializeMaps();
            infoWs.extensionPath = context.extensionPath;

            // レースコンディション対策：初期化後に少し待機してマクロ情報を再確認
            await new Promise((resolve) =>
              setTimeout(resolve, FILE_SYNC_DELAY_MS),
            );
            TyranoLogger.print(
              "Initial macro and variable data loading completed",
            );

            TyranoLogger.print("TyranoDiagnostic activate");
            const tyranoJumpProvider = new TyranoJumpProvider();
            context.subscriptions.push(
              vscode.commands.registerCommand(
                "tyrano.diagnostic",
                tmpDiagnostic,
              ),
            ); //手動診断のコマンドON
            context.subscriptions.push(
              vscode.commands.registerCommand(
                "tyrano.jumpToDestination",
                tyranoJumpProvider.toDestination,
              ),
            ); //ジャンプ先のファイル開くコマンドON
            context.subscriptions.push(
              vscode.languages.registerDefinitionProvider(
                TYRANO_MODE,
                new TyranoDefinitionProvider(),
              ),
            ); //定義元への移動
            //renameproviderの追加
            const renameProvider = new TyranoRenameProvider();
            context.subscriptions.push(
              vscode.languages.registerRenameProvider(
                TYRANO_MODE,
                renameProvider,
              ),
            );
            // context.subscriptions.push(vscode.languages.registerReferenceProvider(TYRANO_MODE, new TyranoReferenceProvider()));//参照先の表示
            // context.subscriptions.push(vscode.languages.registerRenameProvider(TYRANO_MODE, new TyranoRenameProvider()));//シンボルの名前変更

            //設定で診断機能の自動実行ONにしてるなら許可
            if (
              vscode.workspace
                .getConfiguration()
                .get("TyranoScript syntax.autoDiagnostic.isEnabled")
            ) {
              //ファイルに変更を加えたタイミング、もしくはテキストエディタに変更を加えたタイミングでイベント呼び出すようにする
              context.subscriptions.push(
                vscode.workspace.onDidChangeTextDocument(async (e) => {
                  if (
                    path.extname(e.document.fileName) === ".ks" &&
                    !tyranoDiagnostic.isDiagnosing
                  ) {
                    tyranoDiagnostic.isDiagnosing = true;

                    // マクロ、変数、ラベル、キャラクター、トランジション情報を確実に更新
                    await infoWs.updateScenarioFileMap(e.document.fileName);
                    await infoWs.updateMacroLabelVariableDataMapByKs(
                      e.document.fileName,
                    );

                    // レースコンディション対策のため少し待機
                    await new Promise((resolve) =>
                      setTimeout(resolve, FILE_SYNC_DELAY_MS),
                    );

                    try {
                      await tyranoDiagnostic.createDiagnostics(
                        e.document.fileName,
                      );
                    } catch (error) {
                      TyranoLogger.print(
                        `診断中にエラーが発生しました。直前に触ったファイルは${e.document.fileName}です。`,
                        ErrorLevel.ERROR,
                      );
                      console.log(error);
                    } finally {
                      tyranoDiagnostic.isDiagnosing = false;
                    }
                  }
                }),
              );
              TyranoLogger.print("Auto diagnostic activate");
            } else {
              TyranoLogger.print("Auto diagnostic is not activate");
            }

            // ファイル保存時の診断処理（レースコンディション対策版）
            context.subscriptions.push(
              vscode.workspace.onDidSaveTextDocument(async (document) => {
                if (
                  path.extname(document.fileName) === ".ks" &&
                  !tyranoDiagnostic.isDiagnosing
                ) {
                  tyranoDiagnostic.isDiagnosing = true;

                  // 保存時はマクロ、変数、ラベル、キャラクター、トランジション情報を確実に更新してから診断
                  await infoWs.updateScenarioFileMap(document.fileName);
                  await infoWs.updateMacroLabelVariableDataMapByKs(
                    document.fileName,
                  );

                  try {
                    await tyranoDiagnostic.createDiagnostics(document.fileName);
                  } catch (error) {
                    TyranoLogger.print(
                      "保存時診断でエラーが発生しました。",
                      ErrorLevel.ERROR,
                    );
                    console.log(error);
                  } finally {
                    tyranoDiagnostic.isDiagnosing = false;
                  }
                }
              }),
            );
            //scenarioFileの値
            const scenarioFileSystemWatcher: vscode.FileSystemWatcher =
              vscode.workspace.createFileSystemWatcher(
                "**/*.{ks}",
                false,
                false,
                false,
              );
            scenarioFileSystemWatcher.onDidCreate(async (e) => {
              await infoWs.updateScenarioFileMap(e.fsPath);
              await infoWs.updateMacroLabelVariableDataMapByKs(e.fsPath);
              await infoWs.updatePluginParamsFromInitKs(e.fsPath);
            });
            scenarioFileSystemWatcher.onDidChange(async (e) => {
              // Wait for VS Code's file system to sync after external file changes (e.g., git operations)
              await new Promise((resolve) =>
                setTimeout(resolve, FILE_SYNC_DELAY_MS),
              );
              await infoWs.updateScenarioFileMap(e.fsPath);
              await infoWs.updateMacroLabelVariableDataMapByKs(e.fsPath);
              await infoWs.updatePluginParamsFromInitKs(e.fsPath);
            });
            scenarioFileSystemWatcher.onDidDelete(async (e) => {
              await infoWs.spliceScenarioFileMapByFilePath(e.fsPath);
              await infoWs.spliceMacroDataMapByFilePath(e.fsPath);
              await infoWs.spliceLabelMapByFilePath(e.fsPath);
              await infoWs.spliceVariableMapByFilePath(e.fsPath);
              await infoWs.spliceCharacterMapByFilePath(e.fsPath);
              await infoWs.spliceTransitionMapByFilePath(e.fsPath);
              await infoWs.splicePluginParamsByInitKsPath(e.fsPath);
            });

            //scriptFileの値
            const scriptFileSystemWatcher: vscode.FileSystemWatcher =
              vscode.workspace.createFileSystemWatcher(
                "**/*.{js}",
                false,
                false,
                false,
              );
            scriptFileSystemWatcher.onDidCreate(async (e) => {
              await infoWs.updateScriptFileMap(e.fsPath);
              await infoWs.updateMacroDataMapByJs(e.fsPath);
            });
            scriptFileSystemWatcher.onDidChange(async (e) => {
              // Wait for VS Code's file system to sync after external file changes (e.g., git operations)
              await new Promise((resolve) =>
                setTimeout(resolve, FILE_SYNC_DELAY_MS),
              );
              await infoWs.updateScriptFileMap(e.fsPath);
              await infoWs.updateMacroDataMapByJs(e.fsPath);
            });
            scriptFileSystemWatcher.onDidDelete(async (e) => {
              await infoWs.spliceScriptFileMapByFilePath(e.fsPath);
              await infoWs.spliceMacroDataMapByFilePath(e.fsPath);
              await infoWs.spliceVariableMapByFilePath(e.fsPath);
            });

            // リソースファイルウォッチャー。`resource.extension` 設定変更時に
            // 再生成できるようローカル変数に保持する。
            let resourceWatcherBundle: vscode.Disposable[] = [];
            const createResourceWatcher = () => {
              for (const d of resourceWatcherBundle) d.dispose();
              const resourceGlob = `**/*{${infoWs.resourceExtensionsArrays.toString()}}`;
              const watcher = vscode.workspace.createFileSystemWatcher(
                resourceGlob,
                false,
                false,
                false,
              );
              const onCreate = watcher.onDidCreate(async (e) => {
                infoWs.addResourceFileMap(e.fsPath);
              });
              const onDelete = watcher.onDidDelete(async (e) => {
                infoWs.spliceResourceFileMapByFilePath(e.fsPath);
              });
              resourceWatcherBundle = [watcher, onCreate, onDelete];
            };
            createResourceWatcher();
            context.subscriptions.push({
              dispose: () => {
                for (const d of resourceWatcherBundle) d.dispose();
              },
            });

            // ワークスペースフォルダ追加/削除に追従。
            // フォルダ追加時は新しい Tyrano プロジェクトをスキャンしてキャッシュを構築。
            // フォルダ削除時は対象プロジェクト配下のキャッシュをクリーンアップ。
            context.subscriptions.push(
              vscode.workspace.onDidChangeWorkspaceFolders(async () => {
                const currentProjects = new Set(
                  infoWs.getTyranoScriptProjectRootPaths(),
                );
                const knownProjects = new Set(infoWs.resourceFileMap.keys());

                for (const projectPath of knownProjects) {
                  if (!currentProjects.has(projectPath)) {
                    infoWs.removeProject(projectPath);
                  }
                }
                for (const projectPath of currentProjects) {
                  if (!knownProjects.has(projectPath)) {
                    await infoWs.addProject(projectPath);
                    tyranoDiagnostic.createDiagnostics(
                      projectPath + infoWs.pathDelimiter,
                    );
                  }
                }
              }),
            );

            // 設定変更への追従。
            // `resource.extension` はウォッチャーのglob・補完候補に直結するので
            // ライブで再構築する。それ以外の挙動系設定はリロード推奨に留める。
            context.subscriptions.push(
              vscode.workspace.onDidChangeConfiguration(async (event) => {
                if (
                  event.affectsConfiguration(
                    "TyranoScript syntax.resource.extension",
                  )
                ) {
                  infoWs.reloadResourceExtensions();
                  createResourceWatcher();
                  // 既存プロジェクトのリソースキャッシュを新拡張子で再構築
                  for (const projectPath of infoWs.getTyranoScriptProjectRootPaths()) {
                    infoWs.resourceFileMap.set(projectPath, []);
                    const resources = infoWs.getProjectFiles(
                      projectPath + infoWs.DATA_DIRECTORY,
                      infoWs.resourceExtensionsArrays,
                      true,
                    );
                    await Promise.all(
                      resources.map((p) => infoWs.addResourceFileMap(p)),
                    );
                  }
                }

                if (
                  event.affectsConfiguration(
                    "TyranoScript syntax.plugin.parameter",
                  ) ||
                  event.affectsConfiguration(
                    "TyranoScript syntax.parser.read_plugin",
                  ) ||
                  event.affectsConfiguration(
                    "TyranoScript syntax.parser.autoLoadPluginTags",
                  )
                ) {
                  const reloadLabel = "再読み込み";
                  vscode.window
                    .showInformationMessage(
                      "TyranoScript syntax: 設定を反映するにはウィンドウを再読み込みしてください。",
                      reloadLabel,
                    )
                    .then((choice) => {
                      if (choice === reloadLabel) {
                        vscode.commands.executeCommand(
                          "workbench.action.reloadWindow",
                        );
                      }
                    });
                }
              }),
            );

            //すべてのプロジェクトに対して初回診断実行
            for (const i of infoWs.getTyranoScriptProjectRootPaths()) {
              tyranoDiagnostic.createDiagnostics(i + infoWs.pathDelimiter);
            }
          }
          //カーソル移動時のイベント登録
          context.subscriptions.push(
            vscode.window.onDidChangeTextEditorSelection(async (_e) => {
              await TyranoPreview.triggerHotReload();
            }),
          );

          TyranoLogger.print("TyranoScript syntax initialize end");

          //エラーポップアップ
          if (infoWs.getTyranoScriptProjectRootPaths().length === 0) {
            vscode.window.showErrorMessage(
              `TyranoScriptのプロジェクトが見つかりませんでした。一部機能が使用できません。`,
            );
          }
          infoWs.getTyranoScriptProjectRootPaths().forEach((element) => {
            vscode.window.showInformationMessage(
              `${element.split(infoWs.pathDelimiter).pop()}の初期化が完了しました。`,
            );
          });
        } catch (error) {
          TyranoLogger.print(
            "TyranoScript syntax initialize failed",
            ErrorLevel.ERROR,
          );
          TyranoLogger.printStackTrace(error);
          vscode.window.showErrorMessage(
            `TyranoScript syntax初期化中にエラーが発生しました。`,
          );
        }
      },
    );
  };

  run();
}

/**
 * 診断機能のアルゴリズム改善までの間、一時的にコマンドから診断実装可能にするのでその処理を置いとく関数
 */
export async function tmpDiagnostic() {
  //activate内で直接createDiagnosticを呼び出すと、エラーが出る
  //おそらくクラス内で定義した変数がコマンドからの呼び出しに対応していない？
  //のでここに専用の関数
  //実行速度が改善され次第削除予定

  TyranoLogger.print("manual diagnostic start");
  const tyranoDiagnostic: TyranoDiagnostic = new TyranoDiagnostic();
  await tyranoDiagnostic.createDiagnostics(
    vscode.window.activeTextEditor?.document.fileName,
  );
  TyranoLogger.print("manual diagnostic end");
}

export function deactivate(): Thenable<void> | undefined {
  cleanupEmbeddedJavaScript();
  if (!client) {
    return undefined;
  }
  return client.stop();
}
