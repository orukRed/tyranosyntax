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
        this.dataPathList = []; //projectRootPath/data の中に入っているファイルのパス
        this.projectRootPath = null; //プロジェクトのルートパス。index.htmlがあるディレクトリが対象。
        //今開いてるプロジェクトのルートパスを読み込む。
        this.projectRootPath = this.getProjectRootPath();
        //ファイルを再帰的に取得する
        this.dataPathList = this.getProjectFiles(this.projectRootPath);
    }
    static getInstance() {
        return this.instance;
    }
    /**
     * フォルダ開いてるなら、開いてるフォルダ(index.htmlのあるフォルダ)のルートパスを取得します。
     * フォルダ開いてない場合、undefined.
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