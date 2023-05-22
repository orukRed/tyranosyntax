"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelData = void 0;
/**
 * ksファイル内で定義したラベル情報を格納するためのクラス
 */
class LabelData {
    _name; //ラベル名
    _location;
    get name() {
        return this._name;
    }
    get location() {
        return this._location;
    }
    constructor(_name, _location) {
        this._name = _name;
        this._location = _location;
    }
}
exports.LabelData = LabelData;
//# sourceMappingURL=LabelData.js.map