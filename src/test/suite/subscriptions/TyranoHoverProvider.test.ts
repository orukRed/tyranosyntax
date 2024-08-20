// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { TyranoHoverProvider } from "../../../subscriptions/TyranoHoverProvider";
import assert from "assert";

suite("TyranoHoverProvider.provideHover関数", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("正常系 正しくホバーが表示される", () => {
    //値定義
    const tyranoHoverProvider: TyranoHoverProvider = new TyranoHoverProvider();

    const document: vscode.TextDocument = {
      getText: () => '[jump storage="scene1" target="*start"]',
      uri: vscode.Uri.parse(""),
      fileName: "",
      isUntitled: false,
      languageId: "",
      version: 0,
      isDirty: false,
      isClosed: false,
      lineAt: (line: number | vscode.Position) => ({
        lineNumber: typeof line === "number" ? line : line.line,
        text: '[jump storage="scene1" target="*start"]',
        range: new vscode.Range(0, 0, 0, 0),
        rangeIncludingLineBreak: new vscode.Range(0, 0, 0, 0),
        firstNonWhitespaceCharacterIndex: 0,
        isEmptyOrWhitespace: false,
      }),
      save: function (): Thenable<boolean> {
        throw new Error("Function not implemented.");
      },
      eol: vscode.EndOfLine.LF,
      lineCount: 0,
      offsetAt: function (_position: vscode.Position): number {
        throw new Error("Function not implemented.");
      },
      positionAt: function (_offset: number): vscode.Position {
        throw new Error("Function not implemented.");
      },
      getWordRangeAtPosition: function (
        _position: vscode.Position,
        _regex?: RegExp | undefined,
      ): vscode.Range | undefined {
        throw new Error("Function not implemented.");
      },
      validateRange: function (_range: vscode.Range): vscode.Range {
        throw new Error("Function not implemented.");
      },
      validatePosition: function (_position: vscode.Position): vscode.Position {
        throw new Error("Function not implemented.");
      },
    };

    const position = new vscode.Position(0, 0);
    const token = new vscode.CancellationTokenSource().token;

    //実行・期待値
    const actual = tyranoHoverProvider.provideHover(document, position, token);

    //アサート
    actual.then((hover) => {
      assert.ok(hover);
      assert.ok(hover.contents);
    });
  });

  test("異常系 存在しないタグへのホバー（ホバーが表示されない）", () => {
    //値定義
    const tyranoHoverProvider: TyranoHoverProvider = new TyranoHoverProvider();

    // const document: vscode.TextDocument = vscode.window.activeTextEditor
    //   ?.document as vscode.TextDocument;

    const document: vscode.TextDocument = {
      getText: () => '[test_tag hoge="scene1" foo="*start"]',
      uri: vscode.Uri.parse(""),
      fileName: "",
      isUntitled: false,
      languageId: "",
      version: 0,
      isDirty: false,
      isClosed: false,
      lineAt: (line: number | vscode.Position) => ({
        lineNumber: typeof line === "number" ? line : line.line,
        text: '[test_tag hoge="scene1" foo="*start"]',
        range: new vscode.Range(0, 0, 0, 0),
        rangeIncludingLineBreak: new vscode.Range(0, 0, 0, 0),
        firstNonWhitespaceCharacterIndex: 0,
        isEmptyOrWhitespace: false,
      }),
      save: function (): Thenable<boolean> {
        throw new Error("Function not implemented.");
      },
      eol: vscode.EndOfLine.LF,
      lineCount: 0,
      offsetAt: function (_position: vscode.Position): number {
        throw new Error("Function not implemented.");
      },
      positionAt: function (_offset: number): vscode.Position {
        throw new Error("Function not implemented.");
      },
      getWordRangeAtPosition: function (
        _position: vscode.Position,
        _regex?: RegExp | undefined,
      ): vscode.Range | undefined {
        throw new Error("Function not implemented.");
      },
      validateRange: function (_range: vscode.Range): vscode.Range {
        throw new Error("Function not implemented.");
      },
      validatePosition: function (_position: vscode.Position): vscode.Position {
        throw new Error("Function not implemented.");
      },
    };

    const position = new vscode.Position(0, 0);
    const token = new vscode.CancellationTokenSource().token;

    //実行・期待値
    const actual = tyranoHoverProvider.provideHover(document, position, token);

    //アサート
    actual.then((hover) => {
      assert.ok(!hover);
    });
  });
});

