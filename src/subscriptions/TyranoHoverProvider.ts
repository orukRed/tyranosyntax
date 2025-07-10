import * as vscode from "vscode";
import * as fs from "fs";
import path from "path";
import { InformationWorkSpace } from "../InformationWorkSpace";
import { InformationExtension } from "../InformationExtension";

export class TyranoHoverProvider {
  private jsonTyranoSnippet: string;
  private regExp: RegExp;
  private infoWs: InformationWorkSpace = InformationWorkSpace.getInstance();

  constructor() {
    this.jsonTyranoSnippet = JSON.parse(
      fs.readFileSync(this.getTooltipPath(), "utf8"),
    );
    // this.regExp = /(\w+)(\s*((\w*)=\"?([a-zA-Z0-9_./\*]*)\"?)*)*/;//取得した行に対しての正規表現	//タグのどこをホバーしてもツールチップ出る版
    this.regExp = /(\[||@)(\w+)(\s*)/; //取得した行に対しての正規表現 //タグ名のみホバーでツールチップ出る版
  }

  private getTooltipPath(): string {
    return InformationExtension.language === "ja"
      ? path.join(
          InformationExtension.path +
            `${path.sep}Tooltip${path.sep}tyrano.Tooltip.json`,
        )
      : path.join(
          InformationExtension.path +
            `${path.sep}Tooltip${path.sep}en.tyrano.Tooltip.json`,
        );
  }

  private createMarkdownText(textValue: string): vscode.MarkdownString | null {
    if (!textValue) return null;
    const textCopy = textValue["description"].slice(); //非同期通信では引数で受け取った配列を変更してはいけない
    const backQuoteStartIndex = textCopy.indexOf("[パラメータ]");
    textCopy.splice(backQuoteStartIndex, 0, "```tyrano"); //マークダウンの作成
    textCopy.push("```");

    //マークダウン崩れるのでここはインデント変えたらだめ
    const sentence = `
### ${textValue["prefix"]}

${textCopy.join("  \n")}
`;
    const markdownText = new vscode.MarkdownString(sentence);

    return markdownText;
  }

  /**
   * 引数の情報から、画像を表示するためのMarkdownStringを作成して返却します。
   * @param paramValue storage="hoge"などの、hogeの部分
   * @param projectPath
   * @param defaultPath
   * @returns
   */
  private async createImageViewMarkdownText(
    paramValue: string,
    projectPath: string,
    defaultPath: string,
  ): Promise<vscode.MarkdownString> {
    //chara/akane/angry.png
    const markdownText = new vscode.MarkdownString(`${paramValue}<br>`);
    markdownText.appendMarkdown(`<img src="${paramValue}" width=350>`);
    markdownText.supportHtml = true;
    markdownText.isTrusted = true;
    markdownText.supportThemeIcons = true;
    //data/fgimage
    markdownText.baseUri = vscode.Uri.file(
      path.join(projectPath, defaultPath, path.sep),
    );
    return markdownText;
  }

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
  ): Promise<vscode.Hover> {
    //param="hoge"の部分があるかどうか検索
    const parameterWordRange = document.getWordRangeAtPosition(
      position,
      new RegExp(/[\S]+="[\S]+"/),
    );

    if (parameterWordRange) {
      //プロジェクトパス取得
      const projectPath: string = await this.infoWs.getProjectPathByFilePath(
        document.uri.fsPath,
      );

      //タグ名取得
      const exp =
        /(\w+)(\s*((\w*)="?([\w\u3040-\u30FF\u4E00-\u9FFF./*]*)"?)*)*/;
      const wordRange = document.getWordRangeAtPosition(position, exp);
      const matcher: RegExpMatchArray | null = document
        .getText(wordRange)
        .match(exp);
      const tag = matcher![1];

      //parameter名(storageとかgraphicとか)取得
      const parameter = document
        .getText(parameterWordRange)
        .match(/(\w+)="/)![1];

      //storage="hoge"のhogeを取得 この処理もParserに移動してよさそう？ 要検討
      const regExpParameterValue = new RegExp(`${parameter}="([^"]+)"`);
      const match = document
        .getText(parameterWordRange)
        .match(regExpParameterValue);
      const parameterValue = match !== null ? match[1] : "";

      //TyranoScript syntax.tag.parameterの値から、/data/bgimageなどのデフォルトパスを取得する
      const tagParams: object = await vscode.workspace
        .getConfiguration()
        .get("TyranoScript syntax.tag.parameter")!;
      const defaultPath = tagParams[tag][parameter]["path"]; // data/bgimage

      return new vscode.Hover(
        await this.createImageViewMarkdownText(
          parameterValue,
          projectPath,
          defaultPath,
        ),
      );
    }

    const wordRange = document.getWordRangeAtPosition(position, this.regExp);
    if (!wordRange) {
      return Promise.reject("no word here"); //指定文字がなかった時。引数で与えられた理由でPromiseオブジェクトを返却
    }

    const matcher: RegExpMatchArray | null = document
      .getText(wordRange)
      .match(this.regExp);
    let markdownText = null;
    if (matcher != null) {
      markdownText = this.createMarkdownText(
        this.jsonTyranoSnippet[matcher[2]],
      );
    }

    if (!markdownText) {
      return Promise.reject("unmatched."); //指定文字がなかった時。引数で与えられた理由でPromiseオブジェクトを返却
    }
    return new vscode.Hover(markdownText); //解決したPromiseオブジェクトを返却。この場合、現在の文字列を返却
  }
}


