/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from "vscode";
import { InformationWorkSpace } from "../../InformationWorkSpace";
import { Parser } from "../../Parser";
import { LocationNode } from "./SymbolTreeItem";

const CHARACTER_USAGE_TAGS = new Set<string>([
  "chara_show",
  "chara_hide",
  "chara_mod",
  "chara_face",
  "chara_layer",
  "chara_move",
  "chara_delete",
  "chara_ptext",
  "chara_config",
]);

const MAX_USAGE_RESULTS = 200;

interface CachedTags {
  version: number;
  tags: any[];
}

/**
 * シナリオファイル全体を走査して、マクロ・変数・キャラクターの「使用箇所」を集計する。
 * vscode の登録系 API には触らない純粋ロジック。
 */
export class UsageIndexer {
  private readonly parser: Parser = Parser.getInstance();
  private readonly parseCache: Map<string, CachedTags> = new Map();

  constructor(private readonly infoWs: InformationWorkSpace) {}

  /**
   * 引数のファイルに紐づくキャッシュを破棄する。
   * FileSystemWatcher などからファイル更新通知時に呼ぶ。
   */
  public invalidate(filePath: string): void {
    this.parseCache.delete(filePath);
  }

  /**
   * すべてのキャッシュを破棄する。
   */
  public invalidateAll(): void {
    this.parseCache.clear();
  }

  /**
   * マクロ呼び出しの使用箇所一覧を返す。
   * @param macroName 検索対象のマクロ名
   * @param definitionFilePath 定義のあるファイルパス（同一行のマクロ定義を除外するため）
   * @param definitionLine 定義のある行番号（0始まり）
   */
  public findMacroUses(
    macroName: string,
    definitionFilePath?: string,
    definitionLine?: number,
  ): LocationNode[] {
    if (!macroName) {
      return [];
    }
    const results: LocationNode[] = [];
    for (const [filePath, doc] of this.infoWs.scenarioFileMap) {
      const tags = this.getParsedTags(filePath, doc);
      for (const tag of tags) {
        if (results.length >= MAX_USAGE_RESULTS) {
          return results;
        }
        if (tag.name !== macroName) {
          continue;
        }
        if (
          filePath === definitionFilePath &&
          typeof definitionLine === "number" &&
          tag.line === definitionLine
        ) {
          // 定義行そのものは使用箇所に含めない
          continue;
        }
        results.push({
          kind: "location",
          uri: filePath,
          line: tag.line ?? 0,
          character: tag.column ?? 0,
        });
      }
    }
    return results;
  }

  /**
   * 変数（f/sf/tf/mp.xxx）の使用箇所一覧を返す。
   */
  public findVariableUses(variableName: string): LocationNode[] {
    if (!variableName) {
      return [];
    }
    const escaped = variableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // 完全一致のため境界 `\b` を後ろに付ける
    const re = new RegExp(`(?:f|sf|tf|mp)\\.${escaped}\\b`, "g");
    const results: LocationNode[] = [];
    for (const [filePath, doc] of this.infoWs.scenarioFileMap) {
      const text = doc.getText();
      const lines = text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        if (results.length >= MAX_USAGE_RESULTS) {
          return results;
        }
        const line = lines[i];
        const trimmed = line.trim();
        // ; から始まる行はコメントなのでスキップ
        if (trimmed.startsWith(";")) {
          continue;
        }
        re.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = re.exec(line))) {
          results.push({
            kind: "location",
            uri: filePath,
            line: i,
            character: match.index,
          });
          if (results.length >= MAX_USAGE_RESULTS) {
            return results;
          }
        }
      }
    }
    return results;
  }

  /**
   * キャラクターの使用箇所一覧を返す（chara_show 等の name= 参照）。
   */
  public findCharacterUses(characterName: string): LocationNode[] {
    if (!characterName) {
      return [];
    }
    const results: LocationNode[] = [];
    for (const [filePath, doc] of this.infoWs.scenarioFileMap) {
      const tags = this.getParsedTags(filePath, doc);
      for (const tag of tags) {
        if (results.length >= MAX_USAGE_RESULTS) {
          return results;
        }
        if (!CHARACTER_USAGE_TAGS.has(tag.name)) {
          continue;
        }
        const nameVal = tag?.pm?.name;
        if (nameVal !== characterName) {
          continue;
        }
        const detail = tag.name;
        results.push({
          kind: "location",
          uri: filePath,
          line: tag.line ?? 0,
          character: tag.column ?? 0,
          detail,
        });
      }
    }
    return results;
  }

  /**
   * 検索結果が打ち切り上限に達したかどうかを呼び出し側が判定するためのユーティリティ。
   */
  public static get maxResults(): number {
    return MAX_USAGE_RESULTS;
  }

  private getParsedTags(filePath: string, doc: vscode.TextDocument): any[] {
    const cached = this.parseCache.get(filePath);
    if (cached && cached.version === doc.version) {
      return cached.tags;
    }
    const tags: any[] = this.parser.parseText(doc.getText());
    this.parseCache.set(filePath, { version: doc.version, tags });
    return tags;
  }
}
