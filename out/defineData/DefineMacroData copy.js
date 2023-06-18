"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefineMacroData = void 0;
class DefineMacroData {
    _macroName = ""; //マクロ名。[hoge]などのhoge部分。
    _filePath = "";
    _location = null; //定義ジャンプに使う位置情報
    _parameter = [];
    _description = ""; //マクロの説明
    constructor(macroName, location, filePath, description) {
        this._macroName = macroName;
        this._location = location;
        this._filePath = filePath;
        this._description = description;
    }
    parseParametersToJsonObject() {
        // Object.assign(this._parameter, { name: name, required: required, description: description });
    }
    /**
     * 入力補完に使うjsonオブジェクトへと変換します。
     * @returns
     */
    parseToJsonObject() {
        return { "name": this.macroName, "description": this.description, "parameters": this.parseParametersToJsonObject() };
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
    get description() {
        return this._description;
    }
    set description(value) {
        this._description = value;
    }
    get parameter() {
        return this._parameter;
    }
}
exports.DefineMacroData = DefineMacroData;
//# sourceMappingURL=DefineMacroData%20copy.js.map