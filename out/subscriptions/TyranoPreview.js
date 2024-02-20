"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoPreview = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const InformationWorkSpace_1 = require("../InformationWorkSpace");
const InformationExtension_1 = require("../InformationExtension");
class TyranoPreview {
    static async createWindow() {
        const infoE = InformationExtension_1.InformationExtension.getInstance();
        if (!vscode.window.activeTextEditor || !infoE.path) {
            return;
        }
        const infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
        const projectPath = await infoWs.getProjectPathByFilePath(vscode.window.activeTextEditor.document.fileName);
        const folderUri = vscode.Uri.file(projectPath);
        const folderUriJoinTyrano = vscode.Uri.joinPath(folderUri);
        const relativePath = path.relative(infoE.path, projectPath + "/tyrano/tyrano.css");
        const create = (() => {
            const panel = vscode.window.createWebviewPanel('previewHtml', //識別子
            'HTML Preview', //タイトル
            vscode.ViewColumn.Two, //表示する位置
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [folderUri],
                // localResourceRoots: [vscode.Uri.file(relativePath)],
                // enableCommandUris: true,//webview内でvsode.executeCommandを使用してコマンド実行できるようになる
                // enableFindWidget: false,
                // enableForms: true,
                // portMapping: [{ webviewPort: 8000, extensionHostPort: 8000 }],
            });
            //index.htmlを読み込む
            // fs.readFile(path.join(projectPath, 'index.html'), (err, data) => {
            // 	if (err) {
            // 		console.error(err);
            // 		return;
            // 	}
            // 	panel.webview.html = data.toString();
            // });
            // vscode API版もあるので要検討
            vscode.workspace.fs.readFile(vscode.Uri.file(`${projectPath}/index.html`)).then((data) => {
                panel.webview.html = `
        <iframe src="http://localhost:3000/index.html" frameborder="0" style="width:100%; height:100vh;"></iframe>
        `;
            });
        });
        const run = async () => {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "プレビューの作成中...",
                cancellable: true
            }, async (progress, token) => {
                create();
            });
        };
        await run();
    }
}
exports.TyranoPreview = TyranoPreview;
//# sourceMappingURL=TyranoPreview.js.map