import * as vscode from "vscode";
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
  ]; //tyranoJumpProviderでの定義と同じもの。重複なのでどこかで定義すべき？

  private storage: string | undefined; //storageタグで指定したファイルパス
  private target: string | undefined; //targetタグで指定したラベル名
  private tag: string | undefined; //buttonやjumpなどのタグ名
  private currentLabel: string | undefined; //現在のラベル名
  private condition: string | undefined; //条件分岐の条件式
  private currentFile: string | undefined; //現在のファイルパス
  //上記のパラメータを定義したファイルパス
  private fileUri: vscode.Location | undefined;

  public constructor(
    tag: string,
    storage: string | undefined,
    target: string | undefined,
    currentLabel: string | undefined,
    condition: string | undefined,
    fileUri: vscode.Location | undefined,
  ) {
    this.tag = tag;
    this.storage = storage;
    this.target = target;
    this.currentLabel = currentLabel;
    this.condition = condition;
    this.fileUri = fileUri;
    if (fileUri) {
      //data / scenario以降のパスを取得
      this.currentFile = this.extractAfter(fileUri.uri.path, "data/scenario/");
    }
  }

  /**
   *
   * @param str 特定文字列より後ろを抽出します。
   * @param target
   * @returns
   */
  private extractAfter(str: string, target: string) {
    const index = str.indexOf(target);
    if (index >= 0) {
      return str.substring(index + target.length);
    } else {
      return "";
    }
  }
}

