import * as vscode from "vscode";
export class InformationExtension {
  private static instance: InformationExtension = new InformationExtension();
  private constructor() {}
  public static getInstance(): InformationExtension {
    return this.instance;
  }

  public static path: string | undefined = undefined;
  public static readonly language: string = this.setLanguage();

  private static setLanguage(): string {
    const configLanguage: string =
      vscode.workspace.getConfiguration().get("TyranoScript syntax.language") ??
      "default";
    if (configLanguage === "default") {
      return vscode.env.language;
    } else {
      return configLanguage;
    }
  }
}
