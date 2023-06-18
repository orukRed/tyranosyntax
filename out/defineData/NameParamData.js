"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NameParamData = void 0;
/**
 * 各タグのname,face,id,part,jnameパラメータなどで登録した値を保存する。name,face,part,idのいずれかがあればもう登録しちゃっていいかも？
 */
class NameParamData {
    _name = ""; //name,face,partに入れた値 yuko,akaneなど
    _type = ""; //name,face,part,id,jnameのいずれか
    _location = null; //定義ジャンプに使う位置情報？
    _resourceFilePath; //faceなどの場合、参照する画像ファイルへのパス
    get name() {
        return this._name;
    }
    get type() {
        return this._type;
    }
    get location() {
        return this._location;
    }
    get resourceFilePath() {
        return this._resourceFilePath;
    }
    constructor(name, type, location, resourceFilePath) {
        this._name = name;
        this._type = type;
        this._location = location;
        this._resourceFilePath = resourceFilePath;
    }
}
exports.NameParamData = NameParamData;
//# sourceMappingURL=NameParamData.js.map