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
exports.TyranoFlowchart = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const express = require('express');
const InformationWorkSpace_1 = require("../InformationWorkSpace");
const InformationExtension_1 = require("../InformationExtension");
const extension_1 = require("../extension");
const TyranoLogger_1 = require("../TyranoLogger");
class TyranoFlowchart {
    static async createWindow() {
        if (!vscode.window.activeTextEditor) {
            return;
        }
        const createServer = async () => {
            try {
                TyranoLogger_1.TyranoLogger.print("preview server start");
                const app = express();
                console.log("flowchart");
                const filePath = InformationExtension_1.InformationExtension.path + path.sep + "flowchart";
                app.use(express.static((filePath)));
                app.listen(3200, () => { });
            }
            catch (error) {
                TyranoLogger_1.TyranoLogger.printStackTrace(error);
            }
        };
        const createPreview = async (flowchartPanel) => {
            const create = ((flowchartPanel) => {
                flowchartPanel = vscode.window.createWebviewPanel('tyranoFlowchart', 'TyranoFlowchart', vscode.ViewColumn.Two, {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    enableCommandUris: true,
                    portMapping: [{ webviewPort: 3200, extensionHostPort: 3200 }]
                });
                const activeEditor = vscode.window.activeTextEditor;
                const filePath = activeEditor?.document.fileName;
                const infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
                if (!filePath) {
                    return;
                }
                flowchartPanel.webview.postMessage(infoWs.transitionMap.get(filePath));
                flowchartPanel.webview.html = `
          <iframe src="http://localhost:3200/flowchart.html" frameborder="0" style="width:300%; height:100vh;"></iframe>
          <script>
          // Webview内のHTMLでmessageイベントのリスナーを設定
          window.addEventListener('message', event => {
              const message = event.data; // The JSON data our extension sent
          
              // iframeに対してpostMessageを使用してデータを送信
              const iframe = document.querySelector('iframe');
              iframe.contentWindow.postMessage(message, '*');
          });
          </script>
          `;
            });
            const run = async () => {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "フローチャート作成中...",
                    cancellable: true
                }, async (progress, token) => {
                    create(flowchartPanel);
                });
            };
            await run();
        };
        createServer();
        createPreview(extension_1.flowchartPanel);
    }
}
exports.TyranoFlowchart = TyranoFlowchart;
//# sourceMappingURL=TyranoFlowchart.js.map