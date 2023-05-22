"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableData = void 0;
/**
 * evalタグやjsからの変数定義で宣言された変数情報を格納するためのクラス
 */
class VariableData {
    _name; //変数名
    _value; //変数の値 現在未使用だけど今後使うかもなので一応定義だけしておく
    //宣言したファイルパスのSet
    _filePathList = new Set(); //TODO:そのうち独自クラス作って、filePathとLocationを持たせるようにした方がよい。Locationを使った機能がまだないのでこのままで。
    _type; //変数の種類 f sf tf mpのいずれか
    get name() {
        return this._name;
    }
    get filePathList() {
        return this._filePathList;
    }
    addFilePathList(filePath) {
        this.filePathList.add(filePath);
    }
    deleteFilePathList(filePath) {
        this.filePathList.delete(filePath);
    }
    set filePathList(value) {
        this._filePathList = value;
    }
    get type() {
        return this._type;
    }
    constructor(_name, _value, type) {
        this._name = _name;
        this._value = _value;
        this._type = type;
    }
}
exports.VariableData = VariableData;
//# sourceMappingURL=VariableData.js.map