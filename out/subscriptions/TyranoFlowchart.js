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
const open = require('open');
const InformationWorkSpace_1 = require("../InformationWorkSpace");
const InformationExtension_1 = require("../InformationExtension");
const TyranoLogger_1 = require("../TyranoLogger");
class TyranoFlowchart {
    static serverInstance = undefined;
    static async openFlowchart() {
        const createServer = async () => {
            try {
                TyranoLogger_1.TyranoLogger.print("port 3200 server start");
                const app = express();
                console.log("flowchart");
                const filePath = InformationExtension_1.InformationExtension.path + path.sep + "flowchart";
                app.use(express.static((filePath)));
                //ルートの設定
                //特定のルートに対するGETリクエストを処理するためのメソッド
                app.get('/get-transition-data', (req, res) => {
                    TyranoLogger_1.TyranoLogger.print("get-transition-data start");
                    const infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
                    //scenario=FILE_PATHの形で指定したファイルのデータを取得
                    const scenarioFilePath = req.query["scenario"]; // GETパラメータからキーを取得
                    if (!scenarioFilePath) {
                        return;
                    }
                    const normalizedFilePath = scenarioFilePath.replace(/\\\\/g, '\\');
                    const TransitionData = infoWs.transitionMap.get(normalizedFilePath);
                    infoWs.getProjectPathByFilePath(normalizedFilePath).then(projectPath => {
                        // Promise が解決された後、このブロック内で projectPath を使用
                        const projectName = projectPath.split("\\").pop(); // プロジェクトパスからプロジェクト名を取得
                        if (TransitionData) {
                            console.log(TransitionData);
                            res.json({ TransitionData: TransitionData, projectName: projectName }); // 値が見つかった場合、JSONとして返す
                        }
                        else {
                            console.log('Key not found');
                            res.status(404).send('Key not found'); // 値が見つからない場合、404エラーを返す
                        }
                    }).catch(error => {
                        // エラー処理
                        console.error("プロジェクトパスの取得に失敗しました:", error);
                        TyranoLogger_1.TyranoLogger.printStackTrace(error);
                    });
                    TyranoLogger_1.TyranoLogger.print("get-transition-data end");
                });
                app.get('/get-scenario-list', (req, res) => {
                    //シナリオファイルのリストと、プロジェクトパスのリストから、{PROJECT_NAME: [SCENARIO_FILE_PATH, ...]}の形式のオブジェクトを作成する
                    const organizeData = (scenarioList, rootPathList) => {
                        const data = {};
                        // rootPathList をループして、プロジェクト名をキーとした空の配列を data に追加
                        rootPathList.forEach((rootPath) => {
                            const projectName = rootPath.split("\\").pop(); // パスからプロジェクト名を取得
                            if (projectName) {
                                data[projectName] = [];
                            }
                        });
                        // scenarioList をループして、各シナリオファイルがどのプロジェクトに属するかを判断し、data に追加
                        scenarioList.forEach((scenarioPath) => {
                            rootPathList.forEach((rootPath) => {
                                const projectName = rootPath.split("\\").pop();
                                if (scenarioPath.includes(rootPath) && projectName) {
                                    const relativePath = scenarioPath.replace(rootPath + path.sep, '');
                                    data[projectName].push({ fullPath: scenarioPath, scenarioName: relativePath });
                                }
                            });
                        });
                        return data;
                    };
                    const infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
                    const scenarioList = Array.from(infoWs.transitionMap.keys());
                    const rootPathList = infoWs.getTyranoScriptProjectRootPaths();
                    const organizedData = organizeData(scenarioList, rootPathList);
                    res.json({ scenarioList: organizedData });
                });
                TyranoFlowchart.serverInstance = app.listen(3200, () => {
                    open(`http://localhost:3200/flowchart-list.html`);
                });
                TyranoLogger_1.TyranoLogger.print("port 3200 server initialized");
            }
            catch (error) {
                TyranoLogger_1.TyranoLogger.printStackTrace(error);
            }
        };
        if (TyranoFlowchart.serverInstance) {
            TyranoFlowchart.serverInstance.close(() => {
                console.log('port 3200 server closed');
            });
        }
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "フローチャート作成中...",
            cancellable: true
        }, async (progress, token) => {
            createServer();
        });
    }
}
exports.TyranoFlowchart = TyranoFlowchart;
//# sourceMappingURL=TyranoFlowchart.js.map