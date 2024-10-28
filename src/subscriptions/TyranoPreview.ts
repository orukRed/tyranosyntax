import * as vscode from "vscode";
import * as fs from "fs";
import express from "express";
import open from "open";
import { type Server } from "http";
import { InformationWorkSpace } from "../InformationWorkSpace";
import { previewPanel } from "../extension";
import { TyranoLogger } from "../TyranoLogger";
import { InformationExtension } from "../InformationExtension";
import path from "path";
import { Parser } from "../Parser";
/**
 * 
 * メモ
 * index.htmlを改造して、 <input type="hidden" id="first_scenario_file" value="http://test.com/tyrano/data/scenario/first.ks">のコメントアウトを解除する
 * preview.ksを作成し、そこをfirst.ks代わりのエントリポイントとする。
 * そしてそこにあらかじめ設定した処理を読み込ませる
 * 現在のカーソル位置を取得し、そこに[s]タグを入れる。
 * その後、ローカルホスト上でindex.htmlを開いて、localhost:3100/preview.ksにアクセスさせる  
 * エラーが出た場合、出力ウィンドウあたりに表示させる


WARN:
storage等の指定先が、ユーザーの指定したディレクトリになっているかの確認が必要
*/

/**
 * その場プレビュー機能を提供するクラス
 */
export class TyranoPreview {
  private static serverInstance: Server | undefined = undefined;
  public static async createWindow() {
    if (!vscode.window.activeTextEditor || !InformationExtension.path) {
      return;
    }
    const createServer = async () => {
      try {
        TyranoLogger.print("preview server start");
        const app = express();
        console.log("preview");
        const infoWs = InformationWorkSpace.getInstance();
        const projectPath = await infoWs.getProjectPathByFilePath(
          vscode.window.activeTextEditor?.document.fileName!,
        );

        const folderPath = InformationExtension.path + path.sep + "preview";
        const activeFilePath =
          vscode.window.activeTextEditor?.document.fileName!;
        const scenarioName = path.relative(
          projectPath + "/data/scenario",
          activeFilePath,
        );

        //もっとも近いラベルを取得
        const parser: Parser = Parser.getInstance();
        const parsedText = parser.parseText(
          vscode.window.activeTextEditor?.document.getText()!,
        );
        //vscodeの現在のカーソル位置を取得
        const activeEditor = vscode.window.activeTextEditor;
        const cursorPosition = activeEditor?.selection.active;
        const nearestLabel = parser.getNearestLabel(parsedText, cursorPosition);

        app.use((req, res, next) => {
          if (req.path === "/preview.ks") {
            const filePath = folderPath + path.sep + "preview.ks";

            fs.readFile(filePath, "utf8", (err, data) => {
              if (err) {
                return next(err);
              }
              const preprocess = vscode.workspace
                .getConfiguration()
                .get("TyranoScript syntax.preview.preprocess")!
                .toString();
              // ファイルオブジェクトを作成
              const fileObject = {
                content: data
                  .replaceAll(
                    "&f.ORUKRED_TYRANO_SYNTAX_STORAGE_NAME",
                    scenarioName,
                  )
                  .replaceAll(
                    "&f.ORUKRED_TYRANO_SYNTAX_TARGET_NAME",
                    nearestLabel,
                  )
                  .replaceAll(
                    "&f.ORUKRED_TYRANO_SYNTAX_PREPROCESS",
                    preprocess,
                  ),
                path: filePath,
                name: path.basename(filePath),
              };

              // ファイルの内容をレスポンスとして送信
              res.send(fileObject.content);
            });
          }
          //activeFilePathからprojectPathを切り取った値とreq.pathが一致した場合、そのファイルを返す
          else if (req.path === "/data/scenario/" + scenarioName) {
            const filePath = projectPath + "/data/scenario/" + scenarioName;
            fs.readFile(filePath, "utf8", (err, data) => {
              if (err) {
                return next(err);
              }
              //現在のカーソル位置に[s]タグを挿入する
              const activeEditor = vscode.window.activeTextEditor;
              const cursorPosition = activeEditor?.selection.active;
              const line = cursorPosition?.line;
              const character = cursorPosition?.character;
              const text = data.split("\n");
              text[line!] =
                text[line!].substring(0, character!) +
                "[s]" +
                text[line!].substring(character!);
              data = text.join("\n");

              // ファイルオブジェクトを作成
              const fileObject = {
                content: data,
                path: filePath,
                name: path.basename(filePath),
              };
              res.send(fileObject.content);
            });
          } else {
            next();
          }
        });

        // // 静的ファイルを提供する
        app.use(express.static(folderPath));
        app.use(express.static(projectPath));

        app.get("/preview", (req, res) => {
          const dynamicHtml = TyranoPreview.getIndex(
            projectPath,
            InformationExtension.path! + `/preview`,
          );
          res.send(dynamicHtml);
        });

        TyranoPreview.serverInstance = app.listen(3100, () => {
          open(`http://localhost:3100/preview`);
        });
      } catch (error) {
        TyranoLogger.printStackTrace(error);
      }
    };

    if (TyranoPreview.serverInstance) {
      TyranoPreview.serverInstance.close(() => {
        console.log("port 3100 server closed");
      });
    }
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "その場プレビュー作成中...",
        cancellable: true,
      },
      async (_progress, _token) => {
        createServer();
      },
    );
  }

  private static getIndex(projectPath: string, extensionPath: string): string {
    const relativePath = path.relative(extensionPath, projectPath);
    return `
<!DOCTYPE html>
<html>
    <head>
        <title>Loading TyranoScript</title>

        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />
        <meta name="robots" content="noindex,nofollow" />
        <link href="./tyrano/tyrano.css" rel="stylesheet" />
        <link href="./tyrano/libs/jquery-ui/jquery-ui.css" rel="stylesheet" />

        <!-- jQuery -->
        <script src="./tyrano/libs/jquery-3.6.0.min.js"></script>
        <script>
            try {
                window.jQuery = window.$ = require("./tyrano/libs/jquery-3.6.0.min.js");
            } catch (e) {
              console.log(e); 
            }
        </script>

        <!-- jQuery Plugins -->
        <script src="./tyrano/libs/jquery-migrate-1.4.1.js"></script>
        <script src="./tyrano/libs/jquery-ui/jquery-ui.min.js"></script>
        <script src="./tyrano/libs/jquery.a3d.js"></script>
        <script src="./tyrano/libs/jsrender.min.js"></script>

        <!-- 廃止予定 alertify.js -->
        <link href="./tyrano/libs/alertify/alertify.core.css" rel="stylesheet" />
        <link href="./tyrano/libs/alertify/alertify.default.css" rel="stylesheet" />
        <script src="./tyrano/libs/alertify/alertify.min.js"></script>

        <!-- remodal -->
        <link href="./tyrano/libs/remodal/remodal.css" rel="stylesheet" />
        <link href="./tyrano/libs/remodal/remodal-default-theme.css" rel="stylesheet" />
        <script src="./tyrano/libs/remodal/remodal.js"></script>

        <!-- html2canvas -->
        <script src="./tyrano/libs/html2canvas.js"></script>

        <!-- KeyConfig.js -->
        <script src="./data/system/KeyConfig.js"></script>

        <!-- tyrano -->
        <script src="./tyrano/lang.js"></script>
        <script src="./tyrano/libs.js"></script>
        <script src="./tyrano/tyrano.js"></script>
        <script src="./tyrano/tyrano.base.js"></script>
        <script src="./tyrano/plugins/kag/kag.js"></script>
        <script src="./tyrano/plugins/kag/kag.event.js"></script>
        <script src="./tyrano/plugins/kag/kag.key_mouse.js"></script>
        <script src="./tyrano/plugins/kag/kag.layer.js"></script>
        <script src="./tyrano/plugins/kag/kag.menu.js"></script>
        <script src="./tyrano/plugins/kag/kag.parser.js"></script>
        <script src="./tyrano/plugins/kag/kag.rider.js"></script>
        <script src="./tyrano/plugins/kag/kag.studio.js"></script>
        <script src="./tyrano/plugins/kag/kag.tag_audio.js"></script>
        <script src="./tyrano/plugins/kag/kag.tag_camera.js"></script>
        <script src="./tyrano/plugins/kag/kag.tag_ext.js"></script>
        <script src="./tyrano/plugins/kag/kag.tag_system.js"></script>
        <script src="./tyrano/plugins/kag/kag.tag_vchat.js"></script>
        <script src="./tyrano/plugins/kag/kag.tag_ar.js"></script>
        <script src="./tyrano/plugins/kag/kag.tag_three.js"></script>
        <script src="./tyrano/plugins/kag/kag.tag.js"></script>

        <!-- Others -->
        <link href="./tyrano/libs/textillate/assets/animate.css" rel="stylesheet" />
        <script src="./tyrano/libs/textillate/assets/jquery.lettering.js"></script>
        <script src="./tyrano/libs/textillate/jquery.textillate.js"></script>
        <script src="./tyrano/libs/jquery.touchSwipe.min.js"></script>
        <script src="./tyrano/libs/howler.js"></script>
        <script src="./tyrano/libs/jsQR.js"></script>
        <script src="./tyrano/libs/anime.min.js"></script>
        <script src="./tyrano/libs/lz-string.min.js"></script>
        
    </head>

    <body onselectstart="return false" onContextmenu="return false" ontouchmove="event.preventDefault()">
        <div id="tyrano_base" class="tyrano_base" style="overflow: hidden" unselectable="on" ondragstart="return false"></div>
        <div id="vchat_base" class="vchat_base" style="overflow: hidden" unselectable="on" ondragstart="return false"></div>

        <!--  First シナリオファイルに外部ファイルを利用したい場合は、こちらにシナリオファイルのURLを指定できます-->
        <input type="hidden" id="first_scenario_file" value="./../../preview.ks">

        <!-- コンフィグ調整をindex.htmlでもできる -->
        <!--
        <input type="hidden" tyrano="config" key="vchat" value="true" />
        <input type="hidden" tyrano="config" key="vchatMenuVisible" value="true" />
        -->

        <!-- モーダル用 -->
        <div class="remodal-bg"></div>
        <div
            class="remodal"
            data-remodal-id="modal"
            data-remodal-options="hashTracking:false,closeOnEscape:false,closeOnOutsideClick:false"
        >
            <h1 class="remodal_title"></h1>
            <p class="remodal_txt"></p>
            <br />
            <button data-remodal-action="cancel" id="remodal-cancel" class="remodal-cancel">Cancel</button>
            <button data-remodal-action="confirm" id="remodal-confirm" class="remodal-confirm">OK</button>
        </div>  
    </body>
</html>
`;
  }
}
