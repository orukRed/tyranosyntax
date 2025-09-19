import * as vscode from "vscode";
import { InformationWorkSpace } from "../InformationWorkSpace";
import path from "path";
import { Parser } from "../Parser";
import { ErrorLevel, TyranoLogger } from "../TyranoLogger";
import { VariableData } from "../defineData/VariableData";
import * as fs from "fs";

type SuggestionsMiniumByTag = {
  [tag: string]: {
    [s: string]: string;
  };
};

type SuggestionsByTag = {
  [tag: string]: {
    name: string;
    description: string;
    parameters: {
      name: string;
      description: string;
      required: boolean;
      detail?: string;
    }[];
  };
};

type TagParameterConfig = {
  type: string | string[];
  path?: string;
  values?: string[];
};

export class TyranoCompletionItemProvider implements vscode.CompletionItemProvider {
  private infoWs = InformationWorkSpace.getInstance();
  private parser = Parser.getInstance();
  public constructor() {}
  private tagParams: {
    [s: string]: { [s: string]: TagParameterConfig };
  } = vscode.workspace
    .getConfiguration()
    .get("TyranoScript syntax.tag.parameter")!;

  private getVariableName(variableValue0: string): string {
    let variableName = "";
    try {
      const variablePrefixList = ["f", "sf", "tf", "mp"];
      const variableNameBase = variableValue0.startsWith("&")
        ? variableValue0.substring(1)
        : variableValue0;
      variablePrefixList.forEach((prefix) => {
        if (variableNameBase.startsWith(prefix)) {
          const variableNameBaseToWithoutPrefix = variableNameBase.substring(
            prefix.length,
          );
          variableName = variableNameBaseToWithoutPrefix.split(".")[1];
          return;
        }
      });
    } catch (error) {
      TyranoLogger.print(
        `${this.getVariableName.name} failed`,
        ErrorLevel.ERROR,
      );
      TyranoLogger.printStackTrace(error);
      return "";
    }
    return variableName;
  }

  private async findVariableObject(
    projectPath: string,
    variableName: string,
  ): Promise<VariableData | undefined> {
    const variableDataMap = this.infoWs.variableMap.get(projectPath);
    if (variableDataMap) {
      for (const [, value] of variableDataMap) {
        if (value.name === variableName) {
          return value; // マッチするオブジェクトを見つけたら返却
        }
      }
    }
    return undefined; // マッチするオブジェクトが見つからなかった場合
  }

  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext,
  ): Promise<
    | vscode.CompletionItem[]
    | vscode.CompletionList<vscode.CompletionItem>
    | null
    | undefined
  > {
    try {
      const projectPath = await this.infoWs.getProjectPathByFilePath(
        document.fileName,
      );
      //カーソル付近のタグデータを取得
      const lineText = document.lineAt(position.line).text;
      const parsedData = this.parser.parseText(lineText);
      const tagIndex = this.parser.getIndex(parsedData, position.character);

      const leftSideText =
        parsedData[tagIndex] !== undefined
          ? lineText.substring(
              parsedData[tagIndex]["column"],
              position.character,
            )
          : undefined;
      const lineTagName =
        parsedData[tagIndex] !== undefined
          ? parsedData[tagIndex]["name"]
          : undefined; //今見てるタグの名前
      const regExp2 = new RegExp('(\\S)+="(?![\\s\\S]*")', "g"); //今見てるタグの値を取得
      const variableRegExp = /&?(f\.|sf\.|tf\.|mp\.)(\S)*$/; //変数の正規表現
      const regExpResult = leftSideText?.match(regExp2); //「hoge="」を取得できる
      const lineParamName = regExpResult?.[0]
        .replace('"', "")
        .replace("=", "")
        .trim(); //今見てるパラメータの名前
      const paramInfo =
        (lineParamName !== undefined &&
          this.tagParams?.[lineTagName]?.[lineParamName]) ||
        undefined; //今見てるタグのパラメータ情報  paramsInfo.path paramsInfo.type
      const variableValue = variableRegExp.exec(leftSideText!);
      const characterOperationTagList = [
        "chara_ptext",
        "chara_config",
        "chara_show",
        "chara_hide",
        "chara_delete",
        "chara_mod",
        "chara_move",
        "chara_face",
        "chara_layer",
        "chara_layer_mod",
        "chara_part",
        "chara_part_reset",
      ]; //chara_newで定義したname,face,part,idを使うタグのリスト
      const nameParameterList = ["name", "ptext"]; //chara_newで定義したnameを呼び出すparameter一覧

      // //nameパラメータで指定した名前のCharacterDataが存在するかを取得
      // //characterDataのlayerのキー（part）の配列を取得
      const layerParts = this.findLayerParts(projectPath, tagIndex, parsedData);

      //カーソルの左隣の文字取得
      if (typeof leftSideText === "string" && /\s*#.*$/.test(leftSideText)) {
        return await this.completionNameParameter(projectPath);
      } else if (variableValue) {
        const variableKind = variableValue[0].split(".")[0].replace("&", "");
        const variableName = this.getVariableName(variableValue[0]);
        if (variableName) {
          const variableObject = await this.findVariableObject(
            projectPath,
            variableName,
          );
          if (variableObject) {
            const splitVariable = variableValue[0].split(".");
            return this.completionNestVariable(variableObject, splitVariable);
          }
        }
        return await this.completionVariable(projectPath, variableKind);
      }
      //targetへのインテリセンス
      else if (
        parsedData[tagIndex] !== undefined &&
        lineTagName !== undefined &&
        lineParamName === "target"
      ) {
        //leftSideTextの最後の文字が*ならラベルの予測変換を出す //FIXME:「参照paramがtargetなら」の方がよさそう
        return this.completionLabel(
          projectPath,
          parsedData[tagIndex]["pm"]["storage"],
        );
      }
      //nameへのインテリセンス
      else if (
        parsedData[tagIndex] !== undefined &&
        lineTagName !== undefined &&
        lineParamName !== undefined &&
        characterOperationTagList.includes(parsedData[tagIndex]["name"]) &&
        nameParameterList.includes(lineParamName!)
      ) {
        return this.completionNameParameter(projectPath);
      }
      // faceへのインテリセンス
      else if (
        parsedData[tagIndex] !== undefined &&
        lineTagName !== undefined &&
        lineParamName !== undefined &&
        characterOperationTagList.includes(parsedData[tagIndex]["name"]) &&
        lineParamName == "face"
      ) {
        const nameParamValue = parsedData[tagIndex]["pm"]["name"];
        return this.completionFaceParameter(projectPath, nameParamValue);
      }
      // partへのインテリセンス
      else if (
        parsedData[tagIndex] !== undefined &&
        lineTagName !== undefined &&
        lineParamName !== undefined &&
        characterOperationTagList.includes(parsedData[tagIndex]["name"]) &&
        lineParamName == "part"
      ) {
        const nameParamValue = parsedData[tagIndex]["pm"]["name"];
        return this.completionPartParameter(projectPath, nameParamValue);
      }
      //idへのインテリセンス
      //(nameが定義されてて)&&(lineParamNameがCharacterDataList.layerに存在するキーであるなら || lineParamNameがidである)
      else if (
        parsedData[tagIndex] !== undefined &&
        lineTagName !== undefined &&
        lineParamName !== undefined &&
        characterOperationTagList.includes(parsedData[tagIndex]["name"]) &&
        parsedData[tagIndex]["pm"]["name"] &&
        (layerParts.includes(lineParamName) || lineParamName == "id")
      ) {
        const nameParamValue = parsedData[tagIndex]["pm"]["name"];
        const partName = lineParamName;
        return this.completionIdParameter(
          projectPath,
          nameParamValue,
          partName,
        );
      }
      //リソースの予測変換
      else if (
        parsedData[tagIndex] !== undefined &&
        lineTagName !== undefined &&
        lineParamName !== undefined &&
        paramInfo !== undefined
      ) {
        return await this.completionResource(
          projectPath,
          paramInfo.type,
          projectPath + this.infoWs.pathDelimiter + (paramInfo.path || ""),
          paramInfo,
        );
      } else if (
        parsedData === undefined ||
        parsedData[tagIndex] === undefined ||
        !parsedData[tagIndex]["name"]
      ) {
        //空行orテキストならタグの予測変換を出す
        return this.completionTag(projectPath, document, position);
      } else {
        //タグの中ならタグのパラメータの予測変換を出す
        const isTagSentence =
          lineTagName === "text" || lineTagName === undefined ? false : true;
        if (isTagSentence) {
          const nameParamValue = parsedData[tagIndex]["pm"]["name"];
          return this.completionParameter(
            lineTagName,
            parsedData[tagIndex]["pm"],
            projectPath,
            nameParamValue,
            document,
            position,
          );
        } else {
          return this.completionTag(projectPath, document, position);
        }
      }
    } catch (error) {
      TyranoLogger.print(
        `${this.provideCompletionItems.name} failed`,
        ErrorLevel.ERROR,
      );
      TyranoLogger.printStackTrace(error);
    }
  }

  /**
   * キャラクター操作タグでのnameパラメータに使用する値の予測変換
   */
  private async completionNameParameter(
    projectPath: string,
  ): Promise<
    | vscode.CompletionItem[]
    | vscode.CompletionList<vscode.CompletionItem>
    | null
    | undefined
  > {
    const characterDataList = this.infoWs.characterMap.get(projectPath);
    if (!characterDataList) {
      return null;
    }

    const completions: vscode.CompletionItem[] = [];
    characterDataList.forEach((characterData) => {
      const comp = new vscode.CompletionItem(characterData.name);
      comp.kind = vscode.CompletionItemKind.Variable;
      comp.insertText = characterData.name;
      completions.push(comp);
    });
    return completions;
  }

  /**
   * キャラクター操作タグでのfaceパラメータに使用する値の予測変換
   */
  private async completionFaceParameter(
    projectPath: string,
    nameParamValue: string,
  ): Promise<
    | vscode.CompletionItem[]
    | vscode.CompletionList<vscode.CompletionItem>
    | null
    | undefined
  > {
    const characterDataList = this.infoWs.characterMap.get(projectPath);
    if (!characterDataList || !nameParamValue) {
      return null;
    }
    const faceList = characterDataList.find(
      (characterData) => characterData.name === nameParamValue,
    )?.faceList;
    if (!faceList) {
      return null;
    }

    const completions: vscode.CompletionItem[] = [];
    faceList.forEach((faceData) => {
      const comp = new vscode.CompletionItem(faceData.face);
      comp.kind = vscode.CompletionItemKind.Variable;
      comp.insertText = faceData.face;
      comp.detail = `${faceData.name}に定義されているface`;
      completions.push(comp);
    });
    return completions;
  }

  /**
   * キャラクター操作タグでのpartパラメータに使用する値の予測変換
   */
  private async completionPartParameter(
    projectPath: string,
    nameParamValue: string,
  ): Promise<
    | vscode.CompletionItem[]
    | vscode.CompletionList<vscode.CompletionItem>
    | null
    | undefined
  > {
    const characterDataList = this.infoWs.characterMap.get(projectPath);
    if (!characterDataList || !nameParamValue) {
      return null;
    }
    //nameパラメータで指定した名前のCharacterDataが存在するかを取得
    const layerMap = characterDataList.find(
      (characterData) => characterData.name === nameParamValue,
    )?.layer;
    if (!layerMap) {
      return null;
    }

    const completions: vscode.CompletionItem[] = [];
    const layerParts = [...layerMap.keys()];
    layerParts.forEach((part) => {
      const comp = new vscode.CompletionItem(part);
      comp.kind = vscode.CompletionItemKind.Variable;
      comp.insertText = part;
      comp.detail = `${nameParamValue}に定義されているpart`;
      completions.push(comp);
    });

    return completions;
  }

  /**
   * キャラクター操作タグでのidパラメータに使用する値の予測変換
   * @param projectPath
   * @param nameParamValue nameパラメータで指定した値
   * @param partName Character_layerで指定したpartの名前
   */
  private async completionIdParameter(
    projectPath: string,
    nameParamValue: string,
    partName: string,
  ): Promise<
    | vscode.CompletionItem[]
    | vscode.CompletionList<vscode.CompletionItem>
    | null
    | undefined
  > {
    const characterDataList = this.infoWs.characterMap.get(projectPath);
    if (!characterDataList || !nameParamValue) {
      return null;
    }
    //nameパラメータで指定した名前のCharacterDataが存在するかを取得
    const layerMap = characterDataList.find(
      (characterData) => characterData.name === nameParamValue,
    )?.layer;
    if (!layerMap) {
      return null;
    }

    // 特定のキー（partName）でlayerMapの値を取得
    const characterLayerDataList = layerMap.get(partName);
    if (!characterLayerDataList) {
      return null;
    }

    const completions: vscode.CompletionItem[] = [];
    // idListをループしてCompletionItemを作成
    characterLayerDataList.forEach((layer) => {
      const comp = new vscode.CompletionItem(layer.id);
      comp.kind = vscode.CompletionItemKind.Variable;
      comp.insertText = layer.id;
      comp.detail = `${nameParamValue}の${partName}に定義されているid`;
      completions.push(comp);
    });

    return completions;
  }
  /**
   * ラベルへのインテリセンス
   * @param projectPath
   * @param storage storageパラメータで指定した値
   */
  private async completionLabel(
    projectPath: string,
    storage: string,
  ): Promise<
    | vscode.CompletionItem[]
    | vscode.CompletionList<vscode.CompletionItem>
    | null
    | undefined
  > {
    //タグ内のstorage先参照して、そのstorage先にのみ存在するラベルを出力するようにする
    const completions: vscode.CompletionItem[] = [];
    this.infoWs.labelMap.forEach(async (label, key) => {
      const labelProjectPath = await this.infoWs.getProjectPathByFilePath(key);
      if (projectPath === labelProjectPath) {
        label.forEach((value) => {
          // storageで指定したファイルに存在するラベルのみ候補に出す
          // storageがundefinedなら今開いているファイルを指定
          const storagePath =
            storage === undefined
              ? vscode.window.activeTextEditor?.document.uri.fsPath
              : projectPath +
                this.infoWs.DATA_DIRECTORY +
                this.infoWs.DATA_SCENARIO +
                this.infoWs.pathDelimiter +
                storage;
          if (this.infoWs.isSamePath(value.location.uri.fsPath, storagePath!)) {
            const comp = new vscode.CompletionItem(value.name);
            comp.kind = vscode.CompletionItemKind.Interface;
            comp.insertText = "*" + value.name;
            comp.documentation = new vscode.MarkdownString(
              `${value.description}`,
            );
            completions.push(comp);
          }
        });
      }
    });
    return completions;
  }

  /**
   * variableDataのnestObjectの予測変換
   * @param variableObject 変数のオブジェクト
   * @param splitVariable split関数でばらした変数の配列 e.g. f.hoge.fooをsplitした値
   */
  private async completionNestVariable(
    variableObject: VariableData,
    splitVariable: string[],
  ): Promise<
    | vscode.CompletionItem[]
    | vscode.CompletionList<vscode.CompletionItem>
    | null
    | undefined
  > {
    //splitVariableから末尾を削除
    splitVariable.pop();
    const completions: vscode.CompletionItem[] = [];
    if (splitVariable[0].startsWith("&")) {
      splitVariable[0] = splitVariable[0].substring(1);
    }
    
    if (splitVariable.length < 2) {
      return completions;
    }
    
    let sentence = `${splitVariable[0]}.${splitVariable[1]}`;

    // variableObjectは既にfindVariableObjectで見つかった対象のオブジェクト
    // f.hoge.の場合、variableObjectは"hoge"オブジェクト、splitVariableは["f", "hoge"]
    if (splitVariable.length === 2) {
      // 直接variableObjectの子要素を返す
      variableObject.nestVariableData.forEach((value) => {
        const comp = new vscode.CompletionItem(`${value.name}`);
        comp.filterText = `${sentence}.${value.name}`;
        comp.kind = vscode.CompletionItemKind.Variable;
        comp.insertText = new vscode.SnippetString(`${sentence}.${value.name}`);
        comp.detail = `${sentence}.${value.name}`;
        completions.push(comp);
      });
      return completions;
    }

    // 3階層以上の場合（f.hoge.foo.など）
    // splitVariable[2]以降をnavigateする
    for (let i = 2; i < splitVariable.length; i++) {
      const temp = variableObject.nestVariableData.find(
        (value) => value.name === splitVariable[i],
      );
      if (temp) {
        sentence += `.${temp.name}`;
        variableObject = temp;
      } else {
        return completions;
      }
      if (i === splitVariable.length - 1) {
        variableObject.nestVariableData.forEach((value) => {
          const comp = new vscode.CompletionItem(`${value.name}`);
          comp.filterText = `${sentence}.${value.name}`;
          comp.kind = vscode.CompletionItemKind.Variable;
          comp.insertText = new vscode.SnippetString(
            `${sentence}.${value.name}`,
          );
          comp.detail = `${sentence}.${value.name}`;
          completions.push(comp);
        });
      }
    }

    return completions;
  }

  /**
   * 変数の予測変換
   */
  private async completionVariable(
    projectPath: string,
    variableKind: string,
  ): Promise<
    | vscode.CompletionItem[]
    | vscode.CompletionList<vscode.CompletionItem>
    | null
    | undefined
  > {
    const completions: vscode.CompletionItem[] = [];
    this.infoWs.variableMap.forEach((_variable, key) => {
      if (key === projectPath) {
        this.infoWs.variableMap.get(key)?.forEach((value) => {
          if (value.kind == variableKind) {
            const comp = new vscode.CompletionItem(
              value.kind + "." + value.name,
            );
            comp.kind = vscode.CompletionItemKind.Variable;
            comp.insertText = new vscode.SnippetString(
              value.kind + "." + value.name,
            );
            completions.push(comp);
          }
        });
      }
    });
    return completions;
  }

  /**
   * ファイルなどのリソースや、pageパラメータやlayerパラメータなどの列挙定数の予測変換
   * @param projectPath
   * @param requireResourceType
   * @param referencePath そのタグの参照するディレクトリのパス。例えば、bgタグならbgimageフォルダのパス
   */
  private async completionResource(
    projectPath: string,
    requireResourceType: string | string[],
    referencePath: string,
    paramConfig?: TagParameterConfig,
  ): Promise<
    | vscode.CompletionItem[]
    | vscode.CompletionList<vscode.CompletionItem>
    | null
    | undefined
  > {
    const completions: vscode.CompletionItem[] = [];

    // typeを配列に正規化
    const typeArray = Array.isArray(requireResourceType)
      ? requireResourceType
      : [requireResourceType];

    // enumタイプの処理
    if (typeArray.includes("enum") && paramConfig?.values) {
      paramConfig.values.forEach((value) => {
        const comp = new vscode.CompletionItem({
          label: value,
          // description: `Enum value: ${value}`,
          // detail: "Predefined enum value",
        });
        comp.kind = vscode.CompletionItemKind.Enum;
        comp.insertText = value;
        completions.push(comp);
      });
    }

    // layerタイプの処理
    if (typeArray.includes("layer")) {
      const configValues = await this.getConfigValues(projectPath);

      // 0からnumCharacterLayersまでの数値を追加
      for (let i = 0; i <= configValues.numCharacterLayers; i++) {
        const comp = new vscode.CompletionItem({
          label: i.toString(),
          // description: `Character layer ${i}`,
          // detail: "Character layer number",
        });
        comp.kind = vscode.CompletionItemKind.Value;
        comp.insertText = i.toString();
        completions.push(comp);
      }

      // message0からmessage{numMessageLayers}までを追加
      for (let i = 0; i <= configValues.numMessageLayers; i++) {
        const messageLayer = `message${i}`;
        const comp = new vscode.CompletionItem({
          label: messageLayer,
          // description: `Message layer ${i}`,
          // detail: "Message layer name",
        });
        comp.kind = vscode.CompletionItemKind.Value;
        comp.insertText = messageLayer;
        completions.push(comp);
      }
    }

    // 既存のリソースファイル処理（image, scenario等）
    this.infoWs.resourceFileMap.forEach((resourcesMap, key) => {
      if (projectPath === key) {
        resourcesMap.forEach((resource) => {
          if (typeArray.includes(resource.resourceType)) {
            const comp = new vscode.CompletionItem({
              label: resource.filePath
                .replace(
                  projectPath +
                    this.infoWs.DATA_DIRECTORY +
                    this.infoWs.pathDelimiter,
                  "",
                )
                .replace(/\\/g, "/"),
              description: resource.filePath.replace(
                projectPath + this.infoWs.pathDelimiter,
                "",
              ),
              detail: "",
            });
            comp.kind = vscode.CompletionItemKind.File;
            const referenceFilePath = path
              .relative(referencePath, resource.filePath)
              .replace(/\\/g, "/"); //基準パスからの相対パス
            comp.documentation = new vscode.MarkdownString(
              `${referenceFilePath}<br>`,
            );
            comp.documentation.appendMarkdown(
              `<img src="${referenceFilePath}" width=350>`,
            );
            comp.documentation.supportHtml = true;
            comp.documentation.isTrusted = true;
            comp.documentation.supportThemeIcons = true;
            comp.documentation.baseUri = vscode.Uri.file(
              path.join(referencePath, path.sep),
            );
            comp.insertText = new vscode.SnippetString(referenceFilePath); //基準パスからの相対パス
            completions.push(comp);
          }
        });
      }
    });
    return completions;
  }

  private getPartListFromCharacterData(
    projectPath: string,
    nameParamValue: string,
  ): string[] {
    const characterDataList = this.infoWs.characterMap.get(projectPath);
    if (!characterDataList || !nameParamValue) {
      return [];
    }
    // nameパラメータで指定した名前のCharacterDataが存在するかを取得
    const layerMap = characterDataList.find(
      (characterData) => characterData.name === nameParamValue,
    )?.layer;
    if (!layerMap) {
      return [];
    }
    const partList = [...layerMap.keys()];
    return partList;
  }

  /**
   * タグ内のパラメータの予測変換
   */
  private async completionParameter(
    selectedTag: string,
    parameters: object,
    projectPath: string,
    nameParamValue: string,
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<
    | vscode.CompletionItem[]
    | vscode.CompletionList<vscode.CompletionItem>
    | null
    | undefined
  > {
    const completions: vscode.CompletionItem[] = [];

    // カーソルの左隣と右隣の文字を取得
    const lineText = document.lineAt(position.line).text;
    const charBeforeCursor =
      position.character > 0 ? lineText.charAt(position.character - 1) : "";
    const charAfterCursor =
      position.character < lineText.length
        ? lineText.charAt(position.character)
        : "";

    const suggestions = structuredClone(
      this.infoWs.suggestions.get(projectPath),
    ) as SuggestionsByTag; // TODO: Don't use type assertion //タグ補完に使うタグのリスト
    const partList = this.getPartListFromCharacterData(
      projectPath,
      nameParamValue,
    );
    //item:{}で囲ったタグの番号。0,1,2,3...
    //name:そのまんま。middle.jsonを見て。
    //item2:タグのパラメータ。0,1,2,3...って順に。
    for (const item in suggestions) {
      const tagName = suggestions[item]["name"]?.toString(); //タグ名。jumpとかpとかimageとか。
      if (selectedTag === tagName) {
        //nameの値によって、追加するパラメータを変更する。
        //chara_partタグなら特別にCharacterDataに存在するpartの値を追加する。
        if (selectedTag === "chara_part") {
          partList.forEach((part) => {
            suggestions[item]["parameters"].push({
              name: part,
              description: "chara_layerタグのpartパラメータで指定した値",
              required: false,
            });
          });
        }
        for (const item2 of suggestions[item]["parameters"]) {
          if (!(item2["name"] in parameters)) {
            //タグにないparameterのみインテリセンスに出す
            let detailText = "";
            if (!item2["detail"]) {
              detailText = item2["required"] ? "（必須）" : "";
            } else {
              detailText = item2["detail"];
            }

            const comp = new vscode.CompletionItem({
              label: item2["name"],
              description: "",
              detail: detailText,
            });

            // カーソルの左隣がダブルクォーテーション、または右隣に任意の文字がある場合は半角スペースを追加
            const spacePrefix = charBeforeCursor === '"' ? " " : "";
            const spaceSuffix = charAfterCursor !== "" ? " " : "";
            comp.insertText = new vscode.SnippetString(
              spacePrefix + item2["name"] + '="$0"' + spaceSuffix,
            );
            comp.documentation = new vscode.MarkdownString(
              item2["description"],
            );
            comp.kind = vscode.CompletionItemKind.Function;
            comp.command = {
              command: "editor.action.triggerSuggest",
              title: "Re-trigger completions...",
            };
            completions.push(comp);
          }
        }
      }
    }
    return completions;
  }
  /**
   * タグの予測変換
   */
  private async completionTag(
    projectPath: string,
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<
    | vscode.CompletionItem[]
    | vscode.CompletionList<vscode.CompletionItem>
    | null
    | undefined
  > {
    const completions: vscode.CompletionItem[] = [];
    const suggestionsByTag = this.infoWs.suggestions.get(
      projectPath,
    ) as SuggestionsMiniumByTag; // FIXME: Don't use type assertion

    // 現在の行の内容を取得
    const lineText = document.lineAt(position.line).text;
    const beforeCursor = lineText.substring(0, position.character);

    // @が存在するかチェック
    const hasAtSymbol = beforeCursor.includes("@");

    // [と]の間にいるかチェック
    const lastOpenBracket = beforeCursor.lastIndexOf("[");
    const lastCloseBracket = beforeCursor.lastIndexOf("]");
    const isInsideBrackets =
      lastOpenBracket > lastCloseBracket && lastOpenBracket !== -1;

    for (const suggestion of Object.values(suggestionsByTag)) {
      if (!suggestion.name) continue;
      const { name, description } = suggestion;
      try {
        // FIXME: Make the `try`-block smaller[]
        const textLabel = name.toString();
        const comp = new vscode.CompletionItem(textLabel);
        const inputType = vscode.workspace
          .getConfiguration()
          .get("TyranoScript syntax.completionTag.inputType");

        // insertTextを動的に決定
        let insertText: string;
        if (hasAtSymbol) {
          // @が存在する行なら、insertTextを@なしにする
          insertText = `${textLabel} $0`;
        } else if (isInsideBrackets) {
          // [と]の間でcompletionTagをした場合、insertTextから[と]を無しにする
          insertText = `${textLabel} $0`;
        } else {
          // 通常の場合
          insertText =
            inputType === "@" ? `@${textLabel} $0` : `[${textLabel} $0]`;
        }

        comp.insertText = new vscode.SnippetString(insertText);
        comp.documentation = new vscode.MarkdownString(description);
        comp.kind = vscode.CompletionItemKind.Class;
        comp.command = {
          command: "editor.action.triggerSuggest",
          title: "Re-trigger completions...",
        }; //ここに、サンプル2のような予測候補を出すコマンド
        completions.push(comp);
      } catch (error) {
        TyranoLogger.print(
          `${this.completionTag.name} failed`,
          ErrorLevel.ERROR,
        );
        TyranoLogger.printStackTrace(error);
      }
    }
    return completions;
  }
  private findLayerParts(
    projectPath: string,
    tagIndex: number,
    parsedData: { pm: { name: string } }[],
  ): string[] {
    try {
      //nameパラメータで指定した名前のCharacterDataが存在するかを取得
      const characterData = this.infoWs.characterMap
        .get(projectPath)
        ?.find(
          (characterData) =>
            characterData.name === parsedData[tagIndex]["pm"]["name"],
        );
      //characterDataのlayerのキー（part）の配列を取得
      const layerParts = characterData?.layer
        ? [...characterData.layer.keys()]
        : [];
      return layerParts;
    } catch (error) {
      TyranoLogger.print(
        `${this.findLayerParts.name} failed`,
        ErrorLevel.ERROR,
      );
      TyranoLogger.printStackTrace(error);
      return [];
    }
  }

  /**
   * プロジェクトの構成値を取得します。
   * @param projectPath プロジェクトのパス。
   * @returns numCharacterLayersとnumMessageLayersの値を含むオブジェクト。
   * 構成ファイルが存在しない場合、デフォルト値を返します。
   */
  private async getConfigValues(
    projectPath: string,
  ): Promise<{ numCharacterLayers: number; numMessageLayers: number }> {
    const configPath = path.join(projectPath, "data", "system", "Config.tjs");
    const defaultValues = { numCharacterLayers: 3, numMessageLayers: 2 };

    try {
      if (!fs.existsSync(configPath)) {
        return defaultValues;
      }

      const configContent = fs.readFileSync(configPath, "utf-8");
      const numCharacterLayers =
        this.extractConfigValue(configContent, "numCharacterLayers") ??
        defaultValues.numCharacterLayers;
      const numMessageLayers =
        this.extractConfigValue(configContent, "numMessageLayers") ??
        defaultValues.numMessageLayers;

      return { numCharacterLayers, numMessageLayers };
    } catch (error) {
      TyranoLogger.print(
        `${this.getConfigValues.name} failed: ${error}`,
        ErrorLevel.ERROR,
      );
      return defaultValues;
    }
  }

  /**
   * コンテンツから構成値を抽出します。
   * @param content 内部で検索するコンテンツ。
   * @param paramName 抽出するパラメーターの名前。
   * @returns 抽出された値またはnullが見つからない場合。
   */
  private extractConfigValue(
    content: string,
    paramName: string,
  ): number | null {
    try {
      const regex = new RegExp(`;\\s*${paramName}\\s*=\\s*(\\d+)\\s*;`, "m");
      const match = content.match(regex);
      return match ? parseInt(match[1], 10) : null;
    } catch (error) {
      TyranoLogger.print(
        `${this.extractConfigValue.name} failed for ${paramName}: ${error}`,
        ErrorLevel.ERROR,
      );
      return null;
    }
  }
}
