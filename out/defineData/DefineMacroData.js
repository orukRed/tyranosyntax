"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefineMacroData = void 0;
class DefineMacroData {
    _macroName = ""; //マクロ名。[hoge]などのhoge部分。
    _filePath = "";
    _location = null; //定義ジャンプに使う位置情報
    _parameterMap = new Map(); //パラメータ名と値のマップ 最終的に何らかのクラスに入れるべき？
    constructor(macroName, location, filePath) {
        this._macroName = macroName;
        this._location = location;
        this._filePath = filePath;
    }
    addParameter(parameterName, parameterValue) {
        this._parameterMap.set(parameterName, parameterValue);
    }
    get macroName() {
        return this._macroName;
    }
    get filePath() {
        return this._filePath;
    }
    get location() {
        return this._location;
    }
    get parameterMap() {
        return this._parameterMap;
    }
    set parameterMap(value) {
        this._parameterMap = value;
    }
}
exports.DefineMacroData = DefineMacroData;
//# sourceMappingURL=DefineMacroData.js.map