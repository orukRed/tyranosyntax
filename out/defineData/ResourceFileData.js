"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceFileData = void 0;
const InformationWorkSpace_1 = require("../InformationWorkSpace");
/**
 * bgimageなどに入っている素材フォルダ情報を格納するためのクラス
 */
class ResourceFileData {
    infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
    _fileName; //ファイル名：hoge.pngなど。
    _filePath; //各リソースフォルダからのファイルパス。:hoge/foo/bar.pngなど。
    _resourceType; //リソースタイプ。imageなど。
    get fileName() {
        return this._fileName;
    }
    get filePath() {
        return this._filePath;
    }
    get resourceType() {
        return this._resourceType;
    }
    constructor(_filePath, _resourceType) {
        this._fileName = _filePath.split(this.infoWs.pathDelimiter).pop();
        this._filePath = _filePath;
        this._resourceType = _resourceType;
    }
}
exports.ResourceFileData = ResourceFileData;
//# sourceMappingURL=ResourceFileData.js.map