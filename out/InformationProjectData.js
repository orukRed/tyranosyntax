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
exports.InformationProjectData = void 0;
const fs = __importStar(require("fs"));
/**
 * ティラノスクリプトに関する情報。
 * シングルトン。
 */
class InformationProjectData {
    static instance = new InformationProjectData();
    static getInstance() {
        return this.instance;
    }
    constructor() {
    }
    /**
     * ティラノスクリプトにデフォルトで提供されているを返却します。
     * @returns ティラノスクリプトにデフォルトで提供されているタグ
     */
    getDefaultTag() {
        let tyranoDefaultTag = [];
        JSON.parse(fs.readFileSync(__dirname + "/./../Tooltip/tyrano.Tooltip.json", "utf8"), (key, value) => {
            if (key === "prefix") {
                tyranoDefaultTag.push(value);
                return value;
            }
            ;
        });
        //内部のパーサーとしては*はラベル、普通の文字列はtextで追加されているので返却
        tyranoDefaultTag.push("label");
        tyranoDefaultTag.push("text");
        return tyranoDefaultTag;
    }
}
exports.InformationProjectData = InformationProjectData;
//# sourceMappingURL=InformationProjectData.js.map