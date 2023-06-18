"use strict";
/**
 * chara_new:name
 * chara_face:face,name
 * anim:name
 * chara_layer:part,id
 * layermode
 * keyframe
 * html
 * plugin
 * 3d_model_new
 * 3d_sphere_new
 * 3d_sprite_new
 * [3d_event]
 * 3d_box_new
 * 3d_image_new
 **/
Object.defineProperty(exports, "__esModule", { value: true });
exports.NameParamData = void 0;
/**
 * 各タグのname,faceパラメータなどで登録した値を保存する。name,face,part,idのいずれかがあればもう登録しちゃっていいかも？
 */
class NameParamData {
    _name = ""; //name,face,partに入れた値
    _filePath = "";
    _location = null; //定義ジャンプに使う位置情報
    _resourceFilePath; //faceなどの場合、参照する画像ファイルへのパス
    _defineTag; //どのタグで定義されたか
    get name() {
        return this._name;
    }
    get filePath() {
        return this._filePath;
    }
    get location() {
        return this._location;
    }
    get resourceFilePath() {
        return this._resourceFilePath;
    }
    get defineTag() {
        return this._defineTag;
    }
    constructor(name, location, filePath, defineTag, resourceFilePath) {
        this._name = name;
        this._location = location;
        this._filePath = filePath;
        this._defineTag = defineTag;
        this._resourceFilePath = resourceFilePath;
    }
}
exports.NameParamData = NameParamData;
//# sourceMappingURL=NameParamData%20copy.js.map