import { InformationWorkSpace } from "../InformationWorkSpace";

/**
 * bgimageなどに入っている素材フォルダ情報を格納するためのクラス
 */
export class ResourceFileData {
  private infoWs: InformationWorkSpace = InformationWorkSpace.getInstance();
  private _fileName: string; //ファイル名：hoge.pngなど。
  private _filePath: string; //各リソースフォルダからのファイルパス。:hoge/foo/bar.pngなど。
  private _resourceType: string; //リソースタイプ。imageなど。

  public get fileName(): string {
    return this._fileName;
  }
  public get filePath(): string {
    return this._filePath;
  }
  public get resourceType(): string {
    return this._resourceType;
  }

  public constructor(_filePath: string, _resourceType: string) {
    this._fileName = _filePath.split(this.infoWs.pathDelimiter).pop()!;
    this._filePath = _filePath;
    this._resourceType = _resourceType;
  }
}
