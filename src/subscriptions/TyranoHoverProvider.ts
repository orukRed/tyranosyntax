import * as vscode from "vscode";
import * as fs from "fs";
import path from "path";
import { InformationWorkSpace } from "../InformationWorkSpace";
import { InformationExtension } from "../InformationExtension";
import { Parser } from "../Parser";

export class TyranoHoverProvider {
  private jsonTyranoSnippet: string;
  private regExp: RegExp;
  private infoWs: InformationWorkSpace = InformationWorkSpace.getInstance();
  private parser: Parser = Parser.getInstance();

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
    const markdownText = new vscode.MarkdownString();

    // baseUriを先に設定(HTMLコンテンツを追加する前に設定する必要がある)
    markdownText.baseUri = vscode.Uri.file(
      path.join(projectPath, defaultPath) + path.sep,
    );
    markdownText.supportHtml = true;
    markdownText.isTrusted = true;
    markdownText.supportThemeIcons = true;

    // 画像の絶対パスを作成
    const absoluteImagePath = vscode.Uri.file(
      path.join(projectPath, defaultPath, paramValue),
    ).toString();

    markdownText.appendMarkdown(`${paramValue}<br>`);
    markdownText.appendMarkdown(`<img src="${absoluteImagePath}" width=350>`);

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
      new RegExp(/\w+="[^"]+"/),
    );

    if (parameterWordRange) {
      //プロジェクトパス取得
      const projectPath: string = await this.infoWs.getProjectPathByFilePath(
        document.uri.fsPath,
      );

      //parameter名(storageとかgraphicとか)取得
      const parameter = document
        .getText(parameterWordRange)
        .match(/(\w+)="/)![1];

      //storage="hoge"のhogeを取得
      const regExpParameterValue = new RegExp(`${parameter}="([^"]+)"`);
      const match = document
        .getText(parameterWordRange)
        .match(regExpParameterValue);
      const parameterValue = match !== null ? match[1] : "";

      //Parserを使ってタグ全体を解析し、タグ名とすべてのパラメータを取得
      const lineText = document.lineAt(position.line).text;
      const parsedData = this.parser.parseText(lineText);

      //カーソル位置に対応するタグを見つける
      const tagData: { name?: string; pm?: Record<string, string>; column?: number } | undefined =
        parsedData.find(
          (item: { column?: number }) =>
            item.column !== undefined &&
            item.column <= position.character &&
            item.column + lineText.length >= position.character,
        );

      if (!tagData || !tagData.name) {
        return Promise.reject("no tag found");
      }

      const tag = tagData.name;
      const tagParameters = tagData.pm || {};

      //TyranoScript syntax.tag.parameterの値から、/data/bgimageなどのデフォルトパスを取得する
      const tagParams: object = await vscode.workspace
        .getConfiguration()
        .get("TyranoScript syntax.tag.parameter")!;

      if (!tagParams[tag] || !tagParams[tag][parameter]) {
        return Promise.reject("no config found for tag parameter");
      }

      let defaultPath = tagParams[tag][parameter]["path"]; // data/bgimage

      //folderパラメータが指定されている場合、そちらを優先する
      if (tagParameters["folder"]) {
        defaultPath = path.join(defaultPath, tagParameters["folder"]);
      }

      const imageViewMarkdownText = await this.createImageViewMarkdownText(
        parameterValue,
        projectPath,
        defaultPath,
      );
      return new vscode.Hover(imageViewMarkdownText);
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
