/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from "vscode";
import * as fs from "fs";
import express, { Application } from "express";
import WebSocket from "ws";
import open from "open";
import { IncomingMessage, Server } from "http";
import { InformationWorkSpace } from "../InformationWorkSpace";
import { TyranoLogger } from "../TyranoLogger";
import { InformationExtension } from "../InformationExtension";
import path from "path";
import { Parser } from "../Parser";

let wss: WebSocket.Server<typeof WebSocket, typeof IncomingMessage> | undefined; //クラス変数だとなぜかエラーが出たのでこちらに定義
let app: Application | undefined;
let scenarioName: string = "";
let nearestLabel: string = "";
let preprocess: string = "";
const infoWs = InformationWorkSpace.getInstance();

const getScenarioName = async (): Promise<string> => {
  const activeFilePath: string =
    vscode.window.activeTextEditor?.document.fileName || "";

  try {
    const projectPath = await infoWs.getProjectPathByFilePath(activeFilePath);
    const scenarioPathBase = path.relative(
      projectPath + "/data/scenario",
      activeFilePath,
    );
    // filePathの区切り文字が\\なら/にする
    const scenarioPath = scenarioPathBase.replace(/\\/g, "/");
    return scenarioPath;
  } catch (error) {
    console.log(error);
    return "";
  }
};
const getNearestLabel = () => {
  const parser: Parser = Parser.getInstance();
  const parsedText = parser.parseText(
    vscode.window.activeTextEditor?.document.getText() || "",
  );
  //vscodeの現在のカーソル位置を取得
  const activeEditor = vscode.window.activeTextEditor;
  const cursorPosition = activeEditor?.selection.active;
  nearestLabel = parser.getNearestLabel(parsedText, cursorPosition);
  return nearestLabel;
};
const getPreprocess = async () => {
  try {
    const relativeFilePath = vscode.workspace
      .getConfiguration()
      .get("TyranoScript syntax.preview.preprocess")!
      .toString();

    const projectPath = await infoWs.getProjectPathByFilePath(
      vscode.window.activeTextEditor?.document.fileName || "",
    );
    const relativeFilePathResolved = path.resolve(
      projectPath + "/data/scenario/",
      relativeFilePath,
    );
    const absoluteFilePath = path.resolve(__dirname, relativeFilePath);

    let preprocess = "";

    // 相対パスでファイルを探す
    try {
      const relativeUri = vscode.Uri.file(relativeFilePathResolved);
      const relativeData = await vscode.workspace.fs.readFile(relativeUri);
      preprocess = relativeData.toString();
      console.log("Found file at relative path:", preprocess);
      return preprocess;
    } catch (relativeError) {
      console.log(
        "Relative path not found, trying absolute path:",
        relativeError,
      );
    }

    // 絶対パスでファイルを探す
    try {
      const absoluteUri = vscode.Uri.file(absoluteFilePath);
      const absoluteData = await vscode.workspace.fs.readFile(absoluteUri);
      preprocess = absoluteData.toString();
      console.log("Found file at absolute path:", preprocess);
      return preprocess;
    } catch (absoluteError) {
      console.log("Absolute path not found:", absoluteError);
    }
  } catch (error) {
    console.log(error);
  }
  return "";
};
preprocess = "";

/**
 * その場プレビュー機能を提供するクラス
 */
export class TyranoPreview {
  private static serverInstance: Server | undefined = undefined;
  private static clientCount: number = 0;

  public static async createWindow() {
    if (!vscode.window.activeTextEditor || !InformationExtension.path) {
      return;
    }
    const createServer = async () => {
      try {
        // サーバーが既に起動している場合は、一度閉じる
        if (TyranoPreview.serverInstance) {
          TyranoPreview.serverInstance.close(() => {
            console.log("Existing server closed");
          });
        }
        if (wss) {
          wss.close(() => {
            console.log("Existing WebSocket server closed");
          });
        }

        //起動処理
        TyranoLogger.print("preview server start");
        app = express();
        wss = new WebSocket.Server({ port: 8100 });
        wss.on("connection", (ws) => {
          ws.on("message", (message) => {
            console.log(`Received message => ${message}`);
          });
          ws.send("connected");
        });
        console.log("preview");

        // シナリオ、ラベル、事前に読み込む処理を取得
        const activeFilePath: string =
          vscode.window.activeTextEditor?.document.fileName || "";
        const projectPath =
          await infoWs.getProjectPathByFilePath(activeFilePath);
        const folderPath = InformationExtension.path + path.sep + "preview";
        scenarioName = await getScenarioName();
        nearestLabel = getNearestLabel();
        preprocess = await getPreprocess();

        //expressのルーティング
        app.use((req, res, next) => {
          if (req.path === "/preview.ks") {
            const filePath = folderPath + path.sep + "preview.ks";
            fs.readFile(filePath, "utf8", (err, data) => {
              if (err) {
                return next(err);
              }

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
          } else if (req.path === "/preview_js.js") {
            const filePath = folderPath + path.sep + "preview_js.js";
            fs.readFile(filePath, "utf8", (err, data) => {
              if (err) {
                return next(err);
              }
              res.type("application/javascript");
              res.send(data);
            });
          }
          //activeFilePathからprojectPathを切り取った値とreq.pathが一致した場合、そのファイルを返す
          else if (req.path === "/data/scenario/" + scenarioName) {
            const filePath = projectPath + "/data/scenario/" + scenarioName;
            fs.readFile(filePath, "utf8", (err, data) => {
              if (err) {
                return next(err);
              }
              //現在のカーソル位置に[l]タグを挿入する
              const activeEditor = vscode.window.activeTextEditor;
              const cursorPosition = activeEditor?.selection.active;
              const line = cursorPosition?.line;
              const character = cursorPosition?.character;
              const scenarioText = data.split("\n");
              scenarioText[line!] =
                scenarioText[line!].substring(0, character!) +
                `\n
                [skipstop]\n
                [l]\n
                [iscript]
                  TYRANO.kag.config.defaultBgmVolume = tf.defaultBgmVolume;
                  TYRANO.kag.config.defaultSeVolume = tf.defaultSeVolume;
                  TYRANO.kag.config.defaultMovieVolume = tf.defaultMovieVolume;
                [endscript]
                ` +
                scenarioText[line!].substring(character!);
              data = scenarioText.join("\n");

              //lineとcharacterを参考に、そこより前に存在する最も近い[er][cm][ct][p]タグのいずれかが存在する箇所を取得する
              const parser: Parser = Parser.getInstance();
              const parsedText = parser.parseText(data);
              //parsedTextに存在するlineが,変数lineより後ろのものを取り除く
              const parsedTextFiltered = parsedText.filter((value: any) => {
                return value.line < line!;
              });
              //後ろからforでまわして、parsedTextFiltered[i].nameが[er][cm][ct][p]のいずれかだったら、そのlineを取得してbreak

              //初期値として、ラベル名が${nearestLabel}の行を取得
              //これによりラベル以降にcmタグなどがなくてもtf.is_preview_skip=false;を入れることができる
              const labelLine = parsedText.find((value: any) => {
                return (
                  value.name === "label" && value.pm.label_name === nearestLabel
                );
              })?.pm.line;

              let clearTagLine = labelLine;

              for (let i = parsedTextFiltered.length - 1; i >= 0; i--) {
                if (
                  parsedTextFiltered[i].name === "er" ||
                  parsedTextFiltered[i].name === "cm" ||
                  parsedTextFiltered[i].name === "ct" ||
                  parsedTextFiltered[i].name === "p"
                ) {
                  clearTagLine = parsedTextFiltered[i].line;
                  break;
                }
              }
              //cmタグがあった前の行に、空っぽにしたtextタグを再度戻すタグを追加する
              const modifiedScenarioLines = data.split("\n");
              modifiedScenarioLines[clearTagLine] =
                modifiedScenarioLines[clearTagLine] +
                `
                \n
                [iscript]
                  tf.is_preview_skip=false;
                [endscript]
                `;
              data = modifiedScenarioLines.join("\n");

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
        // app.use(express.static(folderPath));//不要そうなのでいったんコメントアウト
        app.use(express.static(projectPath));

        // プレビュー用のAPI
        app.get("/preview", (_req, res) => {
          const dynamicHtml = TyranoPreview.getIndex(
            projectPath,
            InformationExtension.path! + `/preview`,
          );
          res.send(dynamicHtml);
        });
        TyranoPreview.serverInstance = app.listen(3100, () => {
          open(`http://localhost:3100/preview`);
        });
        //状態を監視して、クライアントがいなくなったらサーバーを閉じる
        wss.on("connection", (ws) => {
          TyranoPreview.clientCount++;
          ws.on("close", () => {
            TyranoPreview.clientCount--;
            if (TyranoPreview.clientCount === 0) {
              //TODO:リロード処理入れると接続切れてサーバー閉じちゃうみたいなので一時的にコメントアウト
              // TyranoPreview.serverInstance?.close(() => {});
            }
          });
          ws.on("message", (message) => {
            console.log(`Received message => ${message}`);
          });
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

  public static async triggerHotReload() {
    // すべてのクライアントにリロードを通知;
    if (
      wss === undefined ||
      TyranoPreview.serverInstance === undefined ||
      app === undefined
    ) {
      return;
    }

    //開始シナリオ&ラベル、事前に読み込む処理を定義しなおす
    scenarioName = await getScenarioName();
    nearestLabel = getNearestLabel();

    wss?.clients.forEach((client) => {
      client.send("reload");
    });
  }

  private static getIndex(projectPath: string, _extensionPath: string): string {
    try {
      // プロジェクトのindex.htmlファイルのパスを構築
      const indexHtmlPath = path.join(projectPath, "index.html");

      // index.htmlファイルを読み込み
      const htmlContent = fs.readFileSync(indexHtmlPath, "utf8");

      // first_scenario_fileのinputタグのvalueを置き換える
      let modifiedHtml = htmlContent.replace(
        /(<input[^>]*id=["']first_scenario_file["'][^>]*value=["'])[^"']*(['"][^>]*>)/,
        "$1./../../preview.ks$2",
      );
      // コメントアウトされているfirst_scenario_fileを有効化して値を設定
      modifiedHtml = modifiedHtml.replace(
        /<!--\s*(<input[^>]*id=["']first_scenario_file["'][^>]*value=["'])[^"']*(['"][^>]*>)\s*-->/,
        "$1./../../preview.ks$2",
      );
      return modifiedHtml;
    } catch (error) {
      console.error("Failed to read index.html:", error);

      // フォールバック: デフォルトのHTMLを返す
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
        <!-- web socketでリロード -->
        <script>
            const ws = new WebSocket("ws://localhost:8100");
            ws.onopen = () => {
                console.log("WebSocket connection established");
            };
            ws.onmessage = (event) => {
                if (event.data === "reload") {
                    location.reload();
                }
            };
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
        <script src="./tyrano/plugins/kag/kag.studio_v6.js"></script>
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
}
