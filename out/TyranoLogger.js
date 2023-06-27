"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoLogger = exports.ErrorLevel = void 0;
const vscode = __importStar(require("vscode"));
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
 * ログは出力ウィンドウのウィンドウで出力されるため、try-catchでこれを出力するのはNG
 */
class TyranoLogger {
    static channel = vscode.window.createOutputChannel("TyranoScript syntax");
    constructor() { }
    /**
     *  ログ出力
     * @param text  出力する文字列
     * @param errorLevel  出力するエラーレベル ErrorLevelを使用
     */
    static print(text, errorLevel = ErrorLevel.DEBUG) {
        const currentTime = new Date();
        TyranoLogger.channel.appendLine(`[${currentTime.toLocaleString()}:${currentTime.getMilliseconds()}] [${errorLevel}]  ${text}`);
    }
}
exports.TyranoLogger = TyranoLogger;
//# sourceMappingURL=TyranoLogger.js.map