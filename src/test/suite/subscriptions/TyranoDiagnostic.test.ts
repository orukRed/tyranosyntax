/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { TyranoDiagnostic } from "../../../subscriptions/TyranoDiagnostic";

suite("TyranoDiagnostic.isExistAmpersandAtBeginning", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("&f.hoge true返却", () => {
    //値定義
    const diag = new TyranoDiagnostic();
    assert.strictEqual(
      (diag as any).isExistAmpersandAtBeginning("&f.hoge"),
      true,
    );
  });

  test("f.hoge false返却", () => {
    //値定義
    const diag = new TyranoDiagnostic();
    assert.strictEqual(
      (diag as any).isExistAmpersandAtBeginning("f.hoge"),
      false,
    );
  });
});

