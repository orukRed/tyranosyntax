import { InformationWorkSpace } from "../InformationWorkSpace";

/**
 * bgimageなどに入っている素材フォルダ情報を格納するためのクラス
 */
export class ResourceFileData {
  public readonly fileName: string; //ファイル名：hoge.pngなど。
  public readonly filePath: string; //各リソースフォルダからのファイルパス。:hoge/foo/bar.pngなど。
  public readonly resourceType: string; //リソースタイプ。imageなど。

  public constructor(filePath: string, resourceType: string) {
    const infoWs = InformationWorkSpace.getInstance();
    this.fileName = filePath.split(infoWs.pathDelimiter).pop()!;
    this.filePath = filePath;
    this.resourceType = resourceType;
  }
}
