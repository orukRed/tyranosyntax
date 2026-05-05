import * as vscode from "vscode";
import * as path from "path";
import { Parser } from "../Parser";
import { InformationWorkSpace } from "../InformationWorkSpace";

type TagParamConfig = {
  [tagName: string]: {
    [paramName: string]: { type: string[] | string; path?: string };
  };
};

type LabelTargetInfo = {
  labelName: string; // *を含まない
  sourceFsPath: string; // ラベル定義側のファイル絶対パス
};

export class TyranoRenameProvider implements vscode.RenameProvider {
  private readonly parser = Parser.getInstance();
  private readonly infoWs = InformationWorkSpace.getInstance();

  constructor() {}

  /**
   * `TyranoScript syntax.tag.parameter` 設定から
   * `type` に "label" を含むパラメータを {tagName: [paramName, ...]} として返す
   */
  private getLabelParamsByTag(): Record<string, string[]> {
    const tagParams = vscode.workspace
      .getConfiguration()
      .get("TyranoScript syntax.tag.parameter") as TagParamConfig | undefined;
    const result: Record<string, string[]> = {};
    if (!tagParams) {
      return result;
    }
    for (const [tagName, params] of Object.entries(tagParams)) {
      for (const [paramName, def] of Object.entries(params)) {
        const types = Array.isArray(def?.type) ? def.type : [];
        if (types.includes("label")) {
          (result[tagName] ??= []).push(paramName);
        }
      }
    }
    return result;
  }

  /**
   * 値が変数指定（&, %, &f./&sf./&tf./&mp.）の場合 true を返す
   */
  private isNonLiteralValue(value: string): boolean {
    if (typeof value !== "string") return false;
    return /^[&%]/.test(value) || /(&|%)(f|sf|tf|mp)\./.test(value);
  }

  /**
   * 行頭の `*` ラベル定義からラベル名を抽出する
   * 例: "  *start  " → { name: "start", labelStart: 4 }
   */
  private parseLabelLine(
    lineText: string,
  ): { name: string; labelStart: number } | null {
    const match = lineText.match(/^(\s*)\*([a-zA-Z0-9_$.]+)/);
    if (!match) return null;
    return {
      name: match[2],
      labelStart: match[1].length + 1, // *の次の文字位置
    };
  }

  /**
   * 行内の指定タグ・指定パラメータの値範囲（labelName 部分のみ・`*` を除く）を全て返す
   */
  private findLabelValueRangesInLine(
    lineText: string,
    paramName: string,
    labelName: string,
  ): { start: number; end: number; rawValue: string }[] {
    const ranges: { start: number; end: number; rawValue: string }[] = [];
    // <param>="*<name>" / <param>='<name>' を許容
    const regex = new RegExp(
      `\\b${this.escapeRegExp(paramName)}\\s*=\\s*(["'])(\\*?)([^"']*)\\1`,
      "g",
    );
    let m: RegExpExecArray | null;
    while ((m = regex.exec(lineText)) !== null) {
      const value = m[3];
      if (value === labelName) {
        const quoteAndStar = m[1].length + m[2].length; // 開始quote + (*?)
        const valueStart =
          m.index + m[0].indexOf(m[1]) + quoteAndStar;
        ranges.push({
          start: valueStart,
          end: valueStart + value.length,
          rawValue: m[2] + value,
        });
      }
    }
    return ranges;
  }

  private escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * カーソル位置がラベル定義/参照のいずれであるかを判定し、
   * リネーム対象の Range とラベル情報を返す。
   */
  private async resolveLabelAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<
    | { range: vscode.Range; info: LabelTargetInfo }
    | null
  > {
    const lineText = document.lineAt(position.line).text;

    // 1) ラベル定義行の検出
    const labelLine = this.parseLabelLine(lineText);
    if (labelLine) {
      const labelStart = labelLine.labelStart;
      const labelEnd = labelStart + labelLine.name.length;
      if (position.character >= labelStart && position.character <= labelEnd) {
        return {
          range: new vscode.Range(
            new vscode.Position(position.line, labelStart),
            new vscode.Position(position.line, labelEnd),
          ),
          info: {
            labelName: labelLine.name,
            sourceFsPath: document.uri.fsPath,
          },
        };
      }
      // 行頭が * だがラベル名外（あるいは * の上）にカーソルがある場合は対象外
      return null;
    }

    // 2) ラベル参照の検出
    const labelParamsByTag = this.getLabelParamsByTag();
    const parsedLine = this.parser.parseText(lineText);
    const tagIndex = this.parser.getIndex(parsedLine, position.character);
    if (tagIndex < 0) return null;
    const tag = parsedLine[tagIndex];
    if (!tag) return null;
    const tagName: string = tag["name"];
    const labelParams = labelParamsByTag[tagName];
    if (!labelParams || labelParams.length === 0) return null;

    for (const paramName of labelParams) {
      const rawValue: unknown = tag["pm"]?.[paramName];
      if (typeof rawValue !== "string") continue;
      if (this.isNonLiteralValue(rawValue)) continue;
      const labelName = rawValue.replace(/^\*/, "");
      if (labelName === "") continue;

      // 行内で <param>="..." の値位置を探し、カーソルが値内ならその範囲を返す
      const regex = new RegExp(
        `\\b${this.escapeRegExp(paramName)}\\s*=\\s*(["'])(\\*?)([^"']*)\\1`,
        "g",
      );
      let m: RegExpExecArray | null;
      while ((m = regex.exec(lineText)) !== null) {
        const value = m[3];
        if (value !== labelName) continue;
        const quoteOpenIndex = m.index + m[0].indexOf(m[1]);
        const valueStart = quoteOpenIndex + m[1].length + m[2].length;
        const valueEnd = valueStart + value.length;
        // カーソルが * 上 or 値内なら対象
        const inValue =
          position.character >= valueStart && position.character <= valueEnd;
        const onAsterisk =
          m[2].length > 0 &&
          position.character >= valueStart - 1 &&
          position.character < valueStart;
        if (!inValue && !onAsterisk) continue;

        // sourceFsPath の解決: 同タグの storage パラメータがあれば
        // projectPath/data/scenario/<storage> を absolute path として採用、なければ現ファイル
        const storage: unknown = tag["pm"]?.["storage"];
        let sourceFsPath = document.uri.fsPath;
        if (typeof storage === "string" && storage.length > 0) {
          if (this.isNonLiteralValue(storage)) {
            return null;
          }
          const projectPath = await this.infoWs.getProjectPathByFilePath(
            document.uri.fsPath,
          );
          if (projectPath) {
            sourceFsPath = this.infoWs.convertToAbsolutePathFromRelativePath(
              projectPath +
                this.infoWs.DATA_DIRECTORY +
                this.infoWs.DATA_SCENARIO +
                this.infoWs.pathDelimiter +
                storage,
            );
          }
        }

        return {
          range: new vscode.Range(
            new vscode.Position(position.line, valueStart),
            new vscode.Position(position.line, valueEnd),
          ),
          info: { labelName, sourceFsPath },
        };
      }
    }
    return null;
  }

  /**
   * リネーム操作が可能かどうかを確認し、可能な場合はリネーム対象の範囲を返します
   *
   * @param document 対象のドキュメント
   * @param position カーソル位置
   * @returns リネーム可能な場合は範囲を、不可能な場合はnullを返します
   */
  async prepareRename(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
  ): Promise<vscode.Range | { range: vscode.Range; placeholder: string }> {
    const text = document.getText();
    const offset = document.offsetAt(position);
    const wordRegex = /[a-zA-Z0-9_$.]+/g;
    let match;

    // カーソル位置の行を取得
    const lineText = document.lineAt(position.line).text.trim();

    if (lineText.startsWith(";")) {
      throw new Error("コメントはリネーム不可です");
    }

    // ラベル（定義 or 参照）の判定
    const labelHit = await this.resolveLabelAtPosition(document, position);
    if (labelHit) {
      return labelHit.range;
    }

    // ラベル定義行で、ラベル名以外の位置にカーソルがある場合は従来通り不可
    if (lineText.startsWith("*")) {
      throw new Error("ラベルはリネーム不可です");
    }

    // カーソル位置の単語を検索
    while ((match = wordRegex.exec(text)) !== null) {
      if (match.index <= offset && offset <= match.index + match[0].length) {
        const word = match[0];

        // TyranoScript変数（f.、sf.、tf.で始まる）かどうかをチェック
        // マクロ定義のname属性かどうかをチェック
        const lineStart = text.lastIndexOf("\n", match.index) + 1;
        const lineEnd = text.indexOf("\n", match.index);
        const currentLine = text.substring(
          lineStart,
          lineEnd !== -1 ? lineEnd : text.length,
        );
        const isMacroName = /(@macro|\[macro)\s+name\s*=\s*["'].*["']/.test(
          currentLine,
        );

        // TyranoScript変数（f.、sf.、tf.で始まる）またはマクロ名の場合のみリネーム可能
        if (
          /^(f\.|sf\.|tf\.)?[a-zA-Z0-9_$]+$/.test(word) ||
          isMacroName ||
          (isMacroName && currentLine.includes(`name="${word}"`)) ||
          currentLine.includes(`name='${word}'`)
        ) {
          return new vscode.Range(
            document.positionAt(match.index),
            document.positionAt(match.index + match[0].length),
          );
        }
        break;
      }
    }

    throw new Error("選択箇所はリネーム不可です");
  }

  /**
   * カーソル位置の単語とその種類（マクロ名かどうか）を取得します
   */
  private getTargetWordInfo(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): { targetWord: string; isMacroName: boolean } | null {
    const text = document.getText();
    const offset = document.offsetAt(position);
    const wordRegex = /[a-zA-Z0-9_$.]+/g;
    let match;

    while ((match = wordRegex.exec(text)) !== null) {
      if (match.index <= offset && offset <= match.index + match[0].length) {
        const targetWord = match[0];
        const lineStart = text.lastIndexOf("\n", match.index) + 1;
        const lineEnd = text.indexOf("\n", match.index);
        const currentLine = text.substring(
          lineStart,
          lineEnd !== -1 ? lineEnd : text.length,
        );
        const isMacroName = /(@macro|\[macro)\s+name\s*=\s*["'].*["']/.test(
          currentLine,
        );
        return { targetWord, isMacroName };
      }
    }
    return null;
  }

  /**
   * マクロ名に関する変更をWorkspaceEditに追加します
   */
  private addMacroRenameEdits(
    workspaceEdit: vscode.WorkspaceEdit,
    fileUri: vscode.Uri,
    fileDocument: vscode.TextDocument,
    targetWord: string,
    newName: string,
  ): void {
    const fileText = fileDocument.getText();
    const macroPatterns = [
      new RegExp(
        `(@macro|\\[macro)\\s+name\\s*=\\s*["']${targetWord}["']`,
        "g",
      ),
      // マクロ呼び出しのパターンをより厳密に指定
      new RegExp(`\\[${targetWord}(\\s|\\])`, "g"), // マクロ呼び出し時は空白、]、=が続く場合のみマッチ
      new RegExp(`@${targetWord}(\\s|$)`, "g"), // @での呼び出し時は空白か行末が続く場合のみマッチ
    ];

    for (const pattern of macroPatterns) {
      let macroMatch;
      while ((macroMatch = pattern.exec(fileText)) !== null) {
        const matchStart = pattern.toString().includes("name")
          ? macroMatch.index + macroMatch[0].indexOf(targetWord)
          : macroMatch.index + 1;
        const matchLength = targetWord.length;

        workspaceEdit.replace(
          fileUri,
          new vscode.Range(
            fileDocument.positionAt(matchStart),
            fileDocument.positionAt(matchStart + matchLength),
          ),
          newName,
        );
      }
    }
  }

  /**
   * 変数名に関する変更をWorkspaceEditに追加します
   */
  private addVariableRenameEdits(
    workspaceEdit: vscode.WorkspaceEdit,
    fileUri: vscode.Uri,
    fileDocument: vscode.TextDocument,
    targetWord: string,
    newName: string,
  ): void {
    const prefixMatch = targetWord.match(/^(f\.|sf\.|tf\.)?(.+)$/);
    if (!prefixMatch) {
      return;
    }

    const [, prefix = "", baseName] = prefixMatch;
    const fileText = fileDocument.getText();
    const searchPattern = new RegExp(`(f\\.|sf\\.|tf\\.)?${baseName}`, "g");
    let match;

    while ((match = searchPattern.exec(fileText)) !== null) {
      const matchedPrefix = match[1] || "";
      if (matchedPrefix === prefix) {
        workspaceEdit.replace(
          fileUri,
          new vscode.Range(
            fileDocument.positionAt(match.index),
            fileDocument.positionAt(match.index + match[0].length),
          ),
          newName,
        );
      }
    }
  }

  /**
   * ラベルに関する変更をWorkspaceEditに追加します。
   * - 定義側: sourceFsPath の `*labelName` の `labelName` 部分を newName に置換
   * - 参照側: 任意ファイルで `<param>="*?labelName"` 形式の `labelName` 部分を newName に置換
   *   - 該当する `<param>` は `TyranoScript syntax.tag.parameter` の `type: ["label"]` から動的取得
   *   - 同タグの storage パラメータが指す .ks が sourceFsPath と一致する場合のみ対象
   *   - storage 未指定の参照は同一ファイル内のラベルを指すので、参照元 .ks と sourceFsPath が一致する場合のみ対象
   */
  private async addLabelRenameEdits(
    workspaceEdit: vscode.WorkspaceEdit,
    info: LabelTargetInfo,
    newName: string,
  ): Promise<void> {
    const cleanNewName = newName.replace(/^\*/, "");
    const labelParamsByTag = this.getLabelParamsByTag();

    const ksFiles = await vscode.workspace.findFiles("**/*.ks");
    for (const fileUri of ksFiles) {
      let fileDocument: vscode.TextDocument;
      try {
        fileDocument = await vscode.workspace.openTextDocument(fileUri);
      } catch {
        continue;
      }
      const fileFsPath = fileUri.fsPath;
      const projectPath =
        await this.infoWs.getProjectPathByFilePath(fileFsPath);

      // 1) 定義側のリネーム（このファイルが sourceFsPath なら）
      if (path.resolve(fileFsPath) === path.resolve(info.sourceFsPath)) {
        const text = fileDocument.getText();
        const lines = text.split(/\r?\n/);
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
          const lineText = lines[lineNum];
          const labelLine = this.parseLabelLine(lineText);
          if (labelLine && labelLine.name === info.labelName) {
            const start = labelLine.labelStart;
            const end = start + labelLine.name.length;
            workspaceEdit.replace(
              fileUri,
              new vscode.Range(
                new vscode.Position(lineNum, start),
                new vscode.Position(lineNum, end),
              ),
              cleanNewName,
            );
          }
        }
      }

      // 2) 参照側のリネーム
      const parsed = this.parser.parseText(fileDocument.getText());
      for (const data of parsed) {
        const tagName: string = data?.["name"];
        const labelParams = labelParamsByTag[tagName];
        if (!labelParams || labelParams.length === 0) continue;

        // storage を解決して sourceFsPath と一致するか判定
        const rawStorage: unknown = data?.["pm"]?.["storage"];
        let referencedFsPath: string | null = null;
        if (typeof rawStorage === "string" && rawStorage.length > 0) {
          if (this.isNonLiteralValue(rawStorage)) continue;
          if (!projectPath) continue;
          referencedFsPath = this.infoWs.convertToAbsolutePathFromRelativePath(
            projectPath +
              this.infoWs.DATA_DIRECTORY +
              this.infoWs.DATA_SCENARIO +
              this.infoWs.pathDelimiter +
              rawStorage,
          );
        } else {
          // storage 未指定 → 同一ファイル内
          referencedFsPath = fileFsPath;
        }
        if (
          path.resolve(referencedFsPath) !== path.resolve(info.sourceFsPath)
        ) {
          continue;
        }

        for (const paramName of labelParams) {
          const rawValue: unknown = data?.["pm"]?.[paramName];
          if (typeof rawValue !== "string") continue;
          if (this.isNonLiteralValue(rawValue)) continue;
          const labelName = rawValue.replace(/^\*/, "");
          if (labelName !== info.labelName) continue;

          // タグの行テキストを取得して該当パラメータの値位置を確定する
          const tagLine: number =
            typeof data["line"] === "number" ? data["line"] : -1;
          if (tagLine < 0 || tagLine >= fileDocument.lineCount) continue;
          const lineText = fileDocument.lineAt(tagLine).text;
          const ranges = this.findLabelValueRangesInLine(
            lineText,
            paramName,
            labelName,
          );
          for (const r of ranges) {
            workspaceEdit.replace(
              fileUri,
              new vscode.Range(
                new vscode.Position(tagLine, r.start),
                new vscode.Position(tagLine, r.end),
              ),
              cleanNewName,
            );
          }
        }
      }
    }
  }

  /**
   * Provide an edit that describes changes that have to be made to one
   * or many resources to rename a symbol to a different name.
   *
   * @param document The document in which the command was invoked.
   * @param position The position at which the command was invoked.
   * @param newName The new name of the symbol.
   * @return A workspace edit or null/undefined if the rename cannot be performed.
   */
  async provideRenameEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    newName: string,
    _token: vscode.CancellationToken,
  ): Promise<vscode.WorkspaceEdit> {
    const workspaceEdit = new vscode.WorkspaceEdit();

    // ラベル（定義 or 参照）リネーム
    const labelHit = await this.resolveLabelAtPosition(document, position);
    if (labelHit) {
      await this.addLabelRenameEdits(workspaceEdit, labelHit.info, newName);
      return workspaceEdit;
    }

    // カーソル位置の単語情報を取得
    const wordInfo = this.getTargetWordInfo(document, position);
    if (!wordInfo) {
      return workspaceEdit;
    }

    const { targetWord, isMacroName } = wordInfo;

    if (targetWord.startsWith("tf.")) {
      // tf変数の場合は現在のファイルにのみ変更を適用
      this.addVariableRenameEdits(
        workspaceEdit,
        document.uri,
        document,
        targetWord,
        newName,
      );
      return workspaceEdit;
    }
    // ワークスペース内のすべての.ksファイルを取得
    const ksFiles = await vscode.workspace.findFiles("**/*.ks");

    // 各ファイルに対して変更を適用
    for (const fileUri of ksFiles) {
      const fileDocument = await vscode.workspace.openTextDocument(fileUri);

      if (isMacroName) {
        this.addMacroRenameEdits(
          workspaceEdit,
          fileUri,
          fileDocument,
          targetWord,
          newName,
        );
      } else {
        this.addVariableRenameEdits(
          workspaceEdit,
          fileUri,
          fileDocument,
          targetWord,
          newName,
        );
      }
    }

    return workspaceEdit; //cg_image_buttonをリネームした時、workSpaceEditの中にtyrano.ksが2つある
  }
}
