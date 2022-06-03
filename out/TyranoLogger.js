"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoLogger = void 0;
const vscode = require("vscode");
/**
 * staticクラス。
 * ログ出力用のクラス。
 */
class TyranoLogger {
    constructor() {
    }
}
exports.TyranoLogger = TyranoLogger;
TyranoLogger.print = vscode.window.createOutputChannel("TyranoScript syntax").appendLine;
//# sourceMappingURL=TyranoLogger.js.map