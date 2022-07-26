import * as vscode from 'vscode';


export class ErrorLevel {
	public static readonly DEBUG = "DEBUG";
	public static readonly INFO = "INFO";
	public static readonly WARN = "WARN";
	public static readonly ERROR = "ERROR";
	public static readonly FATAL = "FATAL";
}

/**
 * staticクラス。
 * ログ出力用のクラス。
 */
export class TyranoLogger {

	private static channel = vscode.window.createOutputChannel("TyranoScript syntax");

	private constructor() { }
	public static print(text: string, errorLevel: ErrorLevel = ErrorLevel.DEBUG) {
		const currentTime = new Date();
		TyranoLogger.channel.appendLine(`[${currentTime.toLocaleString()}:${currentTime.getMilliseconds()}] [${errorLevel}]  ${text}`);
	}

}

