import { InformationWorkSpace, TyranoResourceType } from '../InformationWorkSpace';

/**
 * bgimageなどに入っている素材フォルダ情報を格納するためのクラス
 */
export class ResourceFileData {

	fileName: string;//ファイル名：hoge.pngなど。
	filePath: string;//各リソースフォルダからのファイルパス。:hoge/foo/bar.pngなど。

	public constructor(fileName: string, filePath: string,) {
		this.fileName = fileName;
		this.filePath = filePath;
	}

}