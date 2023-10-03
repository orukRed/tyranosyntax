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
     * 引数から、カーソルより左側のタグを返却する
     * @param parsedData getParseTextで取得したパース済みのデータ
     * @param character カーソル位置(position.character)
     * @returns
     */
    getIndex(parsedData, character) {
        let ret = -1;
        for (const [index, data] of parsedData.entries()) {
            //マクロの定義column > カーソル位置なら探索不要なのでbreak;
            if (data["column"] > character) {
                return ret;
            }
            ret = index;
        }
        return ret;
    }
    /**
     * 引数で与えたテキストをパースして、パースしたデータを返却します。
     * @param text
     * @returns
     */
    parseText(text) {
        return this.parser.parseScenario(text)["array_s"];
    }
}
exports.Parser = Parser;
//# sourceMappingURL=Parser.js.map