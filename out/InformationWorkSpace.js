"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InformationWorkSpace = void 0;
const fs = require("fs");
const vscode = require("vscode");
/**
 * ワークスペースディレクトリとか、data/フォルダの中にある素材情報とか。
 * シングルトン。
 */
class InformationWorkSpace {
    constructor() {
        this.DATA_DIRECTORY = "/data"; //projectRootPath/data
        this.TYRANO_DIRECTORY = "/tyrano"; //projectRootPath/tyrano
        this.DATA_BGIMAGE = "/bgimage";
        this.DATA_BGM = "/bgm";
        this.DATA_FGIMAGE = "/fgimage";
        this.DATA_IMAGE = "/image";
        this.DATA_OTHERS = "/others";
        this.DATA_SCENARIO = "/scenario";
        this.DATA_SOUND = "/sound";
        this.DATA_SYSTEM = "/system";
        this.DATA_VIDEO = "/video";
    }
    static getInstance() {
        return this.instance;
    }
    /**
     * フォルダを開いてるなら、開いてるフォルダ(index.htmlのあるフォルダ)のルートパスを取得します。
     * フォルダを開いてない場合、undefined.
     * @returns プロジェクトのルートパス。フォルダを開いていないならundefined.
     */
    getProjectRootPath() {
        //フォルダ開いてない場合、相対パスたどってプロジェクトのルートパス取ろうと思ったけど万が一Cドライブ直下とかにアクセスすると大惨事なのでNG.
        if (vscode.workspace.workspaceFolders === undefined) {
            return "";
        }
        return vscode.workspace.workspaceFolders[0].uri.fsPath;
    }
    /**
     * プロジェクトに存在するファイルパスを取得します。
     * 使用例:
     * @param projectRootPath プロジェクトのルートパス
     * @returns プロジェクトのルートパスが存在するなら存在するファイルパスを文字列型の配列で返却。
     */
    getProjectFiles(projectRootPath) {
        //ルートパスが存在していない場合
        if (projectRootPath === undefined || projectRootPath === "") {
            return [];
        }
        const listFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(dirent => dirent.isFile() ? [`${dir}/${dirent.name}`] : listFiles(`${dir}/${dirent.name}`));
        try {
            let ret = listFiles(projectRootPath); //絶対パスで取得
            ret = ret.map(e => {
                return e.replace(projectRootPath + "/", '');
            });
            return ret;
        }
        catch (error) {
            console.log(error);
            return [];
        }
    }
}
exports.InformationWorkSpace = InformationWorkSpace;
InformationWorkSpace.instance = new InformationWorkSpace();
//# sourceMappingURL=InformationWorkSpace.js.map