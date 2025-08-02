import { DefineMacroData } from "./defineData/DefineMacroData";
import { MacroParameterData } from "./defineData/MacroParameterData";
import * as vscode from "vscode";

/**
 * マクロ内で使用されるパラメータを抽出するクラス
 */
export class MacroParameterExtractor {
  private static readonly MP_REGEX = /mp\.([a-zA-Z0-9_]+)/g;
  private static readonly PERCENT_REGEX = /%([a-zA-Z0-9_]+)(\|[^|\s\]]*)?/g;

  /**
   * マクロ内でパラメータを抽出する
   * @param data パースされたデータ
   * @param macroData 現在のマクロデータ
   * @param scenarioFileMap シナリオファイルマップ
   * @param suggestions タグ定義情報
   * @param projectPath プロジェクトパス
   */
  public extractMacroParameters(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    macroData: DefineMacroData | null,
    scenarioFileMap: Map<string, vscode.TextDocument>,
    suggestions?: Map<string, object>,
    projectPath?: string,
  ): void {
    if (!macroData) return;

    // テキスト行の場合
    if (data["name"] === "text") {
      const lineText = scenarioFileMap
        .get(macroData.filePath)
        ?.lineAt(data["line"]).text;
      if (lineText) {
        this.extractParametersFromText(lineText, macroData);
      }
    }

    // その他のタグでexpパラメータを持つ場合
    if (data["pm"]) {
      Object.values(data["pm"]).forEach((paramValue: unknown) => {
        if (typeof paramValue === "string") {
          this.extractParametersFromText(paramValue, macroData);
        }
      });
    }

    // *パラメータがある場合の処理
    //FIXME:ちゃんと動いていないので要修正
    if (suggestions && projectPath && this.hasAsteriskParameter(data)) {
      this.extractAsteriskParameters(data, macroData, suggestions, projectPath);
    }
  }

  /**
   * テキストからパラメータを抽出してマクロデータに追加
   * @param text 検索対象のテキスト
   * @param macroData マクロデータ
   */
  private extractParametersFromText(
    text: string,
    macroData: DefineMacroData,
  ): void {
    // mp.パラメータの抽出
    this.extractMpParameters(text, macroData);

    // %パラメータの抽出
    this.extractPercentParameters(text, macroData);
  }

  /**
   * テキストからmp.パラメータを抽出してマクロデータに追加
   * @param text 検索対象のテキスト
   * @param macroData マクロデータ
   */
  private extractMpParameters(text: string, macroData: DefineMacroData): void {
    // 正規表現を新しく作成して、グローバルフラグの状態をリセット
    const regex = new RegExp(
      MacroParameterExtractor.MP_REGEX.source,
      MacroParameterExtractor.MP_REGEX.flags,
    );
    let match;

    while ((match = regex.exec(text)) !== null) {
      const parameterName = match[1];

      // 既に存在するパラメータかチェック
      const existingParam = macroData.parameter.find(
        (param) => param.name === parameterName,
      );

      if (!existingParam) {
        // 新しいパラメータとして追加
        const parameterData = new MacroParameterData(
          parameterName,
          false, // mpパラメータは必須ではない
          `マクロパラメータ: ${parameterName}`,
        );
        macroData.parameter.push(parameterData);
      }
    }
  }

  /**
   * テキストから%パラメータを抽出してマクロデータに追加
   * @param text 検索対象のテキスト
   * @param macroData マクロデータ
   */
  private extractPercentParameters(
    text: string,
    macroData: DefineMacroData,
  ): void {
    // 正規表現を新しく作成して、グローバルフラグの状態をリセット
    const regex = new RegExp(
      MacroParameterExtractor.PERCENT_REGEX.source,
      MacroParameterExtractor.PERCENT_REGEX.flags,
    );
    let match;

    while ((match = regex.exec(text)) !== null) {
      const parameterName = match[1];
      const defaultValue = match[2] ? match[2].substring(1) : undefined; // |を除去

      // 既に存在するパラメータかチェック
      const existingParam = macroData.parameter.find(
        (param) => param.name === parameterName,
      );

      if (!existingParam) {
        // 新しいパラメータとして追加
        const description = defaultValue
          ? `マクロパラメータ: ${parameterName} (デフォルト値: ${defaultValue})`
          : `マクロパラメータ: ${parameterName}`;

        const parameterData = new MacroParameterData(
          parameterName,
          false, // %パラメータは必須ではない（デフォルト値があるため）
          description,
        );
        macroData.parameter.push(parameterData);
      }
    }
  }

  /**
   * *パラメータが含まれているかチェック
   * @param data パースされたデータ
   * @returns *パラメータが存在するか
   */
  private hasAsteriskParameter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
  ): boolean {
    return data["pm"] && data["pm"]["*"] !== undefined;
  }

  /**
   * *パラメータから利用可能なタグパラメータを抽出
   * @param data パースされたデータ
   * @param macroData マクロデータ
   * @param suggestions タグ定義情報
   * @param projectPath プロジェクトパス
   */
  private extractAsteriskParameters(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    macroData: DefineMacroData,
    suggestions: Map<string, object>,
    projectPath: string,
  ): void {
    const tagName = data["name"];
    if (!tagName) return;

    // タグ定義を取得
    const tagDefinition = this.getTagDefinition(
      tagName,
      suggestions,
      projectPath,
    );
    if (!tagDefinition || !tagDefinition.parameters) return;

    // 利用可能なパラメータを取得
    const availableParameters = this.getAvailableParameters(tagDefinition);

    // 既存のパラメータを取得
    const existingParameters = this.getExistingParameters(data);

    // 既存パラメータと重複するパラメータを除外
    const newParameters = availableParameters.filter(
      (paramName) =>
        !existingParameters.includes(paramName) &&
        !macroData.parameter.find((param) => param.name === paramName),
    );

    // 新しいパラメータをマクロデータに追加
    newParameters.forEach((paramName) => {
      const parameterData = new MacroParameterData(
        paramName,
        false, // *パラメータは必須ではない
        `*から自動抽出されたパラメータ: ${paramName}`,
      );
      macroData.parameter.push(parameterData);
    });
  }

  /**
   * タグ定義を取得
   * @param tagName タグ名
   * @param suggestions タグ定義情報
   * @param projectPath プロジェクトパス
   * @returns タグ定義オブジェクト
   */
  private getTagDefinition(
    tagName: string,
    suggestions: Map<string, object>,
    projectPath: string,
  ): { name: string; parameters: { name: string }[] } | null {
    const suggestionsByTag = suggestions.get(projectPath) as Record<
      string,
      unknown
    >;
    if (!suggestionsByTag) return null;

    // suggestionsから該当するタグを検索
    for (const suggestion of Object.values(suggestionsByTag)) {
      if ((suggestion as { name?: string }).name === tagName) {
        return suggestion as { name: string; parameters: { name: string }[] };
      }
    }
    return null;
  }

  /**
   * タグ定義から利用可能なパラメータ名の配列を取得
   * @param tagDefinition タグ定義
   * @returns パラメータ名の配列
   */
  private getAvailableParameters(tagDefinition: {
    parameters: { name: string }[];
  }): string[] {
    if (!tagDefinition.parameters || !Array.isArray(tagDefinition.parameters)) {
      return [];
    }

    return tagDefinition.parameters
      .map((param: { name: string }) => param.name)
      .filter((name: string) => name && typeof name === "string");
  }

  /**
   * 現在のタグで既に指定されているパラメータを取得
   * @param data パースされたデータ
   * @returns 既存パラメータ名の配列
   */
  private getExistingParameters(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
  ): string[] {
    if (!data["pm"]) return [];

    return Object.keys(data["pm"]).filter((key) => key !== "*");
  }
}
