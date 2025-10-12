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
  private readonly parameterSpacing = "parameterSpacing";
  private readonly missingAmpersandInVariable = "missingAmpersandInVariable";

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

  //ティラノビルダー固有の設定を取得
  private tyranoBuilderEnabled: boolean = vscode.workspace
    .getConfiguration()
    .get("TyranoScript syntax.tyranoBuilder.enabled")!;

  private tyranoBuilderSkipTags: string[] = vscode.workspace
    .getConfiguration()
    .get("TyranoScript syntax.tyranoBuilder.skipTags")!;

  private tyranoBuilderSkipParameters: {
    [tagName: string]: string[];
  } = vscode.workspace
    .getConfiguration()
    .get("TyranoScript syntax.tyranoBuilder.skipParameters")!;

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

    // 変更されたファイルのマクロ情報を更新してから診断を実行
    // Update macro information for the changed file before running diagnostics
    // This fixes the race condition where diagnostics run before macro map is updated
    if (changedTextDocumentPath && changedTextDocumentPath.endsWith(".ks")) {
      try {
        // 診断前に必ずマクロ情報を更新（二重更新を避けるため、extension.ts側で更新済みでも確実性を保つ）
        await this.infoWs.updateScenarioFileMap(changedTextDocumentPath);
        await this.infoWs.updateMacroLabelVariableDataMapByKs(
          changedTextDocumentPath,
        );

        // マクロ情報の更新完了を確認してログ出力
        TyranoLogger.print(
          `Updated macro data for: ${changedTextDocumentPath}`,
        );
      } catch (error) {
        TyranoLogger.print(
          `Error updating macro data for ${changedTextDocumentPath}: ${error}`,
        );
        // Continue with diagnostics even if update fails
      }
    }

    const diagnosticArray: [
      vscode.Uri,
      readonly vscode.Diagnostic[] | undefined,
    ][] = [];

    TyranoLogger.print(`[${diagnosticProjectPath}] parsing start.`);

    const baseTyranoTag: string[] = Object.keys(
      this.infoWs.suggestions.get(diagnosticProjectPath)!,
    );
    // Note: Macros are already included in suggestions, so no need to add them separately
    // The original line using defineMacroMap.keys() was incorrect as it used UUIDs instead of macro names
    //commentはパーサーに独自で追加したもの、labelとtextはティラノスクリプト側で既に定義されているもの。
    const tyranoTag: string[] = [...baseTyranoTag, "comment", "label", "text"];

    // 統合ループ: 3つの診断メソッドを1つのループに統合して高速化
    // Unified loop: Combine 3 diagnostic methods into one loop for better performance

    // パース結果のキャッシュを作成（同じファイルを何度もパースしないように）
    const parsedDataCache = new Map<string, any>();

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

      // パース結果をキャッシュに保存
      parsedDataCache.set(scenarioDocument.fileName, parsedData);

      //-----------------------------------------
      //■統合診断ループ: 1回のパースで複数の診断を実行
      //-----------------------------------------

      let isInIf: boolean = false; // if文の中にいるかどうか（detectJumpAndCallInIfStatement用）

      for (const data of parsedData) {
        //early return
        if (data["name"] === "comment") {
          continue;
        }

        // 1. 未定義マクロの検出（元のdetectionUndefineMacro）
        if (this.isExecuteDiagnostic(this.undefinedMacro)) {
          if (!tyranoTag.includes(data["name"])) {
            const tagFirstIndex = scenarioDocument
              .lineAt(data["line"])
              .text.indexOf(data["name"]);
            const tagLastIndex = tagFirstIndex + data["name"].length;

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

        // 2. if文内のjump/call検出（元のdetectJumpAndCallInIfStatement）
        if (this.isExecuteDiagnostic(this.jumpAndCallInIfStatement)) {
          if (data["name"] === "if") {
            isInIf = true;
          }
          if (data["name"] === "endif") {
            isInIf = false;
          }

          if (
            isInIf &&
            (data["name"] === "jump" || data["name"] === "call")
          ) {
            const tagFirstIndex = scenarioDocument
              .lineAt(data["line"])
              .text.indexOf(data["name"]);
            const tagLastIndex =
              tagFirstIndex + this.sumStringLengthsInObject(data["pm"]);
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

        // 3. 存在しないシナリオファイル・未定義ラベルの検出（元のdetectionMissingScenariosAndLabels）
        if (this.isExecuteDiagnostic(this.missingScenariosAndLabels)) {
          if (this.JUMP_TAG.includes(data["name"])) {
            // storageに付いての処理
            if (data["pm"]["storage"] !== undefined) {
              const range = this.getParameterRange(
                "storage",
                data["pm"]["storage"],
                data,
                scenarioDocument,
              );

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
                    projectPathOfDiagFile +
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
              const range = this.getParameterRange(
                "target",
                data["pm"]["target"],
                data,
                scenarioDocument,
              );

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
                data["pm"]["target"] = data["pm"]["target"].replace("*", "");

                const storageScenarioDocument: vscode.TextDocument | undefined =
                  data["pm"]["storage"] === undefined
                    ? scenarioDocument
                    : this.infoWs.scenarioFileMap.get(
                        this.infoWs.convertToAbsolutePathFromRelativePath(
                          projectPathOfDiagFile +
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
                );
                let isLabelExsit: boolean = false;
                for (const storageData in storageParsedData) {
                  if (
                    storageParsedData[storageData]["pm"]["label_name"] ===
                    data["pm"]["target"]
                  ) {
                    isLabelExsit = true;
                    break;
                  }
                }

                if (!isLabelExsit && !this.tyranoBuilderEnabled) {
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

        //-----------------------------------------
        //■その他の診断項目（元々統合ループにあったもの）
        //-----------------------------------------

        //存在しないパラメータのチェック
         this.detectionUndefinedParameter(
          data,
          scenarioDocument,
          projectPathOfDiagFile,
          diagnostics,
        );

        //変数で&がないもののチェック
         this.detectionMissingAmpersandInVariable(
          data,
          scenarioDocument,
          projectPathOfDiagFile,
          diagnostics,
        );

        // ファイルリソースの存在チェックを別メソッドで実行
         this.detectionMissingResources(
          data,
          scenarioDocument,
          projectPathOfDiagFile,
          diagnostics,
        );
        //ラベル名のチェック
         this.checkLabelName(
          data,
          scenarioDocument,
          projectPathOfDiagFile,
          diagnostics,
        );
      }

      //-----------------------------------------
      //■ファイルに対しての診断
      //-----------------------------------------

      //マクロの重複チェック
       this.checkMacroDuplicate(
        diagnostics,
        projectPathOfDiagFile,
        scenarioDocument,
      );

      //パラメータ間のスペーシングチェック
       this.checkParameterSpacing(
        diagnostics,
        projectPathOfDiagFile,
        scenarioDocument,
      );

      diagnosticArray.push([scenarioDocument.uri, diagnostics]);
    }

    TyranoLogger.print(
      `[${diagnosticProjectPath}] unified diagnostic loop finished.`,
    );

    //-----------------------------------------
    //■診断結果をセット
    //-----------------------------------------

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
          const tagLastIndex = tagFirstIndex + data["name"].length; // タグ名の長さのみを使用して終了位置を決定

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
            // getParameterRangeメソッドを使用してパラメータの正確な位置を取得
            const range = this.getParameterRange(
              "storage",
              data["pm"]["storage"],
              data,
              scenarioDocument,
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
            // getParameterRangeメソッドを使用してパラメータの正確な位置を取得
            const range = this.getParameterRange(
              "target",
              data["pm"]["target"],
              data,
              scenarioDocument,
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


              if (!isLabelExsit && !this.tyranoBuilderEnabled) {
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
   * TyranoScriptタグのパラメータ間のスペーシングを検証します
   * パラメータ間に適切なスペースがない場合に診断エラーを報告します
   * @param diagnostics 診断結果を格納する配列
   * @param projectPath 診断対象ファイルのプロジェクトパス
   * @param scenarioDocument 診断対象のドキュメント
   */
  private async checkParameterSpacing(
    diagnostics: vscode.Diagnostic[],
    projectPath: string,
    scenarioDocument: vscode.TextDocument,
  ): Promise<void> {
    // パラメータスペーシングチェックを実行するかどうか
    if (!this.isExecuteDiagnostic(this.parameterSpacing)) {
      return;
    }

    const documentText = scenarioDocument.getText();
    const lines = documentText.split("\n");

    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
      const line = lines[lineNumber];

      // パラメータ間のスペース不足パターンを直接検出
      // "value"param= または 'value'param= または `value`param= の形式
      const missingSpacePatterns = [
        /"([a-zA-Z_][a-zA-Z0-9_]*\s*=)/g, // "value"param=
        /'([a-zA-Z_][a-zA-Z0-9_]*\s*=)/g, // 'value'param=
        /`([a-zA-Z_][a-zA-Z0-9_]*\s*=)/g, // `value`param=
      ];

      for (const pattern of missingSpacePatterns) {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          // パラメータ名を取得（=を除く）
          const paramName = match[1].replace(/\s*=/, "");

          // エラー位置を特定
          const errorStartIndex = match.index;
          const range = new vscode.Range(
            lineNumber,
            errorStartIndex,
            lineNumber,
            errorStartIndex + paramName.length,
          );

          const diag = new vscode.Diagnostic(
            range,
            "パラメータ間に半角スペースがありません。パラメータ間は半角スペースで区切ってください。",
            vscode.DiagnosticSeverity.Error,
          );
          diagnostics.push(diag);
        }

        // regex lastIndex をリセット
        pattern.lastIndex = 0;
      }
    }
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
    //ティラノビルダーが有効でティラノビルダーで定義されているタグ（マクロ）ならスキップ
    if (
      this.tyranoBuilderEnabled &&
      this.tyranoBuilderSkipTags.includes(tagName)
    ) {
      return;
    }

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
    const validParameterNames = tagDefinition.parameters.map(
      (param: any) => param.name,
    );

    // condパラメータの場合、なくてもOKとするためにあらかじめ追加しておく
    validParameterNames.push("cond");

    let charaName = "";
    // chara_partタグの場合、characterMap._layerのキーに登録されている値も有効なパラメータ名として扱う
    if (tagName === "chara_part") {
      charaName = data["pm"]["name"];

      //キャラ定義を取得し、chara_partのnameと一致する物だけに絞る
      const characterDataArray = this.infoWs.characterMap
        .get(projectPathOfDiagFile)
        ?.filter((characterData) => characterData.name === charaName);

      //キャラ定義が存在する場合、layerのキーを有効なパラメータ名として追加
      if (characterDataArray) {
        const layerKeys = new Set<string>();

        for (const characterData of characterDataArray) {
          for (const [, partDataArray] of characterData.layer) {
            for (const partData of partDataArray) {
              layerKeys.add(partData.part);
            }
          }
        }

        validParameterNames.push(...layerKeys);
      }
    }

    // タグのパラメータをチェック
    for (const paramName in tagParameters) {
      // ワイルドカードパラメータ（*）はスキップ
      if (paramName === "*") {
        continue;
      }

      // パラメータが定義されているかチェック
      if (!validParameterNames.includes(paramName)) {
        // ティラノビルダーが有効でティラノビルダー固有のパラメータの場合はスキップ
        if (
          this.tyranoBuilderEnabled &&
          this.tyranoBuilderSkipParameters[tagName] &&
          this.tyranoBuilderSkipParameters[tagName].includes(paramName)
        ) {
          continue;
        }
        // パラメータの位置を特定
        const range = this.getParameterRange(
          paramName,
          tagParameters[paramName],
          data,
          scenarioDocument,
        );

        if (tagName == "chara_part") {
          const diag = new vscode.Diagnostic(
            range,
            `タグ[${tagName}]のキャラ${charaName}には"${paramName}"パラメータが存在しません。chara_showやchara_layerタグを見直してください。`,
            vscode.DiagnosticSeverity.Error,
          );
          diagnostics.push(diag);
        } else {
          const diag = new vscode.Diagnostic(
            range,
            `タグ[${tagName}]のパラメータ "${paramName}" はタグ "${tagName}" に定義されていません。`,
            vscode.DiagnosticSeverity.Error,
          );

          diagnostics.push(diag);
        }
      }
    }
  }

  /**
   * 正規表現で使用する文字列をエスケープします
   * @param string エスケープする文字列
   * @returns エスケープされた文字列
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    try {
      const line = document.lineAt(data["line"]);
      const lineText = line.text;

      // パラメータ名をエスケープして正規表現の特殊文字を無効化
      const escapedParamName = this.escapeRegExp(paramName);

      // パラメータの検索パターン（paramName="value" または paramName=value）
      const patterns = [
        new RegExp(`\\b${escapedParamName}\\s*=\\s*"[^"]*"`), // paramName="value"
        new RegExp(`\\b${escapedParamName}\\s*=\\s*'[^']*'`), // paramName='value'
        new RegExp(`\\b${escapedParamName}\\s*=\\s*[^\\s\\]]+`), // paramName=value (引用符なし)
      ];

      for (const pattern of patterns) {
        const match = lineText.match(pattern);
        if (match && match.index !== undefined) {
          const startPos = match.index;
          const endPos = startPos + match[0].length;
          return new vscode.Range(data["line"], startPos, data["line"], endPos);
        }
      }

      // パラメータが見つからない場合はタグ全体を範囲とする
      return new vscode.Range(
        data["line"],
        line.firstNonWhitespaceCharacterIndex,
        data["line"],
        line.text.length,
      );
    } catch (error) {
      console.log(error);
    }
    return new vscode.Range(data["line"], 1, data["line"], 2);
  }

  /**
   * パラメータで変数を使用する際に&がない場合にエラーを報告します
   * @param data パース済みのタグデータ
   * @param scenarioDocument 診断対象のドキュメント
   * @param projectPathOfDiagFile 診断対象ファイルのプロジェクトパス
   * @param diagnostics 診断結果を格納する配列
   */
  private async detectionMissingAmpersandInVariable(
    data: any,
    scenarioDocument: vscode.TextDocument,
    projectPathOfDiagFile: string,
    diagnostics: vscode.Diagnostic[],
  ): Promise<void> {
    // 設定で診断が無効になっている場合はスキップ
    if (!this.isExecuteDiagnostic(this.missingAmpersandInVariable)) {
      return;
    }

    const tagName = data["name"];
    // タグ名が存在しない、またはtext/commentの場合はスキップ
    if (!tagName || tagName === "text" || tagName === "comment") {
      return;
    }

    // パラメータオブジェクトを取得
    const tagParameters = data["pm"];
    if (!tagParameters || typeof tagParameters !== "object") {
      return;
    }

    // タグのパラメータのみをチェック（text/commentは除外済み）
    for (const paramName in tagParameters) {
      // exp,cond,preexpパラメータは&がなくてもエラーにしない
      if (
        paramName === "exp" ||
        paramName === "cond" ||
        paramName === "preexp"
      ) {
        continue;
      }

      //editタグのnameパラメータとdialogタグのnameパラメータはスキップ
      if (
        (tagName === "edit" && paramName === "name") ||
        (tagName === "dialog" && paramName === "name")
      ) {
        continue;
      }

      const paramValue = tagParameters[paramName];
      if (typeof paramValue !== "string") {
        continue;
      }

      // 値が変数を含むかどうかをチェック
      if (this.isValueIsIncludeVariable(paramValue)) {
        // &も%もない場合はエラー
        if (
          !this.isExistAmpersandAtBeginning(paramValue) &&
          this.isExistPercentAtBeginning(paramValue) === false
        ) {
          // パラメータの位置を特定
          const range = this.getParameterRange(
            paramName,
            paramValue,
            data,
            scenarioDocument,
          );

          const diag = new vscode.Diagnostic(
            range,
            `タグ[${tagName}]のパラメータ"${paramName}"で変数を使用する場合は値の先頭に&、もしくはマクロで渡された変数なら%を付ける必要があります。例: ${paramName}="&${paramValue}"`,
            vscode.DiagnosticSeverity.Warning,
          );

          diagnostics.push(diag);
        }
      }
    }
  }
}
