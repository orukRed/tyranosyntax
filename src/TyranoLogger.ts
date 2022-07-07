import * as vscode from 'vscode';
require('date-utils');

/**
 * staticクラス。
 * ログ出力用のクラス。
 */
export class TyranoLogger {

	// public static print = vscode.window.createOutputChannel("TyranoScript syntax").appendLine;
	private static channel = vscode.window.createOutputChannel("TyranoScript syntax");
	private constructor() { }

	public static print(text: string) {
		const currentTime = new Intl.DateTimeFormat('UTC', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(Date.now());
		TyranoLogger.channel.appendLine(`${currentTime}  ${text}`);
	}


}

