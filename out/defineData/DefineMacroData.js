"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefineMacroData = void 0;
class DefineMacroData {
    constructor(macroName, location) {
        this._macroName = ""; //マクロ名。[hoge]などのhoge部分。
        this._location = null; //定義ジャンプに使う位置情報
        this._macroName = macroName;
        this._location = location;
    }
    get macroName() {
        return this._macroName;
    }
    get location() {
        return this._location;
    }
}
exports.DefineMacroData = DefineMacroData;
//# sourceMappingURL=DefineMacroData.js.map