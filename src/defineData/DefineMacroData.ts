/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from "vscode";
import { MacroParameterData } from "./MacroParameterData";
import { MacroParameterAnalyzer } from "./MacroParameterAnalyzer";

interface ParameterConfig {
  required?: boolean;
  description?: string;
}

interface PluginConfig {
  parameters?: Record<string, ParameterConfig>;
}

export class DefineMacroData {
  private _macroName: string = ""; //マクロ名。[hoge]などのhoge部分。
  private _filePath: string = "";
  private _location: vscode.Location | null = null; //定義ジャンプに使う位置情報
  private _parameter: MacroParameterData[] = []; //TODO:まだ未実装だけどそのうち追加する。マクロのパラメータ
  private _description: string = ""; //マクロの説明

  public constructor(
    macroName: string,
    location: vscode.Location,
    filePath: string,
    description: string,
  ) {
    this._macroName = macroName;
    this._location = location;
    this._filePath = filePath;
    this._description = description;
  }

  /**
   * マクロで定義したパラメータを入れる用のメソッド
   * 自動検出されたパラメータと手動で設定されたパラメータを統合します
   */
  private parseParametersToJsonObject(): Record<string, Record<string, any>> {
    const obj: Record<string, Record<string, any>> = {};
    this._parameter.forEach((parameter) => {
      obj[parameter.name] = {
        name: parameter.name,
        required: parameter.required,
        description: parameter.description,
      };
    });
    return obj;
  }

  /**
   * 入力補完に使うjsonオブジェクトへと変換します。
   * @returns
   */
  public parseToJsonObject(): object {
    return {
      name: this.macroName,
      description: this.description,
      parameters: this.parseParametersToJsonObject(),
    };
  }

  public get macroName(): string {
    return this._macroName;
  }
  public get filePath(): string {
    return this._filePath;
  }
  public get location(): vscode.Location | null {
    return this._location;
  }
  public get description(): string {
    return this._description;
  }
  public set description(value: string) {
    this._description = value;
  }
  /**
   * Analyzes macro content and automatically sets parameters based on detected patterns
   * @param fileContent The full file content containing the macro
   * @param existingPluginConfig Optional existing plugin configuration for this macro
   */
  public analyzeAndSetParameters(fileContent: string, existingPluginConfig?: PluginConfig): void {
    const macroContent = MacroParameterAnalyzer.extractMacroContent(fileContent, this._macroName);
    const detectedParams = MacroParameterAnalyzer.analyzeParameters(macroContent);
    
    // First, add manually configured parameters if they exist
    if (existingPluginConfig && existingPluginConfig.parameters) {
      for (const [paramName, paramConfig] of Object.entries(existingPluginConfig.parameters)) {
        this._parameter.push(new MacroParameterData(
          paramName,
          paramConfig.required || false,
          paramConfig.description || "Manually configured parameter"
        ));
      }
    }
    
    // Then add auto-detected parameters that aren't already manually configured
    const existingParamNames = new Set(this._parameter.map(p => p.name));
    
    for (const paramName of detectedParams) {
      if (!existingParamNames.has(paramName)) {
        this._parameter.push(new MacroParameterData(
          paramName,
          false, // Auto-detected parameters are not required by default
          `Auto-detected parameter from macro content`
        ));
      }
    }
  }

  public get parameter(): MacroParameterData[] {
    return this._parameter;
  }

  public set parameter(value: MacroParameterData[]) {
    this._parameter = value;
  }
}

