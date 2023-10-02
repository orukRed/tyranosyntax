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
exports.Parser = void 0;
const path = __importStar(require("path"));
/**
 * ティラノスクリプト本体に存在するパーサー処理を用いたパーサークラスです。
 * parseScenarioした後に追加の処理をすることが多かったため作成したクラスです。
 */
class Parser {
    static instance = new Parser();
    parser = require(`.${path.sep}lib${path.sep}tyrano_parser.js`);
    constructor() { }
    static getInstance() {
        return this.instance;
    }
    /**
     * 与えられた行とカーソルを引数として、カーソルより左側のタグを返却する
     * @param line
     * @returns
     */
    getTagName(line, cursor) {
        return "";
    }
    /**
     * 与えられた行とカーソルを引数として、カーソルより左側のタグのパラメータ名を返却する
     */
    getParameterName(line, cursor) {
    }
    /**
     * 与えられた行とカーソルを引数として、カーソルより左側のタグのパラメータ値を返却する
     */
    getParameterValue(line, cursor) {
    }
    /**
     * 引数で与えたテキストをパースして、パースしたデータを返却します。
     * @param text
     * @returns
     */
    parseText(text) {
        return this.parser.parseScenario(text);
    }
}
exports.Parser = Parser;
//# sourceMappingURL=Parser.js.map