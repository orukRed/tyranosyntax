//拡張機能のエントリポイント

import * as vscode from 'vscode';
import * as fs from 'fs';

import { TyranoCreateTagByShortcutKey } from './TyranoCreateTagByShortcutKey';
import { TyranoTagHoverProvider } from './TyranoTagHoverProvider';
import { TyranoOutlineProvider } from './TyranoOutlineProvider';
import { TyranoCompletionItemProvider } from './TyranoCompletionItemProvider';
import { TyranoDiagnostic } from './TyranoDiagnostic';
import { TyranoLogger } from './TyranoLogger';
import { InformationWorkSpace } from './InformationWorkSpace';

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
	if (vscode.workspace.workspaceFolders !== undefined) {
		let tyranoDiagnostic = new TyranoDiagnostic();

		TyranoLogger.print("TyranoDiagnostic activate");
		context.subscriptions.push(vscode.commands.registerCommand('tyrano.diagnostic', tmpDiagnostic));
		//設定で診断機能の自動実行ONにしてるなら許可
		if (vscode.workspace.getConfiguration().get('TyranoScript syntax.autoDiagnostic.isEnabled')) {
			//ファイルに変更を加えたタイミング、もしくはテキストエディタに変更を加えたタイミングでイベント呼び出すようにする
			context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(async e => tyranoDiagnostic.createDiagnostics()));
			context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(async e => tyranoDiagnostic.createDiagnostics()));
			TyranoLogger.print("Auto diagnostic activate");
		} else {
			TyranoLogger.print("Auto diagnostic is not activate");
		}

	}



	//ワークスペースに変更がかかった時。CompletionItemの実装に使えそう。
	//context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(TYRANO_MODE, new Hoge()));

}

/**
 * 診断機能のアルゴリズム改善までの間、一時的にコマンドから診断実装可能にするのでその処理を置いとく関数
 */
export function tmpDiagnostic() {
	//activate内で直接createDiagnosticを呼び出すと、エラーが出る
	//おそらくクラス内で定義した変数がコマンドからの呼び出しに対応していない？
	//のでここに専用の関数
	//実行速度が改善され次第削除予定

	TyranoLogger.print("manual diagnostic start");
	let tyranoDiagnostic: TyranoDiagnostic = new TyranoDiagnostic();
	tyranoDiagnostic.createDiagnostics();
	TyranoLogger.print("manual diagnostic end");
}

export function deactivate() {
	return undefined;
}
