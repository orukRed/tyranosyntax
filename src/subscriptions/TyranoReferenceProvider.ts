/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from "vscode";
import { InformationWorkSpace } from "../InformationWorkSpace";
import { Parser } from "../Parser";
import {
  LocationNode,
  SidebarNode,
} from "./sidebar/SymbolTreeItem";
import { UsageIndexer } from "./sidebar/UsageIndexer";

const VARIABLE_REGEX = /(?:f|sf|tf|mp)\.[a-zA-Z_]\w*/;
const WORD_REGEX = /[A-Za-z0-9_]+/;

const CHARACTER_TAGS = new Set<string>([
  "chara_new",
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

type SymbolHit =
  | { type: "macro"; name: string }
  | { type: "variable"; name: string }
  | { type: "character"; name: string };

/**
 * VSCode 標準の参照表示機能（Shift+F12 等）に対応する Reference Provider。
 * 参照箇所収集は Issue #322 で作成した {@link UsageIndexer} を再利用する。
 */
export class TyranoReferenceProvider implements vscode.ReferenceProvider {
  private readonly infoWs = InformationWorkSpace.getInstance();
  private readonly parser = Parser.getInstance();
  private readonly indexer: UsageIndexer = new UsageIndexer(this.infoWs);

  public async provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.ReferenceContext,
    _token: vscode.CancellationToken,
  ): Promise<vscode.Location[] | null | undefined> {
    const projectPath = await this.infoWs.getProjectPathByFilePath(
      document.uri.fsPath,
    );
    const hit = this.identifySymbol(document, position, projectPath);
    if (!hit) {
      return null;
    }

    const usages: LocationNode[] = this.collectUsages(hit);
    const locations: vscode.Location[] = usages.map(toLocation);

    if (context.includeDeclaration) {
      const defs = this.collectDefinitions(hit, projectPath);
      // 既出と同位置の重複排除
      const seen = new Set(locations.map(locationKey));
      for (const def of defs) {
        const key = locationKey(def);
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        locations.push(def);
      }
    }

    return locations;
  }

  private identifySymbol(
    document: vscode.TextDocument,
    position: vscode.Position,
    projectPath: string,
  ): SymbolHit | null {
    // 1. 変数 (f|sf|tf|mp).name
    const variableRange = document.getWordRangeAtPosition(
      position,
      VARIABLE_REGEX,
    );
    if (variableRange) {
      const text = document.getText(variableRange);
      const dot = text.indexOf(".");
      if (dot >= 0) {
        return { type: "variable", name: text.slice(dot + 1) };
      }
    }

    // 行をパースしてカーソル位置のタグを取得
    const lineText = document.lineAt(position.line).text;
    const parsedLine: any[] = this.parser.parseText(lineText);
    if (!parsedLine || parsedLine.length === 0) {
      return null;
    }
    const tagIndex = this.parser.getIndex(parsedLine, position.character);
    if (tagIndex < 0) {
      return null;
    }
    const tag: any = parsedLine[tagIndex];
    if (!tag || tag.name === "comment" || tag.name === "text") {
      return null;
    }

    const wordRange = document.getWordRangeAtPosition(position, WORD_REGEX);
    const wordUnderCursor = wordRange ? document.getText(wordRange) : undefined;

    // 2. マクロ呼び出し: タグ名そのものがマクロ名
    if (this.isDefinedMacro(projectPath, tag.name)) {
      return { type: "macro", name: tag.name };
    }

    // 3. [macro name="my_macro"] の name 値の上にカーソル
    if (
      tag.name === "macro" &&
      wordUnderCursor &&
      tag?.pm?.name === wordUnderCursor &&
      this.isDefinedMacro(projectPath, wordUnderCursor)
    ) {
      return { type: "macro", name: wordUnderCursor };
    }

    // 4. chara_* タグの name 値の上にカーソル
    if (
      CHARACTER_TAGS.has(tag.name) &&
      wordUnderCursor &&
      tag?.pm?.name === wordUnderCursor
    ) {
      return { type: "character", name: wordUnderCursor };
    }

    return null;
  }

  private isDefinedMacro(projectPath: string, macroName: string): boolean {
    const macros = this.infoWs.defineMacroMap.get(projectPath);
    if (!macros) {
      return false;
    }
    for (const m of macros.values()) {
      if (m.macroName === macroName) {
        return true;
      }
    }
    return false;
  }

  private collectUsages(hit: SymbolHit): LocationNode[] {
    switch (hit.type) {
      case "macro":
        return this.indexer.findMacroUses(hit.name);
      case "variable":
        return this.indexer.findVariableUses(hit.name);
      case "character":
        return this.indexer.findCharacterUses(hit.name);
    }
  }

  private collectDefinitions(
    hit: SymbolHit,
    projectPath: string,
  ): vscode.Location[] {
    switch (hit.type) {
      case "macro": {
        const macros = this.infoWs.defineMacroMap.get(projectPath);
        if (!macros) {
          return [];
        }
        const result: vscode.Location[] = [];
        for (const m of macros.values()) {
          if (m.macroName === hit.name && m.location) {
            result.push(m.location);
          }
        }
        return result;
      }
      case "variable": {
        const map = this.infoWs.variableMap.get(projectPath);
        const variable = map?.get(hit.name);
        if (!variable) {
          return [];
        }
        return variable.locations.slice();
      }
      case "character": {
        const characters = this.infoWs.characterMap.get(projectPath);
        if (!characters) {
          return [];
        }
        return characters
          .filter((c) => c.name === hit.name)
          .map((c) => c.location);
      }
    }
  }
}

function toLocation(node: LocationNode | SidebarNode): vscode.Location {
  // SidebarNode 型のうち実質受け取るのは LocationNode のみ
  const loc = node as LocationNode;
  return new vscode.Location(
    vscode.Uri.file(loc.uri),
    new vscode.Position(loc.line, loc.character),
  );
}

function locationKey(loc: vscode.Location): string {
  return `${loc.uri.fsPath}::${loc.range.start.line}::${loc.range.start.character}`;
}
