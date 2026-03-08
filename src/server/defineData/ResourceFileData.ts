import * as path from "path";

/**
 * bgimageなどに入っている素材フォルダ情報を格納するためのクラス（サーバー側）
 */
export class ResourceFileData {
  public readonly fileName: string; //ファイル名：hoge.pngなど。
  public readonly filePath: string; //各リソースフォルダからのファイルパス
  public readonly resourceType: string; //リソースタイプ。imageなど。

  public constructor(filePath: string, resourceType: string) {
    this.fileName = path.basename(filePath);
    this.filePath = filePath;
    this.resourceType = resourceType;
  }
}
