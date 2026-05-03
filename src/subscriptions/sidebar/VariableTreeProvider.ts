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
  private _collapseGeneration = 0;

  constructor(
    private readonly infoWs: InformationWorkSpace,
    private readonly indexer: UsageIndexer,
  ) {}

  public refresh(): void {
    this.usageCache.clear();
    this._onDidChangeTreeData.fire(undefined);
  }

  public collapseAll(): void {
    this._collapseGeneration++;
    this._onDidChangeTreeData.fire(undefined);
  }

  public getTreeItem(element: SidebarNode): vscode.TreeItem {
    const item = toTreeItem(element);
    if (element.kind === "symbol") {
      item.id = `g${this._collapseGeneration}::${element.projectPath}::${element.name}`;
    }
    return item;
  }

  public getParent(element: SidebarNode): SidebarNode | undefined {
    if (element.kind === "symbol") {
      const projectPaths = this.infoWs.getTyranoScriptProjectRootPaths();
      if (projectPaths.length > 1) {
        return { kind: "root", projectPath: element.projectPath };
      }
      return undefined;
    }
    if (element.kind === "category") {
      return element.parent;
    }
    return undefined;
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
      });
    }
    symbols.sort((a, b) => a.name.localeCompare(b.name));
    return symbols;
  }

  private getSymbolChildren(symbol: SymbolNode): CategoryNode[] {
    const categories: CategoryNode[] = [];
    const writes = this.getWritesForSymbol(symbol);
    if (writes.length > 0) {
      categories.push({
        kind: "category",
        parent: symbol,
        category: "write",
        count: writes.length,
      });
    }
    const reads = this.getReadsForSymbol(symbol);
    categories.push({
      kind: "category",
      parent: symbol,
      category: "read",
      count: reads.length,
    });
    return categories;
  }

  private getCategoryChildren(category: CategoryNode): SidebarNode[] {
    switch (category.category) {
      case "write":
        return this.getWritesForSymbol(category.parent);
      case "read":
        return this.getReadsForSymbol(category.parent);
      default:
        return [];
    }
  }

  /** symbol.name は "f.foo" 形式。バリバリ区切ってベース名を返す */
  private baseNameOf(symbol: SymbolNode): string {
    const dot = symbol.name.indexOf(".");
    return dot >= 0 ? symbol.name.slice(dot + 1) : symbol.name;
  }

  private getWritesForSymbol(symbol: SymbolNode): LocationNode[] {
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

  private getReadsForSymbol(symbol: SymbolNode): LocationNode[] {
    const cacheKey = `${symbol.projectPath}::${symbol.name}`;
    const cached = this.usageCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const baseName = this.baseNameOf(symbol);
    const allUses = this.indexer.findVariableUses(baseName);
    const writes = this.getWritesForSymbol(symbol);
    const writeSet = new Set(writes.map((w) => `${w.uri}::${w.line}`));
    const reads = allUses.filter((u) => !writeSet.has(`${u.uri}::${u.line}`));
    this.usageCache.set(cacheKey, reads);
    return reads;
  }
}
