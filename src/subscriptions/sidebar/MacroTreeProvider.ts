import * as path from "path";
import * as vscode from "vscode";
import { DefineMacroData } from "../../defineData/DefineMacroData";
import { InformationWorkSpace } from "../../InformationWorkSpace";
import {
  CategoryNode,
  LocationNode,
  RootNode,
  SidebarNode,
  SymbolNode,
  toTreeItem,
} from "./SymbolTreeItem";
import { UsageIndexer } from "./UsageIndexer";

/**
 * アクティビティバー「マクロ」ビュー用 TreeDataProvider。
 */
export class MacroTreeProvider implements vscode.TreeDataProvider<SidebarNode> {
  private readonly _onDidChangeTreeData: vscode.EventEmitter<
    SidebarNode | undefined
  > = new vscode.EventEmitter<SidebarNode | undefined>();
  public readonly onDidChangeTreeData: vscode.Event<SidebarNode | undefined> =
    this._onDidChangeTreeData.event;

  /** Provider 内ローカルキャッシュ: 同じ symbol を再展開する際の使用箇所結果 */
  private readonly usageCache: Map<string, LocationNode[]> = new Map();

  constructor(
    private readonly infoWs: InformationWorkSpace,
    private readonly indexer: UsageIndexer,
  ) {}

  public refresh(): void {
    this.usageCache.clear();
    this._onDidChangeTreeData.fire(undefined);
  }

  public getTreeItem(element: SidebarNode): vscode.TreeItem {
    return toTreeItem(element);
  }

  public getChildren(element?: SidebarNode): SidebarNode[] {
    if (!element) {
      return this.getRootChildren();
    }
    if (element.kind === "root") {
      return this.collectMacroSymbolsForProject(element.projectPath);
    }
    if (element.kind === "symbol" && element.symbolType === "macro") {
      return this.getSymbolChildren(element);
    }
    if (element.kind === "category") {
      return this.getCategoryChildren(element);
    }
    return [];
  }

  private getRootChildren(): SidebarNode[] {
    const projectPaths = this.infoWs.getTyranoScriptProjectRootPaths();
    if (projectPaths.length === 0) {
      return [];
    }
    if (projectPaths.length === 1) {
      return this.collectMacroSymbolsForProject(projectPaths[0]);
    }
    return projectPaths.map<RootNode>((p) => ({
      kind: "root",
      projectPath: p,
    }));
  }

  private collectMacroSymbolsForProject(projectPath: string): SymbolNode[] {
    const macroMap = this.infoWs.defineMacroMap.get(projectPath);
    if (!macroMap) {
      return [];
    }
    // 同名マクロは1ノードに集約。代表データは最初のものを使う。
    const groups = new Map<string, DefineMacroData[]>();
    for (const macro of macroMap.values()) {
      const list = groups.get(macro.macroName) ?? [];
      list.push(macro);
      groups.set(macro.macroName, list);
    }

    const symbols: SymbolNode[] = [];
    for (const [macroName, defs] of groups) {
      if (!macroName) {
        continue;
      }
      const head = defs[0];
      const description = head.location
        ? `${path.basename(head.filePath)}:${head.location.range.start.line + 1}`
        : path.basename(head.filePath);
      const comment = defs
        .map((d) => d.description?.trim())
        .filter((c): c is string => !!c)
        .join("\n");
      symbols.push({
        kind: "symbol",
        symbolType: "macro",
        projectPath,
        name: macroName,
        description,
        comment: comment || undefined,
      });
    }
    symbols.sort((a, b) => a.name.localeCompare(b.name));
    return symbols;
  }

  private getSymbolChildren(symbol: SymbolNode): CategoryNode[] {
    const categories: CategoryNode[] = [];
    const defs = this.getDefinitionsForSymbol(symbol);
    if (symbol.comment) {
      categories.push({
        kind: "category",
        parent: symbol,
        category: "comment",
      });
    }
    if (defs.length > 0) {
      categories.push({
        kind: "category",
        parent: symbol,
        category: "definition",
        count: defs.length,
      });
    }
    const usages = this.getUsagesForSymbol(symbol);
    categories.push({
      kind: "category",
      parent: symbol,
      category: "usage",
      count: usages.length,
    });
    return categories;
  }

  private getCategoryChildren(category: CategoryNode): SidebarNode[] {
    const symbol = category.parent;
    switch (category.category) {
      case "comment":
        if (!symbol.comment) {
          return [];
        }
        return symbol.comment
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map<SidebarNode>((line) => ({ kind: "text", text: line }));
      case "definition":
        return this.getDefinitionsForSymbol(symbol);
      case "usage":
        return this.getUsagesForSymbol(symbol);
      default:
        return [];
    }
  }

  private getDefinitionsForSymbol(symbol: SymbolNode): LocationNode[] {
    const macroMap = this.infoWs.defineMacroMap.get(symbol.projectPath);
    if (!macroMap) {
      return [];
    }
    const result: LocationNode[] = [];
    for (const macro of macroMap.values()) {
      if (macro.macroName !== symbol.name || !macro.location) {
        continue;
      }
      result.push({
        kind: "location",
        uri: macro.location.uri.fsPath,
        line: macro.location.range.start.line,
        character: macro.location.range.start.character,
      });
    }
    return result;
  }

  private getUsagesForSymbol(symbol: SymbolNode): LocationNode[] {
    const cacheKey = `${symbol.projectPath}::${symbol.name}`;
    const cached = this.usageCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    // 定義行を除外するため、最初の定義の filePath/line を渡す
    const defs = this.getDefinitionsForSymbol(symbol);
    const aggregated: LocationNode[] = [];
    if (defs.length === 0) {
      aggregated.push(...this.indexer.findMacroUses(symbol.name));
    } else {
      // 全ての定義行をスキップする必要があるので、defs ごとに集計してマージする
      const exclude = new Set(defs.map((d) => `${d.uri}::${d.line}`));
      const all = this.indexer.findMacroUses(symbol.name);
      for (const loc of all) {
        if (exclude.has(`${loc.uri}::${loc.line}`)) {
          continue;
        }
        aggregated.push(loc);
      }
    }
    this.usageCache.set(cacheKey, aggregated);
    return aggregated;
  }
}
