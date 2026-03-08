import { DefineMacroData } from "./defineData/DefineMacroData";
import { MacroParameterData } from "./defineData/MacroParameterData";
import { TextDocument } from "vscode-languageserver-textdocument";

/**
 * macroタグで定義した自作マクロ内で使用されるパラメータを抽出するクラス（サーバー側）。
 * vscode.TextDocument → TextDocument (vscode-languageserver-textdocument)
 */
export class MacroParameterExtractor {
  private static readonly MP_REGEX = /mp\.([a-zA-Z0-9_]+)/g;
  private static readonly PERCENT_REGEX = /%([a-zA-Z0-9_]+)(\|[^|\s\]]*)?/g;

  public extractMacroParameters(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    macroData: DefineMacroData | null,
    scenarioFileMap: Map<string, TextDocument>,
    suggestions?: Map<string, object>,
    projectPath?: string,
  ): void {
    if (!macroData) return;

    if (data["name"] === "text") {
      const doc = scenarioFileMap.get(macroData.filePath);
      if (doc) {
        const lineText = this.getLineText(doc, data["line"]);
        if (lineText) {
          this.extractParametersFromText(lineText, macroData);
        }
      }
    }

    if (data["pm"]) {
      const tagName = data["name"];
      Object.values(data["pm"]).forEach((paramValue: unknown) => {
        if (typeof paramValue === "string") {
          this.extractParametersFromText(paramValue, macroData, tagName);
        }
      });
    }

    if (suggestions && projectPath && this.hasAsteriskParameter(data)) {
      this.extractAsteriskParameters(data, macroData, suggestions, projectPath);
    }
  }

  /**
   * TextDocument から指定行のテキストを取得する。
   * vscode.TextDocument.lineAt() の代替。
   */
  private getLineText(doc: TextDocument, line: number): string | undefined {
    const text = doc.getText();
    const lines = text.split(/\r?\n/);
    if (line >= 0 && line < lines.length) {
      return lines[line];
    }
    return undefined;
  }

  private extractParametersFromText(
    text: string,
    macroData: DefineMacroData,
    tagName?: string,
  ): void {
    this.extractMpParameters(text, macroData);
    this.extractPercentParameters(text, macroData, tagName);
  }

  private extractMpParameters(text: string, macroData: DefineMacroData): void {
    const regex = new RegExp(
      MacroParameterExtractor.MP_REGEX.source,
      MacroParameterExtractor.MP_REGEX.flags,
    );
    let match;

    while ((match = regex.exec(text)) !== null) {
      const parameterName = match[1];
      const existingParam = macroData.parameter.find(
        (param) => param.name === parameterName,
      );

      if (!existingParam) {
        const parameterData = new MacroParameterData(
          parameterName,
          false,
          `mpパラメータ: ${parameterName}`,
          "(mp)",
        );
        macroData.parameter.push(parameterData);
      }
    }
  }

  private extractPercentParameters(
    text: string,
    macroData: DefineMacroData,
    tagName?: string,
  ): void {
    const regex = new RegExp(
      MacroParameterExtractor.PERCENT_REGEX.source,
      MacroParameterExtractor.PERCENT_REGEX.flags,
    );
    let match;

    while ((match = regex.exec(text)) !== null) {
      const parameterName = match[1];
      const defaultValue = match[2] ? match[2].substring(1) : undefined;

      const existingParam = macroData.parameter.find(
        (param) => param.name === parameterName,
      );

      if (!existingParam) {
        const baseDescription = defaultValue
          ? `%パラメータ: ${parameterName} (デフォルト値: ${defaultValue})`
          : `%パラメータ: ${parameterName}`;

        const description = tagName
          ? `${tagName}タグの${baseDescription}`
          : baseDescription;

        const parameterData = new MacroParameterData(
          parameterName,
          false,
          description,
          tagName ? `(${tagName} %)` : "(%)",
        );
        macroData.parameter.push(parameterData);
      }
    }
  }

  private hasAsteriskParameter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
  ): boolean {
    return data["pm"] && "*" in data["pm"];
  }

  private extractAsteriskParameters(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    macroData: DefineMacroData,
    suggestions: Map<string, object>,
    projectPath: string,
  ): void {
    const tagName = data["name"];
    if (!tagName) return;

    const tagDefinition = this.getTagDefinition(
      tagName,
      suggestions,
      projectPath,
    );
    if (!tagDefinition || !tagDefinition.parameters) return;

    const availableParameters = this.getAvailableParameters(tagDefinition);
    const existingParameters = this.getExistingParameters(data);

    const newParameters = availableParameters.filter(
      (paramName) =>
        !existingParameters.includes(paramName) &&
        !macroData.parameter.find((param) => param.name === paramName),
    );

    newParameters.forEach((paramName) => {
      const parameterData = new MacroParameterData(
        paramName,
        false,
        `マクロ内で使用している${tagDefinition.name}タグの*から自動抽出されたパラメータ: ${paramName}`,
        `(${tagDefinition.name} *)`,
      );
      macroData.parameter.push(parameterData);
    });
  }

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

    for (const suggestion of Object.values(suggestionsByTag)) {
      if ((suggestion as { name?: string }).name === tagName) {
        return suggestion as { name: string; parameters: { name: string }[] };
      }
    }
    return null;
  }

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

  private getExistingParameters(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
  ): string[] {
    if (!data["pm"]) return [];
    return Object.keys(data["pm"]).filter((key) => key !== "*");
  }
}
