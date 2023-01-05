"use strict";
//拡張機能のエントリポイント
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.tmpDiagnostic = exports.activate = void 0;
const vscode = require("vscode");
const path = require("path");
const TyranoCreateTagByShortcutKey_1 = require("./subscriptions/TyranoCreateTagByShortcutKey");
const TyranoTagHoverProvider_1 = require("./subscriptions/TyranoTagHoverProvider");
const TyranoOutlineProvider_1 = require("./subscriptions/TyranoOutlineProvider");
const TyranoCompletionItemProvider_1 = require("./subscriptions/TyranoCompletionItemProvider");
const TyranoDiagnostic_1 = require("./subscriptions/TyranoDiagnostic");
const TyranoLogger_1 = require("./TyranoLogger");
const InformationWorkSpace_1 = require("./InformationWorkSpace");
const TyranoDefinitionProvider_1 = require("./subscriptions/TyranoDefinitionProvider");
const TyranoJumpProvider_1 = require("./subscriptions/TyranoJumpProvider");
const TYRANO_MODE = { scheme: 'file', language: 'tyrano' };
async function activate(context) {
    TyranoLogger_1.TyranoLogger.print("TyranoScript syntax initialize start.");
    //登録処理
    //サブスクリプションを登録することで、拡張機能がアンロードされたときにコマンドを解除してくれる
    context.subscriptions.push(vscode.languages.registerHoverProvider(TYRANO_MODE, new TyranoTagHoverProvider_1.TyranoTagHoverProvider()));
    TyranoLogger_1.TyranoLogger.print("TyranoTagHoverProvider activate");
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(TYRANO_MODE, new TyranoOutlineProvider_1.TyranoOutlineProvider()));
    TyranoLogger_1.TyranoLogger.print("TyranoOutlineProvider activate");
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(TYRANO_MODE, new TyranoCompletionItemProvider_1.TyranoCompletionItemProvider()));
    TyranoLogger_1.TyranoLogger.print("TyranoCompletionItemProvider activate");
    //ショートカットコマンドの登録
    let ctbs = new TyranoCreateTagByShortcutKey_1.TyranoCreateTagByShortcutKey();
    context.subscriptions.push(vscode.commands.registerCommand('tyrano.shiftEnter', ctbs.KeyPushShiftEnter));
    context.subscriptions.push(vscode.commands.registerCommand('tyrano.ctrlEnter', ctbs.KeyPushCtrlEnter));
    context.subscriptions.push(vscode.commands.registerCommand('tyrano.altEnter', ctbs.KeyPushAltEnter));
    TyranoLogger_1.TyranoLogger.print("TyranoCreateTagByShortcutKey activate");
    //診断機能の登録
    //ワークスペースを開いてる && index.htmlがある時のみ診断機能使用OK
    if (vscode.workspace.workspaceFolders !== undefined) {
        TyranoLogger_1.TyranoLogger.print("workspace is opening");
        const tyranoDiagnostic = new TyranoDiagnostic_1.TyranoDiagnostic();
        const infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
        await infoWs.initializeMaps();
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
                    await infoWs.updateMacroDataMapByKs(e.document.fileName);
                    try {
                        await tyranoDiagnostic.createDiagnostics(e.document.fileName);
                    }
                    catch (error) {
                        console.log(error);
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
        //scriptFileの値
        const scriptFileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.{js}', false, false, false);
        scriptFileSystemWatcher.onDidCreate(async (e) => {
            await infoWs.updateScriptFileMap(e.fsPath);
            await infoWs.updateMacroDataMapByJs(e.fsPath);
        });
        scriptFileSystemWatcher.onDidChange(async (e) => {
            await infoWs.updateScriptFileMap(e.fsPath);
            await infoWs.updateMacroDataMapByJs(e.fsPath);
        });
        // シナリオやスクリプトを削除したとき、マクロデータが削除されずに残っている
        scriptFileSystemWatcher.onDidDelete(async (e) => {
            //違うところでksファイルに対しても同様の処理が必要
            // await infoWs.spliceScriptFileMapByFilePath(e.fsPath);
            // await infoWs.spliceMacroDataMapByFilePath(e.fsPath);
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
    vscode.window.showInformationMessage("TyranoScript syntaxの初期化が完了しました。");
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