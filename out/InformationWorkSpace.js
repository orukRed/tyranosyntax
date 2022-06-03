"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InformationWorkSpace = void 0;
const fs = require("fs");
const vscode = require("vscode");
const path = require("path");
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
    getWorkspaceRootPath() {
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
     * @param permissionExtension 取得するファイルパスの拡張子。無指定ですべてのファイル取得。
     * @param isAbsolute 絶対パスで返すかどうか。trueなら絶対パス。falseで相対パス。
     * @returns プロジェクトのルートパスが存在するなら存在するファイルパスを文字列型の配列で返却。
     */
    getProjectFiles(projectRootPath, permissionExtension = [], isAbsolute = false) {
        //ルートパスが存在していない場合
        if (projectRootPath === undefined || projectRootPath === "") {
            return [];
        }
        //指定したファイルパスの中のファイルのうち、permissionExtensionの中に入ってる拡張子のファイルパスのみを取得
        const listFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).
            flatMap(dirent => dirent.isFile() ?
            [`${dir}/${dirent.name}`].filter(file => {
                if (permissionExtension.length <= 0) {
                    return file;
                }
                return permissionExtension.includes(path.extname(file));
            }) :
            listFiles(`${dir}/${dirent.name}`));
        try {
            let ret = listFiles(projectRootPath); //絶対パスで取得
            //相対パスに変換
            if (!isAbsolute) {
                ret = ret.map(e => {
                    return e.replace(projectRootPath + "/", '');
                });
            }
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