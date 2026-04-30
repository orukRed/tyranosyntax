/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import { InformationWorkSpace } from "../../../../InformationWorkSpace";
import { UsageIndexer } from "../../../../subscriptions/sidebar/UsageIndexer";

interface MockDocOptions {
  uri: vscode.Uri;
  text: string;
  version?: number;
}

function makeMockDoc(opts: MockDocOptions): vscode.TextDocument {
  const text = opts.text;
  const lines = text.split(/\r?\n/);
  return {
    uri: opts.uri,
    fileName: opts.uri.fsPath,
    isUntitled: false,
    languageId: "tyrano",
    version: opts.version ?? 1,
    isDirty: false,
    isClosed: false,
    eol: vscode.EndOfLine.LF,
    lineCount: lines.length,
    save(): Thenable<boolean> {
      return Promise.resolve(true);
    },
    lineAt(_lineOrPosition: any): any {
      return { text: "", lineNumber: 0 } as any;
    },
    offsetAt(_position: vscode.Position): number {
      return 0;
    },
    positionAt(_offset: number): vscode.Position {
      return new vscode.Position(0, 0);
    },
    getText(_range?: vscode.Range): string {
      return text;
    },
    getWordRangeAtPosition(): vscode.Range | undefined {
      return undefined;
    },
    validateRange(range: vscode.Range): vscode.Range {
      return range;
    },
    validatePosition(position: vscode.Position): vscode.Position {
      return position;
    },
  } as any;
}

function makeIndexerWithDocs(
  docs: { path: string; text: string }[],
): { indexer: UsageIndexer; restore: () => void } {
  const fakeMap = new Map<string, vscode.TextDocument>();
  for (const d of docs) {
    fakeMap.set(
      d.path,
      makeMockDoc({ uri: vscode.Uri.file(d.path), text: d.text }),
    );
  }
  const infoWs = InformationWorkSpace.getInstance();
  // 既存の scenarioFileMap を一時的に差し替えるため、private フィールドへ書き込む
  const original = (infoWs as any)._scenarioFileMap;
  (infoWs as any)._scenarioFileMap = fakeMap;
  const indexer = new UsageIndexer(infoWs);
  return {
    indexer,
    restore: () => {
      (infoWs as any)._scenarioFileMap = original;
    },
  };
}

suite("UsageIndexer.findMacroUses", () => {
  test("正常系 マクロ呼び出しを集計する", () => {
    const { indexer, restore } = makeIndexerWithDocs([
      {
        path: "/tmp/scene1.ks",
        text: "[my_macro]\n[other]\n[my_macro arg=1]",
      },
      {
        path: "/tmp/scene2.ks",
        text: "text\n[my_macro]",
      },
    ]);
    try {
      const result = indexer.findMacroUses("my_macro");
      assert.strictEqual(result.length, 3, "3件あるはず");
      assert.ok(
        result.some(
          (r) => r.uri === "/tmp/scene1.ks" && r.line === 0,
        ),
      );
      assert.ok(
        result.some(
          (r) => r.uri === "/tmp/scene1.ks" && r.line === 2,
        ),
      );
      assert.ok(
        result.some(
          (r) => r.uri === "/tmp/scene2.ks" && r.line === 1,
        ),
      );
    } finally {
      restore();
    }
  });

  test("正常系 定義行を除外する", () => {
    const { indexer, restore } = makeIndexerWithDocs([
      {
        path: "/tmp/macro.ks",
        text: "[macro name=\"my_macro\"]\n[my_macro]\n[endmacro]\n[my_macro]",
      },
    ]);
    try {
      const result = indexer.findMacroUses("my_macro", "/tmp/macro.ks", 1);
      // 定義行(line=1)は除外、line=3 のみ残る
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].line, 3);
    } finally {
      restore();
    }
  });

  test("異常系 空文字列なら空配列を返す", () => {
    const { indexer, restore } = makeIndexerWithDocs([
      { path: "/tmp/a.ks", text: "[anything]" },
    ]);
    try {
      assert.deepStrictEqual(indexer.findMacroUses(""), []);
    } finally {
      restore();
    }
  });

  test("正常系 コメント行は使用箇所に含めない", () => {
    const { indexer, restore } = makeIndexerWithDocs([
      {
        path: "/tmp/scene.ks",
        text: ";[my_macro]\n[my_macro]",
      },
    ]);
    try {
      const result = indexer.findMacroUses("my_macro");
      // ; 始まりはコメント扱いで Parser 側で name="comment" になるため
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].line, 1);
    } finally {
      restore();
    }
  });
});

suite("UsageIndexer.findVariableUses", () => {
  test("正常系 変数参照を集計する", () => {
    const { indexer, restore } = makeIndexerWithDocs([
      {
        path: "/tmp/a.ks",
        text: "[eval exp=\"f.hp = f.max_hp\"]\n[emb exp=\"f.hp\"]",
      },
      {
        path: "/tmp/b.ks",
        text: "&f.hp",
      },
    ]);
    try {
      const result = indexer.findVariableUses("hp");
      assert.strictEqual(result.length, 3, "3件あるはず");
    } finally {
      restore();
    }
  });

  test("正常系 ; 始まりのコメント行は除外する", () => {
    const { indexer, restore } = makeIndexerWithDocs([
      {
        path: "/tmp/a.ks",
        text: ";[emb exp=\"f.hp\"]\n[emb exp=\"f.hp\"]",
      },
    ]);
    try {
      const result = indexer.findVariableUses("hp");
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].line, 1);
    } finally {
      restore();
    }
  });

  test("異常系 空文字列なら空配列", () => {
    const { indexer, restore } = makeIndexerWithDocs([
      { path: "/tmp/a.ks", text: "f.hp" },
    ]);
    try {
      assert.deepStrictEqual(indexer.findVariableUses(""), []);
    } finally {
      restore();
    }
  });

  test("正常系 別変数名を誤検知しない", () => {
    const { indexer, restore } = makeIndexerWithDocs([
      {
        path: "/tmp/a.ks",
        text: "[emb exp=\"f.hp\"]\n[emb exp=\"f.hp_max\"]",
      },
    ]);
    try {
      const result = indexer.findVariableUses("hp");
      assert.strictEqual(result.length, 1, "f.hp_max は除外");
      assert.strictEqual(result[0].line, 0);
    } finally {
      restore();
    }
  });
});

suite("UsageIndexer.findCharacterUses", () => {
  test("正常系 chara_show, chara_hide, chara_mod を集計する", () => {
    const { indexer, restore } = makeIndexerWithDocs([
      {
        path: "/tmp/a.ks",
        text:
          "[chara_show name=\"akane\"]\n[chara_hide name=\"akane\"]\n" +
          "[chara_mod name=\"yuko\"]",
      },
    ]);
    try {
      const akane = indexer.findCharacterUses("akane");
      assert.strictEqual(akane.length, 2);
      const yuko = indexer.findCharacterUses("yuko");
      assert.strictEqual(yuko.length, 1);
    } finally {
      restore();
    }
  });

  test("正常系 #name:face 記法 (chara_ptext) を集計する", () => {
    const { indexer, restore } = makeIndexerWithDocs([
      {
        path: "/tmp/a.ks",
        text: "#akane:smile\nテキスト",
      },
    ]);
    try {
      const result = indexer.findCharacterUses("akane");
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].line, 0);
    } finally {
      restore();
    }
  });

  test("異常系 空文字列なら空配列", () => {
    const { indexer, restore } = makeIndexerWithDocs([
      { path: "/tmp/a.ks", text: "[chara_show name=\"akane\"]" },
    ]);
    try {
      assert.deepStrictEqual(indexer.findCharacterUses(""), []);
    } finally {
      restore();
    }
  });
});

suite("UsageIndexer.invalidate", () => {
  test("正常系 invalidate 後でも結果を再計算する", () => {
    const { indexer, restore } = makeIndexerWithDocs([
      { path: "/tmp/a.ks", text: "[my_macro]" },
    ]);
    try {
      const first = indexer.findMacroUses("my_macro");
      assert.strictEqual(first.length, 1);
      indexer.invalidate("/tmp/a.ks");
      const second = indexer.findMacroUses("my_macro");
      assert.strictEqual(second.length, 1);
    } finally {
      restore();
    }
  });
});
