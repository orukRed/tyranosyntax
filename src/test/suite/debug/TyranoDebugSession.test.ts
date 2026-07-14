/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as path from "path";
import { TyranoDebugSession } from "../../../debug/TyranoDebugSession";

/**
 * launchRequestは呼ばず、パス変換ユーティリティのみを検証する。
 * projectRootはprivateフィールドなので直接設定する。
 */
const createSession = (projectRoot: string): TyranoDebugSession => {
  const session = new TyranoDebugSession("/dummy/extension");
  (session as any).projectRoot = projectRoot;
  return session;
};

suite("TyranoDebugSession.getScenarioRelativePath", () => {
  test("正常系 data/scenario配下の絶対パスから相対パスを返す", () => {
    const projectRoot = path.join(path.sep, "proj");
    const session = createSession(projectRoot);
    const absolutePath = path.join(
      projectRoot,
      "data",
      "scenario",
      "first.ks",
    );

    const result = (session as any).getScenarioRelativePath(absolutePath);

    assert.strictEqual(result, "first.ks");
  });

  test("正常系 サブフォルダ内のシナリオはスラッシュ区切りで返る", () => {
    const projectRoot = path.join(path.sep, "proj");
    const session = createSession(projectRoot);
    const absolutePath = path.join(
      projectRoot,
      "data",
      "scenario",
      "chapter1",
      "scene1.ks",
    );

    const result = (session as any).getScenarioRelativePath(absolutePath);

    // Windowsでもバックスラッシュはスラッシュに正規化される
    assert.strictEqual(result, "chapter1/scene1.ks");
  });
});

suite("TyranoDebugSession.resolveScenarioPath", () => {
  test("正常系 相対パスからdata/scenario配下の絶対パスを返す", () => {
    const projectRoot = path.join(path.sep, "proj");
    const session = createSession(projectRoot);

    const result = (session as any).resolveScenarioPath("first.ks");

    assert.strictEqual(
      result,
      path.join(projectRoot, "data", "scenario", "first.ks"),
    );
  });

  test("正常系 相対パス→絶対パス→相対パスの往復が恒等になる", () => {
    const projectRoot = path.join(path.sep, "proj");
    const session = createSession(projectRoot);

    const absolute = (session as any).resolveScenarioPath("chapter1/scene1.ks");
    const roundTrip = (session as any).getScenarioRelativePath(absolute);

    assert.strictEqual(roundTrip, "chapter1/scene1.ks");
  });
});
