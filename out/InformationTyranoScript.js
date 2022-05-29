"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InformationTyranoScript = void 0;
const fs = require("fs");
/**
 * ティラノスクリプトに関する情報。
 * シングルトン。
 */
class InformationTyranoScript {
    constructor() {
    }
    static getInstance() {
        return this.instance;
    }
    /**
     * ティラノスクリプトにデフォルトで提供されているを返却します。
     * @returns ティラノスクリプトにデフォルトで提供されているタグ
     */
    getDefaultTag() {
        let tyranoDefaultTag = [];
        JSON.parse(fs.readFileSync(__dirname + "/./../Tiptool/tyrano.tiptool.json", "utf8"), (key, value) => {
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
exports.InformationTyranoScript = InformationTyranoScript;
InformationTyranoScript.instance = new InformationTyranoScript();
//# sourceMappingURL=InformationTyranoScript.js.map