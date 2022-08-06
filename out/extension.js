"use strict";
//拡張機能のエントリポイント
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.tmpDiagnostic = exports.activate = void 0;
const vscode = require("vscode");
const TyranoCreateTagByShortcutKey_1 = require("./TyranoCreateTagByShortcutKey");
const TyranoTagHoverProvider_1 = require("./TyranoTagHoverProvider");
const TyranoOutlineProvider_1 = require("./TyranoOutlineProvider");
const TyranoCompletionItemProvider_1 = require("./TyranoCompletionItemProvider");
const TyranoDiagnostic_1 = require("./TyranoDiagnostic");
const TyranoLogger_1 = require("./TyranoLogger");
const InformationWorkSpace_1 = require("./InformationWorkSpace");
const path = require("path");
const TYRANO_MODE = { scheme: 'file', language: 'tyrano' };
async function activate(context) {
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
        const tyranoDiagnostic = new TyranoDiagnostic_1.TyranoDiagnostic();
        const infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
        TyranoLogger_1.TyranoLogger.print("TyranoDiagnostic activate");
        context.subscriptions.push(vscode.commands.registerCommand('tyrano.diagnostic', tmpDiagnostic));
        //設定で診断機能の自動実行ONにしてるなら許可
        if (vscode.workspace.getConfiguration().get('TyranoScript syntax.autoDiagnostic.isEnabled')) {
            //ファイルに変更を加えたタイミング、もdしくはテキストエディタに変更を加えたタイミングでイベント呼び出すようにする
            context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(async (e) => {
                if (path.extname(e.document.fileName) === ".ks") {
                    await infoWs.updateScenarioFileMap(e.document.fileName);
                    tyranoDiagnostic.createDiagnostics(e.document);
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
        });
        scriptFileSystemWatcher.onDidChange(async (e) => {
            await infoWs.updateScriptFileMap(e.fsPath);
        });
        //resourceFileMapも同様にファイルウォッチャー設定
        const resourceFileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.{png,jpeg,jpg,bmp,gif,ogg,mp3,m4a,ks,js,json}', false, false, false);
        resourceFileSystemWatcher.onDidCreate(async (e) => {
        });
        resourceFileSystemWatcher.onDidChange(async (e) => {
            infoWs.updateResourceFilePathMap(e.fsPath);
        });
        resourceFileSystemWatcher.onDidDelete(async (e) => {
        });
    }
    //ワークスペースに変更がかかった時。CompletionItemの実装に使えそう。
    //context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(TYRANO_MODE, new Hoge()));
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
    var _a;
    TyranoLogger_1.TyranoLogger.print("manual diagnostic start");
    let tyranoDiagnostic = new TyranoDiagnostic_1.TyranoDiagnostic();
    await tyranoDiagnostic.createDiagnostics((_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document);
    TyranoLogger_1.TyranoLogger.print("manual diagnostic end");
}
exports.tmpDiagnostic = tmpDiagnostic;
function deactivate() {
    return undefined;
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map