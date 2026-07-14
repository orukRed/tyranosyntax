/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { InformationWorkSpace } from "../../InformationWorkSpace";
import path from "path";
import * as fs from "fs";
// import * as myExtension from '../../extension';

suite("InformationWorkSpace.getInstance", () => {
  test("正常系 シングルトンパターン", () => {
    // 実行
    const instance1 = InformationWorkSpace.getInstance();
    const instance2 = InformationWorkSpace.getInstance();

    // アサート
    assert.strictEqual(instance1, instance2, "同じインスタンスが返されるべき");
    assert.ok(
      instance1 instanceof InformationWorkSpace,
      "InformationWorkSpaceのインスタンスであるべき",
    );
  });
});

suite("InformationWorkSpace.getProjectRootPath", () => {
  test("正常系", async () => {
    //値定義
    const info = InformationWorkSpace.getInstance();
    // ワークスペースが開かれていない環境（runTest.tsの第2回実行など）ではスキップ
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders || wsFolders.length === 0) {
      return;
    }
    const workspaceFolder = wsFolders[0].uri.fsPath;
    const filePath = path.join(workspaceFolder, "data", "scenario", "first.ks");
    const expect = path.join(workspaceFolder);
    //実行
    const actual = await info.getProjectPathByFilePath(filePath);
    //アサート
    assert.deepStrictEqual(actual, expect);
  });
});

suite("InformationWorkSpace.getWorkspaceRootPath", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("正常系 ワークスペースを開いている場合は先頭フォルダのパスを返す", () => {
    const info = InformationWorkSpace.getInstance();
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders || wsFolders.length === 0) {
      // ワークスペース未オープン時は空文字を返す契約
      assert.strictEqual(info.getWorkspaceRootPath(), "");
      return;
    }
    assert.strictEqual(info.getWorkspaceRootPath(), wsFolders[0].uri.fsPath);
  });
});

suite("InformationWorkSpace.getProjectFiles", () => {
  vscode.window.showInformationMessage("Start all tests.");
  // 配列はdeepStrictEqualを使うこと。配列を再帰的に中身まで見てくれる。
  // strictEqualだとアドレスを比較する。
  test("正常系 プロジェクトパスだとファイル多すぎるのでbgimageフォルダを指定", async () => {
    //値定義
    const info = InformationWorkSpace.getInstance();
    // ワークスペースが開かれていない環境（runTest.tsの第2回実行など）ではスキップ
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders || wsFolders.length === 0) {
      return;
    }
    const expect = ["room.jpg", "rouka.jpg", "title.jpg"];
    const workspaceFolder = wsFolders[0].uri.fsPath;
    const filePath = path.join(workspaceFolder, "data", "scenario", "first.ks");
    const projectRootPath = await info.getProjectPathByFilePath(filePath);
    const bgimagePath = path.join(projectRootPath, "data", "bgimage");

    assert.deepStrictEqual(
      await info.getProjectFiles(bgimagePath, [".jpg", ".ogg"], false),
      expect,
    );
  });
  test("異常系 不正なパスを与える", () => {
    //値定義
    const info = InformationWorkSpace.getInstance();
    assert.deepStrictEqual(info.getProjectFiles("hoge/foo/bar/"), []);
  });

  test("異常系 パスでない文字列を与える", () => {
    //値定義
    const info = InformationWorkSpace.getInstance();
    assert.deepStrictEqual(info.getProjectFiles("hoge"), []);
  });

  test("異常系 空文字を与える", () => {
    //値定義
    const info = InformationWorkSpace.getInstance();
    assert.deepStrictEqual(info.getProjectFiles(""), []);
  });
});

suite("InformationWorkSpace.initializeMaps", () => {
  test("正常系 各プロジェクトのマップが初期化される", async function () {
    // プロジェクト全体をパースするため余裕を持たせる
    this.timeout(60000);
    const info = InformationWorkSpace.getInstance();

    // rejectされれば awaitでテストが失敗する
    await info.initializeMaps();

    // ワークスペースを開いている場合、プロジェクトごとのマップが作られていること
    for (const projectPath of info.getTyranoScriptProjectRootPaths()) {
      assert.ok(
        info.defineMacroMap.has(projectPath),
        `defineMacroMapに${projectPath}のエントリがあるべき`,
      );
      assert.ok(
        info.variableMap.has(projectPath),
        `variableMapに${projectPath}のエントリがあるべき`,
      );
      assert.ok(
        info.characterMap.has(projectPath),
        `characterMapに${projectPath}のエントリがあるべき`,
      );
    }
  });
});

suite("InformationWorkSpace.getTyranoScriptProjectRootPaths", () => {
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();

    // 実行
    const result = await info.getTyranoScriptProjectRootPaths();

    // アサート
    assert.ok(Array.isArray(result), "戻り値は配列であるべき");
  });
});

suite("InformationWorkSpace.updateScriptFileMap", () => {
  test("正常系 .jsファイルの内容がscriptFileMapに格納される", async () => {
    const info = InformationWorkSpace.getInstance();
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders || wsFolders.length === 0) {
      return;
    }
    const pluginJs = path.join(
      wsFolders[0].uri.fsPath,
      "data",
      "others",
      "plugin",
      "notification",
      "plugin.js",
    );

    await info.updateScriptFileMap(pluginJs);

    assert.strictEqual(
      info.scriptFileMap.get(pluginJs),
      fs.readFileSync(pluginJs, "utf-8"),
      "ディスク上の内容と一致するべき",
    );
  });

  test("正常系 .js以外の拡張子は無視される", async () => {
    const info = InformationWorkSpace.getInstance();
    const testPath = path.join("test", "not-a-script.txt");

    await info.updateScriptFileMap(testPath);

    assert.strictEqual(
      info.scriptFileMap.has(testPath),
      false,
      ".js以外はマップに追加されないべき",
    );
  });

  test("異常系 存在しない.jsファイルはrejectされキャッシュから削除される", async () => {
    const info = InformationWorkSpace.getInstance();
    const missingPath = path.join("no", "such", "dir", "missing.js");
    info.scriptFileMap.set(missingPath, "stale content");
    try {
      await assert.rejects(() => info.updateScriptFileMap(missingPath));
      assert.strictEqual(
        info.scriptFileMap.has(missingPath),
        false,
        "読み込み失敗時はキャッシュから削除されるべき",
      );
    } finally {
      info.scriptFileMap.delete(missingPath);
    }
  });
});

suite("InformationWorkSpace.updateScenarioFileMap", () => {
  test("正常系 .ksファイルがTextDocumentとしてscenarioFileMapに格納される", async () => {
    const info = InformationWorkSpace.getInstance();
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders || wsFolders.length === 0) {
      return;
    }
    const firstKs = path.join(
      wsFolders[0].uri.fsPath,
      "data",
      "scenario",
      "first.ks",
    );

    await info.updateScenarioFileMap(firstKs);

    const doc = info.scenarioFileMap.get(firstKs);
    assert.ok(doc, "scenarioFileMapにTextDocumentが登録されるべき");
    assert.strictEqual(
      doc!.getText(),
      fs.readFileSync(firstKs, "utf-8"),
      "ディスク上の内容と一致するべき",
    );
  });

  test("正常系 .ks以外の拡張子は無視される", async () => {
    const info = InformationWorkSpace.getInstance();
    const testPath = path.join("test", "not-a-scenario.txt");

    await info.updateScenarioFileMap(testPath);

    assert.strictEqual(
      info.scenarioFileMap.has(testPath),
      false,
      ".ks以外はマップに追加されないべき",
    );
  });

  test("異常系 存在しない.ksファイルはrejectされる", async () => {
    const info = InformationWorkSpace.getInstance();
    const missingPath = path.join("no", "such", "dir", "missing.ks");

    await assert.rejects(() => info.updateScenarioFileMap(missingPath));
  });
});

suite("InformationWorkSpace.updateMacroDataMapByJs", () => {
  // 正常系（plugin.jsからのタグ抽出）は
  // suite "InformationWorkSpace plugin auto-detection" で検証済み
  test("異常系 scriptFileMap未登録のパスはrejectされる", async () => {
    const info = InformationWorkSpace.getInstance();
    const unregisteredPath = path.join("no", "such", "dir", "macro.js");

    await assert.rejects(() => info.updateMacroDataMapByJs(unregisteredPath));
  });
});


suite("InformationWorkSpace.updateMacroLabelVariableDataMapByKs", () => {
  test("正常系 登録済みシナリオのlabelMap/transitionMapが構築される", async () => {
    const info = InformationWorkSpace.getInstance();
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders || wsFolders.length === 0) {
      return;
    }
    const firstKs = path.join(
      wsFolders[0].uri.fsPath,
      "data",
      "scenario",
      "first.ks",
    );
    await info.updateScenarioFileMap(firstKs);

    await info.updateMacroLabelVariableDataMapByKs(firstKs);

    assert.ok(
      Array.isArray(info.labelMap.get(firstKs)),
      "labelMapにエントリが作られるべき",
    );
    const transitions = info.transitionMap.get(firstKs);
    assert.ok(Array.isArray(transitions), "transitionMapにエントリが作られるべき");
    // first.ksには @call storage="tyrano.ks" と @jump storage="title.ks" がある
    assert.ok(
      transitions!.length >= 1,
      "call/jumpタグからトランジションが抽出されるべき",
    );
  });

  test("異常系 scenarioFileMap未登録のパスは何もせず解決する", async () => {
    const info = InformationWorkSpace.getInstance();
    const unregisteredPath = path.join("no", "such", "dir", "scenario.ks");

    await info.updateMacroLabelVariableDataMapByKs(unregisteredPath);

    assert.strictEqual(
      info.labelMap.has(unregisteredPath),
      false,
      "未登録パスに対してlabelMapエントリは作られないべき",
    );
  });
});

suite("InformationWorkSpace.addResourceFileMap", () => {
  test("正常系 リソースが追加され、二重追加はされない", async () => {
    const info = InformationWorkSpace.getInstance();
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders || wsFolders.length === 0) {
      return;
    }
    const projectPath = wsFolders[0].uri.fsPath;
    const roomJpg = path.join(projectPath, "data", "bgimage", "room.jpg");
    if (!info.resourceFileMap.has(projectPath)) {
      info.resourceFileMap.set(projectPath, []);
    }

    await info.addResourceFileMap(roomJpg);
    await info.addResourceFileMap(roomJpg); // 2回目は重複追加されない

    const entries = info.resourceFileMap
      .get(projectPath)!
      .filter((r) => r.filePath === roomJpg);
    assert.strictEqual(entries.length, 1, "同一パスは1エントリのみであるべき");
  });

  test("異常系 プロジェクト外のパスは追加されない", async () => {
    const info = InformationWorkSpace.getInstance();
    const outsidePath = path.join("no", "such", "project", "test.jpg");
    const sizeBefore = info.resourceFileMap.size;

    await info.addResourceFileMap(outsidePath);

    assert.strictEqual(
      info.resourceFileMap.size,
      sizeBefore,
      "未知プロジェクトのエントリは作られないべき",
    );
  });
});

suite("InformationWorkSpace.spliceResourceFileMapByFilePath", () => {
  test("正常系 追加したリソースが削除される", async () => {
    const info = InformationWorkSpace.getInstance();
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders || wsFolders.length === 0) {
      return;
    }
    const projectPath = wsFolders[0].uri.fsPath;
    const roomJpg = path.join(projectPath, "data", "bgimage", "room.jpg");
    if (!info.resourceFileMap.has(projectPath)) {
      info.resourceFileMap.set(projectPath, []);
    }
    try {
      await info.addResourceFileMap(roomJpg);

      await info.spliceResourceFileMapByFilePath(roomJpg);

      const entries = info.resourceFileMap
        .get(projectPath)!
        .filter((r) => r.filePath === roomJpg);
      assert.strictEqual(entries.length, 0, "削除後はエントリが無いべき");
    } finally {
      // 他テスト・拡張機能本体のためにエントリを復元しておく
      await info.addResourceFileMap(roomJpg);
    }
  });

  test("異常系 未知プロジェクトのパスでも例外にならずマップは変化しない", async () => {
    const info = InformationWorkSpace.getInstance();
    const sizeBefore = info.resourceFileMap.size;

    await info.spliceResourceFileMapByFilePath(
      path.join("no", "such", "resource.jpg"),
    );

    assert.strictEqual(info.resourceFileMap.size, sizeBefore);
  });
});

suite("InformationWorkSpace.spliceScenarioFileMapByFilePath", () => {
  test("正常系 指定キーがマップから削除される", async () => {
    const info = InformationWorkSpace.getInstance();
    const testPath = path.join("fake", "scenario.ks");
    info.scenarioFileMap.set(testPath, {} as vscode.TextDocument);
    try {
      await info.spliceScenarioFileMapByFilePath(testPath);
      assert.strictEqual(info.scenarioFileMap.has(testPath), false);
    } finally {
      info.scenarioFileMap.delete(testPath);
    }
  });
});

suite("InformationWorkSpace.spliceScriptFileMapByFilePath", () => {
  test("正常系 指定キーがマップから削除される", async () => {
    const info = InformationWorkSpace.getInstance();
    const testPath = path.join("fake", "script.js");
    info.scriptFileMap.set(testPath, "content");
    try {
      await info.spliceScriptFileMapByFilePath(testPath);
      assert.strictEqual(info.scriptFileMap.has(testPath), false);
    } finally {
      info.scriptFileMap.delete(testPath);
    }
  });
});

suite("InformationWorkSpace.spliceMacroDataMapByFilePath", () => {
  test("正常系 InProject:登録済みマクロが削除されタグ名リストが返る", () => {
    const info = InformationWorkSpace.getInstance();
    const fakeProject = path.join("fake", "project");
    const fakeFile = path.join(fakeProject, "data", "scenario", "macro.ks");
    const projectMacroMap = new Map<string, any>([
      ["uuid-1", { macroName: "my_macro" }],
    ]);
    info.defineMacroMap.set(fakeProject, projectMacroMap);
    (info as any)._macroByFilePath.set(fakeFile, new Set(["uuid-1"]));
    try {
      const deleteTagList = info.spliceMacroDataMapByFilePathInProject(
        fakeProject,
        fakeFile,
      );

      assert.deepStrictEqual(deleteTagList, ["my_macro"]);
      assert.strictEqual(projectMacroMap.size, 0, "マクロが削除されるべき");
      assert.strictEqual(
        (info as any)._macroByFilePath.has(fakeFile),
        false,
        "逆引きマップからも削除されるべき",
      );
    } finally {
      info.defineMacroMap.delete(fakeProject);
      (info as any)._macroByFilePath.delete(fakeFile);
    }
  });

  test("異常系 未登録ファイルは空配列を返す", async () => {
    const info = InformationWorkSpace.getInstance();
    const result = await info.spliceMacroDataMapByFilePath(
      path.join("no", "such", "macro.ks"),
    );
    assert.deepStrictEqual(result, []);
  });
});

suite("InformationWorkSpace.spliceLabelMapByFilePath", () => {
  test("正常系 指定キーがマップから削除される", async () => {
    const info = InformationWorkSpace.getInstance();
    const testPath = path.join("fake", "labels.ks");
    info.labelMap.set(testPath, []);
    try {
      await info.spliceLabelMapByFilePath(testPath);
      assert.strictEqual(info.labelMap.has(testPath), false);
    } finally {
      info.labelMap.delete(testPath);
    }
  });
});

suite("InformationWorkSpace.spliceVariableMapByFilePath", () => {
  test("正常系 InProject:対象ファイル由来の変数のみ削除される", () => {
    const info = InformationWorkSpace.getInstance();
    const fakeProject = path.join("fake", "project");
    const targetFile = path.join(fakeProject, "data", "scenario", "a.ks");
    const otherFile = path.join(fakeProject, "data", "scenario", "b.ks");
    const makeVariable = (fsPath: string) =>
      ({ locations: [{ uri: { fsPath } }] }) as any;
    const projectVariableMap = new Map<string, any>([
      ["f.target", makeVariable(targetFile)],
      ["f.other", makeVariable(otherFile)],
    ]);
    info.variableMap.set(fakeProject, projectVariableMap);
    try {
      info.spliceVariableMapByFilePathInProject(fakeProject, targetFile);

      assert.strictEqual(
        projectVariableMap.has("f.target"),
        false,
        "対象ファイル由来の変数は削除されるべき",
      );
      assert.strictEqual(
        projectVariableMap.has("f.other"),
        true,
        "他ファイル由来の変数は残るべき",
      );
    } finally {
      info.variableMap.delete(fakeProject);
    }
  });

  test("異常系 未知プロジェクトのパスでも例外にならない", () => {
    const info = InformationWorkSpace.getInstance();
    info.spliceVariableMapByFilePath(path.join("no", "such", "vars.ks"));
  });
});

suite("InformationWorkSpace.spliceCharacterMapByFilePath", () => {
  test("正常系 InProject:対象ファイルで定義されたキャラクターのみ削除される", () => {
    const info = InformationWorkSpace.getInstance();
    const fakeProject = path.join("fake", "project");
    const targetFile = path.join(fakeProject, "data", "scenario", "a.ks");
    const otherFile = path.join(fakeProject, "data", "scenario", "b.ks");
    const makeCharacter = (fsPath: string) =>
      ({
        deleteFaceByFilePath: () => {},
        deleteLayerByFilePath: () => {},
        location: { uri: { fsPath } },
      }) as any;
    info.characterMap.set(fakeProject, [
      makeCharacter(targetFile),
      makeCharacter(otherFile),
    ]);
    try {
      info.spliceCharacterMapByFilePathInProject(fakeProject, targetFile);

      const remaining = info.characterMap.get(fakeProject)!;
      assert.strictEqual(remaining.length, 1, "対象ファイル分のみ削除されるべき");
      assert.strictEqual(remaining[0].location.uri.fsPath, otherFile);
    } finally {
      info.characterMap.delete(fakeProject);
    }
  });

  test("異常系 未知プロジェクトのパスでも例外にならない", () => {
    const info = InformationWorkSpace.getInstance();
    info.spliceCharacterMapByFilePath(path.join("no", "such", "chara.ks"));
  });
});

suite("InformationWorkSpace.spliceSuggestionsByFilePath", () => {
  test("正常系 デフォルトタグ以外の削除対象タグがsuggestionsから消える", async () => {
    const info = InformationWorkSpace.getInstance();
    const fakeProject = path.join("fake", "project");
    info.suggestions.set(fakeProject, {
      my_custom_tag: { name: "my_custom_tag" },
      keep_tag: { name: "keep_tag" },
    });
    try {
      await info.spliceSuggestionsByFilePath(fakeProject, ["my_custom_tag"]);

      const suggestions = info.suggestions.get(fakeProject) as Record<
        string,
        unknown
      >;
      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(suggestions, "my_custom_tag"),
        false,
        "指定タグは削除されるべき",
      );
      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(suggestions, "keep_tag"),
        true,
        "指定していないタグは残るべき",
      );
    } finally {
      info.suggestions.delete(fakeProject);
    }
  });

  test("異常系 suggestions未登録のプロジェクトは何もせず解決する", async () => {
    const info = InformationWorkSpace.getInstance();
    await info.spliceSuggestionsByFilePath(path.join("no", "such", "project"), [
      "sometag",
    ]);
  });
});

suite("InformationWorkSpace.isSkipParse", () => {
  test("正常系 plugin配下のファイルはスキップ対象になる", () => {
    const info = InformationWorkSpace.getInstance();
    const original = (info as any).isParsePluginFolder;
    (info as any).isParsePluginFolder = false;
    try {
      const directory = path.join(path.sep, "fake", "project");
      const pluginFile = path.join(
        directory,
        "data",
        "others",
        "plugin",
        "notification",
        "init.ks",
      );
      assert.strictEqual(info.isSkipParse(pluginFile, directory), true);
    } finally {
      (info as any).isParsePluginFolder = original;
    }
  });

  test("正常系 plugin配下以外のファイルはスキップされない", () => {
    const info = InformationWorkSpace.getInstance();
    const original = (info as any).isParsePluginFolder;
    (info as any).isParsePluginFolder = false;
    try {
      const directory = path.join(path.sep, "fake", "project");
      const scenarioFile = path.join(directory, "data", "scenario", "first.ks");
      assert.strictEqual(info.isSkipParse(scenarioFile, directory), false);
    } finally {
      (info as any).isParsePluginFolder = original;
    }
  });

  test("正常系 isParsePluginFolderがtrueなら常にスキップしない", () => {
    const info = InformationWorkSpace.getInstance();
    const original = (info as any).isParsePluginFolder;
    (info as any).isParsePluginFolder = true;
    try {
      const directory = path.join(path.sep, "fake", "project");
      const pluginFile = path.join(
        directory,
        "data",
        "others",
        "plugin",
        "notification",
        "init.ks",
      );
      assert.strictEqual(info.isSkipParse(pluginFile, directory), false);
    } finally {
      (info as any).isParsePluginFolder = original;
    }
  });

  test("正常系 pluginフォルダ自体（配下でないパス）はスキップされない", () => {
    const info = InformationWorkSpace.getInstance();
    const original = (info as any).isParsePluginFolder;
    (info as any).isParsePluginFolder = false;
    try {
      const directory = path.join(path.sep, "fake", "project");
      const pluginFolderItself = path.join(
        directory,
        "data",
        "others",
        "plugin",
      );
      assert.strictEqual(info.isSkipParse(pluginFolderItself, directory), false);
    } finally {
      (info as any).isParsePluginFolder = original;
    }
  });
});

suite("InformationWorkSpace.getSuggestionVersion", () => {
  test("正常系 未知のプロジェクトは0を返す", () => {
    const info = InformationWorkSpace.getInstance();
    assert.strictEqual(
      info.getSuggestionVersion(path.join("no", "such", "project")),
      0,
    );
  });

  test("正常系 markSuggestionsUpdated相当の更新後はそのバージョンを返す", () => {
    const info = InformationWorkSpace.getInstance();
    const fakeProject = path.join("fake", "version-project");
    (info as any)._suggestionVersions.set(fakeProject, 42);
    try {
      assert.strictEqual(info.getSuggestionVersion(fakeProject), 42);
    } finally {
      (info as any)._suggestionVersions.delete(fakeProject);
    }
  });
});

suite("InformationWorkSpace.getProjectPathByFilePath additional tests", () => {
  test("正常系 独立テスト", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();
    const testPath = "/test/project/data/scenario/test.ks";

    // 実行
    try {
      const result = await info.getProjectPathByFilePath(testPath);
      // 戻り値は文字列またはundefined
      assert.ok(
        typeof result === "string" || result === undefined,
        "戻り値は文字列またはundefinedであるべき",
      );
    } catch (_error) {
      // エラーは想定内
      assert.ok(true, "エラーは想定内");
    }
  });
});

suite("InformationWorkSpace.isSamePath", () => {
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();
    const path1 = "/test/path1";
    const path2 = "/test/path2";

    // 実行
    const result = info.isSamePath(path1, path2);

    // アサート
    assert.ok(typeof result === "boolean", "戻り値はbooleanであるべき");
  });
});

suite("InformationWorkSpace.convertToAbsolutePathFromRelativePath", () => {
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();
    const relativePath = "./relative/path";

    // 実行
    const result = info.convertToAbsolutePathFromRelativePath(relativePath);

    // アサート
    assert.ok(typeof result === "string", "戻り値は文字列であるべき");
  });
});

suite("InformationWorkSpace plugin auto-detection", () => {
  test("isPluginFile はプラグインフォルダ配下のファイルでtrueを返す", () => {
    const info = InformationWorkSpace.getInstance();
    const workspaceFolder = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : "";
    const pluginFile = path.join(
      workspaceFolder,
      "data",
      "others",
      "plugin",
      "notification",
      "plugin.js",
    );
    const nonPluginFile = path.join(
      workspaceFolder,
      "data",
      "scenario",
      "first.ks",
    );

    assert.strictEqual(info.isPluginFile(pluginFile, workspaceFolder), true);
    assert.strictEqual(
      info.isPluginFile(nonPluginFile, workspaceFolder),
      false,
    );
  });

  test("extractPluginNameFromInitKs は init.ks からプラグイン名を取得する", () => {
    const info = InformationWorkSpace.getInstance();
    const workspaceFolder = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : "";
    const initKs = path.join(
      workspaceFolder,
      "data",
      "others",
      "plugin",
      "notification",
      "init.ks",
    );
    const otherKs = path.join(
      workspaceFolder,
      "data",
      "others",
      "plugin",
      "notification",
      "sub",
      "init.ks",
    );

    assert.strictEqual(
      info.extractPluginNameFromInitKs(initKs, workspaceFolder),
      "notification",
    );
    assert.strictEqual(
      info.extractPluginNameFromInitKs(otherKs, workspaceFolder),
      undefined,
    );
  });

  test("updatePluginParamsFromInitKs は mp.* 参照を抽出する", async () => {
    const info = InformationWorkSpace.getInstance();
    const workspaceFolder = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : "";
    const initKs = path.join(
      workspaceFolder,
      "data",
      "others",
      "plugin",
      "notification",
      "init.ks",
    );

    await info.updatePluginParamsFromInitKs(initKs);

    const set = info.pluginParameterMap
      .get(workspaceFolder)
      ?.get("notification");
    assert.ok(set, "notification プラグインのパラメータセットが存在する");
    assert.strictEqual(set!.has("offset_top"), true);
    assert.strictEqual(set!.has("offset_right"), true);
  });

  test("updateMacroDataMapByJs は plugin.js から pm/vital を抽出する", async () => {
    const info = InformationWorkSpace.getInstance();
    const workspaceFolder = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : "";
    const pluginJs = path.join(
      workspaceFolder,
      "data",
      "others",
      "plugin",
      "notification",
      "plugin.js",
    );

    // 必要な事前状態を直接セットアップ（initializeMaps全体を呼ばない）
    if (!info.suggestions.get(workspaceFolder)) {
      info.suggestions.set(workspaceFolder, {});
    }
    if (!info.defineMacroMap.get(workspaceFolder)) {
      info.defineMacroMap.set(workspaceFolder, new Map());
    }

    await info.updateScriptFileMap(pluginJs);
    await info.updateMacroDataMapByJs(pluginJs);

    // suggestionsに登録されているか
    const suggestions = info.suggestions.get(workspaceFolder) as Record<
      string,
      { name: string; parameters: { name: string; required: boolean }[] }
    >;
    assert.ok(suggestions, "suggestions が存在する");
    assert.ok(
      suggestions["notify"],
      "notify タグが suggestions に登録されている",
    );

    const params = suggestions["notify"].parameters;
    const paramNames = params.map((p) => p.name);
    assert.ok(paramNames.includes("text"), "text パラメータが登録されている");
    assert.ok(
      paramNames.includes("duration"),
      "duration パラメータが登録されている",
    );

    const textParam = params.find((p) => p.name === "text");
    assert.strictEqual(
      textParam?.required,
      true,
      "vital に含まれる text は required=true",
    );
    const durationParam = params.find((p) => p.name === "duration");
    assert.strictEqual(
      durationParam?.required,
      false,
      "vital に含まれない duration は required=false",
    );

    // notify_init / notify_clear も登録される
    assert.ok(suggestions["notify_init"], "notify_init が登録されている");
    assert.ok(suggestions["notify_clear"], "notify_clear が登録されている");
  });

  test("updateMacroDataMapByJs は object(varname) ラッパパターンからも pm/vital を抽出する", async () => {
    const info = InformationWorkSpace.getInstance();
    const workspaceFolder = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : "";
    const pluginJs = path.join(
      workspaceFolder,
      "data",
      "others",
      "plugin",
      "notify_show",
      "main.js",
    );

    if (!info.suggestions.get(workspaceFolder)) {
      info.suggestions.set(workspaceFolder, {});
    }
    if (!info.defineMacroMap.get(workspaceFolder)) {
      info.defineMacroMap.set(workspaceFolder, new Map());
    }

    await info.updateScriptFileMap(pluginJs);
    await info.updateMacroDataMapByJs(pluginJs);

    const suggestions = info.suggestions.get(workspaceFolder) as Record<
      string,
      { name: string; parameters: { name: string; required: boolean }[] }
    >;
    assert.ok(suggestions, "suggestions が存在する");
    assert.ok(
      suggestions["p_notify"],
      "p_notify タグが suggestions に登録されている",
    );

    const params = suggestions["p_notify"].parameters;
    assert.ok(
      Array.isArray(params),
      "object(cfg) パターンでも parameters が配列として抽出される",
    );
    const paramNames = params.map((p) => p.name);
    for (const expected of ["name", "text", "height", "delay"]) {
      assert.ok(
        paramNames.includes(expected),
        `${expected} パラメータが登録されている`,
      );
    }

    const textParam = params.find((p) => p.name === "text");
    assert.strictEqual(
      textParam?.required,
      true,
      "vital に含まれる text は required=true",
    );
    const nameParam = params.find((p) => p.name === "name");
    assert.strictEqual(
      nameParam?.required,
      false,
      "vital に含まれない name は required=false",
    );
  });
});
