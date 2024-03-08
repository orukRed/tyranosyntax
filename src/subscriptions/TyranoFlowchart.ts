import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
const express = require('express');

import { InformationWorkSpace } from '../InformationWorkSpace';
import { InformationExtension } from '../InformationExtension';
import { previewPanel } from '../extension';
import { TyranoLogger } from '../TyranoLogger';
import { TransitionData } from '../defineData/TransitionData';

export class TyranoFlowchart {

  public static async createWindow() {
    if (!vscode.window.activeTextEditor) {
      return;
    }

    const activeEditor = vscode.window.activeTextEditor;
    const filePath = activeEditor?.document.fileName;
    const create = (() => {
      const flowchartPanel = vscode.window.createWebviewPanel(
        'tyranoFlowchart',
        'TyranoFlowchart',
        vscode.ViewColumn.Two, {
        enableScripts: true,//コンテンツスクリプトを有効化
        retainContextWhenHidden: true,//非表示時にコンテンツスクリプトを維持
        enableCommandUris: true,
      });
      const infoWs = InformationWorkSpace.getInstance();
      console.log(infoWs.transitionMap.get(filePath));
      flowchartPanel.webview.postMessage(infoWs.transitionMap.get(filePath));
      flowchartPanel.webview.html = `
Flowchartだよ
<div id="output"></div>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.8.0/dist/mermaid.min.js"></script>
<style>
  body{
    background-color: white;
  }
</style>
<script>
window.addEventListener('message', event => {
  const obj = event.data; // The JSON data our extension sent
  let output = '';
  for (let key in obj) {
      output += key + ': ' + obj[key]["storage"] + '<br>';
  }
  document.getElementById('output').innerHTML = output;
});
</script>

<body>
  <div id="flowchart"></div>
  =======================================<br>
  状態遷移図版
  <pre class="mermaid">
    stateDiagram-v2
    # 最初にここで全ラベルの定義が必要そう
    # #でコメントアウト
    state "start" as first.ks/start
    state if_first.ks/l1c1 <<choice>> #ここのif文にも、ifやcondごとにそれぞれ作る必要がありそう. l1c1は行と列
    state "start" as scene1.ks/start
    state "end" as scene1.ks/end
    state "start" as scene2.ks/start
    state "end" as scene2.ks/end


    [*] --> first.ks
    state first.ks{ 
      [*]--> first.ks/start
      first.ks/start --> if_first.ks/l1c1
    }
    state scene1.ks{ 
      if_first.ks/l1c1 --> scene1.ks/start: f.hoge=1 
      scene1.ks/start --> scene1.ks/end
    }
    state scene2.ks{ 
      if_first.ks/l1c1 --> scene2.ks/start: f.hoge=2
      scene2.ks/start --> scene2.ks/end      
    }


  </pre>
=======================================<br>
  フローチャート（プロジェクト単位）版
  <pre class="mermaid">
    flowchart TB
      subgraph "first.ks"
        first.ks/start[start] --text--> if_first.ks/l1c1{if}
      end
      subgraph "scene1.ks"
        if_first.ks/l1c1{if} --f.hoge=1--> scene1.ks/start[start]
        scene1.ks/start[start] --> scene1.ks/end[end] 
      end
      subgraph "scene2.ks"
        if_first.ks/l1c1{if} --f.hoge=2--> scene2.ks/start[start]
        scene2.ks/start[start] --> scene2.ks/end[end] 
      end
    </pre>
=======================================<br>
  フローチャート（ファイル単位）版
    <pre class="mermaid">
      flowchart TB
        subgraph "first.ks"
          first.ks/start[start] --text--> if_first.ks/l1c1{if}
          if_first.ks/l1c1{if} --f.hoge=1--> scene1.ks/start[[scene1.ks/start]]
          if_first.ks/l1c1{if} --f.hoge=2--> scene2.ks/start[[scene2.ks/start]]
        end
      </pre>

</body>



`
    });

    const run = async () => {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "フローチャートの作成中...",
        cancellable: true
      }, async (progress, token) => {
        create();
      });
    }
    await run();
  }
}