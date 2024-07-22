import * as vscode from "vscode";

export class TyranoOutlineProvider implements vscode.DocumentSymbolProvider {
  private readonly REGEX_VARIABLE =
    /\b(f\.|sf\.|tf\.|mp\.)([a-zA-Z_ぁ-んァ-ヶ一-龠Ａ-Ｚａ-ｚ]+)(([0-9a-zA-Z_ぁ-んァ-ヶ一-龠０-９Ａ-Ｚａ-ｚ]*))\b/; //変数検出用のアウトライン
  constructor() {}

  public provideDocumentSymbols(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken,
  ): vscode.ProviderResult<
    vscode.DocumentSymbol[] | vscode.SymbolInformation[]
  > {
    const symbols = [];
    let commentFlag: boolean = false; //複数行コメントになっているかのフラグ

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i); //i行目のドキュメントを取得

      //ブロックコメント中ならアウトラインとして表示しない(β機能)
      //FIXME: 「hoge /**/」とか「/**/ hoge」のような書き方をすると正しくアウトラインに表示されない。
      //解決策１：regExpの正規表現を変えて、/**/[p]のような書き方でも正しく正規表現されるようにする
      //解決策２：ブロックコメント内のアウトライン検出アルゴリズムを変える。
      if (
        vscode.workspace
          .getConfiguration()
          .get("TyranoScript syntax.outline.blockComment")
      ) {
        if (line.text.includes("/*")) {
          commentFlag = true;
        }
        if (line.text.includes("*/")) {
          commentFlag = false;
        }
      }

      //コメント中ならアウトラインとして表示しない
      if (line.text.startsWith(";") || commentFlag) {
        continue;
      }

      //タグのアウトライン表示
      if (this.isAddTagOutline(line.text)) {
        const symbol = new vscode.DocumentSymbol(
          line.text,
          "Component",
          vscode.SymbolKind.Class,
          line.range,
          line.range,
        );
        symbols.push(symbol);
      }

      //変数のアウトライン表示
      if (this.isAddVariableOutLine(line.text)) {
        const outlineText = line.text.match(this.REGEX_VARIABLE)![0];
        const symbol = new vscode.DocumentSymbol(
          outlineText,
          "Component",
          vscode.SymbolKind.Variable,
          line.range,
          line.range,
        );
        symbols.push(symbol);
      }

      //ラベルをアウトラインに表示
      if (this.isAddLabelOutLine(line.text)) {
        const symbol = new vscode.DocumentSymbol(
          line.text,
          "Component",
          vscode.SymbolKind.Function,
          line.range,
          line.range,
        );
        symbols.push(symbol);
      }
    }
    return symbols;
  }

  /**
   * 引数で渡した文字列に、アウトライン表示するタグが含まれているかを判定します。
   * @param text その行の文字列
   * @returns アウトライン表示するタグが含まれているならtrue,そうでないならfalse
   */
  private isAddTagOutline(text: string): boolean {
    const outlineTags: string[] | undefined = vscode.workspace
      .getConfiguration()
      .get("TyranoScript syntax.outline.tag"); //setting.jsonに記載のタグ取得
    if (!outlineTags) {
      return false;
    }

    const REGEX = /((\w+))\s*((\S*)="?(\w*)"?)*()/; //タグ検出用の正規表現
    const matcher = text.match(REGEX); //[hoge param=""]の形式のタグでマッチしてるかを探して変数に格納
    // タグとマッチしないなら戻る
    if (!matcher) {
      return false;
    }

    const tagName = matcher[1];

    return outlineTags.includes(tagName);
  }

  /**
   * 引数で渡した文字列に、アウトライン表示する変数が含まれているかを判定します。
   * @param text その行の文字列
   * @returns アウトライン表示する変数が含まれているならtrue,そうでないならfalse
   */
  private isAddVariableOutLine(text: string): boolean {
    if (text.search(this.REGEX_VARIABLE) !== -1) {
      return true;
    }
    return false;
  }

  /**
   * 引数で渡した文字列に、アウトライン表示するラベルが含まれているかを判定します。
   * @param text その行の文字列
   * @returns アウトライン表示するラベルが含まれているならtrue,そうでないならfalse
   */
  private isAddLabelOutLine(text: string): boolean {
    //ラベルをアウトラインに表示
    const REGEX = /^\*[0-9a-zA-Z\\-_]+/; //ラベル検出用正規表現

    if (text.search(REGEX) !== -1) {
      return true;
    }
    return false;
  }
}
