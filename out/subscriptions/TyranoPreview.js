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
const extension_1 = require("../extension");
const TyranoLogger_1 = require("../TyranoLogger");
class TyranoPreview {
    static async createWindow() {
        if (!vscode.window.activeTextEditor) {
            return;
        }
        const createServer = async () => {
            try {
                TyranoLogger_1.TyranoLogger.print("preview server start");
                const app = express();
                console.log("preview");
                const infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
                const filePath = await infoWs.getProjectPathByFilePath(vscode.window.activeTextEditor.document.fileName);
                app.use(express.static((filePath)));
                app.listen(3100, () => { });
            }
            catch (error) {
                TyranoLogger_1.TyranoLogger.printStackTrace(error);
            }
        };
        const createPreview = async (previewPanel) => {
            const create = ((previewPanel) => {
                previewPanel = vscode.window.createWebviewPanel('tyranoPreview', 'TyranoPreview', vscode.ViewColumn.Two, {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    enableCommandUris: true,
                    portMapping: [{ webviewPort: 3100, extensionHostPort: 3100 }]
                });
                previewPanel.webview.html = `
        <iframe src="http://localhost:3100/index.html" frameborder="0" style="width:100%; height:100vh;"></iframe>
        `;
            });
            const run = async () => {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "プレビューの作成中...",
                    cancellable: true
                }, async (progress, token) => {
                    create(previewPanel);
                });
            };
            await run();
        };
        createServer();
        createPreview(extension_1.previewPanel);
    }
}
exports.TyranoPreview = TyranoPreview;
//# sourceMappingURL=TyranoPreview.js.map