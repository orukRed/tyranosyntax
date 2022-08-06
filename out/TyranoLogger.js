"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoLogger = exports.ErrorLevel = void 0;
const vscode = require("vscode");
class ErrorLevel {
}
exports.ErrorLevel = ErrorLevel;
ErrorLevel.DEBUG = "DEBUG";
ErrorLevel.INFO = "INFO";
ErrorLevel.WARN = "WARN";
ErrorLevel.ERROR = "ERROR";
ErrorLevel.FATAL = "FATAL";
/**
 * staticクラス。
 * ログ出力用のクラス。
 */
class TyranoLogger {
    constructor() { }
    static print(text, errorLevel = ErrorLevel.DEBUG) {
        const currentTime = new Date();
        TyranoLogger.channel.appendLine(`[${currentTime.toLocaleString()}:${currentTime.getMilliseconds()}] [${errorLevel}]  ${text}`);
    }
}
exports.TyranoLogger = TyranoLogger;
TyranoLogger.channel = vscode.window.createOutputChannel("TyranoScript syntax");
//# sourceMappingURL=TyranoLogger.js.map