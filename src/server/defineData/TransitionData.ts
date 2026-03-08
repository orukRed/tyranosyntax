import { Location } from "vscode-languageserver/node";

/**
 * jump系のタグで指定したファイル名やラベル名を保持するクラス
 */
export class TransitionData {
  public static jumpTags = [
    "scenario",
    "script",
    "html",
    "css",
    "jump",
    "button",
    "glink",
  ];

  public readonly storage: string | undefined;
  public readonly target: string | undefined;
  public readonly tag: string | undefined;
  public readonly currentLabel: string | undefined;
  public readonly condition: string | undefined;
  public readonly currentFile: string | undefined;
  public readonly fileUri: Location | undefined;

  public constructor(
    tag: string,
    storage: string | undefined,
    target: string | undefined,
    currentLabel: string | undefined,
    condition: string | undefined,
    fileUri: Location | undefined,
  ) {
    this.tag = tag;
    this.storage = storage;
    this.target = target;
    this.currentLabel = currentLabel;
    this.condition = condition;
    this.fileUri = fileUri;
    if (fileUri) {
      this.currentFile = this.extractAfter(fileUri.uri, "data/scenario/");
    }
  }

  private extractAfter(str: string, target: string) {
    const index = str.indexOf(target);
    if (index >= 0) {
      return str.substring(index + target.length);
    } else {
      return "";
    }
  }
}
