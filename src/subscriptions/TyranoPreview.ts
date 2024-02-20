import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { InformationWorkSpace } from '../InformationWorkSpace';
import { InformationExtension } from '../InformationExtension';
export class TyranoPreview {
  public static async createWindow() {
    const infoE: InformationExtension = InformationExtension.getInstance();
    if (!vscode.window.activeTextEditor || !infoE.path) {
      return;
    }

    const infoWs: InformationWorkSpace = InformationWorkSpace.getInstance();
    const projectPath = await infoWs.getProjectPathByFilePath(vscode.window.activeTextEditor.document.fileName);
    const folderUri = vscode.Uri.file(projectPath);
    const folderUriJoinTyrano = vscode.Uri.joinPath(folderUri);
    const relativePath = path.relative(infoE.path, projectPath + "/tyrano/tyrano.css");

    const create = (() => {


      const panel = vscode.window.createWebviewPanel(
        'previewHtml',//識別子
        'HTML Preview',//タイトル
        vscode.ViewColumn.Two,//表示する位置
        {
          enableScripts: true,//コンテンツスクリプトを有効化
          retainContextWhenHidden: true,
          localResourceRoots: [folderUri],
          // localResourceRoots: [vscode.Uri.file(relativePath)],
          // enableCommandUris: true,//webview内でvsode.executeCommandを使用してコマンド実行できるようになる
          // enableFindWidget: false,
          // enableForms: true,
          // portMapping: [{ webviewPort: 8000, extensionHostPort: 8000 }],

        }
      );

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
        `
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
    }

    await run();

  }


}
