/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as path from "path";
import * as vscode from "vscode";
import { TyranoHoverProvider } from "../../../subscriptions/TyranoHoverProvider";
import { InformationExtension } from "../../../InformationExtension";

/**
 * コンストラクタがInformationExtension.pathからTooltip JSONを読むため、
 * 未設定の場合は拡張機能のルート（out/test/suite/subscriptionsの4階層上）を設定する。
 * 戻り値は復元用の関数。
 */
const ensureExtensionPath = (): (() => void) => {
  const original = InformationExtension.path;
  if (!InformationExtension.path) {
    InformationExtension.path = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
    );
  }
  return () => {
    InformationExtension.path = original;
  };
};

const mockToken = {
  isCancellationRequested: false,
  onCancellationRequested: () => ({ dispose: () => {} }),
} as unknown as vscode.CancellationToken;

suite("TyranoHoverProvider.provideHover関数", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("正常系 正しくホバーが表示される", async () => {
    const restore = ensureExtensionPath();
    try {
      const provider = new TyranoHoverProvider();
      const document = await vscode.workspace.openTextDocument({
        language: "tyrano",
        content: '[bg storage="room.jpg"]',
      });

      // タグ名"bg"の上にカーソルを置く
      const hover = await provider.provideHover(
        document,
        new vscode.Position(0, 1),
        mockToken,
      );

      assert.ok(hover instanceof vscode.Hover, "Hoverが返されるべき");
      const markdown = hover.contents[0] as vscode.MarkdownString;
      assert.ok(
        markdown.value.includes("bg"),
        "ツールチップにタグ名が含まれるべき",
      );
    } finally {
      restore();
    }
  });

  test("正常系 @記法のタグでもホバーが表示される", async () => {
    const restore = ensureExtensionPath();
    try {
      const provider = new TyranoHoverProvider();
      const document = await vscode.workspace.openTextDocument({
        language: "tyrano",
        content: '@jump storage="title.ks"',
      });

      const hover = await provider.provideHover(
        document,
        new vscode.Position(0, 2),
        mockToken,
      );

      assert.ok(hover instanceof vscode.Hover, "Hoverが返されるべき");
      const markdown = hover.contents[0] as vscode.MarkdownString;
      assert.ok(
        markdown.value.includes("jump"),
        "ツールチップにタグ名が含まれるべき",
      );
    } finally {
      restore();
    }
  });

  test("異常系 存在しないタグへのホバー（ホバーが表示されない）", async () => {
    const restore = ensureExtensionPath();
    try {
      const provider = new TyranoHoverProvider();
      const document = await vscode.workspace.openTextDocument({
        language: "tyrano",
        content: "[zzz_unknown_tag]",
      });

      await assert.rejects(
        Promise.resolve(
          provider.provideHover(
            document,
            new vscode.Position(0, 1),
            mockToken,
          ),
        ),
      );
    } finally {
      restore();
    }
  });

  test("異常系 単語が無い位置へのホバー（ホバーが表示されない）", async () => {
    const restore = ensureExtensionPath();
    try {
      const provider = new TyranoHoverProvider();
      const document = await vscode.workspace.openTextDocument({
        language: "tyrano",
        content: "   ",
      });

      await assert.rejects(
        Promise.resolve(
          provider.provideHover(
            document,
            new vscode.Position(0, 0),
            mockToken,
          ),
        ),
      );
    } finally {
      restore();
    }
  });
});
