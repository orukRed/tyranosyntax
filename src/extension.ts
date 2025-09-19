//拡張機能のエントリポイント

import * as vscode from "vscode";
import * as path from "path";
import { ExtensionContext } from "vscode";
import {
  LanguageClient,
} from "vscode-languageclient/node";

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
import { IscriptCommentProvider, IscriptOnTypeFormattingProvider } from "./subscriptions/IscriptLanguageProvider";
const TYRANO_MODE = { scheme: "file", language: "tyrano" };

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

          // Register iscript language providers for JavaScript-like behavior
          const iscriptCommentProvider = new IscriptCommentProvider();
          const iscriptOnTypeProvider = new IscriptOnTypeFormattingProvider();

          context.subscriptions.push(
            vscode.languages.registerOnTypeFormattingEditProvider(
              TYRANO_MODE,
              iscriptOnTypeProvider,
              "{", "}", ";",
            ),
          );

          // Override the default comment toggle command to be context-aware
          context.subscriptions.push(
            vscode.commands.registerCommand(
              "editor.action.commentLine",
              iscriptCommentProvider.toggleLineComment.bind(iscriptCommentProvider),
            ),
          );
          TyranoLogger.print("IscriptLanguageProviders activate");

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
                    await infoWs.updateScenarioFileMap(e.document.fileName);
                    await infoWs.updateMacroLabelVariableDataMapByKs(
                      e.document.fileName,
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

            //FIXME:ファイル保存時にも診断実行 autosaveONにしてると正しく働かないので様子見
            // vscode.workspace.onDidSaveTextDocument(document => {
            //   if (previewPanel) {
            //     console.log("onDidSaveTextDocument");
            //     previewPanel.webview.html = `
            //     <iframe src="http://localhost:3000/index.html" frameborder="0" style="width:100%; height:100vh;"></iframe>
            //     `
            //   }
            // });
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
            });
            scenarioFileSystemWatcher.onDidDelete(async (e) => {
              await infoWs.spliceScenarioFileMapByFilePath(e.fsPath);
              await infoWs.spliceMacroDataMapByFilePath(e.fsPath);
              await infoWs.spliceLabelMapByFilePath(e.fsPath);
              await infoWs.spliceVariableMapByFilePath(e.fsPath);
              await infoWs.spliceCharacterMapByFilePath(e.fsPath);
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
              await infoWs.updateVariableMapByJS(e.fsPath);
            });
            scriptFileSystemWatcher.onDidChange(async (e) => {
              await infoWs.updateScriptFileMap(e.fsPath);
              await infoWs.updateMacroDataMapByJs(e.fsPath);
              await infoWs.updateVariableMapByJS(e.fsPath);
            });
            scriptFileSystemWatcher.onDidDelete(async (e) => {
              await infoWs.spliceScriptFileMapByFilePath(e.fsPath);
              await infoWs.spliceMacroDataMapByFilePath(e.fsPath);
              await infoWs.spliceVariableMapByFilePath(e.fsPath);
            });

            const resourceGlob = `**/*{${infoWs.resourceExtensionsArrays.toString()}}`; //TyranoScript syntax.resource.extensionで指定したすべての拡張子を取得
            const resourceFileSystemWatcher: vscode.FileSystemWatcher =
              vscode.workspace.createFileSystemWatcher(
                resourceGlob,
                false,
                false,
                false,
              );
            resourceFileSystemWatcher.onDidCreate(async (e) => {
              infoWs.addResourceFileMap(e.fsPath);
            });
            resourceFileSystemWatcher.onDidDelete(async (e) => {
              infoWs.spliceResourceFileMapByFilePath(e.fsPath);
            });

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
  if (!client) {
    return undefined;
  }
  return client.stop();
}
