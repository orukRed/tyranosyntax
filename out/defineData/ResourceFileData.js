"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceFileData = void 0;
const InformationWorkSpace_1 = require("../InformationWorkSpace");
/**
 * bgimageなどに入っている素材フォルダ情報を格納するためのクラス
 */
class ResourceFileData {
    constructor(_filePath, _resourceType) {
        this.infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
        this._fileName = _filePath.split(this.infoWs.pathDelimiter).pop();
        this._filePath = _filePath;
        this._resourceType = _resourceType;
    }
    get fileName() {
        return this._fileName;
    }
    get filePath() {
        return this._filePath;
    }
    get resourceType() {
        return this._resourceType;
    }
}
exports.ResourceFileData = ResourceFileData;
//# sourceMappingURL=ResourceFileData.js.map