"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefineMacroData = void 0;
class DefineMacroData {
    _macroName = ""; //マクロ名。[hoge]などのhoge部分。
    get macroName() {
        return this._macroName;
    }
    _filePath = "";
    get filePath() {
        return this._filePath;
    }
    _location = null; //定義ジャンプに使う位置情報
    get location() {
        return this._location;
    }
    constructor(macroName, location, filePath) {
        this._macroName = macroName;
        this._location = location;
        this._filePath = filePath;
    }
}
exports.DefineMacroData = DefineMacroData;
//# sourceMappingURL=DefineMacroData.js.map