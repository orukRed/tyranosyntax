"use strict";
//拡張機能のエントリポイント
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const TyranoCreateTagByShortcutKey_1 = require("./TyranoCreateTagByShortcutKey");
const TyranoTagHoverProvider_1 = require("./TyranoTagHoverProvider");
const TyranoOutlineProvider_1 = require("./TyranoOutlineProvider");
const TyranoCompletionItemProvider_1 = require("./TyranoCompletionItemProvider");
const TyranoDiagnostic_1 = require("./TyranoDiagnostic");
const TyranoLogger_1 = require("./TyranoLogger");
const TYRANO_MODE = { scheme: 'file', language: 'tyrano' };
function activate(context) {
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
        //ファイルに変更を加えたタイミング、もしくはテキストエディタに変更を加えたタイミングでイベント呼び出すようにする
        context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(async (e) => tyranoDiagnostic.createDiagnostics()));
        context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(async (e) => tyranoDiagnostic.createDiagnostics()));
        TyranoLogger_1.TyranoLogger.print("TyranoDiagnostic activate");
    }
    //ワークスペースに変更がかかった時。CompletionItemの実装に使えそう。
    //context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(TYRANO_MODE, new Hoge()));
}
exports.activate = activate;
function deactivate() {
    return undefined;
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map