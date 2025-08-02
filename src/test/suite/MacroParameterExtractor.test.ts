/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import { MacroParameterExtractor } from "../../MacroParameterExtractor";
import { DefineMacroData } from "../../defineData/DefineMacroData";
import { MacroParameterData } from "../../defineData/MacroParameterData";

// Mock TextDocument for testing
class MockTextDocument implements vscode.TextDocument {
  uri: vscode.Uri;
  fileName: string;
  isUntitled: boolean;
  languageId: string;
  version: number;
  isDirty: boolean;
  isClosed: boolean;
  eol: vscode.EndOfLine;
  lineCount: number;
  private lines: string[];

  constructor(fileName: string, lines: string[]) {
    this.uri = vscode.Uri.file(fileName);
    this.fileName = fileName;
    this.isUntitled = false;
    this.languageId = "tyrano";
    this.version = 1;
    this.isDirty = false;
    this.isClosed = false;
    this.eol = vscode.EndOfLine.LF;
    this.lineCount = lines.length;
    this.lines = lines;
  }

  save(): Thenable<boolean> {
    return Promise.resolve(true);
  }

  lineAt(line: number | vscode.Position): vscode.TextLine {
    const lineNumber = typeof line === "number" ? line : line.line;
    const text = this.lines[lineNumber] || "";
    return {
      lineNumber,
      text,
      range: new vscode.Range(lineNumber, 0, lineNumber, text.length),
      rangeIncludingLineBreak: new vscode.Range(
        lineNumber,
        0,
        lineNumber + 1,
        0,
      ),
      firstNonWhitespaceCharacterIndex: text.search(/\S/),
      isEmptyOrWhitespace: text.trim().length === 0,
    };
  }

  offsetAt(position: vscode.Position): number {
    let offset = 0;
    for (let i = 0; i < position.line; i++) {
      offset += this.lines[i].length + 1; // +1 for line ending
    }
    return offset + position.character;
  }

  positionAt(offset: number): vscode.Position {
    let currentOffset = 0;
    for (let line = 0; line < this.lines.length; line++) {
      const lineLength = this.lines[line].length + 1; // +1 for line ending
      if (currentOffset + lineLength > offset) {
        return new vscode.Position(line, offset - currentOffset);
      }
      currentOffset += lineLength;
    }
    return new vscode.Position(
      this.lines.length - 1,
      this.lines[this.lines.length - 1].length,
    );
  }

  getText(range?: vscode.Range): string {
    if (!range) {
      return this.lines.join("\n");
    }
    const startLine = range.start.line;
    const endLine = range.end.line;
    if (startLine === endLine) {
      return this.lines[startLine].substring(
        range.start.character,
        range.end.character,
      );
    }
    let text = this.lines[startLine].substring(range.start.character) + "\n";
    for (let i = startLine + 1; i < endLine; i++) {
      text += this.lines[i] + "\n";
    }
    text += this.lines[endLine].substring(0, range.end.character);
    return text;
  }

  getWordRangeAtPosition(
    _position: vscode.Position,
    _regex?: RegExp,
  ): vscode.Range | undefined {
    return undefined;
  }

  validateRange(range: vscode.Range): vscode.Range {
    return range;
  }

  validatePosition(position: vscode.Position): vscode.Position {
    return position;
  }
}

suite("MacroParameterExtractor Tests", () => {
  let extractor: MacroParameterExtractor;
  let macroData: DefineMacroData;
  let scenarioFileMap: Map<string, vscode.TextDocument>;

  setup(() => {
    extractor = new MacroParameterExtractor();
    const location = new vscode.Location(
      vscode.Uri.file("test.ks"),
      new vscode.Position(0, 0),
    );
    macroData = new DefineMacroData(
      "testMacro",
      location,
      "test.ks",
      "テスト用マクロ",
    );
    scenarioFileMap = new Map();
  });

  suite("extractMacroParameters - mp.パラメータの抽出", () => {
    test("mp.パラメータが正常に抽出される", () => {
      const mockDoc = new MockTextDocument("test.ks", [
        "テストメッセージ mp.name で mp.age を表示",
      ]);
      scenarioFileMap.set("test.ks", mockDoc);

      const data = {
        name: "text",
        line: 0,
      };

      extractor.extractMacroParameters(data, macroData, scenarioFileMap);

      assert.strictEqual(macroData.parameter.length, 2);
      assert.strictEqual(macroData.parameter[0].name, "name");
      assert.strictEqual(
        macroData.parameter[0].description,
        "mpパラメータ: name",
      );
      assert.strictEqual(macroData.parameter[1].name, "age");
      assert.strictEqual(
        macroData.parameter[1].description,
        "mpパラメータ: age",
      );
    });

    test("同じmp.パラメータが重複して抽出されない", () => {
      const mockDoc = new MockTextDocument("test.ks", [
        "テストメッセージ mp.name で mp.name を表示",
      ]);
      scenarioFileMap.set("test.ks", mockDoc);

      const data = {
        name: "text",
        line: 0,
      };

      extractor.extractMacroParameters(data, macroData, scenarioFileMap);

      assert.strictEqual(macroData.parameter.length, 1);
      assert.strictEqual(macroData.parameter[0].name, "name");
    });

    test("mp.パラメータが存在しない場合は何も抽出されない", () => {
      const mockDoc = new MockTextDocument("test.ks", [
        "通常のテキストメッセージ",
      ]);
      scenarioFileMap.set("test.ks", mockDoc);

      const data = {
        name: "text",
        line: 0,
      };

      extractor.extractMacroParameters(data, macroData, scenarioFileMap);

      assert.strictEqual(macroData.parameter.length, 0);
    });
  });

  suite("extractMacroParameters - %パラメータの抽出", () => {
    test("%パラメータが正常に抽出される", () => {
      const mockDoc = new MockTextDocument("test.ks", [
        "テストメッセージ %character_name で %message を表示",
      ]);
      scenarioFileMap.set("test.ks", mockDoc);

      const data = {
        name: "text",
        line: 0,
      };

      extractor.extractMacroParameters(data, macroData, scenarioFileMap);

      assert.strictEqual(macroData.parameter.length, 2);
      assert.strictEqual(macroData.parameter[0].name, "character_name");
      assert.strictEqual(
        macroData.parameter[0].description,
        "%パラメータ: character_name",
      );
      assert.strictEqual(macroData.parameter[1].name, "message");
      assert.strictEqual(
        macroData.parameter[1].description,
        "%パラメータ: message",
      );
    });

    test("デフォルト値付き%パラメータが正常に抽出される", () => {
      const mockDoc = new MockTextDocument("test.ks", [
        "テストメッセージ %name|デフォルト名前 で %age|20 を表示",
      ]);
      scenarioFileMap.set("test.ks", mockDoc);

      const data = {
        name: "text",
        line: 0,
      };

      extractor.extractMacroParameters(data, macroData, scenarioFileMap);

      assert.strictEqual(macroData.parameter.length, 2);
      assert.strictEqual(macroData.parameter[0].name, "name");
      assert.strictEqual(
        macroData.parameter[0].description,
        "%パラメータ: name (デフォルト値: デフォルト名前)",
      );
      assert.strictEqual(macroData.parameter[1].name, "age");
      assert.strictEqual(
        macroData.parameter[1].description,
        "%パラメータ: age (デフォルト値: 20)",
      );
    });

    test("同じ%パラメータが重複して抽出されない", () => {
      const mockDoc = new MockTextDocument("test.ks", [
        "テストメッセージ %name で %name を表示",
      ]);
      scenarioFileMap.set("test.ks", mockDoc);

      const data = {
        name: "text",
        line: 0,
      };

      extractor.extractMacroParameters(data, macroData, scenarioFileMap);

      assert.strictEqual(macroData.parameter.length, 1);
      assert.strictEqual(macroData.parameter[0].name, "name");
    });
  });

 

  suite("extractMacroParameters - 混在パターン", () => {
    test("mp.パラメータと%パラメータが混在している場合", () => {
      const mockDoc = new MockTextDocument("test.ks", [
        "こんにちは mp.name さん、%message|ようこそ を表示します",
      ]);
      scenarioFileMap.set("test.ks", mockDoc);

      const data = {
        name: "text",
        line: 0,
        pm: {
          storage: "mp.background_image",
          time: "%transition_time|1000",
        },
      };

      extractor.extractMacroParameters(data, macroData, scenarioFileMap);

      assert.strictEqual(macroData.parameter.length, 4);

      const parameterNames = macroData.parameter.map((p) => p.name).sort();
      assert.deepStrictEqual(parameterNames, [
        "background_image",
        "message",
        "name",
        "transition_time",
      ]);
    });
  });

  suite("extractMacroParameters - エラーケース", () => {
    test("macroDataがnullの場合は何も処理されない", () => {
      const data = {
        name: "text",
        line: 0,
      };

      extractor.extractMacroParameters(data, null, scenarioFileMap);

      // エラーが発生しないことを確認
      assert.ok(true);
    });

    test("存在しないファイルパスの場合", () => {
      const data = {
        name: "text",
        line: 0,
      };

      const location = new vscode.Location(
        vscode.Uri.file("nonexistent.ks"),
        new vscode.Position(0, 0),
      );
      const nonExistentMacroData = new DefineMacroData(
        "testMacro",
        location,
        "nonexistent.ks",
        "テスト用マクロ",
      );
      extractor.extractMacroParameters(
        data,
        nonExistentMacroData,
        scenarioFileMap,
      );

      assert.strictEqual(nonExistentMacroData.parameter.length, 0);
    });

    test("既存パラメータと同名のパラメータは追加されない", () => {
      // 既存パラメータを追加
      macroData.parameter.push(
        new MacroParameterData("existing_param", true, "既存パラメータ"),
      );

      const mockDoc = new MockTextDocument("test.ks", [
        "mp.existing_param を使用",
      ]);
      scenarioFileMap.set("test.ks", mockDoc);

      const data = {
        name: "text",
        line: 0,
      };

      extractor.extractMacroParameters(data, macroData, scenarioFileMap);

      // 既存パラメータのみで新規追加されていない
      assert.strictEqual(macroData.parameter.length, 1);
      assert.strictEqual(macroData.parameter[0].description, "既存パラメータ");
    });
  });

  suite("extractMacroParameters - *パラメータ関連", () => {
    test("*パラメータが存在する場合の処理", () => {
      const suggestions = new Map();
      const projectPath = "/test/project";

      // モックのタグ定義を作成
      suggestions.set(projectPath, {
        chara_show: {
          name: "chara_show",
          parameters: [
            { name: "name" },
            { name: "face" },
            { name: "time" },
            { name: "storage" },
          ],
        },
      });

      const data = {
        name: "chara_show",
        pm: {
          name: "test_character",
          "*": "",
        },
      };

      extractor.extractMacroParameters(
        data,
        macroData,
        scenarioFileMap,
        suggestions,
        projectPath,
      );

      // 既存パラメータ（name）以外のパラメータが追加される
      const parameterNames = macroData.parameter.map((p) => p.name).sort();
      assert.deepStrictEqual(parameterNames, ["face", "storage", "time"]);
    });
  });
});
