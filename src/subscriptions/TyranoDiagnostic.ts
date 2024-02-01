import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { InformationWorkSpace as workspace } from '../InformationWorkSpace';
import { TextDecoder } from 'util';
import { ErrorLevel, TyranoLogger } from '../TyranoLogger';
import { Parser } from '../Parser';

export class TyranoDiagnostic {

  public static diagnosticCollection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection('tyranoDiagnostic');

  //ファイルパス取得用
  private readonly infoWs: workspace = workspace.getInstance();
  private parser: Parser = Parser.getInstance();

  //ティラノスクリプトのプロジェクトのルートパス
  private readonly tyranoProjectPaths: string[] = this.infoWs.getTyranoScriptProjectRootPaths();

  //パーサー
  private readonly JUMP_TAG = ["jump", "call", "link", "button", "glink", "clickable"];

  //基本タグを取得

  private _isDiagnosing: boolean = false;
  public get isDiagnosing(): boolean {
    return this._isDiagnosing;
  }
  public set isDiagnosing(value: boolean) {
    this._isDiagnosing = value;
  }


  constructor() {
    this.tyranoProjectPaths.forEach(element => {
      TyranoLogger.print(element + "をプロジェクトとして読み込みました。");
    });
  }


  /**
   * 
   * @param changedTextDocumentPath 変更されたテキストドキュメント、もしくは現在のアクティブテキストエディタのパス
   * @returns 
   */
  public async createDiagnostics(changedTextDocumentPath: string | undefined) {

    //変更されたテキストエディタが無いなら診断しない
    if (changedTextDocumentPath === undefined) {
      return;
    }

    //ログへの変更なら診断しない
    if (changedTextDocumentPath === "extension-output-orukred-tyranosyntax.tyranosyntax-#1-TyranoScript syntax") {
      return;
    }

    const diagnosticProjectPath = await this.infoWs.getProjectPathByFilePath(changedTextDocumentPath);

    TyranoLogger.print(`diagnostic start.`);
    let diagnosticArray: any[] = [];//診断結果を一時的に保存する配列

    TyranoLogger.print(`[${diagnosticProjectPath}] parsing start.`);

    let tyranoTag: string[] = Object.keys(this.infoWs.suggestions.get(diagnosticProjectPath)!);
    tyranoTag = tyranoTag.concat(Array.from(this.infoWs.defineMacroMap.get(diagnosticProjectPath)!.keys()));
    //commetはパーサーに独自で追加したもの、labelとtextはティラノスクリプト側で既に定義されているもの。
    tyranoTag.push("comment");
    tyranoTag.push("label");
    tyranoTag.push("text");


    //未定義のマクロを使用しているか検出
    await this.detectionNotDefineMacro(tyranoTag, this.infoWs.scenarioFileMap, diagnosticArray, diagnosticProjectPath);
    TyranoLogger.print(`[${diagnosticProjectPath}] macro detection finished.`);
    //存在しないシナリオファイル、未定義のラベルを検出
    await this.detectionNotExistScenarioAndLabels(this.infoWs.scenarioFileMap, diagnosticArray, diagnosticProjectPath);
    TyranoLogger.print(`[${diagnosticProjectPath}] scenario and label detection finished.`);


    //診断結果をセット
    TyranoLogger.print(`diagnostic set`);
    TyranoDiagnostic.diagnosticCollection.set(diagnosticArray);
    TyranoLogger.print("diagnostic end");

  }

  /**
   * 未定義のマクロを使用しているか検出します。
   * @param tyranoTag 現在プロジェクトに定義しているティラノスクリプトのタグ
   */
  private async detectionNotDefineMacro(tyranoTag: string[], absoluteScenarioFilePathMap: Map<string, vscode.TextDocument>, diagnosticArray: any[], projectPath: string) {
    for (const [filePath, scenarioDocument] of absoluteScenarioFilePathMap) {
      const projectPathOfDiagFile = await this.infoWs.getProjectPathByFilePath(scenarioDocument.fileName);
      //診断中のプロジェクトフォルダと、診断対象のファイルのプロジェクトが一致しないならcontinue
      if (projectPath !== projectPathOfDiagFile) {
        continue;
      }

      const parsedData = this.parser.parseText(scenarioDocument.getText()); //構文解析
      let diagnostics: vscode.Diagnostic[] = [];
      for (let data of parsedData) {
        //early return
        if (data["name"] === "comment") {
          continue;
        }
        //タグが定義されていない場合
        if (!tyranoTag.includes(data["name"])) {

          let tagFirstIndex = scenarioDocument.lineAt(data["line"]).text.indexOf(data["name"]);	// 該当行からタグの定義場所(開始位置)探す
          let tagLastIndex = scenarioDocument.lineAt(data["line"]).text.lastIndexOf(data["name"]);	// 該当行からタグの定義場所(終了位置)探す

          let range = new vscode.Range(data["line"], tagFirstIndex, data["line"], tagLastIndex);
          let diag = new vscode.Diagnostic(range, "タグ" + data["name"] + "は未定義です。", vscode.DiagnosticSeverity.Error);
          diagnostics.push(diag);

        }
      }
      diagnosticArray.push([scenarioDocument.uri, diagnostics]);
    }
  }

  /**
   * jump系タグで指定したstorageやtargetに付いての診断を行います。
   * @param scenarioFiles 診断するシナリオファイルの絶対パスのリスト
   * @param diagnosticArray 参照渡しで更新する診断結果
   * @param projectPath 診断するプロジェクトの絶対パス
   */
  private async detectionNotExistScenarioAndLabels(absoluteScenarioFilePathMap: Map<string, vscode.TextDocument>, diagnosticArray: any[], projectPath: string) {
    for (const [filePath, scenarioDocument] of absoluteScenarioFilePathMap) {
      const projectPathOfDiagFile = await this.infoWs.getProjectPathByFilePath(scenarioDocument.fileName);
      //診断中のプロジェクトフォルダと、診断対象のファイルのプロジェクトが一致しないならcontinue
      if (projectPath !== projectPathOfDiagFile) {
        continue;
      }

      const parsedData = this.parser.parseText(scenarioDocument.getText()); //構文解析
      let diagnostics: vscode.Diagnostic[] = [];
      for (let data of parsedData) {
        if (data["name"] === "comment") {
          continue;
        }

        //storageに付いての処理(指定したファイルが有るかどうか)
        if (this.JUMP_TAG.includes(data["name"])) {

          if (data["pm"]["storage"] !== undefined) {
            let tagFirstIndex: number = scenarioDocument.lineAt(data["line"]).text.indexOf(data["pm"]["storage"]);	// 該当行からタグの定義場所(開始位置)探す
            let tagLastIndex: number = scenarioDocument.lineAt(data["line"]).text.indexOf(data["pm"]["storage"]) + data["pm"]["storage"].length;	// 該当行からタグの定義場所(終了位置)探す
            let range = new vscode.Range(data["line"], tagFirstIndex, data["line"], tagLastIndex);

            //頭文字が%ならエラーとしては扱わない
            if (this.isExistPercentAtBeginning(data["pm"]["storage"])) {
              continue;
            }

            if (this.isValueIsIncludeVariable(data["pm"]["storage"])) {
              if (!this.isExistAmpersandAtBeginning(data["pm"]["storage"])) {
                let diag = new vscode.Diagnostic(range, "パラメータに変数を使う場合は先頭に'&'が必要です。", vscode.DiagnosticSeverity.Error);
                diagnostics.push(diag);
                continue;
              }
            } else {
              if (!data["pm"]["storage"].endsWith(".ks")) {
                let diag = new vscode.Diagnostic(range, "storageパラメータは末尾が'.ks'である必要があります。", vscode.DiagnosticSeverity.Error);
                diagnostics.push(diag);
                continue;
              }

              if (!fs.existsSync(projectPath + this.infoWs.DATA_DIRECTORY + this.infoWs.DATA_SCENARIO + this.infoWs.pathDelimiter + data["pm"]["storage"])) {
                let diag = new vscode.Diagnostic(range, data["pm"]["storage"] + "は存在しないファイルです。", vscode.DiagnosticSeverity.Error);
                diagnostics.push(diag);
                continue;
              }
            }
          }

          // targetについての処理
          if (data["pm"]["target"] !== undefined) {
            let tagFirstIndex: number = scenarioDocument.lineAt(data["line"]).text.indexOf(data["pm"]["target"]);	// 該当行からタグの定義場所(開始位置)探す
            let tagLastIndex: number = scenarioDocument.lineAt(data["line"]).text.indexOf(data["pm"]["target"]) + data["pm"]["target"].length;	// 該当行からタグの定義場所(終了位置)探す
            let range = new vscode.Range(data["line"], tagFirstIndex, data["line"], tagLastIndex);

            //頭文字が%ならエラーとしては扱わない
            if (this.isExistPercentAtBeginning(data["pm"]["target"])) {
              continue;
            }

            if (this.isValueIsIncludeVariable(data["pm"]["target"])) {
              if (!this.isExistAmpersandAtBeginning(data["pm"]["target"])) {
                let diag = new vscode.Diagnostic(range, "パラメータに変数を使う場合は先頭に'&'が必要です。", vscode.DiagnosticSeverity.Error);
                diagnostics.push(diag);
                continue;
              }
            } else if (!this.isValueIsIncludeVariable(data["pm"]["storage"])) {//targetがundefinedじゃない &&storageがundefinedじゃない && storageが変数でもない
              //targetから*を外して表記ゆれ防ぐ
              data["pm"]["target"] = data["pm"]["target"].replace("*", "");

              //ファイル探索して、該当のラベルがあればisLabelExsitをtrueにして操作打ち切る
              //storageが指定されてない(undefined)ならscenarioに入ってるパス（自分自身のシナリオファイル）を入れる
              //storageが指定されてるなら指定先を取得
              let storageScenarioDocument: vscode.TextDocument | undefined =
                (data["pm"]["storage"] === undefined) ?
                  scenarioDocument :
                  this.infoWs.scenarioFileMap.get(this.infoWs.convertToAbsolutePathFromRelativePath(projectPath + this.infoWs.DATA_DIRECTORY + this.infoWs.DATA_SCENARIO + this.infoWs.pathDelimiter + data["pm"]["storage"]))

              if (storageScenarioDocument === undefined) {
                let diag = new vscode.Diagnostic(range, data["pm"]["target"] + "ファイル解析中に下線の箇所でエラーが発生しました。開発者への報告をお願いします。", vscode.DiagnosticSeverity.Error);
                diagnostics.push(diag);
                continue;
              }
              const storageParsedData = this.parser.parseText(storageScenarioDocument.getText()); //構文解析
              let isLabelExsit: boolean = false;//targetで指定したラベルが存在しているかどうか
              for (let storageData in storageParsedData) {
                if ((storageParsedData[storageData]["pm"]["label_name"] === data["pm"]["target"])) {
                  isLabelExsit = true;
                  break;
                }
              }

              if (!isLabelExsit) {
                let diag = new vscode.Diagnostic(range, data["pm"]["target"] + "は存在しないラベルです。", vscode.DiagnosticSeverity.Error);
                diagnostics.push(diag);
                continue;
              }
            }
          }
        }
      }
      diagnosticArray.push([scenarioDocument.uri, diagnostics]);
    }
  }

  /**
   * 引数に入れた値の先頭に&記号があるかを判断します。
   * @returns trueなら&がある、 falseなら&がない
   */
  private isExistAmpersandAtBeginning(value: string): boolean {
    return value.indexOf("&") === 0 ? true : false;
  }

  /**
 * 引数に入れた値の先頭に%記号があるかを判断します。
 * @returns trueなら&がある、 falseなら&がない
 */
  private isExistPercentAtBeginning(value: string): boolean {
    return value.indexOf("%") === 0 ? true : false;
  }


  /**
   * 引数に入れた値が変数を含むかどうかを判断します。
   * @returns trueなら値は変数 falseなら値は変数でない
   */
  private isValueIsIncludeVariable(value: string): boolean {
    if (value === undefined) {
      return false;
    }
    //いずれの変数ともマッチしないならvalueに変数は含まれていない
    if (value.match(/f\.[a-zA-Z_]\w*/) === null &&
      value.match(/sf\.[a-zA-Z_]\w*/) === null &&
      value.match(/tf\.[a-zA-Z_]\w*/) === null &&
      value.match(/mp\.[a-zA-Z_]\w*/) === null) {
      return false;
    }
    return true;

  }

  /**
   * 読み込んだスクリプトの現在位置がラベルで定義済みかを判断します。
   * @param scenarioFileLabel  ジャンプ系タグで指定されたtargetの値
   * @param loadingScriptLabel 現在読み込んでいるシナリオの現在のラベル
   * @returns 
   */
  private async checkLoadingScriptIsDefinedLabel(scenarioFileLabel: string, loadingScriptLabel: string): Promise<boolean> {
    //ターゲットが未指定、もしくはターゲットとラベルが一致する
    if (scenarioFileLabel === undefined || scenarioFileLabel === "" || loadingScriptLabel === scenarioFileLabel) {
      return true;
    }
    return false;
  }

}