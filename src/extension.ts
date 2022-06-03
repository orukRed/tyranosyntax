//拡張機能のエントリポイント

import * as vscode from 'vscode';
import * as fs from 'fs';

import { TyranoCreateTagByShortcutKey } from './TyranoCreateTagByShortcutKey';
import { TyranoTagHoverProvider } from './TyranoTagHoverProvider';
import { TyranoOutlineProvider } from './TyranoOutlineProvider';
import { TyranoCompletionItemProvider } from './TyranoCompletionItemProvider';
import { TyranoDiagnostic } from './TyranoDiagnostic';
import { TyranoLogger } from './TyranoLogger';

const TYRANO_MODE = { scheme: 'file', language: 'tyrano' };

export function activate(context: vscode.ExtensionContext) {
	//登録処理
	//サブスクリプションを登録することで、拡張機能がアンロードされたときにコマンドを解除してくれる
	context.subscriptions.push(vscode.languages.registerHoverProvider(TYRANO_MODE, new TyranoTagHoverProvider()));
	TyranoLogger.print("TyranoTagHoverProvider activate");
	context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(TYRANO_MODE, new TyranoOutlineProvider()));
	TyranoLogger.print("TyranoOutlineProvider activate");
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider(TYRANO_MODE, new TyranoCompletionItemProvider()));
	TyranoLogger.print("TyranoCompletionItemProvider activate");

	//ショートカットコマンドの登録
	let ctbs = new TyranoCreateTagByShortcutKey();
	context.subscriptions.push(vscode.commands.registerCommand('tyrano.shiftEnter', ctbs.KeyPushShiftEnter));
	context.subscriptions.push(vscode.commands.registerCommand('tyrano.ctrlEnter', ctbs.KeyPushCtrlEnter));
	context.subscriptions.push(vscode.commands.registerCommand('tyrano.altEnter', ctbs.KeyPushAltEnter));
	TyranoLogger.print("TyranoCreateTagByShortcutKey activate");

	//診断機能の登録
	//ワークスペースを開いてる && index.htmlがある時のみ診断機能使用OK
	if (vscode.workspace.workspaceFolders !== undefined && fs.existsSync(vscode.workspace.workspaceFolders[0].uri.fsPath + "/index.html")) {
		const tyranoDiagnostic = new TyranoDiagnostic();
		//ファイルに変更を加えたタイミング、もしくはテキストエディタに変更を加えたタイミングでイベント呼び出すようにする
		context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => tyranoDiagnostic.createDiagnostics()));
		context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(e => tyranoDiagnostic.createDiagnostics()));
		TyranoLogger.print("TyranoDiagnostic activate");
	}

	//ワークスペースに変更がかかった時。CompletionItemの実装に使えそう。
	//context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(TYRANO_MODE, new Hoge()));


}

export function deactivate() {
	return undefined;
}
