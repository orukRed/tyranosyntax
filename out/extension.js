"use strict";
//拡張機能のエントリポイント
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const CreateTagByShortcutKey_1 = require("./CreateTagByShortcutKey");
const TagHoverProvider_1 = require("./TagHoverProvider");
const OutlineProvider_1 = require("./OutlineProvider");
const TYRANO_MODE = { scheme: 'file', language: 'tyrano' };
function activate(context) {
    //登録処理
    //サブスクリプションを登録することで、拡張機能がアンロードされたときにコマンドを解除してくれる
    context.subscriptions.push(vscode.languages.registerHoverProvider(TYRANO_MODE, new TagHoverProvider_1.TagHoverProvider()));
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(TYRANO_MODE, new OutlineProvider_1.OutlineProvider()));
    let ctbs = new CreateTagByShortcutKey_1.CreateTagByShortcutKey();
    context.subscriptions.push(vscode.commands.registerCommand('tyrano.shiftEnter', ctbs.KeyPushShiftEnter));
    context.subscriptions.push(vscode.commands.registerCommand('tyrano.ctrlEnter', ctbs.KeyPushCtrlEnter));
    context.subscriptions.push(vscode.commands.registerCommand('tyrano.altEnter', ctbs.KeyPushAltEnter));
}
exports.activate = activate;
function deactivate() {
    return undefined;
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map