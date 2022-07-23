"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InformationWorkSpace = exports.TyranoResourceType = void 0;
const fs = require("fs");
const vscode = require("vscode");
const path = require("path");
class TyranoResourceType {
}
exports.TyranoResourceType = TyranoResourceType;
TyranoResourceType.BGIMAGE = "bgimage";
TyranoResourceType.BGM = "bgm";
TyranoResourceType.FGIMAGE = "fgimage";
TyranoResourceType.IMAGE = "image";
TyranoResourceType.OTHERS = "others";
TyranoResourceType.SCENARIO = "scenario";
TyranoResourceType.SOUND = "sound";
TyranoResourceType.SYSTEM = "system";
TyranoResourceType.VIDEO = "video";
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
        this._scriptFileMap = new Map(); //ファイルパスと、中身(全文)
        //プロジェクト内の素材リソースのMap
        //keyはbgimage,bgm,fgimage.image.others,scenario,sound,system,videoとする。
        //valueは各フォルダに入っている素材のファイル名のリスト。
        //追加するときはresourceFileMap.set("bgimage",resourceMap.get("bgimage").concat["foo.png"]);
        //削除するときはresourceFileMap.set("bgimage",resourceMap.get("bgimage").splice["foo.png"]);
        this._resourceFilePathMap = new Map(); //string,string,string[] の順にプロジェクトパス、bgimageとかのフォルダ、絶対パスのリスト
        //スクリプトファイルパスを初期化
        for (let projectPaths of this.getTyranoScriptProjectRootPaths()) {
            let absoluteScenarioFilePaths = this.getProjectFiles(projectPaths + this.DATA_DIRECTORY, [".ks"], true); //dataディレクトリ内の.ksファイルを取得
            absoluteScenarioFilePaths = absoluteScenarioFilePaths.concat(this.getProjectFiles(projectPaths + this.DATA_DIRECTORY, [".ks"], true)); //dataディレクトリ内の.jsファイルを取得
            absoluteScenarioFilePaths.forEach(element => {
                this.updateScriptFileMap(element);
            });
        }
    }
    static getInstance() {
        return this.instance;
    }
    /**
     * フォルダを開いてるなら、vscodeで開いているルートパスのディレクトリを取得します。
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
     * vscodeで開いたフォルダ内に存在するティラノスクリプトのプロジェクトのパスを取得します。
     * @returns
     */
    getTyranoScriptProjectRootPaths() {
        //フォルダ開いてないなら早期リターン
        if (this.getWorkspaceRootPath() === undefined) {
            return [];
        }
        // 指定したファイルパスの中のファイルのうち、index.htmlがあるディレクトリを返却。
        const listFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).
            flatMap(dirent => dirent.isFile() ?
            [`${dir}/${dirent.name}`].filter((file) => dirent.name === "index.html").map(str => str.replace("/index.html", "")) :
            listFiles(`${dir}/${dirent.name}`));
        const ret = listFiles(this.getWorkspaceRootPath());
        return ret;
    }
    /**
     * スクリプトファイルパスとその中身のMapを更新
     * @param filePath
     */
    async updateScriptFileMap(filePath) {
        vscode.workspace.fs.readFile(vscode.Uri.file(filePath)).then(async (text) => {
            this._scriptFileMap.set(filePath, text.toString());
        });
    }
    /**
     * プロジェクトごとのリソースファイルパスを更新
     * @param projectRootPath
     */
    async updateResourceFilePathMap(projectRootPath) {
        var _a;
        this._resourceFilePathMap.set(projectRootPath, new Map());
        (_a = this._resourceFilePathMap.get(projectRootPath)) === null || _a === void 0 ? void 0 : _a.set("", ["", ""]);
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
    get scriptFileMap() {
        return this._scriptFileMap;
    }
    get resourceFilePathMap() {
        return this._resourceFilePathMap;
    }
}
exports.InformationWorkSpace = InformationWorkSpace;
InformationWorkSpace.instance = new InformationWorkSpace();
//# sourceMappingURL=InformationWorkSpace.js.map