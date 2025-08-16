/* eslint-disable no-control-regex */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as vscode from "vscode";
import * as fs from "fs";
import { InformationWorkSpace as workspace } from "../InformationWorkSpace";
import { TyranoLogger } from "../TyranoLogger";
import { Parser } from "../Parser";

export class TyranoDiagnostic {
  public static diagnosticCollection: vscode.DiagnosticCollection =
    vscode.languages.createDiagnosticCollection("tyranoDiagnostic");

  //ファイルパス取得用
  private readonly infoWs: workspace = workspace.getInstance();
  private parser: Parser = Parser.getInstance();

  //ティラノスクリプトのプロジェクトのルートパス
  private readonly tyranoProjectPaths: string[] =
    this.infoWs.getTyranoScriptProjectRootPaths();

  //診断を実行するかどうかの設定
  private readonly executeDiagnostic: object = vscode.workspace
    .getConfiguration()
    .get("TyranoScript syntax.execute.diagnostic")!;
  private readonly undefinedMacro = "undefinedMacro";
  private readonly missingScenariosAndLabels = "missingScenariosAndLabels";
  private readonly jumpAndCallInIfStatement = "jumpAndCallInIfStatement";
  private readonly existResource = "existResource";
  private readonly labelName = "labelName";
  private readonly macroDuplicate = "macroDuplicate";
  private readonly undefinedParameter = "undefinedParameter";

  //パーサー
  private readonly JUMP_TAG = [
    "jump",
    "call",
    "link",
    "button",
    "glink",
    "clickable",
  ];

  private tagParams: {
    [s: string]: { [s: string]: { type: string[]; path: string } };
  } = vscode.workspace
    .getConfiguration()
    .get("TyranoScript syntax.tag.parameter")!;

  //基本タグを取得

  private _isDiagnosing: boolean = false;
  public get isDiagnosing(): boolean {
    return this._isDiagnosing;
  }
  public set isDiagnosing(value: boolean) {
    this._isDiagnosing = value;
  }

  constructor() {
    this.tyranoProjectPaths.forEach((element) => {
      TyranoLogger.print(element + "の診断準備ができました。");
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
    //設定で診断しないようにしているならリターン
    if (
      !vscode.workspace
        .getConfiguration()
        .get("TyranoScript syntax.autoDiagnostic.isEnabled")
    ) {
      return;
    }
    //ログへの変更なら診断しない
    if (
      changedTextDocumentPath ===
      "extension-output-orukred-tyranosyntax.tyranosyntax-#1-TyranoScript syntax"
    ) {
      return;
    }

    const diagnosticProjectPath = await this.infoWs.getProjectPathByFilePath(
      changedTextDocumentPath,
    );

    TyranoLogger.print(`diagnostic start.`);
    const diagnosticArray: [
      vscode.Uri,
      readonly vscode.Diagnostic[] | undefined,
    ][] = [];

    TyranoLogger.print(`[${diagnosticProjectPath}] parsing start.`);

    let tyranoTag: string[] = Object.keys(
      this.infoWs.suggestions.get(diagnosticProjectPath)!,
    );
    tyranoTag = tyranoTag.concat(
      Array.from(this.infoWs.defineMacroMap.get(diagnosticProjectPath)!.keys()),
    );
    //commentはパーサーに独自で追加したもの、labelとtextはティラノスクリプト側で既に定義されているもの。
    tyranoTag.push("comment");
    tyranoTag.push("label");
    tyranoTag.push("text");

    //FIXME:各関数でfor回すんじゃなくて、for回してから各関数を呼び出す処理にしたい
    //未定義のマクロを使用しているか検出
    if (this.isExecuteDiagnostic(this.undefinedMacro)) {
      await this.detectionUndefineMacro(
        tyranoTag,
        this.infoWs.scenarioFileMap,
        diagnosticArray,
        diagnosticProjectPath,
      );
      TyranoLogger.print(
        `[${diagnosticProjectPath}] macro detection finished.`,
      );
    }
    //存在しないシナリオファイル、未定義のラベルを検出
    if (this.isExecuteDiagnostic(this.missingScenariosAndLabels)) {
      await this.detectionMissingScenariosAndLabels(
        this.infoWs.scenarioFileMap,
        diagnosticArray,
        diagnosticProjectPath,
      );
      TyranoLogger.print(
        `[${diagnosticProjectPath}] scenario and label detection finished.`,
      );
    }

    //if文の中でjump,callタグを使用しているか検出
    if (this.isExecuteDiagnostic(this.jumpAndCallInIfStatement)) {
      await this.detectJumpAndCallInIfStatement(
        this.infoWs.scenarioFileMap,
        diagnosticArray,
        diagnosticProjectPath,
      );
      TyranoLogger.print(
        `[${diagnosticProjectPath}] Detect if the 'jump' or 'call' tags are being used within an 'if' statement.`,
      );
    }

    //-----------------------------------------
    //■その他の診断機能
    //診断項目ごとにfor文作ってると処理速度が壊滅的な遅さになるのでここに書く
    //-----------------------------------------

    //プロジェクトのシナリオファイルを一つずつ診断
    for (const [_filePath, scenarioDocument] of this.infoWs.scenarioFileMap) {
      //診断中のプロジェクトフォルダと、診断対象のファイルのプロジェクトが一致しないならcontinue
      const projectPathOfDiagFile = await this.infoWs.getProjectPathByFilePath(
        scenarioDocument.fileName,
      );
      if (diagnosticProjectPath !== projectPathOfDiagFile) {
        continue;
      }
      //skipしてOKならcontinueする
      if (
        this.infoWs.isSkipParse(
          scenarioDocument.fileName,
          projectPathOfDiagFile,
        )
      ) {
        continue;
      }

      const parsedData = this.parser.parseText(scenarioDocument.getText()); //構文解析
      const diagnostics: vscode.Diagnostic[] = [];

      //-----------------------------------------
      //■ファイルに対しての診断はここ
      //-----------------------------------------

      //マクロの重複チェック
      await this.checkMacroDuplicate(
        diagnostics,
        projectPathOfDiagFile,
        scenarioDocument,
      );

      for (const data of parsedData) {
        //early return
        if (data["name"] === "comment") {
          continue;
        }

        //TODO:今後もし行に対しての診断項目が増えた場合はここに追加
        // ファイルリソースの存在チェックを別メソッドで実行
        await this.detectionMissingResources(
          data,
          scenarioDocument,
          projectPathOfDiagFile,
          diagnostics,
        );
        //ラベル名のチェック
        await this.checkLabelName(
          data,
          scenarioDocument,
          projectPathOfDiagFile,
          diagnostics,
        );
        //存在しないパラメータのチェック
        await this.detectionUndefinedParameter(
          data,
          scenarioDocument,
          projectPathOfDiagFile,
          diagnostics,
        );
      }
      diagnosticArray.push([scenarioDocument.uri, diagnostics]);
    }
    //診断結果をセット

    TyranoLogger.print(`diagnostic set`);
    TyranoDiagnostic.diagnosticCollection.set(diagnosticArray);
    TyranoLogger.print("diagnostic end");
  }

  /**
   * storageで指定したリソースが存在しているかどうかを診断します
   * @param data パース済みのタグデータ
   * @param scenarioDocument 診断対象のドキュメント
   * @param projectPathOfDiagFile 診断対象ファイルのプロジェクトパス
   * @param diagnostics 診断結果を格納する配列
   */
  private async detectionMissingResources(
    data: any,
    scenarioDocument: vscode.TextDocument,
    projectPathOfDiagFile: string,
    diagnostics: vscode.Diagnostic[],
  ): Promise<void> {
    if (!this.isExecuteDiagnostic(this.existResource)) {
      return;
    }

    const storage = data["pm"]["storage"];
    const tagName = data["name"];

    //tagNameが定義されていない、もしくはstorageが空、
    //もしくはstorageパラメータの先頭が&,もしくは%なら、storageがnoneならエラーとしては扱わない
    if (
      !this.tagParams[tagName] ||
      !storage ||
      this.isExistPercentAtBeginning(storage) ||
      this.isExistAmpersandAtBeginning(storage) ||
      storage === "none"
    ) {
      return;
    }

    // リソースタイプ（フォルダ）の判定
    let resourceFolder = "";
    if (
      this.tagParams[tagName].storage &&
      this.tagParams[tagName].storage.path === "data/image"
    ) {
      resourceFolder = this.infoWs.DATA_IMAGE;
    } else if (
      this.tagParams[tagName].storage &&
      this.tagParams[tagName].storage.path === "data/fgimage"
    ) {
      resourceFolder = this.infoWs.DATA_FGIMAGE;
    } else if (
      this.tagParams[tagName].storage &&
      this.tagParams[tagName].storage.path === "data/bgimage"
    ) {
      resourceFolder = this.infoWs.DATA_BGIMAGE;
    } else if (
      this.tagParams[tagName].storage &&
      this.tagParams[tagName].storage.path === "data/bgm"
    ) {
      resourceFolder = this.infoWs.DATA_BGM;
    } else if (
      this.tagParams[tagName].storage &&
      this.tagParams[tagName].storage.path === "data/sound"
    ) {
      resourceFolder = this.infoWs.DATA_SOUND;
    }
    //タグ名がimageで、folderに値が指定されているならresourceFolderがdata/${folder}になる
    if (tagName === "image" && data["pm"]["folder"]) {
      resourceFolder = `${this.infoWs.pathDelimiter}${data["pm"]["folder"]}`;
    }

    // リソースフォルダが特定できた場合のみチェック
    if (resourceFolder) {
      // リソースパスの構築
      const resourcePath = [
        projectPathOfDiagFile,
        this.infoWs.DATA_DIRECTORY,
        resourceFolder + this.infoWs.pathDelimiter,
        storage,
      ].join("");

      // ファイルの存在をチェック
      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(resourcePath));
        // ファイルが存在する場合は何もしない
      } catch (error) {
        // ファイルが存在しない場合
        const range = this.getStorageParameterRange(data, scenarioDocument);
        const diag = new vscode.Diagnostic(
          range,
          `リソースファイル "${storage}" が見つかりません。`,
          vscode.DiagnosticSeverity.Error,
        );
        console.log(resourcePath);
        diagnostics.push(diag);
      }
    }
  }

  /**
   * storageパラメータの範囲を取得します
   */
  private getStorageParameterRange(
    data: any,
    document: vscode.TextDocument,
  ): vscode.Range {
    const line = document.lineAt(data["line"]);
    const lineText = line.text;
    const storageValue = data["pm"]["storage"];

    // storage="値" の位置を探す
    const storageParamStart = lineText.indexOf(`storage="${storageValue}"`);
    if (storageParamStart >= 0) {
      return new vscode.Range(
        data["line"],
        storageParamStart + 9, // "storage="の後
        data["line"],
        storageParamStart + 9 + storageValue.length,
      );
    }

    // 見つからない場合はタグ全体を範囲とする
    return new vscode.Range(
      data["line"],
      line.firstNonWhitespaceCharacterIndex,
      data["line"],
      line.text.length,
    );
  }

  /**
   * 未定義のマクロを使用しているか検出します。
   * @param tyranoTag 現在プロジェクトに定義しているティラノスクリプトのタグ
   */
  private async detectionUndefineMacro(
    tyranoTag: string[],
    absoluteScenarioFilePathMap: Map<string, vscode.TextDocument>,
    diagnosticArray: [vscode.Uri, readonly vscode.Diagnostic[] | undefined][],
    projectPath: string,
  ) {
    for (const [_filePath, scenarioDocument] of absoluteScenarioFilePathMap) {
      const projectPathOfDiagFile = await this.infoWs.getProjectPathByFilePath(
        scenarioDocument.fileName,
      );
      //診断中のプロジェクトフォルダと、診断対象のファイルのプロジェクトが一致しないならcontinue
      if (projectPath !== projectPathOfDiagFile) {
        continue;
      }
      //skipしてOKならcontinueする
      if (this.infoWs.isSkipParse(scenarioDocument.fileName, projectPath)) {
        continue;
      }

      const parsedData = this.parser.parseText(scenarioDocument.getText()); //構文解析
      const diagnostics: vscode.Diagnostic[] = [];
      for (const data of parsedData) {
        //early return
        if (data["name"] === "comment") {
          continue;
        }
        //タグが定義されていない場合
        if (!tyranoTag.includes(data["name"])) {
          const tagFirstIndex = scenarioDocument
            .lineAt(data["line"])
            .text.indexOf(data["name"]); // 該当行からタグの定義場所(開始位置)探す
          const tagLastIndex =
            tagFirstIndex + data["name"].length; // タグ名の長さのみを使用して終了位置を決定

          const range = new vscode.Range(
            data["line"],
            tagFirstIndex,
            data["line"],
            tagLastIndex,
          );
          const diag = new vscode.Diagnostic(
            range,
            "タグ" + data["name"] + "は未定義です。",
            vscode.DiagnosticSeverity.Error,
          );
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
  private async detectionMissingScenariosAndLabels(
    absoluteScenarioFilePathMap: Map<string, vscode.TextDocument>,
    diagnosticArray: [vscode.Uri, readonly vscode.Diagnostic[] | undefined][],
    projectPath: string,
  ) {
    for (const [_filePath, scenarioDocument] of absoluteScenarioFilePathMap) {
      const projectPathOfDiagFile = await this.infoWs.getProjectPathByFilePath(
        scenarioDocument.fileName,
      );
      //診断中のプロジェクトフォルダと、診断対象のファイルのプロジェクトが一致しないならcontinue
      if (projectPath !== projectPathOfDiagFile) {
        continue;
      }
      //skipしてOKならcontinueする
      if (this.infoWs.isSkipParse(scenarioDocument.fileName, projectPath)) {
        continue;
      }

      const parsedData = this.parser.parseText(scenarioDocument.getText()); //構文解析
      const diagnostics: vscode.Diagnostic[] = [];
      for (const data of parsedData) {
        if (data["name"] === "comment") {
          continue;
        }

        //storageに付いての処理(指定したファイルが有るかどうか)
        if (this.JUMP_TAG.includes(data["name"])) {
          if (data["pm"]["storage"] !== undefined) {
            const tagFirstIndex: number = scenarioDocument
              .lineAt(data["line"])
              .text.indexOf(data["pm"]["storage"]); // 該当行からタグの定義場所(開始位置)探す
            const tagLastIndex =
              tagFirstIndex + this.sumStringLengthsInObject(data["pm"]); // 該当行からタグの定義場所(終了位置)探す
            const range = new vscode.Range(
              data["line"],
              tagFirstIndex,
              data["line"],
              tagLastIndex,
            );

            //頭文字が%ならエラーとしては扱わない
            if (this.isExistPercentAtBeginning(data["pm"]["storage"])) {
              continue;
            }

            if (this.isValueIsIncludeVariable(data["pm"]["storage"])) {
              if (!this.isExistAmpersandAtBeginning(data["pm"]["storage"])) {
                const diag = new vscode.Diagnostic(
                  range,
                  "パラメータに変数を使う場合は先頭に'&'が必要です。",
                  vscode.DiagnosticSeverity.Error,
                );
                diagnostics.push(diag);
                continue;
              }
            } else {
              if (!data["pm"]["storage"].endsWith(".ks")) {
                const diag = new vscode.Diagnostic(
                  range,
                  "storageパラメータは末尾が'.ks'である必要があります。",
                  vscode.DiagnosticSeverity.Error,
                );
                diagnostics.push(diag);
                continue;
              }

              if (
                !fs.existsSync(
                  projectPath +
                    this.infoWs.DATA_DIRECTORY +
                    this.infoWs.DATA_SCENARIO +
                    this.infoWs.pathDelimiter +
                    data["pm"]["storage"],
                )
              ) {
                const diag = new vscode.Diagnostic(
                  range,
                  data["pm"]["storage"] + "は存在しないファイルです。",
                  vscode.DiagnosticSeverity.Error,
                );
                diagnostics.push(diag);
                continue;
              }
            }
          }

          // targetについての処理
          if (data["pm"]["target"] !== undefined) {
            const tagFirstIndex: number = scenarioDocument
              .lineAt(data["line"])
              .text.indexOf(data["pm"]["target"]); // 該当行からタグの定義場所(開始位置)探す
            const tagLastIndex =
              tagFirstIndex + this.sumStringLengthsInObject(data["pm"]); // 該当行からタグの定義場所(終了位置)探す
            const range = new vscode.Range(
              data["line"],
              tagFirstIndex,
              data["line"],
              tagLastIndex,
            );

            //頭文字が%ならエラーとしては扱わない
            if (this.isExistPercentAtBeginning(data["pm"]["target"])) {
              continue;
            }

            if (this.isValueIsIncludeVariable(data["pm"]["target"])) {
              if (!this.isExistAmpersandAtBeginning(data["pm"]["target"])) {
                const diag = new vscode.Diagnostic(
                  range,
                  "パラメータに変数を使う場合は先頭に'&'が必要です。",
                  vscode.DiagnosticSeverity.Error,
                );
                diagnostics.push(diag);
                continue;
              }
            } else if (!this.isValueIsIncludeVariable(data["pm"]["storage"])) {
              //targetがundefinedじゃない &&storageがundefinedじゃない && storageが変数でもない

              //targetから*を外して表記ゆれ防ぐ
              data["pm"]["target"] = data["pm"]["target"].replace("*", "");

              //ファイル探索して、該当のラベルがあればisLabelExsitをtrueにして操作打ち切る
              //storageが指定されてない(undefined)ならscenarioに入ってるパス（自分自身のシナリオファイル）を入れる
              //storageが指定されてるなら指定先を取得
              const storageScenarioDocument: vscode.TextDocument | undefined =
                data["pm"]["storage"] === undefined
                  ? scenarioDocument
                  : this.infoWs.scenarioFileMap.get(
                      this.infoWs.convertToAbsolutePathFromRelativePath(
                        projectPath +
                          this.infoWs.DATA_DIRECTORY +
                          this.infoWs.DATA_SCENARIO +
                          this.infoWs.pathDelimiter +
                          data["pm"]["storage"],
                      ),
                    );

              if (storageScenarioDocument === undefined) {
                const diag = new vscode.Diagnostic(
                  range,
                  data["pm"]["target"] +
                    "ファイル解析中に下線の箇所でエラーが発生しました。開発者への報告をお願いします。",
                  vscode.DiagnosticSeverity.Error,
                );
                diagnostics.push(diag);
                continue;
              }
              const storageParsedData = this.parser.parseText(
                storageScenarioDocument.getText(),
              ); //構文解析
              let isLabelExsit: boolean = false; //targetで指定したラベルが存在しているかどうか
              for (const storageData in storageParsedData) {
                if (
                  storageParsedData[storageData]["pm"]["label_name"] ===
                  data["pm"]["target"]
                ) {
                  isLabelExsit = true;
                  break;
                }
              }

              if (!isLabelExsit) {
                const diag = new vscode.Diagnostic(
                  range,
                  data["pm"]["target"] + "は存在しないラベルです。",
                  vscode.DiagnosticSeverity.Error,
                );
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
   * @returns trueなら%がある、 falseなら%がない
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
    if (
      value.match(/f\.[a-zA-Z_]\w*/) === null &&
      value.match(/sf\.[a-zA-Z_]\w*/) === null &&
      value.match(/tf\.[a-zA-Z_]\w*/) === null &&
      value.match(/mp\.[a-zA-Z_]\w*/) === null
    ) {
      return false;
    }
    return true;
  }

  /**
   * if,ifelse,else文の中でjump,callタグを使用しているか検出します。
   */
  private async detectJumpAndCallInIfStatement(
    absoluteScenarioFilePathMap: Map<string, vscode.TextDocument>,
    diagnosticArray: [vscode.Uri, readonly vscode.Diagnostic[] | undefined][],
    projectPath: string,
  ) {
    for (const [_filePath, scenarioDocument] of absoluteScenarioFilePathMap) {
      const projectPathOfDiagFile = await this.infoWs.getProjectPathByFilePath(
        scenarioDocument.fileName,
      );
      //診断中のプロジェクトフォルダと、診断対象のファイルのプロジェクトが一致しないならcontinue
      if (projectPath !== projectPathOfDiagFile) {
        continue;
      }
      //skipしてOKならcontinueする
      if (this.infoWs.isSkipParse(scenarioDocument.fileName, projectPath)) {
        continue;
      }

      let isInIf: boolean = false; //if文の中にいるかどうか
      const parsedData = this.parser.parseText(scenarioDocument.getText()); //構文解析
      const diagnostics: vscode.Diagnostic[] = [];
      for (const data of parsedData) {
        //early return
        if (data["name"] === "comment") {
          continue;
        }

        if (data["name"] === "if") {
          isInIf = true;
        }
        if (data["name"] === "endif") {
          isInIf = false;
        }

        //条件式
        if (
          isInIf &&
          (data["name"] === "jump" || (isInIf && data["name"] === "call"))
        ) {
          const tagFirstIndex = scenarioDocument
            .lineAt(data["line"])
            .text.indexOf(data["name"]); // 該当行からタグの定義場所(開始位置)探す
          const tagLastIndex =
            tagFirstIndex + this.sumStringLengthsInObject(data["pm"]); // 該当行からタグの定義場所(終了位置)探す
          const range = new vscode.Range(
            data["line"],
            tagFirstIndex,
            data["line"],
            tagLastIndex,
          );
          const diag = new vscode.Diagnostic(
            range,
            `ifの中での${data["name"]}は正常に動作しない可能性があります。[${data["name"]} cond="条件式"]に置き換えることを推奨します。`,
            vscode.DiagnosticSeverity.Warning,
          );

          diagnostics.push(diag);
        }
      }
      diagnosticArray.push([scenarioDocument.uri, diagnostics]);
    }
  }

  private sumStringLengthsInObject(obj: object): number {
    let totalLength = 0;
    const value = 4; //ダブルクォート*2とイコールと半角スペースの分
    const firstValue = 2; //アットマークor[]と、最初の半角スペース分
    totalLength += firstValue;
    for (const key in obj) {
      if (typeof key === "string") {
        totalLength += key.length;
      }
      if (typeof obj[key] === "string") {
        totalLength += obj[key].length;
      }
      totalLength += value;
    }
    return totalLength;
  }

  private isExecuteDiagnostic(key: string): boolean {
    const value = this.executeDiagnostic[key];
    return typeof value === "boolean" ? value : false;
  }

  /**
   * ラベル名（*label_name）のバリデーションを行います
   * - エラー: ラベル名が数字から始まる、空白文字を含む、使用不可能な文字を含む
   * - 警告: ラベル名に2バイト文字を使用している
   * @param data パース済みのタグデータ
   * @param scenarioDocument 診断対象のドキュメント
   * @param projectPathOfDiagFile 診断対象ファイルのプロジェクトパス
   * @param diagnostics 診断結果を格納する配列
   */
  private async checkLabelName(
    data: any,
    scenarioDocument: vscode.TextDocument,
    projectPathOfDiagFile: string,
    diagnostics: vscode.Diagnostic[],
  ): Promise<void> {
    if (!this.isExecuteDiagnostic(this.labelName)) {
      return;
    }

    // ラベルタグでない場合は何もしない
    if (data["name"] !== "label") {
      return;
    }

    // コメント中のラベルは診断対象外
    if (data["pm"]["is_in_comment"] === true) {
      return;
    }

    const labelName = data["pm"]["label_name"];
    if (!labelName) {
      return;
    }

    // ラベル名の範囲を取得
    const range = new vscode.Range(
      new vscode.Position(data["pm"]["line"], 0),
      new vscode.Position(
        data["pm"]["line"],
        data["pm"]["label_name"].length + 1,
      ),
    );

    // エラーチェック
    // 1. ラベル名が数字から始まる
    if (/^\d/.test(labelName)) {
      const diag = new vscode.Diagnostic(
        range,
        `ラベル名 "${labelName}" は数字から始まっており、非推奨の可能性があります。`,
        vscode.DiagnosticSeverity.Warning,
      );
      diagnostics.push(diag);
      return; // 重複エラーを避けるため早期リターン
    }

    // 2. ラベル名に空白文字が存在している
    if (/\s/.test(labelName)) {
      const diag = new vscode.Diagnostic(
        range,
        `ラベル名 "${labelName}" に空白文字が含まれています。空白文字は非推奨です。`,
        vscode.DiagnosticSeverity.Warning,
      );
      diagnostics.push(diag);
      return; // 重複エラーを避けるため早期リターン
    }

    // 3. 使用できるのは半角英数字とアンダースコアのみ
    if (!/^[a-zA-Z0-9_]+$/.test(labelName)) {
      // 2バイト文字チェックは別途行うので、2バイト文字がある場合は警告だけにする
      if (/[^\x01-\x7E]/.test(labelName)) {
        const diag = new vscode.Diagnostic(
          range,
          `ラベル名 "${labelName}" に日本語などの2バイト文字が含まれています。半角英数字とアンダースコアの使用を推奨します。`,
          vscode.DiagnosticSeverity.Warning,
        );
        diagnostics.push(diag);
      } else {
        const diag = new vscode.Diagnostic(
          range,
          `ラベル名 "${labelName}" に使用できない文字が含まれてる可能性があります。半角英数字とアンダースコアのみ使用可能です。`,
          vscode.DiagnosticSeverity.Warning,
        );
        diagnostics.push(diag);
      }
    }
  }

  private async checkMacroDuplicate(
    diagnostics: vscode.Diagnostic[],
    projectPath: string,
    scenarioDocument: vscode.TextDocument,
  ): Promise<void> {
    // マクロの重複チェックを実行するかどうか
    if (!this.isExecuteDiagnostic(this.macroDuplicate)) {
      return;
    }

    //現在のプロジェクトのマクロデータ取得
    const defineMacroMap = this.infoWs.defineMacroMap.get(projectPath);
    if (!defineMacroMap) {
      return; // マクロが定義されていない場合は何もしない
    }

    // macro.macroNameのリストを取得
    const hoge = Array.from(defineMacroMap.values());

    //hogeから、macroNameに重複があるもののみを取得
    // 1. 各 name の出現回数を数える。
    // 2. 出現回数が1回より多い name を特定。
    // 3. 元のリストをフィルタリングして、特定された name を持つオブジェクトのみを抽出。
    const macroNameCounts: Record<string, number> = {};
    for (const item of hoge) {
      macroNameCounts[item.macroName] =
        (macroNameCounts[item.macroName] || 0) + 1;
    }
    const duplicateMacroNames = Object.keys(macroNameCounts).filter(
      (name) => macroNameCounts[name] > 1,
    );
    const piyo = hoge.filter((item) =>
      duplicateMacroNames.includes(item.macroName),
    );

    //piyoから、scenarioDocument.fileNameが同じものでフィルタリング
    const fuga = piyo.filter(
      (macro) => macro.location?.uri.fsPath === scenarioDocument.fileName,
    );

    for (const macro of fuga) {
      if (macro.location) {
        const end = new vscode.Position(
          macro.location.range.start.line,
          macro.location.range.end.character +
            macro.macroName.length +
            `macro name="${macro.macroName}"`.length,
        );
        const range = new vscode.Range(macro.location.range.start, end);
        const diag = new vscode.Diagnostic(
          range,
          `マクロ名 "${macro.macroName}" が重複しています。同じ名前のマクロが他の箇所で定義されています。`,
          vscode.DiagnosticSeverity.Warning,
        );
        diagnostics.push(diag);
      }
    }

    return;
  }

  /**
   * タグに存在しないパラメータが指定されているかを検出します
   * @param data パース済みのタグデータ
   * @param scenarioDocument 診断対象のドキュメント
   * @param projectPathOfDiagFile 診断対象ファイルのプロジェクトパス
   * @param diagnostics 診断結果を格納する配列
   */
  private async detectionUndefinedParameter(
    data: any,
    scenarioDocument: vscode.TextDocument,
    projectPathOfDiagFile: string,
    diagnostics: vscode.Diagnostic[],
  ): Promise<void> {
    if (!this.isExecuteDiagnostic(this.undefinedParameter)) {
      return;
    }

    // タグ名を取得
    const tagName = data["name"];
    
    // パラメータオブジェクトを取得
    const tagParameters = data["pm"];
    if (!tagParameters || typeof tagParameters !== "object") {
      return;
    }

    // suggestions から該当タグの定義を取得
    const suggestions = this.infoWs.suggestions.get(projectPathOfDiagFile);
    if (!suggestions || !suggestions[tagName]) {
      return; // タグ定義が見つからない場合はスキップ（別の診断でキャッチされる）
    }

    const tagDefinition = suggestions[tagName];
    if (!tagDefinition.parameters || !Array.isArray(tagDefinition.parameters)) {
      return; // パラメータ定義がない場合はスキップ
    }

    // 定義されたパラメータ名の配列を作成
    const validParameterNames = tagDefinition.parameters.map((param: any) => param.name);

    // タグのパラメータをチェック
    for (const paramName in tagParameters) {
      // 内部的なパラメータ（line, column など）はスキップ
      if (paramName === "line" || paramName === "column" || paramName === "is_in_comment") {
        continue;
      }

      // パラメータが定義されているかチェック
      if (!validParameterNames.includes(paramName)) {
        // パラメータの位置を特定
        const range = this.getParameterRange(paramName, tagParameters[paramName], data, scenarioDocument);
        
        const diag = new vscode.Diagnostic(
          range,
          `パラメータ "${paramName}" はタグ "${tagName}" に定義されていません。`,
          vscode.DiagnosticSeverity.Error,
        );
        diagnostics.push(diag);
      }
    }
  }

  /**
   * パラメータの範囲を取得します
   * @param paramName パラメータ名
   * @param paramValue パラメータ値
   * @param data パース済みのタグデータ
   * @param document ドキュメント
   */
  private getParameterRange(
    paramName: string,
    paramValue: string,
    data: any,
    document: vscode.TextDocument,
  ): vscode.Range {
    const line = document.lineAt(data["line"]);
    const lineText = line.text;

    // パラメータの検索パターン（paramName="value" または paramName=value）
    const patterns = [
      new RegExp(`\\b${paramName}\\s*=\\s*"[^"]*"`), // paramName="value"
      new RegExp(`\\b${paramName}\\s*=\\s*'[^']*'`), // paramName='value'
      new RegExp(`\\b${paramName}\\s*=\\s*[^\\s\\]]+`), // paramName=value (引用符なし)
    ];

    for (const pattern of patterns) {
      const match = lineText.match(pattern);
      if (match && match.index !== undefined) {
        const startPos = match.index;
        const endPos = startPos + match[0].length;
        return new vscode.Range(
          data["line"],
          startPos,
          data["line"],
          endPos,
        );
      }
    }

    // パラメータが見つからない場合はタグ全体を範囲とする
    return new vscode.Range(
      data["line"],
      line.firstNonWhitespaceCharacterIndex,
      data["line"],
      line.text.length,
    );
  }
}
