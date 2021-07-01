//拡張機能のエントリポイント


import * as vscode from 'vscode';

import {CreateTagByShortcutKey} from './CreateTagByShortcutKey';
import {TagHoverProvider} from './TagHoverProvider';
import {OutlineProvider} from './OutlineProvider';

const TYRANO_MODE = { scheme: 'file', language: 'tyrano' };


export function activate(context: vscode.ExtensionContext){
	//登録処理
	//サブスクリプションを登録することで、拡張機能がアンロードされたときにコマンドを解除してくれる
	context.subscriptions.push(vscode.languages.registerHoverProvider(TYRANO_MODE, new TagHoverProvider()));
	context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(TYRANO_MODE, new OutlineProvider()));

	let ctbs = new CreateTagByShortcutKey();
	context.subscriptions.push(vscode.commands.registerCommand('tyrano.shiftEnter', ctbs.KeyPushShiftEnter));
	context.subscriptions.push(vscode.commands.registerCommand('tyrano.ctrlEnter', ctbs.KeyPushCtrlEnter));
	context.subscriptions.push(vscode.commands.registerCommand('tyrano.altEnter', ctbs.KeyPushAltEnter));

}

export function deactivate(){
	return undefined;
}