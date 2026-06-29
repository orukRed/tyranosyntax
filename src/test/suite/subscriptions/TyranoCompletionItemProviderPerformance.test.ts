import * as assert from "assert";
import * as vscode from "vscode";
import { TyranoCompletionItemProvider } from "../../../subscriptions/TyranoCompletionItemProvider";

type TestableCompletionProvider = {
  infoWs: {
    suggestions: Map<string, unknown>;
    characterMap?: Map<string, unknown[]>;
  };
  completionTag: (
    projectPath: string,
    document: vscode.TextDocument,
    position: vscode.Position,
  ) => Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined>;
  completionParameter: (
    selectedTag: string,
    parameters: object,
    projectPath: string,
    nameParamValue: string,
    document: vscode.TextDocument,
    position: vscode.Position,
  ) => Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined>;
};

function createMockDocument(lineText: string): vscode.TextDocument {
  return {
    uri: vscode.Uri.file("/project/data/scenario/test.ks"),
    fileName: "/project/data/scenario/test.ks",
    isUntitled: false,
    languageId: "tyrano",
    version: 1,
    isDirty: false,
    isClosed: false,
    eol: vscode.EndOfLine.LF,
    lineCount: 1,
    save: () => Promise.resolve(true),
    lineAt: (_: number | vscode.Position) => ({
      lineNumber: 0,
      text: lineText,
      range: new vscode.Range(0, 0, 0, lineText.length),
      rangeIncludingLineBreak: new vscode.Range(0, 0, 1, 0),
      firstNonWhitespaceCharacterIndex: lineText.search(/\S/),
      isEmptyOrWhitespace: lineText.trim() === "",
    }),
    offsetAt: () => 0,
    positionAt: () => new vscode.Position(0, 0),
    getText: () => lineText,
    getWordRangeAtPosition: () => undefined,
    validateRange: (range: vscode.Range) => range,
    validatePosition: (position: vscode.Position) => position,
  } as vscode.TextDocument;
}

suite("TyranoCompletionItemProvider performance-focused behavior", () => {
  test("completionTag reuses cached candidates for repeated requests", async () => {
    const provider = new TyranoCompletionItemProvider();
    const providerAny = provider as unknown as TestableCompletionProvider;
    const suggestions = {
      p: { name: "p", description: "paragraph" },
      jump: { name: "jump", description: "jump" },
    };
    providerAny.infoWs = {
      suggestions: new Map([["/project", suggestions]]),
    };

    const document = createMockDocument("ju");
    const position = new vscode.Position(0, 2);

    const firstResult = await providerAny.completionTag(
      "/project",
      document,
      position,
    );
    const secondResult = await providerAny.completionTag(
      "/project",
      document,
      position,
    );

    assert.ok(Array.isArray(firstResult), "候補配列が返るべき");
    assert.strictEqual(
      firstResult,
      secondResult,
      "同一条件の再補完ではキャッシュ済み候補が再利用されるべき",
    );
  });

  test("completionParameter adds chara_part-specific items without mutating cached suggestions", async () => {
    const provider = new TyranoCompletionItemProvider();
    const providerAny = provider as unknown as TestableCompletionProvider;
    const baseSuggestion = {
      name: "chara_part",
      description: "character part",
      parameters: [
        {
          name: "name",
          description: "character name",
          required: true,
        },
      ],
    };
    providerAny.infoWs = {
      suggestions: new Map([["/project", { chara_part: baseSuggestion }]]),
      characterMap: new Map([
        [
          "/project",
          [
            {
              name: "hero",
              layer: new Map([
                ["eye", []],
                ["mouth", []],
              ]),
            },
          ],
        ],
      ]),
    };

    const result = await providerAny.completionParameter(
      "chara_part",
      {},
      "/project",
      "hero",
      createMockDocument("[chara_part "),
      new vscode.Position(0, 12),
    );

    assert.ok(Array.isArray(result), "候補配列が返るべき");
    const labels = result.map((item: vscode.CompletionItem) =>
      typeof item.label === "string" ? item.label : item.label.label,
    );
    assert.ok(labels.includes("eye"), "動的なpart候補が含まれるべき");
    assert.ok(labels.includes("mouth"), "動的なpart候補が含まれるべき");
    assert.deepStrictEqual(
      baseSuggestion.parameters.map((parameter) => parameter.name),
      ["name"],
      "元のsuggestionsは破壊的に変更されないべき",
    );
  });
});
