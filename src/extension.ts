//拡張機能のエントリポイント


import * as vscode from 'vscode';

import { TyranoCreateTagByShortcutKey } from './TyranoCreateTagByShortcutKey';
import { TyranoTagHoverProvider } from './TyranoTagHoverProvider';
import { TyranoOutlineProvider } from './TyranoOutlineProvider';
import { TyranoCompletionItemProvider } from './TyranoCompletionItemProvider';
import { TyranoDiagnostic } from './TyranoDiagnostic';


const TYRANO_MODE = { scheme: 'file', language: 'tyrano' };

export function activate(context: vscode.ExtensionContext) {
	//登録処理
	//サブスクリプションを登録することで、拡張機能がアンロードされたときにコマンドを解除してくれる
	context.subscriptions.push(vscode.languages.registerHoverProvider(TYRANO_MODE, new TyranoTagHoverProvider()));
	context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(TYRANO_MODE, new TyranoOutlineProvider()));
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider(TYRANO_MODE, new TyranoCompletionItemProvider()));


	//ショートカットコマンドの登録
	let ctbs = new TyranoCreateTagByShortcutKey();
	context.subscriptions.push(vscode.commands.registerCommand('tyrano.shiftEnter', ctbs.KeyPushShiftEnter));
	context.subscriptions.push(vscode.commands.registerCommand('tyrano.ctrlEnter', ctbs.KeyPushCtrlEnter));
	context.subscriptions.push(vscode.commands.registerCommand('tyrano.altEnter', ctbs.KeyPushAltEnter));

	//パース機能呼び出しテスト
	const hoge11: TyranoDiagnostic = new TyranoDiagnostic();
	hoge11.hoge();


	// //診断機能の登録
	// const tyranoDiagnostic = new TyranoDiagnostic();
	// //ファイルに変更を加えたタイミング、もしくはテキストエディタに変更を加えたタイミングでイベント呼び出すようにする
	// context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e =>tyranoDiagnostic.createDiagnostics(e.document, tyranoDiagnostic.collection)));
	// context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(e=>{
	// 	if(vscode.window.activeTextEditor&&e){
	// 		tyranoDiagnostic.createDiagnostics(vscode.window.activeTextEditor.document, tyranoDiagnostic.collection);
	// 	}
	// }));

	//ワークスペースに変更がかかった時。CompletionItemの実装に使えそう。
	//context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(TYRANO_MODE, new Hoge()));


}

export function deactivate() {
	return undefined;
}
