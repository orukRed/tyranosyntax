//拡張機能のエントリポイント

import * as vscode from 'vscode';
import * as fs from 'fs';

import { TyranoCreateTagByShortcutKey } from './TyranoCreateTagByShortcutKey';
import { TyranoTagHoverProvider } from './TyranoTagHoverProvider';
import { TyranoOutlineProvider } from './TyranoOutlineProvider';
import { TyranoCompletionItemProvider } from './TyranoCompletionItemProvider';
import { TyranoDiagnostic } from './TyranoDiagnostic';
import { ErrorLevel, TyranoLogger } from './TyranoLogger';
import { InformationWorkSpace } from './InformationWorkSpace';
import * as path from 'path';
const TYRANO_MODE = { scheme: 'file', language: 'tyrano' };


export async function activate(context: vscode.ExtensionContext) {
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
		const tyranoDiagnostic = new TyranoDiagnostic();
		const infoWs: InformationWorkSpace = InformationWorkSpace.getInstance();
		await infoWs.initializeMaps();

		TyranoLogger.print("TyranoDiagnostic activate");
		context.subscriptions.push(vscode.commands.registerCommand('tyrano.diagnostic', tmpDiagnostic));
		//設定で診断機能の自動実行ONにしてるなら許可
		if (vscode.workspace.getConfiguration().get('TyranoScript syntax.autoDiagnostic.isEnabled')) {
			//ファイルに変更を加えたタイミング、もdしくはテキストエディタに変更を加えたタイミングでイベント呼び出すようにする
			context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(async e => {
				if (path.extname(e.document.fileName) === ".ks") {
					await infoWs.updateScenarioFileMap(e.document.fileName);
					await tyranoDiagnostic.createDiagnostics(e.document.fileName);
				}
			}));
			TyranoLogger.print("Auto diagnostic activate");
		} else {
			TyranoLogger.print("Auto diagnostic is not activate");
		}

		//scriptFileの値
		const scriptFileSystemWatcher: vscode.FileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.{js}', false, false, false);
		scriptFileSystemWatcher.onDidCreate(async e => {
			await infoWs.updateScriptFileMap(e.fsPath);
		});
		scriptFileSystemWatcher.onDidChange(async e => {
			await infoWs.updateScriptFileMap(e.fsPath);
		});



		//resourceFileMapも同様にファイルウォッチャー設定
		const resourceFileSystemWatcher: vscode.FileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.{png,jpeg,jpg,bmp,gif,ogg,mp3,m4a,ks,js,json}', false, false, false);
		resourceFileSystemWatcher.onDidCreate(async e => {
		});
		resourceFileSystemWatcher.onDidChange(async e => {
			infoWs.updateResourceFilePathMap(e.fsPath);
		});
		resourceFileSystemWatcher.onDidDelete(async e => {

		});

		//すべてのプロジェクトに対して初回診断実行
		for (let i of infoWs.getTyranoScriptProjectRootPaths()) {
			tyranoDiagnostic.createDiagnostics(i + infoWs.pathDelimiter);
		}

	}



	//ワークスペースに変更がかかった時。CompletionItemの実装に使えそう。
	//context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(TYRANO_MODE, new Hoge()));

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
	let tyranoDiagnostic: TyranoDiagnostic = new TyranoDiagnostic();
	await tyranoDiagnostic.createDiagnostics(vscode.window.activeTextEditor?.document.fileName);
	TyranoLogger.print("manual diagnostic end");
}

export function deactivate() {
	return undefined;
}
