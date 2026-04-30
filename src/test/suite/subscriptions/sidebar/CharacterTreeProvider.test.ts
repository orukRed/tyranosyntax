/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import { CharacterData } from "../../../../defineData/CharacterData";
import { CharacterFaceData } from "../../../../defineData/CharacterFaceData";
import { CharacterLayerData } from "../../../../defineData/CharacterLayerData";
import { InformationWorkSpace } from "../../../../InformationWorkSpace";
import { CharacterTreeProvider } from "../../../../subscriptions/sidebar/CharacterTreeProvider";
import { UsageIndexer } from "../../../../subscriptions/sidebar/UsageIndexer";

function setProjectCharacters(
  projectPath: string,
  characters: CharacterData[],
): () => void {
  const infoWs = InformationWorkSpace.getInstance();
  const orig = (infoWs as any)._characterMap;
  const next = new Map<string, CharacterData[]>();
  next.set(projectPath, characters);
  (infoWs as any)._characterMap = next;
  const origGetPaths = infoWs.getTyranoScriptProjectRootPaths.bind(infoWs);
  (infoWs as any).getTyranoScriptProjectRootPaths = () => [projectPath];
  return () => {
    (infoWs as any)._characterMap = orig;
    (infoWs as any).getTyranoScriptProjectRootPaths = origGetPaths;
  };
}

suite("CharacterTreeProvider", () => {
  test("正常系 キャラ一覧と jname description が出る", () => {
    const akane = new CharacterData(
      "akane",
      "茜",
      new vscode.Location(
        vscode.Uri.file("/proj/c.ks"),
        new vscode.Position(0, 0),
      ),
    );
    const restore = setProjectCharacters("/proj", [akane]);
    try {
      const infoWs = InformationWorkSpace.getInstance();
      const indexer = new UsageIndexer(infoWs);
      const provider = new CharacterTreeProvider(infoWs, indexer);
      const symbols = provider.getChildren();
      assert.strictEqual(symbols.length, 1);
      assert.strictEqual((symbols[0] as any).name, "akane");
      assert.strictEqual((symbols[0] as any).description, "jname: 茜");
    } finally {
      restore();
    }
  });

  test("正常系 表情とレイヤーカテゴリが現れる", () => {
    const akane = new CharacterData(
      "akane",
      "茜",
      new vscode.Location(
        vscode.Uri.file("/proj/c.ks"),
        new vscode.Position(0, 0),
      ),
    );
    akane.addFace(
      new CharacterFaceData(
        "akane",
        "smile",
        new vscode.Location(
          vscode.Uri.file("/proj/c.ks"),
          new vscode.Position(2, 0),
        ),
      ),
    );
    akane.addLayer(
      "face",
      new CharacterLayerData(
        "akane",
        "face",
        "a",
        new vscode.Location(
          vscode.Uri.file("/proj/c.ks"),
          new vscode.Position(5, 0),
        ),
      ),
    );
    const restore = setProjectCharacters("/proj", [akane]);
    try {
      const infoWs = InformationWorkSpace.getInstance();
      const indexer = new UsageIndexer(infoWs);
      const provider = new CharacterTreeProvider(infoWs, indexer);
      const symbols = provider.getChildren();
      const cats = provider.getChildren(symbols[0]);
      const categories = cats.map((c: any) => c.category);
      assert.ok(categories.includes("definition"));
      assert.ok(categories.includes("face"));
      assert.ok(categories.includes("layer"));
      assert.ok(categories.includes("usage"));
    } finally {
      restore();
    }
  });
});
