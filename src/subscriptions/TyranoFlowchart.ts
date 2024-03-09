import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
const express = require('express');

import { InformationWorkSpace } from '../InformationWorkSpace';
import { InformationExtension } from '../InformationExtension';
import { flowchartPanel } from '../extension';
import { TyranoLogger } from '../TyranoLogger';


export class TyranoFlowchart {

  public static async createWindow() {
    if (!vscode.window.activeTextEditor) {
      return;
    }
    const createServer = async () => {
      try {
        TyranoLogger.print("preview server start");
        const app = express();
        console.log("flowchart");
        const filePath = InformationExtension.path + path.sep + "flowchart";
        app.use(express.static((filePath)));
        app.listen(3200, () => { });
      } catch (error) {
        TyranoLogger.printStackTrace(error);
      }


    }
    const createPreview = async (flowchartPanel: vscode.WebviewPanel | undefined) => {
      const create = ((flowchartPanel: vscode.WebviewPanel | undefined) => {
        flowchartPanel = vscode.window.createWebviewPanel(
          'tyranoFlowchart',
          'TyranoFlowchart',
          vscode.ViewColumn.Two, {
          enableScripts: true,//コンテンツスクリプトを有効化
          retainContextWhenHidden: true,//非表示時にコンテンツスクリプトを維持
          enableCommandUris: true,
          portMapping: [{ webviewPort: 3200, extensionHostPort: 3200 }]
        });
        const activeEditor = vscode.window.activeTextEditor;
        const filePath = activeEditor?.document.fileName;
        const infoWs = InformationWorkSpace.getInstance();
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
          `
      });
      const run = async () => {
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: "フローチャート作成中...",
          cancellable: true
        }, async (progress, token) => {
          create(flowchartPanel);
        });
      }
      await run();
    }
    createServer();
    createPreview(flowchartPanel);
  }
}