/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import { CharacterData } from "../../../defineData/CharacterData";
import { DefineMacroData } from "../../../defineData/DefineMacroData";
import { VariableData } from "../../../defineData/VariableData";
import { InformationWorkSpace } from "../../../InformationWorkSpace";
import { TyranoReferenceProvider } from "../../../subscriptions/TyranoReferenceProvider";

class MockTextDocument implements vscode.TextDocument {
  public uri: vscode.Uri;
  public fileName: string;
  public isUntitled = false;
  public languageId = "tyrano";
  public version = 1;
  public isDirty = false;
  public isClosed = false;
  public eol = vscode.EndOfLine.LF;
  public lineCount: number;
  private readonly text: string;
  private readonly lines: string[];

  constructor(filePath: string, text: string) {
    this.uri = vscode.Uri.file(filePath);
    this.fileName = filePath;
    this.text = text;
    this.lines = text.split(/\r?\n/);
    this.lineCount = this.lines.length;
  }

  save(): Thenable<boolean> {
    return Promise.resolve(true);
  }
  lineAt(lineOrPosition: number | vscode.Position): vscode.TextLine {
    const line =
      typeof lineOrPosition === "number" ? lineOrPosition : lineOrPosition.line;
    const text = this.lines[line] ?? "";
    return {
      lineNumber: line,
      text,
      range: new vscode.Range(line, 0, line, text.length),
      rangeIncludingLineBreak: new vscode.Range(line, 0, line + 1, 0),
      firstNonWhitespaceCharacterIndex: 0,
      isEmptyOrWhitespace: text.trim().length === 0,
    };
  }
  offsetAt(position: vscode.Position): number {
    let offset = 0;
    for (let i = 0; i < position.line; i++) {
      offset += (this.lines[i]?.length ?? 0) + 1;
    }
    offset += position.character;
    return offset;
  }
  positionAt(_offset: number): vscode.Position {
    return new vscode.Position(0, 0);
  }
  getText(range?: vscode.Range): string {
    if (!range) {
      return this.text;
    }
    const line = this.lines[range.start.line] ?? "";
    return line.substring(range.start.character, range.end.character);
  }
  getWordRangeAtPosition(
    position: vscode.Position,
    regex?: RegExp,
  ): vscode.Range | undefined {
    if (!regex) {
      return undefined;
    }
    const line = this.lines[position.line] ?? "";
    const flags = regex.flags.includes("g") ? regex.flags : regex.flags + "g";
    const re = new RegExp(regex.source, flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(line))) {
      const start = match.index;
      const end = start + match[0].length;
      if (start <= position.character && position.character <= end) {
        return new vscode.Range(
          new vscode.Position(position.line, start),
          new vscode.Position(position.line, end),
        );
      }
    }
    return undefined;
  }
  validateRange(range: vscode.Range): vscode.Range {
    return range;
  }
  validatePosition(position: vscode.Position): vscode.Position {
    return position;
  }
}

class MockCancellationToken implements vscode.CancellationToken {
  isCancellationRequested = false;
  onCancellationRequested = new vscode.EventEmitter<any>().event;
}

const REFCONTEXT_NO_DECL: vscode.ReferenceContext = {
  includeDeclaration: false,
};
const REFCONTEXT_WITH_DECL: vscode.ReferenceContext = {
  includeDeclaration: true,
};

interface FixtureOpts {
  projectPath: string;
  scenarioFiles: { path: string; text: string }[];
  macros?: DefineMacroData[];
  variables?: { name: string; kind: string; locations: vscode.Location[] }[];
  characters?: CharacterData[];
}

function setupFixture(opts: FixtureOpts): () => void {
  const infoWs = InformationWorkSpace.getInstance();
  const origScenarioMap = (infoWs as any)._scenarioFileMap;
  const origMacroMap = (infoWs as any)._defineMacroMap;
  const origVariableMap = (infoWs as any)._variableMap;
  const origCharacterMap = (infoWs as any)._characterMap;
  const origGetProject = (infoWs as any).getProjectPathByFilePath;
  const origGetPaths = (infoWs as any).getTyranoScriptProjectRootPaths;

  const scenarioMap = new Map<string, vscode.TextDocument>();
  for (const f of opts.scenarioFiles) {
    scenarioMap.set(f.path, new MockTextDocument(f.path, f.text));
  }
  (infoWs as any)._scenarioFileMap = scenarioMap;

  const macroMap = new Map<string, Map<string, DefineMacroData>>();
  const macroInner = new Map<string, DefineMacroData>();
  (opts.macros ?? []).forEach((m, i) => macroInner.set(`uuid-${i}`, m));
  macroMap.set(opts.projectPath, macroInner);
  (infoWs as any)._defineMacroMap = macroMap;

  const variableMap = new Map<string, Map<string, VariableData>>();
  const variableInner = new Map<string, VariableData>();
  for (const v of opts.variables ?? []) {
    const data = new VariableData(v.name, undefined, v.kind);
    for (const loc of v.locations) {
      data.addLocation(loc);
    }
    variableInner.set(v.name, data);
  }
  variableMap.set(opts.projectPath, variableInner);
  (infoWs as any)._variableMap = variableMap;

  const characterMap = new Map<string, CharacterData[]>();
  characterMap.set(opts.projectPath, opts.characters ?? []);
  (infoWs as any)._characterMap = characterMap;

  (infoWs as any).getProjectPathByFilePath = async (_p: string) =>
    opts.projectPath;
  (infoWs as any).getTyranoScriptProjectRootPaths = () => [opts.projectPath];

  return () => {
    (infoWs as any)._scenarioFileMap = origScenarioMap;
    (infoWs as any)._defineMacroMap = origMacroMap;
    (infoWs as any)._variableMap = origVariableMap;
    (infoWs as any)._characterMap = origCharacterMap;
    (infoWs as any).getProjectPathByFilePath = origGetProject;
    (infoWs as any).getTyranoScriptProjectRootPaths = origGetPaths;
  };
}

suite("TyranoReferenceProvider", () => {
  vscode.window.showInformationMessage("Start TyranoReferenceProvider tests.");

  suite("constructor", () => {
    test("正常系 インスタンス作成", () => {
      assert.doesNotThrow(() => new TyranoReferenceProvider());
    });

    test("正常系 provideReferences メソッドが存在する", () => {
      const provider = new TyranoReferenceProvider();
      assert.ok(typeof provider.provideReferences === "function");
    });
  });

  suite("provideReferences", () => {
    test("正常系 マクロ呼び出し位置で参照配列が返る", async () => {
      const projectPath = "/proj";
      const macroLocation = new vscode.Location(
        vscode.Uri.file("/proj/macro.ks"),
        new vscode.Position(0, 0),
      );
      const restore = setupFixture({
        projectPath,
        scenarioFiles: [
          {
            path: "/proj/scene1.ks",
            text: "[my_macro]\n[other]\n[my_macro arg=1]",
          },
          { path: "/proj/scene2.ks", text: "[my_macro]" },
        ],
        macros: [
          new DefineMacroData(
            "my_macro",
            macroLocation,
            "/proj/macro.ks",
            "",
          ),
        ],
      });
      try {
        const provider = new TyranoReferenceProvider();
        const document = new MockTextDocument(
          "/proj/scene1.ks",
          "[my_macro]\n[other]\n[my_macro arg=1]",
        );
        // 1行目の "my_macro" の上 (col=2)
        const result = await provider.provideReferences(
          document,
          new vscode.Position(0, 2),
          REFCONTEXT_NO_DECL,
          new MockCancellationToken(),
        );
        assert.ok(Array.isArray(result), "配列が返るべき");
        assert.ok((result as vscode.Location[]).length >= 2);
      } finally {
        restore();
      }
    });

    test("正常系 変数 f.hp 上で参照配列が返る", async () => {
      const projectPath = "/proj";
      const restore = setupFixture({
        projectPath,
        scenarioFiles: [
          {
            path: "/proj/scene.ks",
            text: '[eval exp="f.hp = 100"]\n[emb exp="f.hp"]',
          },
        ],
        variables: [
          {
            name: "hp",
            kind: "f",
            locations: [
              new vscode.Location(
                vscode.Uri.file("/proj/scene.ks"),
                new vscode.Position(0, 11),
              ),
            ],
          },
        ],
      });
      try {
        const provider = new TyranoReferenceProvider();
        const document = new MockTextDocument(
          "/proj/scene.ks",
          '[eval exp="f.hp = 100"]\n[emb exp="f.hp"]',
        );
        // 2 行目の f.hp 上
        const result = await provider.provideReferences(
          document,
          new vscode.Position(1, 11),
          REFCONTEXT_NO_DECL,
          new MockCancellationToken(),
        );
        assert.ok(Array.isArray(result));
        assert.ok((result as vscode.Location[]).length >= 1);
      } finally {
        restore();
      }
    });

    test("正常系 chara_show name=akane の akane 上でキャラ参照が返る", async () => {
      const projectPath = "/proj";
      const charaDef = new vscode.Location(
        vscode.Uri.file("/proj/chara.ks"),
        new vscode.Position(0, 0),
      );
      const restore = setupFixture({
        projectPath,
        scenarioFiles: [
          {
            path: "/proj/scene.ks",
            text: '[chara_show name="akane"]\n[chara_hide name="akane"]',
          },
        ],
        characters: [new CharacterData("akane", "茜", charaDef)],
      });
      try {
        const provider = new TyranoReferenceProvider();
        const document = new MockTextDocument(
          "/proj/scene.ks",
          '[chara_show name="akane"]\n[chara_hide name="akane"]',
        );
        // "akane" の上
        const result = await provider.provideReferences(
          document,
          new vscode.Position(0, 20),
          REFCONTEXT_NO_DECL,
          new MockCancellationToken(),
        );
        assert.ok(Array.isArray(result));
        assert.strictEqual((result as vscode.Location[]).length, 2);
      } finally {
        restore();
      }
    });

    test("正常系 includeDeclaration=true で定義位置が含まれる", async () => {
      const projectPath = "/proj";
      const macroDefLocation = new vscode.Location(
        vscode.Uri.file("/proj/macro.ks"),
        new vscode.Position(0, 7),
      );
      const restore = setupFixture({
        projectPath,
        scenarioFiles: [
          {
            path: "/proj/scene.ks",
            text: "[my_macro]",
          },
        ],
        macros: [
          new DefineMacroData(
            "my_macro",
            macroDefLocation,
            "/proj/macro.ks",
            "",
          ),
        ],
      });
      try {
        const provider = new TyranoReferenceProvider();
        const document = new MockTextDocument(
          "/proj/scene.ks",
          "[my_macro]",
        );
        const result = (await provider.provideReferences(
          document,
          new vscode.Position(0, 2),
          REFCONTEXT_WITH_DECL,
          new MockCancellationToken(),
        )) as vscode.Location[] | null;
        assert.ok(Array.isArray(result));
        const includesDef = (result as vscode.Location[]).some(
          (loc) =>
            loc.uri.fsPath === "/proj/macro.ks" &&
            loc.range.start.line === 0 &&
            loc.range.start.character === 7,
        );
        assert.ok(includesDef, "定義位置が含まれるべき");
      } finally {
        restore();
      }
    });

    test("異常系 該当しない位置では null を返す", async () => {
      const projectPath = "/proj";
      const restore = setupFixture({
        projectPath,
        scenarioFiles: [{ path: "/proj/scene.ks", text: "ただのテキスト" }],
      });
      try {
        const provider = new TyranoReferenceProvider();
        const document = new MockTextDocument(
          "/proj/scene.ks",
          "ただのテキスト",
        );
        const result = await provider.provideReferences(
          document,
          new vscode.Position(0, 2),
          REFCONTEXT_NO_DECL,
          new MockCancellationToken(),
        );
        assert.strictEqual(result, null);
      } finally {
        restore();
      }
    });
  });
});
