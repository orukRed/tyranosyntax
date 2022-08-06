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
        this.pathDelimiter = (process.platform === "win32") ? "\\" : "/";
        this.DATA_DIRECTORY = this.pathDelimiter + "data"; //projectRootPath/data
        this.TYRANO_DIRECTORY = this.pathDelimiter + "tyrano"; //projectRootPath/tyrano
        this.DATA_BGIMAGE = this.pathDelimiter + "bgimage";
        this.DATA_BGM = this.pathDelimiter + "bgm";
        this.DATA_FGIMAGE = this.pathDelimiter + "fgimage";
        this.DATA_IMAGE = this.pathDelimiter + "image";
        this.DATA_OTHERS = this.pathDelimiter + "others";
        this.DATA_SCENARIO = this.pathDelimiter + "scenario";
        this.DATA_SOUND = this.pathDelimiter + "sound";
        this.DATA_SYSTEM = this.pathDelimiter + "system";
        this.DATA_VIDEO = this.pathDelimiter + "video";
        this._scriptFileMap = new Map(); //ファイルパスと、中身(全文)
        this._scenarioFileMap = new Map(); //ファイルパスと、中身(全文)
        //プロジェクト内の素材リソースのMap
        //keyはbgimage,bgm,fgimage.image.others,scenario,sound,system,videoとする。
        //valueは各フォルダに入っている素材のファイル名のリスト。
        //追加するときはresourceFileMap.set("bgimage",resourceMap.get("bgimage").concat["foo.png"]);
        //削除するときはresourceFileMap.set("bgimage",resourceMap.get("bgimage").splice["foo.png"]);
        this._resourceFilePathMap = new Map(); //string,string,string[] の順にプロジェクトパス、bgimageとかのフォルダ、絶対パスのリスト
        for (let projectPath of this.getTyranoScriptProjectRootPaths()) {
            //スクリプトファイルパスを初期化
            let absoluteScriptFilePaths = this.getProjectFiles(projectPath + this.DATA_DIRECTORY, [".js"], true); //dataディレクトリ内の.jsファイルを取得
            absoluteScriptFilePaths.forEach(element => {
                this.updateScriptFileMap(element);
            });
            //シナリオファイルを初期化
            let absoluteScenarioFilePaths = this.getProjectFiles(projectPath + this.DATA_DIRECTORY, [".ks"], true); //dataディレクトリ内の.ksファイルを取得
            absoluteScenarioFilePaths.forEach(element => {
                this.updateScenarioFileMap(element);
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
            [`${dir}${this.pathDelimiter}${dirent.name}`].filter((file) => dirent.name === "index.html").map(str => str.replace(this.pathDelimiter + "index.html", "")) :
            listFiles(`${dir}${this.pathDelimiter}${dirent.name}`));
        const ret = listFiles(this.getWorkspaceRootPath());
        return ret;
    }
    /**
     * スクリプトファイルパスとその中身のMapを更新
     * @param filePath
     */
    async updateScriptFileMap(filePath) {
        if (path.extname(filePath) !== ".js") {
            return;
        }
        let textDocument = await vscode.workspace.openTextDocument(filePath);
        this._scriptFileMap.set(textDocument.fileName, textDocument.getText());
    }
    async updateScenarioFileMap(filePath) {
        //.ks拡張子以外ならシナリオではないのでreturn
        if (path.extname(filePath) !== ".ks") {
            return;
        }
        let textDocument = await vscode.workspace.openTextDocument(filePath);
        this._scenarioFileMap.set(textDocument.fileName, textDocument);
    }
    /**
     * プロジェクトごとのリソースファイルパスを更新
     * @param projectRootPath
     */
    async updateResourceFilePathMap(projectRootPath) {
        // this._resourceFilePathMap.set(projectRootPath, new Map<string, string[]>());
        // this._resourceFilePathMap.get(projectRootPath)?.set("", ["", ""]);
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
            [`${dir}${this.pathDelimiter}${dirent.name}`].filter(file => {
                if (permissionExtension.length <= 0) {
                    return file;
                }
                return permissionExtension.includes(path.extname(file));
            }) :
            listFiles(`${dir}${this.pathDelimiter}${dirent.name}`));
        try {
            let ret = listFiles(projectRootPath); //絶対パスで取得
            //相対パスに変換
            if (!isAbsolute) {
                ret = ret.map(e => {
                    return e.replace(projectRootPath + this.pathDelimiter, '');
                });
            }
            return ret;
        }
        catch (error) {
            console.log(error);
            return [];
        }
    }
    /**
     * 引数で指定したファイルパスからプロジェクトパス（index.htmlのあるフォルダパス）を取得します。
     * @param filePath
     * @returns
     */
    async getProjectPathByFilePath(filePath) {
        let searchDir;
        do {
            const delimiterIndex = filePath.lastIndexOf(this.pathDelimiter);
            if (delimiterIndex === -1) {
                return "";
            }
            //filePathに存在するpathDelimiiter以降の文字列を削除
            filePath = filePath.substring(0, delimiterIndex);
            //フォルダ検索
            searchDir = fs.readdirSync(filePath, 'utf-8');
            //index.htmlが見つからないならループ
        } while (searchDir.filter(e => e === "index.html").length <= 0);
        return filePath;
    }
    /**
     * 引数で与えたファイルの相対パスから、絶対パスを返します。
     * @param relativePath
     */
    convertToAbsolutePathFromRelativePath(relativePath) {
        return path.resolve(relativePath);
    }
    get scriptFileMap() {
        return this._scriptFileMap;
    }
    get resourceFilePathMap() {
        return this._resourceFilePathMap;
    }
    get scenarioFileMap() {
        return this._scenarioFileMap;
    }
}
exports.InformationWorkSpace = InformationWorkSpace;
InformationWorkSpace.instance = new InformationWorkSpace();
//# sourceMappingURL=InformationWorkSpace.js.map