import * as assert from "assert";
import * as vscode from "vscode";
import { IscriptDetector } from "../../../subscriptions/IscriptDetector";

suite("IscriptDetector Test Suite", () => {
  test("should detect cursor inside iscript block", async () => {
    const detector = IscriptDetector.getInstance();
    
    // Create a test document
    const content = `; Test file
*start

[iscript]
var test = 10;
f.score = 100;
[endscript]

[p]
*end`;

    const document = await vscode.workspace.openTextDocument({
      content,
      language: "tyrano",
    });

    // Test position inside iscript block (line 4 - "var test = 10;")
    const insidePosition = new vscode.Position(4, 5);
    assert.strictEqual(
      detector.isInsideIscriptBlock(document, insidePosition),
      true,
      "Should detect cursor inside iscript block"
    );

    // Test position outside iscript block (line 1 - "*start")
    const outsidePosition = new vscode.Position(1, 0);
    assert.strictEqual(
      detector.isInsideIscriptBlock(document, outsidePosition),
      false,
      "Should detect cursor outside iscript block"
    );

    // Test position after iscript block (line 8 - "[p]")
    const afterPosition = new vscode.Position(8, 0);
    assert.strictEqual(
      detector.isInsideIscriptBlock(document, afterPosition),
      false,
      "Should detect cursor after iscript block"
    );
  });

  test("should handle multiple iscript blocks", async () => {
    const detector = IscriptDetector.getInstance();
    
    const content = `[iscript]
var first = 1;
[endscript]

Normal text here

[iscript]
var second = 2;
[endscript]`;

    const document = await vscode.workspace.openTextDocument({
      content,
      language: "tyrano",
    });

    // Test first iscript block
    const firstBlock = new vscode.Position(1, 0);
    assert.strictEqual(
      detector.isInsideIscriptBlock(document, firstBlock),
      true,
      "Should detect first iscript block"
    );

    // Test between blocks
    const betweenBlocks = new vscode.Position(4, 0);
    assert.strictEqual(
      detector.isInsideIscriptBlock(document, betweenBlocks),
      false,
      "Should detect position between iscript blocks"
    );

    // Test second iscript block
    const secondBlock = new vscode.Position(7, 0);
    assert.strictEqual(
      detector.isInsideIscriptBlock(document, secondBlock),
      true,
      "Should detect second iscript block"
    );
  });

  test("should get iscript content", async () => {
    const detector = IscriptDetector.getInstance();
    
    const content = `[iscript]
var test = 10;
console.log("hello");
[endscript]`;

    const document = await vscode.workspace.openTextDocument({
      content,
      language: "tyrano",
    });

    const insidePosition = new vscode.Position(1, 0);
    const jsContent = detector.getIscriptContent(document, insidePosition);
    
    assert.notStrictEqual(jsContent, null, "Should return JavaScript content");
    assert.ok(jsContent?.includes("var test = 10;"), "Should include JavaScript code");
    assert.ok(jsContent?.includes('console.log("hello");'), "Should include JavaScript code");
  });
});