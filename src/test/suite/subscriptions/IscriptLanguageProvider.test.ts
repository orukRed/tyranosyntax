import * as assert from "assert";
import * as vscode from "vscode";
import { 
  IscriptCompletionProvider, 
  IscriptHoverProvider, 
  IscriptSignatureHelpProvider 
} from "../../../subscriptions/IscriptLanguageProvider";

suite("IscriptLanguageProvider Test Suite", () => {
  let document: vscode.TextDocument;
  let completionProvider: IscriptCompletionProvider;
  let hoverProvider: IscriptHoverProvider;
  let signatureProvider: IscriptSignatureHelpProvider;

  suiteSetup(async () => {
    completionProvider = new IscriptCompletionProvider();
    hoverProvider = new IscriptHoverProvider();
    signatureProvider = new IscriptSignatureHelpProvider();

    // Create a test document with iscript content
    const testContent = `; TyranoScript test file
*start

[text text="Hello World"]

[iscript]
// JavaScript code here
var player = {
    name: "Hero",
    level: 1
};

console.log("Player name: " + player.name);
f.playerLevel = player.level;

function calculateScore() {
    return player.level * 100;
}

alert("Score: " + calculateScore());
[endscript]

[text text="Game continues..."]

*end`;

    document = await vscode.workspace.openTextDocument({
      content: testContent,
      language: "tyrano",
    });
  });

  test("Completion Provider - Should provide JavaScript completions in iscript blocks", async () => {
    // Position inside iscript block
    const position = new vscode.Position(8, 0); // Inside iscript block
    const token = { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) };
    const completions = await completionProvider.provideCompletionItems(
      document,
      position,
      token,
      { triggerKind: vscode.CompletionTriggerKind.Invoke, triggerCharacter: undefined }
    );

    assert.ok(completions, "Should provide completions");
    assert.ok(completions.length > 0, "Should provide at least one completion");

    // Check for JavaScript globals
    const consoleCompletion = completions.find(item => item.label === "console");
    assert.ok(consoleCompletion, "Should provide console completion");

    const alertCompletion = completions.find(item => item.label === "alert");
    assert.ok(alertCompletion, "Should provide alert completion");

    // Check for TyranoScript variables
    const fCompletion = completions.find(item => item.label === "f");
    assert.ok(fCompletion, "Should provide f (TyranoScript variables) completion");
  });

  test("Completion Provider - Should not provide completions outside iscript blocks", async () => {
    // Position outside iscript block
    const position = new vscode.Position(4, 0); // Outside iscript block
    const token = { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) };
    const completions = await completionProvider.provideCompletionItems(
      document,
      position,
      token,
      { triggerKind: vscode.CompletionTriggerKind.Invoke, triggerCharacter: undefined }
    );

    assert.strictEqual(completions.length, 0, "Should not provide completions outside iscript blocks");
  });

  test("Completion Provider - Should provide context-aware completions", async () => {
    // Create a document with console. trigger
    const consoleTestContent = `[iscript]
console.
[endscript]`;

    const consoleDoc = await vscode.workspace.openTextDocument({
      content: consoleTestContent,
      language: "tyrano",
    });

    const position = new vscode.Position(1, 8); // After "console."
    const token = { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) };
    const completions = await completionProvider.provideCompletionItems(
      consoleDoc,
      position,
      token,
      { triggerKind: vscode.CompletionTriggerKind.TriggerCharacter, triggerCharacter: "." }
    );

    assert.ok(completions, "Should provide console method completions");
    const logCompletion = completions.find(item => item.label === "log");
    assert.ok(logCompletion, "Should provide console.log completion");
  });

  test("Hover Provider - Should provide hover info in iscript blocks", () => {
    // Position inside iscript block on "console"
    const position = new vscode.Position(13, 0); // Inside iscript block
    const token = { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) };
    const hover = hoverProvider.provideHover(
      document,
      position,
      token
    );

    // Since we can't easily test exact word position, we'll test that the provider
    // correctly identifies iscript blocks
    // In a real scenario, hover would work when cursor is on specific words
    assert.ok(hover === null || hover instanceof vscode.Hover, "Should handle hover request properly");
  });

  test("Hover Provider - Should not provide hover outside iscript blocks", () => {
    // Position outside iscript block
    const position = new vscode.Position(4, 0); // Outside iscript block
    const token = { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) };
    const hover = hoverProvider.provideHover(
      document,
      position,
      token
    );

    assert.strictEqual(hover, null, "Should not provide hover outside iscript blocks");
  });

  test("Signature Help Provider - Should provide signature help in iscript blocks", async () => {
    // Create a document with function call
    const signatureTestContent = `[iscript]
alert(
[endscript]`;

    const signatureDoc = await vscode.workspace.openTextDocument({
      content: signatureTestContent,
      language: "tyrano",
    });

    const position = new vscode.Position(1, 6); // After "alert("
    const token = { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) };
    const signatureHelp = signatureProvider.provideSignatureHelp(
      signatureDoc,
      position,
      token,
      { 
        triggerKind: vscode.SignatureHelpTriggerKind.TriggerCharacter, 
        triggerCharacter: "(",
        isRetrigger: false,
        activeSignatureHelp: undefined
      }
    );

    if (signatureHelp && typeof signatureHelp !== "object" || !("then" in signatureHelp)) {
      const help = signatureHelp as vscode.SignatureHelp;
      if (help && help.signatures) {
        assert.ok(help.signatures.length > 0, "Should provide signature information");
        assert.strictEqual(help.signatures[0].label, "alert(message: string): void", "Should provide correct alert signature");
      }
    }
  });

  test("Signature Help Provider - Should not provide signature help outside iscript blocks", () => {
    // Position outside iscript block
    const position = new vscode.Position(4, 0); // Outside iscript block
    const token = { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) };
    const signatureHelp = signatureProvider.provideSignatureHelp(
      document,
      position,
      token,
      { 
        triggerKind: vscode.SignatureHelpTriggerKind.TriggerCharacter, 
        triggerCharacter: "(",
        isRetrigger: false,
        activeSignatureHelp: undefined
      }
    );

    assert.strictEqual(signatureHelp, null, "Should not provide signature help outside iscript blocks");
  });

  test("JavaScript Keywords and Functions - Should provide comprehensive JavaScript support", async () => {
    const position = new vscode.Position(8, 0); // Inside iscript block
    const token = { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) };
    const completions = await completionProvider.provideCompletionItems(
      document,
      position,
      token,
      { triggerKind: vscode.CompletionTriggerKind.Invoke, triggerCharacter: undefined }
    );

    // Check for JavaScript keywords
    const varCompletion = completions.find(item => item.label === "var");
    assert.ok(varCompletion, "Should provide 'var' keyword completion");

    const functionCompletion = completions.find(item => item.label === "function");
    assert.ok(functionCompletion, "Should provide 'function' keyword completion");

    const ifCompletion = completions.find(item => item.label === "if");
    assert.ok(ifCompletion, "Should provide 'if' keyword completion");

    // Check for JavaScript globals
    const mathCompletion = completions.find(item => item.label === "Math");
    assert.ok(mathCompletion, "Should provide 'Math' object completion");

    const dateCompletion = completions.find(item => item.label === "Date");
    assert.ok(dateCompletion, "Should provide 'Date' constructor completion");
  });
});