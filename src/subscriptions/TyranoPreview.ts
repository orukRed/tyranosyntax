import * as vscode from "vscode";
import express from "express";

import { InformationWorkSpace } from "../InformationWorkSpace";
import { previewPanel } from "../extension";
import { TyranoLogger } from "../TyranoLogger";

export class TyranoPreview {
  public static async createWindow() {
    if (!vscode.window.activeTextEditor) {
      return;
    }
    const createServer = async () => {
      try {
        TyranoLogger.print("preview server start");
        const app = express();
        console.log("preview");
        const infoWs = InformationWorkSpace.getInstance();
        const filePath = await infoWs.getProjectPathByFilePath(
          vscode.window.activeTextEditor!.document.fileName,
        );
        app.use(express.static(filePath));
        app.listen(3100, () => {});
      } catch (error) {
        TyranoLogger.printStackTrace(error);
      }
    };
    const createPreview = async (
      previewPanel: vscode.WebviewPanel | undefined,
    ) => {
      const create = (previewPanel: vscode.WebviewPanel | undefined) => {
        previewPanel = vscode.window.createWebviewPanel(
          "tyranoPreview",
          "TyranoPreview",
          vscode.ViewColumn.Two,
          {
            enableScripts: true, //コンテンツスクリプトを有効化
            retainContextWhenHidden: true, //非表示時にコンテンツスクリプトを維持
            enableCommandUris: true,
            portMapping: [{ webviewPort: 3100, extensionHostPort: 3100 }],
          },
        );
        previewPanel.webview.html = `
        <iframe src="http://localhost:3100/index.html" frameborder="0" style="width:100%; height:100vh;"></iframe>
        `;
      };
      const run = async () => {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "プレビューの作成中...",
            cancellable: true,
          },
          async (_progress, _token) => {
            create(previewPanel);
          },
        );
      };
      await run();
    };

    createServer();
    createPreview(previewPanel);
  }
}
