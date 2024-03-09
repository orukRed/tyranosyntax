"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransitionData = void 0;
const InformationWorkSpace_1 = require("../InformationWorkSpace");
/**
 * jump系のタグで指定したファイル名やラベル名を保持するクラス
 */
class TransitionData {
    static jumpTags = ["scenario", "script", "html", "css", "jump", "button", "glink"]; //tyranoJumpProviderでの定義と同じもの。重複なのでどこかで定義すべき？
    storage; //storageタグで指定したファイルパス
    target; //targetタグで指定したラベル名
    tag; //buttonやjumpなどのタグ名
    currentLabel; //現在のラベル名
    condition; //条件分岐の条件式
    currentFile; //現在のファイルパス
    //上記のパラメータを定義したファイルパス
    fileUri;
    constructor(tag, storage, target, currentLabel, condition, fileUri) {
        this.tag = tag;
        this.storage = storage;
        this.target = target;
        this.currentLabel = currentLabel;
        this.condition = condition;
        this.fileUri = fileUri;
        const infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
        if (fileUri) {
            //data / scenario以降のパスを取得
            this.currentFile = this.extractAfter(fileUri.uri.path, "data/scenario/");
        }
    }
    /**
     *
     * @param str 特定文字列より後ろを抽出します。
     * @param target
     * @returns
     */
    extractAfter(str, target) {
        const index = str.indexOf(target);
        if (index >= 0) {
            return str.substring(index + target.length);
        }
        else {
            return '';
        }
    }
}
exports.TransitionData = TransitionData;
//# sourceMappingURL=TransitionData.js.map