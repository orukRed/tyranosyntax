/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as path from "path";
import { TyranoFlowchart } from "../../../subscriptions/TyranoFlowchart";

suite("TyranoFlowchart.buildStorageResolution", () => {
  test("正常系 相対パスとファイル名のみの両方で解決できる", () => {
    const files = [
      { filePath: "/proj/data/scenario/first.ks", relativePath: "first.ks" },
      {
        filePath: path.join("/proj/data/scenario", "sub", "scene1.ks"),
        relativePath: path.join("sub", "scene1.ks"),
      },
    ];

    const resolution = (TyranoFlowchart as any).buildStorageResolution(files);

    assert.strictEqual(
      resolution["first.ks"],
      "/proj/data/scenario/first.ks",
    );
    // 相対パスはスラッシュ区切りに正規化される
    assert.strictEqual(
      resolution["sub/scene1.ks"],
      path.join("/proj/data/scenario", "sub", "scene1.ks"),
    );
    // サブフォルダのファイルはファイル名のみでも解決できる
    assert.strictEqual(
      resolution["scene1.ks"],
      path.join("/proj/data/scenario", "sub", "scene1.ks"),
    );
  });

  test("正常系 ファイル名衝突時はdata/scenario直下のファイルが優先される", () => {
    // サブフォルダ側が先に処理されても、直下ファイルの相対パスキーが
    // basenameと同一のため上書きされ、直下が優先される
    const files = [
      {
        filePath: "/proj/data/scenario/sub/common.ks",
        relativePath: "sub/common.ks",
      },
      {
        filePath: "/proj/data/scenario/common.ks",
        relativePath: "common.ks",
      },
    ];

    const resolution = (TyranoFlowchart as any).buildStorageResolution(files);

    assert.strictEqual(
      resolution["common.ks"],
      "/proj/data/scenario/common.ks",
      "直下のcommon.ksが優先されるべき",
    );
    assert.strictEqual(
      resolution["sub/common.ks"],
      "/proj/data/scenario/sub/common.ks",
    );
  });

  test("正常系 空の入力は空のマップを返す", () => {
    const resolution = (TyranoFlowchart as any).buildStorageResolution([]);
    assert.deepStrictEqual(resolution, {});
  });
});

suite("TyranoFlowchart.collectProjectScenarioFiles", () => {
  const projectPath = path.join(path.sep, "proj");
  const scenarioDir = path.join(projectPath, "data", "scenario");

  test("正常系 transitionMapとlabelMapのdata/scenario配下のファイルが集約される", () => {
    const inTransition = path.join(scenarioDir, "first.ks");
    const inLabelOnly = path.join(scenarioDir, "labels_only.ks");
    const outsideProject = path.join(
      path.sep,
      "other",
      "data",
      "scenario",
      "outside.ks",
    );
    const fakeInfoWs = {
      transitionMap: new Map([[inTransition, []]]),
      labelMap: new Map([
        [inLabelOnly, []],
        [outsideProject, []],
      ]),
    } as any;

    const result = (TyranoFlowchart as any).collectProjectScenarioFiles(
      fakeInfoWs,
      projectPath,
    );

    const filePaths = result.map((f: any) => f.filePath);
    assert.deepStrictEqual(filePaths, [inTransition, inLabelOnly]);
    assert.strictEqual(result[0].relativePath, "first.ks");
    assert.strictEqual(result[1].relativePath, "labels_only.ks");
  });

  test("正常系 両方のマップに存在するファイルは重複しない", () => {
    const filePath = path.join(scenarioDir, "first.ks");
    const fakeInfoWs = {
      transitionMap: new Map([[filePath, []]]),
      labelMap: new Map([[filePath, []]]),
    } as any;

    const result = (TyranoFlowchart as any).collectProjectScenarioFiles(
      fakeInfoWs,
      projectPath,
    );

    assert.strictEqual(result.length, 1);
  });

  test("正常系 data/scenario配下以外のファイルは除外される", () => {
    const outsideScenario = path.join(projectPath, "data", "others", "x.ks");
    const fakeInfoWs = {
      transitionMap: new Map([[outsideScenario, []]]),
      labelMap: new Map(),
    } as any;

    const result = (TyranoFlowchart as any).collectProjectScenarioFiles(
      fakeInfoWs,
      projectPath,
    );

    assert.deepStrictEqual(result, []);
  });
});
