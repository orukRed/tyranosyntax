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
const express = require('express');
const InformationWorkSpace_1 = require("../InformationWorkSpace");
class TyranoPreview {
    static async createWindow() {
        if (!vscode.window.activeTextEditor) {
            return;
        }
        const createServer = async () => {
            const app = express();
            console.log("preview");
            const infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
            const filePath = await infoWs.getProjectPathByFilePath(vscode.window.activeTextEditor.document.fileName);
            app.use(express.static((filePath)));
            app.listen(3000, () => { });
        };
        const createPreview = async () => {
            const create = (() => {
                const panel = vscode.window.createWebviewPanel('tyranoPreview', 'TyranoPreview', vscode.ViewColumn.Two, {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    enableCommandUris: true,
                    portMapping: [{ webviewPort: 3000, extensionHostPort: 3000 }]
                });
                panel.webview.html = `
        <iframe src="http://localhost:3000/index.html" frameborder="0" style="width:100%; height:100vh;"></iframe>
        `;
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
        };
        createServer();
        createPreview();
    }
}
exports.TyranoPreview = TyranoPreview;
//# sourceMappingURL=TyranoPreview.js.map