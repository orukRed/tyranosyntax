/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import { TyranoDebugConfigProvider } from "../../../debug/TyranoDebugConfigProvider";
import { InformationWorkSpace } from "../../../InformationWorkSpace";

/**
 * InformationWorkSpaceシングルトンのgetTyranoScriptProjectRootPathsをスタブし、
 * 復元用の関数を返す。
 */
const stubProjectRootPaths = (paths: string[]): (() => void) => {
  const infoWs = InformationWorkSpace.getInstance();
  const original = infoWs.getTyranoScriptProjectRootPaths;
  (infoWs as any).getTyranoScriptProjectRootPaths = () => paths;
  return () => {
    (infoWs as any).getTyranoScriptProjectRootPaths = original;
  };
};

suite("TyranoDebugConfigProvider.resolveDebugConfiguration", () => {
  test("正常系 空のconfigにはデフォルト値が設定される", () => {
    const restore = stubProjectRootPaths(["/proj/root"]);
    try {
      const provider = new TyranoDebugConfigProvider();
      const config = provider.resolveDebugConfiguration(
        undefined,
        {} as vscode.DebugConfiguration,
      ) as vscode.DebugConfiguration;

      assert.strictEqual(config.type, "tyranoDebug");
      assert.strictEqual(config.request, "launch");
      assert.strictEqual(config.name, "TyranoScript Debug");
      assert.strictEqual(config.projectRoot, "/proj/root");
      assert.strictEqual(config.scenario, "first.ks");
    } finally {
      restore();
    }
  });

  test("正常系 プロジェクトが検出できない場合はfolderにフォールバックする", () => {
    const restore = stubProjectRootPaths([]);
    try {
      const provider = new TyranoDebugConfigProvider();
      const folder = {
        uri: vscode.Uri.file("/workspace/folder"),
        name: "folder",
        index: 0,
      } as vscode.WorkspaceFolder;

      const config = provider.resolveDebugConfiguration(
        folder,
        {} as vscode.DebugConfiguration,
      ) as vscode.DebugConfiguration;

      assert.strictEqual(
        config.projectRoot,
        vscode.Uri.file("/workspace/folder").fsPath,
      );
    } finally {
      restore();
    }
  });

  test("正常系 プロジェクトもfolderも無い場合はprojectRootは未設定のまま", () => {
    const restore = stubProjectRootPaths([]);
    try {
      const provider = new TyranoDebugConfigProvider();
      const config = provider.resolveDebugConfiguration(
        undefined,
        {} as vscode.DebugConfiguration,
      ) as vscode.DebugConfiguration;

      assert.strictEqual(config.projectRoot, undefined);
      // デフォルト値自体は設定される
      assert.strictEqual(config.type, "tyranoDebug");
      assert.strictEqual(config.scenario, "first.ks");
    } finally {
      restore();
    }
  });

  test("正常系 設定済みの値は上書きされない", () => {
    const restore = stubProjectRootPaths(["/proj/root"]);
    try {
      const provider = new TyranoDebugConfigProvider();
      const input = {
        type: "tyranoDebug",
        request: "launch",
        name: "My Custom Debug",
        projectRoot: "/custom/root",
        scenario: "custom.ks",
      } as unknown as vscode.DebugConfiguration;

      const config = provider.resolveDebugConfiguration(
        undefined,
        input,
      ) as vscode.DebugConfiguration;

      assert.strictEqual(config.name, "My Custom Debug");
      assert.strictEqual(config.projectRoot, "/custom/root");
      assert.strictEqual(config.scenario, "custom.ks");
    } finally {
      restore();
    }
  });
});
