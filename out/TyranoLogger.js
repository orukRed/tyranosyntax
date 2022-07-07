"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoLogger = void 0;
const vscode = require("vscode");
require('date-utils');
/**
 * staticクラス。
 * ログ出力用のクラス。
 */
class TyranoLogger {
    constructor() { }
    static print(text) {
        const currentTime = new Intl.DateTimeFormat('UTC', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(Date.now());
        TyranoLogger.channel.appendLine(`${currentTime}  ${text}`);
    }
}
exports.TyranoLogger = TyranoLogger;
// public static print = vscode.window.createOutputChannel("TyranoScript syntax").appendLine;
TyranoLogger.channel = vscode.window.createOutputChannel("TyranoScript syntax");
//# sourceMappingURL=TyranoLogger.js.map