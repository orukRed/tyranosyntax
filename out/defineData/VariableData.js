"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableData = void 0;
const InformationWorkSpace_1 = require("../InformationWorkSpace");
/**
 * evalタグやjsからの変数定義で宣言された変数情報を格納するためのクラス
 */
class VariableData {
    infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
    _name; //変数名
    _value; //変数の値 現在未使用だけど今後使うかもなので一応定義だけしておく
    _description; //変数の説明
    _locations = []; //定義ジャンプに使う位置情報？ あと今は変数の定義場所取得手段思いつかないので、変数の使用箇所とする。そのため配列で値保持
    _type; //変数の種類 f sf tf mpのいずれか
    get name() {
        return this._name;
    }
    get locations() {
        return this._locations;
    }
    set locations(value) {
        this._locations = value;
    }
    addLocation(value) {
        this._locations?.push(value);
    }
    deleteLocation(deletePath) {
        const value = this._locations?.filter((location) => { return location.uri.fsPath !== deletePath.fsPath; });
        this.locations = value;
    }
    get type() {
        return this._type;
    }
    get description() {
        return this._description;
    }
    constructor(_name, _value, type, description = "") {
        this._name = _name;
        this._value = _value;
        this._type = type;
        this._description = description;
    }
}
exports.VariableData = VariableData;
//# sourceMappingURL=VariableData.js.map