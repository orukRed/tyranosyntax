import * as assert from "assert";
import * as vscode from "vscode";
import { TyranoCompletionItemProvider } from "../../../subscriptions/TyranoCompletionItemProvider";

type TestableCompletionProvider = {
  infoWs: unknown;
  completionTag: (
    projectPath: string,
    document: vscode.TextDocument,
    position: vscode.Position,
  ) => Promise<vscode.CompletionItem[]>;
  completionParameter: (
    selectedTag: string,
    parameters: object,
    projectPath: string,
    nameParamValue: string,
    document: vscode.TextDocument,
    position: vscode.Position,
  ) => Promise<vscode.CompletionItem[]>;
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

function getCompletionLabel(item: vscode.CompletionItem): string {
  return typeof item.label === "string" ? item.label : item.label.label;
}

function getInsertText(item: vscode.CompletionItem): string | undefined {
  return item.insertText instanceof vscode.SnippetString
    ? item.insertText.value
    : item.insertText;
}

suite("TyranoCompletionItemProvider performance behavior", () => {
  const projectPath = "/project";

  test("reuses a tag candidate list and refreshes it after an update", async () => {
    const provider = new TyranoCompletionItemProvider();
    const providerAny = provider as unknown as TestableCompletionProvider;
    const suggestions: Record<string, { name: string; description: string }> = {
      p: { name: "p", description: "before update" },
    };
    let suggestionVersion = 1;
    providerAny.infoWs = {
      suggestions: new Map([[projectPath, suggestions]]),
      getSuggestionVersion: () => suggestionVersion,
    };

    const document = createMockDocument("p");
    const position = new vscode.Position(0, 1);
    const firstResult = await providerAny.completionTag(
      projectPath,
      document,
      position,
    );
    const secondResult = await providerAny.completionTag(
      projectPath,
      document,
      position,
    );

    assert.ok(Array.isArray(firstResult));
    assert.strictEqual(
      firstResult,
      secondResult,
      "unchanged suggestions should reuse the same candidate list",
    );

    suggestions.p.description = "after update";
    suggestions.jump = { name: "jump", description: "jump" };
    suggestionVersion += 1;
    const refreshedResult = await providerAny.completionTag(
      projectPath,
      document,
      position,
    );

    assert.ok(Array.isArray(refreshedResult));
    assert.notStrictEqual(refreshedResult, firstResult);
    assert.ok(
      refreshedResult
        .map((item: vscode.CompletionItem) => getCompletionLabel(item))
        .includes("jump"),
    );
    assert.ok(
      (
        (refreshedResult[0] as vscode.CompletionItem)
          .documentation as vscode.MarkdownString
      ).value.includes("after update"),
    );

    delete suggestions.p;
    delete suggestions.jump;
    suggestionVersion += 1;
    const removedResult = await providerAny.completionTag(
      projectPath,
      document,
      position,
    );

    assert.deepStrictEqual(removedResult, []);
  });

  test("preserves tag insertion styles while caching each style separately", async () => {
    const provider = new TyranoCompletionItemProvider();
    const providerAny = provider as unknown as TestableCompletionProvider;
    const suggestions = {
      p: { name: "p", description: "paragraph" },
    };
    providerAny.infoWs = {
      suggestions: new Map([[projectPath, suggestions]]),
      getSuggestionVersion: () => 1,
    };

    const normalResult = await providerAny.completionTag(
      projectPath,
      createMockDocument("p"),
      new vscode.Position(0, 1),
    );
    const bracketResult = await providerAny.completionTag(
      projectPath,
      createMockDocument("[p"),
      new vscode.Position(0, 2),
    );
    const atResult = await providerAny.completionTag(
      projectPath,
      createMockDocument("@p"),
      new vscode.Position(0, 2),
    );

    assert.ok(Array.isArray(normalResult));
    assert.ok(Array.isArray(bracketResult));
    assert.ok(Array.isArray(atResult));
    const inputType = vscode.workspace
      .getConfiguration()
      .get<string>("TyranoScript syntax.completionTag.inputType");
    assert.strictEqual(
      getInsertText(normalResult[0]),
      inputType === "@" ? "@p $0" : "[p $0]",
    );
    assert.strictEqual(getInsertText(bracketResult[0]), "p $0");
    assert.strictEqual(getInsertText(atResult[0]), "p $0");
    assert.notStrictEqual(normalResult, bracketResult);
    assert.strictEqual(bracketResult, atResult);
  });

  test("does not mutate chara_part suggestions while adding dynamic parts", async () => {
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
      suggestions: new Map([[projectPath, { chara_part: baseSuggestion }]]),
      characterMap: new Map([
        [
          projectPath,
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
      projectPath,
      "hero",
      createMockDocument("[chara_part "),
      new vscode.Position(0, 12),
    );

    assert.ok(Array.isArray(result));
    const labels = result.map((item: vscode.CompletionItem) =>
      getCompletionLabel(item),
    );
    assert.ok(labels.includes("eye"));
    assert.ok(labels.includes("mouth"));
    assert.deepStrictEqual(
      baseSuggestion.parameters.map((parameter) => parameter.name),
      ["name"],
    );
  });
});
