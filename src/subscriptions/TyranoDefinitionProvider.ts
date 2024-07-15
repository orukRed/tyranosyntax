import * as vscode from "vscode";
import { InformationWorkSpace } from "../InformationWorkSpace";
import { Parser } from "../Parser";

/**
 * F12押したタグの定義元へジャンプするクラスです。
 */
export class TyranoDefinitionProvider {
  private readonly infoWs = InformationWorkSpace.getInstance();
  private readonly parser = Parser.getInstance();
  constructor() {}

  /**
   * Provide the definition of the symbol at the given position and document.
   *
   * @param document The document in which the command was invoked.
   * @param position The position at which the command was invoked.
   * @param token A cancellation token.
   * @return A definition or a thenable that resolves to such. The lack of a result can be
   * signaled by returning `undefined` or `null`.
   */

  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<vscode.Definition | vscode.LocationLink[] | null | undefined> {
    const projectPath = await this.infoWs.getProjectPathByFilePath(
      document.uri.fsPath,
    );
    const parsedData = this.parser.parseText(
      document.lineAt(position.line).text,
    );
    const tagIndex = this.parser.getIndex(parsedData, position.character);
    //カーソル位置のマクロのMapデータ取得
    const retMacroData = this.infoWs.defineMacroMap
      .get(projectPath)
      ?.get(parsedData[tagIndex]["name"]);

    return retMacroData?.location;
  }
}
