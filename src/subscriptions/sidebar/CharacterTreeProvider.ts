import * as vscode from "vscode";
import { CharacterData } from "../../defineData/CharacterData";
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
 * アクティビティバー「キャラクター」ビュー用 TreeDataProvider。
 */
export class CharacterTreeProvider
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
      return this.collectCharacterSymbolsForProject(element.projectPath);
    }
    if (element.kind === "symbol" && element.symbolType === "character") {
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
      return this.collectCharacterSymbolsForProject(projectPaths[0]);
    }
    return projectPaths.map<RootNode>((p) => ({
      kind: "root",
      projectPath: p,
    }));
  }

  private collectCharacterSymbolsForProject(
    projectPath: string,
  ): SymbolNode[] {
    const characters = this.infoWs.characterMap.get(projectPath);
    if (!characters) {
      return [];
    }
    // 同名キャラを 1 ノードに集約。description には jname を入れる
    const grouped = new Map<string, CharacterData[]>();
    for (const chara of characters) {
      if (!chara.name) {
        continue;
      }
      const list = grouped.get(chara.name) ?? [];
      list.push(chara);
      grouped.set(chara.name, list);
    }
    const symbols: SymbolNode[] = [];
    for (const [name, defs] of grouped) {
      const jname = defs.map((d) => d.jname).find((j) => !!j);
      symbols.push({
        kind: "symbol",
        symbolType: "character",
        projectPath,
        name,
        description: jname ? `jname: ${jname}` : undefined,
      });
    }
    symbols.sort((a, b) => a.name.localeCompare(b.name));
    return symbols;
  }

  private getSymbolChildren(symbol: SymbolNode): CategoryNode[] {
    const categories: CategoryNode[] = [];
    const characters = this.getCharaDataForSymbol(symbol);
    const defCount = characters.length;
    if (defCount > 0) {
      categories.push({
        kind: "category",
        parent: symbol,
        category: "definition",
        count: defCount,
      });
    }
    const faceCount = characters.reduce(
      (acc, c) => acc + c.faceList.length,
      0,
    );
    if (faceCount > 0) {
      categories.push({
        kind: "category",
        parent: symbol,
        category: "face",
        count: faceCount,
      });
    }
    let layerCount = 0;
    for (const c of characters) {
      for (const parts of c.layer.values()) {
        layerCount += parts.length;
      }
    }
    if (layerCount > 0) {
      categories.push({
        kind: "category",
        parent: symbol,
        category: "layer",
        count: layerCount,
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
    const characters = this.getCharaDataForSymbol(symbol);
    switch (category.category) {
      case "definition":
        return characters.map<LocationNode>((c) => ({
          kind: "location",
          uri: c.location.uri.fsPath,
          line: c.location.range.start.line,
          character: c.location.range.start.character,
        }));
      case "face": {
        const result: LocationNode[] = [];
        for (const c of characters) {
          for (const face of c.faceList) {
            if (!face.location) {
              continue;
            }
            result.push({
              kind: "location",
              uri: face.location.uri.fsPath,
              line: face.location.range.start.line,
              character: face.location.range.start.character,
              detail: face.face,
            });
          }
        }
        return result;
      }
      case "layer": {
        const result: LocationNode[] = [];
        for (const c of characters) {
          for (const [partName, parts] of c.layer) {
            for (const part of parts) {
              if (!part.location) {
                continue;
              }
              result.push({
                kind: "location",
                uri: part.location.uri.fsPath,
                line: part.location.range.start.line,
                character: part.location.range.start.character,
                detail: `${partName}/${part.id}`,
              });
            }
          }
        }
        return result;
      }
      case "usage":
        return this.getUsagesForSymbol(symbol);
      default:
        return [];
    }
  }

  private getCharaDataForSymbol(symbol: SymbolNode): CharacterData[] {
    const characters = this.infoWs.characterMap.get(symbol.projectPath);
    if (!characters) {
      return [];
    }
    return characters.filter((c) => c.name === symbol.name);
  }

  private getUsagesForSymbol(symbol: SymbolNode): LocationNode[] {
    const cacheKey = `${symbol.projectPath}::${symbol.name}`;
    const cached = this.usageCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const usages = this.indexer.findCharacterUses(symbol.name);
    this.usageCache.set(cacheKey, usages);
    return usages;
  }
}
