"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MacroParameterData = void 0;
/**
 * マクロのパラメータ（[bg storage="hoge.ks"]のstorageの部分）
 * 将来的にjsで定義したタグのパラメータをこれに格納する
 */
class MacroParameterData {
    _name = ""; //parameter名
    _required = false; //必須かどうか
    _description = ""; //parameterの説明
    constructor(name, required, description) {
        this._name = name;
        this._required = required;
        this._description = description;
    }
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
    }
    get required() {
        return this._required;
    }
    set required(value) {
        this._required = value;
    }
    get description() {
        return this._description;
    }
    set description(value) {
        this._description = value;
    }
}
exports.MacroParameterData = MacroParameterData;
//# sourceMappingURL=MacroParameterData.js.map