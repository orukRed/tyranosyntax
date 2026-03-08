import { Location } from "vscode-languageserver/node";
import { MacroParameterData } from "./MacroParameterData";

export class DefineMacroData {
  public readonly macroName: string;
  public readonly filePath: string;
  public readonly location: Location | null;
  public readonly parameter: MacroParameterData[] = [];
  public description: string;

  public constructor(
    macroName: string,
    location: Location,
    filePath: string,
    description: string,
  ) {
    this.macroName = macroName;
    this.location = location;
    this.filePath = filePath;
    this.description = description;
  }

  private parseParametersToJsonObject(): object[] {
    return this.parameter.map((parameter) => ({
      name: parameter.name,
      required: parameter.required,
      description: parameter.description,
      detail: parameter.detail,
    }));
  }

  public parseToJsonObject(): object {
    return {
      name: this.macroName,
      description: this.description,
      parameters: this.parseParametersToJsonObject(),
    };
  }
}
