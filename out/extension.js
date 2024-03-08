"use strict";
//拡張機能のエントリポイント
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.tmpDiagnostic = exports.activate = exports.previewPanel = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const TyranoCreateTagByShortcutKey_1 = require("./subscriptions/TyranoCreateTagByShortcutKey");
const TyranoHoverProvider_1 = require("./subscriptions/TyranoHoverProvider");
const TyranoOutlineProvider_1 = require("./subscriptions/TyranoOutlineProvider");
const TyranoCompletionItemProvider_1 = require("./subscriptions/TyranoCompletionItemProvider");
const TyranoDiagnostic_1 = require("./subscriptions/TyranoDiagnostic");
const TyranoLogger_1 = require("./TyranoLogger");
const InformationWorkSpace_1 = require("./InformationWorkSpace");
const TyranoDefinitionProvider_1 = require("./subscriptions/TyranoDefinitionProvider");
const TyranoJumpProvider_1 = require("./subscriptions/TyranoJumpProvider");
const InformationExtension_1 = require("./InformationExtension");
const TyranoPreview_1 = require("./subscriptions/TyranoPreview");
const TyranoFlowchart_1 = require("./subscriptions/TyranoFlowchart");
const TYRANO_MODE = { scheme: 'file', language: 'tyrano' };
exports.previewPanel = undefined;
async function activate(context) {
    const run = async () => {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "TyranoScript_syntaxの初期化中...",
            cancellable: true
        }, async (progress, token) => {
            InformationExtension_1.InformationExtension.path = context.extensionPath;
            TyranoLogger_1.TyranoLogger.print("TyranoScript syntax initialize start.");
            try {
                //登録処理
                //サブスクリプションを登録することで、拡張機能がアンロードされたときにコマンドを解除してくれる
                context.subscriptions.push(vscode.languages.registerHoverProvider(TYRANO_MODE, new TyranoHoverProvider_1.TyranoHoverProvider()));
                TyranoLogger_1.TyranoLogger.print("TyranoHoverProvider activate");
                context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(TYRANO_MODE, new TyranoOutlineProvider_1.TyranoOutlineProvider()));
                TyranoLogger_1.TyranoLogger.print("TyranoOutlineProvider activate");
                context.subscriptions.push(vscode.languages.registerCompletionItemProvider(TYRANO_MODE, new TyranoCompletionItemProvider_1.TyranoCompletionItemProvider(), '.'));
                TyranoLogger_1.TyranoLogger.print("TyranoCompletionItemProvider activate");
                //ショートカットコマンドの登録
                let ctbs = new TyranoCreateTagByShortcutKey_1.TyranoCreateTagByShortcutKey();
                context.subscriptions.push(vscode.commands.registerCommand('tyrano.shiftEnter', ctbs.KeyPushShiftEnter));
                context.subscriptions.push(vscode.commands.registerCommand('tyrano.ctrlEnter', ctbs.KeyPushCtrlEnter));
                context.subscriptions.push(vscode.commands.registerCommand('tyrano.altEnter', ctbs.KeyPushAltEnter));
                TyranoLogger_1.TyranoLogger.print("TyranoCreateTagByShortcutKey activate");
                context.subscriptions.push(vscode.commands.registerCommand('tyrano.preview', TyranoPreview_1.TyranoPreview.createWindow));
                TyranoLogger_1.TyranoLogger.print("TyranoPreview activate");
                context.subscriptions.push(vscode.commands.registerCommand('tyrano.flowchart', TyranoFlowchart_1.TyranoFlowchart.createWindow));
                TyranoLogger_1.TyranoLogger.print("TyranoFlowchart activate");
                const infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
                //診断機能の登録
                //ワークスペースを開いてる && index.htmlがある時のみ診断機能使用OK
                if (vscode.workspace.workspaceFolders !== undefined) {
                    TyranoLogger_1.TyranoLogger.print("workspace is opening");
                    const tyranoDiagnostic = new TyranoDiagnostic_1.TyranoDiagnostic();
                    await infoWs.initializeMaps();
                    infoWs.extensionPath = context.extensionPath;
                    TyranoLogger_1.TyranoLogger.print("TyranoDiagnostic activate");
                    let tyranoJumpProvider = new TyranoJumpProvider_1.TyranoJumpProvider();
                    context.subscriptions.push(vscode.commands.registerCommand('tyrano.diagnostic', tmpDiagnostic)); //手動診断のコマンドON
                    context.subscriptions.push(vscode.commands.registerCommand('tyrano.jumpToDestination', tyranoJumpProvider.toDestination)); //ジャンプ先のファイル開くコマンドON
                    context.subscriptions.push(vscode.languages.registerDefinitionProvider(TYRANO_MODE, new TyranoDefinitionProvider_1.TyranoDefinitionProvider())); //定義元への移動
                    // context.subscriptions.push(vscode.languages.registerReferenceProvider(TYRANO_MODE, new TyranoReferenceProvider()));//参照先の表示
                    // context.subscriptions.push(vscode.languages.registerRenameProvider(TYRANO_MODE, new TyranoRenameProvider()));//シンボルの名前変更
                    //設定で診断機能の自動実行ONにしてるなら許可
                    if (vscode.workspace.getConfiguration().get('TyranoScript syntax.autoDiagnostic.isEnabled')) {
                        //ファイルに変更を加えたタイミング、もしくはテキストエディタに変更を加えたタイミングでイベント呼び出すようにする
                        context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(async (e) => {
                            if (path.extname(e.document.fileName) === ".ks" && !tyranoDiagnostic.isDiagnosing) {
                                tyranoDiagnostic.isDiagnosing = true;
                                await infoWs.updateScenarioFileMap(e.document.fileName);
                                await infoWs.updateMacroLabelVariableDataMapByKs(e.document.fileName);
                                try {
                                    await tyranoDiagnostic.createDiagnostics(e.document.fileName);
                                }
                                catch (error) {
                                    TyranoLogger_1.TyranoLogger.print(`診断中にエラーが発生しました。直前に触ったファイルは${e.document.fileName}です。`, TyranoLogger_1.ErrorLevel.ERROR);
                                }
                                finally {
                                    tyranoDiagnostic.isDiagnosing = false;
                                }
                            }
                        }));
                        TyranoLogger_1.TyranoLogger.print("Auto diagnostic activate");
                    }
                    else {
                        TyranoLogger_1.TyranoLogger.print("Auto diagnostic is not activate");
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
                    const scenarioFileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.{ks}', false, false, false);
                    scenarioFileSystemWatcher.onDidCreate(async (e) => {
                        await infoWs.updateScenarioFileMap(e.fsPath);
                        await infoWs.updateMacroLabelVariableDataMapByKs(e.fsPath);
                    });
                    scenarioFileSystemWatcher.onDidDelete(async (e) => {
                        await infoWs.spliceScenarioFileMapByFilePath(e.fsPath);
                        await infoWs.spliceMacroDataMapByFilePath(e.fsPath);
                        await infoWs.spliceLabelMapByFilePath(e.fsPath);
                        await infoWs.spliceVariableMapByFilePath(e.fsPath);
                        await infoWs.spliceNameMapByFilePath(e.fsPath);
                    });
                    //scriptFileの値
                    const scriptFileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.{js}', false, false, false);
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
                    const resourceFileSystemWatcher = vscode.workspace.createFileSystemWatcher(resourceGlob, false, false, false);
                    resourceFileSystemWatcher.onDidCreate(async (e) => {
                        infoWs.addResourceFileMap(e.fsPath);
                    });
                    resourceFileSystemWatcher.onDidDelete(async (e) => {
                        infoWs.spliceResourceFileMapByFilePath(e.fsPath);
                    });
                    //すべてのプロジェクトに対して初回診断実行
                    for (let i of infoWs.getTyranoScriptProjectRootPaths()) {
                        tyranoDiagnostic.createDiagnostics(i + infoWs.pathDelimiter);
                    }
                }
                TyranoLogger_1.TyranoLogger.print("TyranoScript syntax initialize end");
                //エラーポップアップ
                if (infoWs.getTyranoScriptProjectRootPaths().length === 0) {
                    vscode.window.showErrorMessage(`TyranoScriptのプロジェクトが見つかりませんでした。一部機能が使用できません。`);
                }
                infoWs.getTyranoScriptProjectRootPaths().forEach(element => {
                    vscode.window.showInformationMessage(`${element.split(infoWs.pathDelimiter).pop()}の初期化が完了しました。`);
                });
            }
            catch (error) {
                TyranoLogger_1.TyranoLogger.print("TyranoScript syntax initialize failed", TyranoLogger_1.ErrorLevel.ERROR);
                TyranoLogger_1.TyranoLogger.printStackTrace(error);
                vscode.window.showErrorMessage(`TyranoScript syntax初期化中にエラーが発生しました。`);
            }
        });
    };
    run();
}
exports.activate = activate;
/**
 * 診断機能のアルゴリズム改善までの間、一時的にコマンドから診断実装可能にするのでその処理を置いとく関数
 */
async function tmpDiagnostic() {
    //activate内で直接createDiagnosticを呼び出すと、エラーが出る
    //おそらくクラス内で定義した変数がコマンドからの呼び出しに対応していない？
    //のでここに専用の関数
    //実行速度が改善され次第削除予定
    TyranoLogger_1.TyranoLogger.print("manual diagnostic start");
    let tyranoDiagnostic = new TyranoDiagnostic_1.TyranoDiagnostic();
    await tyranoDiagnostic.createDiagnostics(vscode.window.activeTextEditor?.document.fileName);
    TyranoLogger_1.TyranoLogger.print("manual diagnostic end");
}
exports.tmpDiagnostic = tmpDiagnostic;
function deactivate() {
    return undefined;
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map