/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import { DefineMacroData } from "../../../../defineData/DefineMacroData";
import { InformationWorkSpace } from "../../../../InformationWorkSpace";
import { MacroTreeProvider } from "../../../../subscriptions/sidebar/MacroTreeProvider";
import { UsageIndexer } from "../../../../subscriptions/sidebar/UsageIndexer";

function setProjectMacros(
  projectPath: string,
  entries: DefineMacroData[],
): () => void {
  const infoWs = InformationWorkSpace.getInstance();
  const orig = (infoWs as any)._defineMacroMap as Map<
    string,
    Map<string, DefineMacroData>
  >;
  const next = new Map<string, Map<string, DefineMacroData>>();
  const inner = new Map<string, DefineMacroData>();
  entries.forEach((e, i) => inner.set(`uuid-${i}`, e));
  next.set(projectPath, inner);
  (infoWs as any)._defineMacroMap = next;
  const origGetPaths = infoWs.getTyranoScriptProjectRootPaths.bind(infoWs);
  (infoWs as any).getTyranoScriptProjectRootPaths = () => [projectPath];
  return () => {
    (infoWs as any)._defineMacroMap = orig;
    (infoWs as any).getTyranoScriptProjectRootPaths = origGetPaths;
  };
}

suite("MacroTreeProvider", () => {
  test("正常系 ルートでマクロ一覧が name 昇順で返る", () => {
    const restore = setProjectMacros("/proj", [
      new DefineMacroData(
        "z_macro",
        new vscode.Location(
          vscode.Uri.file("/proj/z.ks"),
          new vscode.Position(2, 0),
        ),
        "/proj/z.ks",
        "",
      ),
      new DefineMacroData(
        "a_macro",
        new vscode.Location(
          vscode.Uri.file("/proj/a.ks"),
          new vscode.Position(0, 0),
        ),
        "/proj/a.ks",
        "コメント",
      ),
    ]);
    try {
      const infoWs = InformationWorkSpace.getInstance();
      const indexer = new UsageIndexer(infoWs);
      const provider = new MacroTreeProvider(infoWs, indexer);
      const roots = provider.getChildren();
      assert.strictEqual(roots.length, 2);
      assert.strictEqual((roots[0] as any).name, "a_macro");
      assert.strictEqual((roots[1] as any).name, "z_macro");
    } finally {
      restore();
    }
  });

  test("正常系 ワークスペースが空のときはルートが空配列", () => {
    const restore = setProjectMacros("/proj", []);
    const infoWs = InformationWorkSpace.getInstance();
    const origGetPaths = infoWs.getTyranoScriptProjectRootPaths.bind(infoWs);
    (infoWs as any).getTyranoScriptProjectRootPaths = () => [];
    try {
      const indexer = new UsageIndexer(infoWs);
      const provider = new MacroTreeProvider(infoWs, indexer);
      assert.deepStrictEqual(provider.getChildren(), []);
    } finally {
      (infoWs as any).getTyranoScriptProjectRootPaths = origGetPaths;
      restore();
    }
  });

  test("正常系 SymbolNode 配下にコメント・定義箇所・使用箇所カテゴリが現れる", () => {
    const restore = setProjectMacros("/proj", [
      new DefineMacroData(
        "my_macro",
        new vscode.Location(
          vscode.Uri.file("/proj/m.ks"),
          new vscode.Position(0, 0),
        ),
        "/proj/m.ks",
        "コメント",
      ),
    ]);
    try {
      const infoWs = InformationWorkSpace.getInstance();
      const indexer = new UsageIndexer(infoWs);
      const provider = new MacroTreeProvider(infoWs, indexer);
      const symbols = provider.getChildren();
      assert.strictEqual(symbols.length, 1);
      const cats = provider.getChildren(symbols[0]);
      const labels = cats.map((c: any) => c.category);
      assert.ok(labels.includes("comment"), "comment が含まれる");
      assert.ok(labels.includes("definition"), "definition が含まれる");
      assert.ok(labels.includes("usage"), "usage が含まれる");
    } finally {
      restore();
    }
  });
});
