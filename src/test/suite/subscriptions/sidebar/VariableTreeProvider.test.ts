/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import { InformationWorkSpace } from "../../../../InformationWorkSpace";
import { VariableData } from "../../../../defineData/VariableData";
import { UsageIndexer } from "../../../../subscriptions/sidebar/UsageIndexer";
import { VariableTreeProvider } from "../../../../subscriptions/sidebar/VariableTreeProvider";

function setProjectVariables(
  projectPath: string,
  entries: { name: string; kind: string; locations: vscode.Location[] }[],
): () => void {
  const infoWs = InformationWorkSpace.getInstance();
  const orig = (infoWs as any)._variableMap;
  const next = new Map<string, Map<string, VariableData>>();
  const inner = new Map<string, VariableData>();
  for (const e of entries) {
    const v = new VariableData(e.name, undefined, e.kind);
    for (const loc of e.locations) {
      v.addLocation(loc);
    }
    inner.set(e.name, v);
  }
  next.set(projectPath, inner);
  (infoWs as any)._variableMap = next;
  const origGetPaths = infoWs.getTyranoScriptProjectRootPaths.bind(infoWs);
  (infoWs as any).getTyranoScriptProjectRootPaths = () => [projectPath];
  return () => {
    (infoWs as any)._variableMap = orig;
    (infoWs as any).getTyranoScriptProjectRootPaths = origGetPaths;
  };
}

suite("VariableTreeProvider", () => {
  test("正常系 変数一覧が kind.name 形式で返る", () => {
    const restore = setProjectVariables("/proj", [
      {
        name: "hp",
        kind: "f",
        locations: [
          new vscode.Location(
            vscode.Uri.file("/proj/a.ks"),
            new vscode.Position(0, 0),
          ),
        ],
      },
    ]);
    try {
      const infoWs = InformationWorkSpace.getInstance();
      const indexer = new UsageIndexer(infoWs);
      const provider = new VariableTreeProvider(infoWs, indexer);
      const symbols = provider.getChildren();
      assert.strictEqual(symbols.length, 1);
      assert.strictEqual((symbols[0] as any).name, "f.hp");
      assert.strictEqual((symbols[0] as any).description, "kind=f");
    } finally {
      restore();
    }
  });

  test("正常系 SymbolNode 配下に定義・使用カテゴリが現れる", () => {
    const restore = setProjectVariables("/proj", [
      {
        name: "hp",
        kind: "f",
        locations: [
          new vscode.Location(
            vscode.Uri.file("/proj/a.ks"),
            new vscode.Position(0, 0),
          ),
        ],
      },
    ]);
    try {
      const infoWs = InformationWorkSpace.getInstance();
      const indexer = new UsageIndexer(infoWs);
      const provider = new VariableTreeProvider(infoWs, indexer);
      const symbols = provider.getChildren();
      const cats = provider.getChildren(symbols[0]);
      const categories = cats.map((c: any) => c.category);
      assert.ok(categories.includes("definition"));
      assert.ok(categories.includes("usage"));
    } finally {
      restore();
    }
  });
});
