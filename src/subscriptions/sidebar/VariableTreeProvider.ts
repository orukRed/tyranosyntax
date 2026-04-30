import * as vscode from "vscode";
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
 * アクティビティバー「変数」ビュー用 TreeDataProvider。
 */
export class VariableTreeProvider
  implements vscode.TreeDataProvider<SidebarNode>
{
  private readonly _onDidChangeTreeData: vscode.EventEmitter<
    SidebarNode | undefined
  > = new vscode.EventEmitter<SidebarNode | undefined>();
  public readonly onDidChangeTreeData: vscode.Event<SidebarNode | undefined> =
    this._onDidChangeTreeData.event;

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
      return this.collectVariableSymbolsForProject(element.projectPath);
    }
    if (element.kind === "symbol" && element.symbolType === "variable") {
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
      return this.collectVariableSymbolsForProject(projectPaths[0]);
    }
    return projectPaths.map<RootNode>((p) => ({
      kind: "root",
      projectPath: p,
    }));
  }

  private collectVariableSymbolsForProject(
    projectPath: string,
  ): SymbolNode[] {
    const variableMap = this.infoWs.variableMap.get(projectPath);
    if (!variableMap) {
      return [];
    }
    const symbols: SymbolNode[] = [];
    for (const variable of variableMap.values()) {
      const name = variable.name;
      if (!name) {
        continue;
      }
      const kind = variable.kind ?? "";
      symbols.push({
        kind: "symbol",
        symbolType: "variable",
        projectPath,
        name: kind ? `${kind}.${name}` : name,
        description: kind ? `kind=${kind}` : undefined,
      });
    }
    symbols.sort((a, b) => a.name.localeCompare(b.name));
    return symbols;
  }

  private getSymbolChildren(symbol: SymbolNode): CategoryNode[] {
    const categories: CategoryNode[] = [];
    const defs = this.getDefinitionsForSymbol(symbol);
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
    switch (category.category) {
      case "definition":
        return this.getDefinitionsForSymbol(category.parent);
      case "usage":
        return this.getUsagesForSymbol(category.parent);
      default:
        return [];
    }
  }

  /** symbol.name は "f.foo" 形式。バリバリ区切ってベース名を返す */
  private baseNameOf(symbol: SymbolNode): string {
    const dot = symbol.name.indexOf(".");
    return dot >= 0 ? symbol.name.slice(dot + 1) : symbol.name;
  }

  private getDefinitionsForSymbol(symbol: SymbolNode): LocationNode[] {
    const variableMap = this.infoWs.variableMap.get(symbol.projectPath);
    if (!variableMap) {
      return [];
    }
    const baseName = this.baseNameOf(symbol);
    const variable = variableMap.get(baseName);
    if (!variable) {
      return [];
    }
    return variable.locations.map<LocationNode>((loc: vscode.Location) => ({
      kind: "location",
      uri: loc.uri.fsPath,
      line: loc.range.start.line,
      character: loc.range.start.character,
    }));
  }

  private getUsagesForSymbol(symbol: SymbolNode): LocationNode[] {
    const cacheKey = `${symbol.projectPath}::${symbol.name}`;
    const cached = this.usageCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const baseName = this.baseNameOf(symbol);
    const usages = this.indexer.findVariableUses(baseName);
    this.usageCache.set(cacheKey, usages);
    return usages;
  }
}
