import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { InformationWorkSpace } from "../../InformationWorkSpace";
import path from "path";
import { Parser } from "../../Parser";
// import * as myExtension from '../../extension';

suite("Parser.getNearestLabel", () => {
  test("正常系", () => {
    const parser = Parser.getInstance();
    const parsedData = [
      { name: "label", pm: { line: 0, label_name: "start" } },
      { name: "text", pm: { line: 1, val: "Hello" } },
      { name: "label", pm: { line: 2, label_name: "middle" } },
      { name: "text", pm: { line: 3, val: "World" } },
      { name: "label", pm: { line: 4, label_name: "end" } },
    ];
    const cursor = new vscode.Position(3, 0);
    const result = parser.getNearestLabel(parsedData, cursor);
    assert.strictEqual(result, "middle");
  });

  test("カーソル位置がラベルの前にない場合", () => {
    const parser = Parser.getInstance();
    const parsedData = [
      { name: "label", pm: { line: 0, label_name: "start" } },
      { name: "text", pm: { line: 1, val: "Hello" } },
      { name: "label", pm: { line: 2, label_name: "middle" } },
      { name: "text", pm: { line: 3, val: "World" } },
      { name: "label", pm: { line: 4, label_name: "end" } },
    ];
    const cursor = new vscode.Position(0, 0);
    const result = parser.getNearestLabel(parsedData, cursor);
    assert.strictEqual(result, "");
  });

  test("パース済みデータが空の場合", () => {
    const parser = Parser.getInstance();
    const parsedData: any[] = [];
    const cursor = new vscode.Position(3, 0);
    const result = parser.getNearestLabel(parsedData, cursor);
    assert.strictEqual(result, "");
  });
});

suite("Parser.getIndex", () => {
  test("正常系", () => {
    const parser = Parser.getInstance();
    const parsedData = [{ column: 0 }, { column: 5 }, { column: 10 }];
    const character = 7;
    const result = parser.getIndex(parsedData, character);
    assert.strictEqual(result, 1);
  });

  test("カーソル位置がすべてのタグの前にある場合", () => {
    const parser = Parser.getInstance();
    const parsedData = [{ column: 5 }, { column: 10 }, { column: 15 }];
    const character = 3;
    const result = parser.getIndex(parsedData, character);
    assert.strictEqual(result, -1);
  });

  test("カーソル位置がすべてのタグの後にある場合", () => {
    const parser = Parser.getInstance();
    const parsedData = [{ column: 5 }, { column: 10 }, { column: 15 }];
    const character = 20;
    const result = parser.getIndex(parsedData, character);
    assert.strictEqual(result, 2);
  });
});

suite("Parser.parseText", () => {
  test("正常系", () => {
    const parser = Parser.getInstance();
    const text = "*start\nHello\n*middle\nWorld\n*end";
    const result = parser.parseText(text);
    assert.strictEqual(result.length, 5);
    assert.strictEqual(result[0].name, "label");
    assert.strictEqual(result[1].name, "text");
    assert.strictEqual(result[2].name, "label");
    assert.strictEqual(result[3].name, "text");
    assert.strictEqual(result[4].name, "label");
  });

  test("空のテキスト", () => {
    const parser = Parser.getInstance();
    const text = "";
    const result = parser.parseText(text);
    assert.strictEqual(result.length, 0);
  });

  test("コメント内のブラケット文字が正しく解析される", () => {
    const parser = Parser.getInstance();
    const text = "; 呼び出すには[hoge]と記述してください\n[macro name=\"hogehoge\"]\n[endmacro]";
    const result = parser.parseText(text);
    
    // コメント行が単一のコメントとして解析されることを確認
    const commentEntry = result.find((item: any) => item.name === "comment" && item.pm && item.pm.val);
    assert.ok(commentEntry, "コメントエントリが見つからない");
    assert.strictEqual(commentEntry.pm.val, "; 呼び出すには[hoge]と記述してください");
    
    // マクロタグが正しく解析されることを確認
    const macroEntry = result.find((item: any) => item.name === "macro");
    assert.ok(macroEntry, "マクロエントリが見つからない");
    assert.strictEqual(macroEntry.pm.name, "hogehoge");
  });

  test("複数のブラケット文字を含むコメントが正しく解析される", () => {
    const parser = Parser.getInstance();
    const text = "; コメント内に[複数]の[タグ]のような文字があります\n[macro name=\"multiple_brackets\"]\n[endmacro]";
    const result = parser.parseText(text);
    
    // コメント行が単一のコメントとして解析されることを確認
    const commentEntry = result.find((item: any) => item.name === "comment" && item.pm && item.pm.val);
    assert.ok(commentEntry, "コメントエントリが見つからない");
    assert.strictEqual(commentEntry.pm.val, "; コメント内に[複数]の[タグ]のような文字があります");
    
    // マクロタグが正しく解析されることを確認
    const macroEntry = result.find((item: any) => item.name === "macro");
    assert.ok(macroEntry, "マクロエントリが見つからない");
    assert.strictEqual(macroEntry.pm.name, "multiple_brackets");
  });
  test("複数行コメント内の行はラベルとして認識されない", () => {
    const parser = Parser.getInstance();
    const text = "/*\n *\n * hoge 変数その1\n */\n*real_label\nテキスト";
    const result = parser.parseText(text);
    const labelTags = result.filter((item: any) => item.name === "label");
    // 複数行コメント内の行はラベルとして認識されないため、real_labelのみが検出される
    assert.strictEqual(labelTags.length, 1);
    assert.strictEqual(labelTags[0].pm.label_name, "real_label");
    assert.strictEqual(labelTags[0].pm.line, 4);
  });

  test("/** 形式の複数行コメント内の行はラベルとして認識されない", () => {
    const parser = Parser.getInstance();
    const text = "[iscript]\n/**\n* hoge てすと\n*/\n[endscript]\n*real_label";
    const result = parser.parseText(text);
    const labelTags = result.filter((item: any) => item.name === "label");
    // /** 形式の複数行コメント内の行もラベルとして認識されないため、real_labelのみが検出される
    assert.strictEqual(labelTags.length, 1);
    assert.strictEqual(labelTags[0].pm.label_name, "real_label");
  });
});
