"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoLogger = exports.ErrorLevel = void 0;
const vscode = require("vscode");
class ErrorLevel {
    static DEBUG = "DEBUG";
    static INFO = "INFO";
    static WARN = "WARN";
    static ERROR = "ERROR";
    static FATAL = "FATAL";
}
exports.ErrorLevel = ErrorLevel;
/**
 * staticクラス。
 * ログ出力用のクラス。
 */
class TyranoLogger {
    static channel = vscode.window.createOutputChannel("TyranoScript syntax");
    constructor() { }
    static print(text, errorLevel = ErrorLevel.DEBUG) {
        const currentTime = new Date();
        TyranoLogger.channel.appendLine(`[${currentTime.toLocaleString()}:${currentTime.getMilliseconds()}] [${errorLevel}]  ${text}`);
    }
}
exports.TyranoLogger = TyranoLogger;
//# sourceMappingURL=TyranoLogger.js.map