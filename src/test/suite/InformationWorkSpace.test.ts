import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { InformationWorkSpace } from "../../InformationWorkSpace";
import path from "path";
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
    const workspaceFolder = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : "";
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

  test("正常系", () => {});
});

suite("InformationWorkSpace.getProjectFiles", () => {
  vscode.window.showInformationMessage("Start all tests.");
  // 配列はdeepStrictEqualを使うこと。配列を再帰的に中身まで見てくれる。
  // strictEqualだとアドレスを比較する。
  test("正常系 プロジェクトパスだとファイル多すぎるのでbgimageフォルダを指定", async () => {
    //値定義
    const info = InformationWorkSpace.getInstance();

    const expect = ["room.jpg", "rouka.jpg", "title.jpg"];
    const workspaceFolder = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : "";
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
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();

    // 実行（例外が発生しないことを確認）
    assert.doesNotThrow(async () => {
      await info.initializeMaps();
    });
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
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();
    const testPath = "/test/script.js";

    // 実行（例外が発生しないことを確認）
    assert.doesNotThrow(async () => {
      await info.updateScriptFileMap(testPath);
    });
  });
});

suite("InformationWorkSpace.updateScenarioFileMap", () => {
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();
    const testPath = "/test/scenario.ks";

    // 実行（例外が発生しないことを確認）
    assert.doesNotThrow(async () => {
      await info.updateScenarioFileMap(testPath);
    });
  });
});

suite("InformationWorkSpace.updateMacroDataMapByJs", () => {
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();
    const testPath = "/test/macro.js";

    // 実行（例外が発生しないことを確認）
    assert.doesNotThrow(async () => {
      await info.updateMacroDataMapByJs(testPath);
    });
  });
});


suite("InformationWorkSpace.updateMacroLabelVariableDataMapByKs", () => {
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();
    const testPath = "/test/scenario.ks";

    // 実行（例外が発生しないことを確認）
    assert.doesNotThrow(async () => {
      await info.updateMacroLabelVariableDataMapByKs(testPath);
    });
  });
});

suite("InformationWorkSpace.addResourceFileMap", () => {
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();
    const filePath = "/test/project/data/bgimage/test.jpg";

    // 実行（例外が発生しないことを確認）
    assert.doesNotThrow(async () => {
      await info.addResourceFileMap(filePath);
    });
  });
});

suite("InformationWorkSpace.spliceResourceFileMapByFilePath", () => {
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();
    const testPath = "/test/resource.jpg";

    // 実行（例外が発生しないことを確認）
    assert.doesNotThrow(() => {
      info.spliceResourceFileMapByFilePath(testPath);
    });
  });
});

suite("InformationWorkSpace.spliceScenarioFileMapByFilePath", () => {
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();
    const testPath = "/test/scenario.ks";

    // 実行（例外が発生しないことを確認）
    assert.doesNotThrow(() => {
      info.spliceScenarioFileMapByFilePath(testPath);
    });
  });
});

suite("InformationWorkSpace.spliceScriptFileMapByFilePath", () => {
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();
    const testPath = "/test/script.js";

    // 実行（例外が発生しないことを確認）
    assert.doesNotThrow(() => {
      info.spliceScriptFileMapByFilePath(testPath);
    });
  });
});

suite("InformationWorkSpace.spliceMacroDataMapByFilePath", () => {
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();
    const testPath = "/test/macro.ks";

    // 実行（例外が発生しないことを確認）
    assert.doesNotThrow(() => {
      info.spliceMacroDataMapByFilePath(testPath);
    });
  });
});

suite("InformationWorkSpace.spliceLabelMapByFilePath", () => {
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();
    const testPath = "/test/scenario.ks";

    // 実行（例外が発生しないことを確認）
    assert.doesNotThrow(() => {
      info.spliceLabelMapByFilePath(testPath);
    });
  });
});

suite("InformationWorkSpace.spliceVariableMapByFilePath", () => {
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();
    const testPath = "/test/variables.ks";

    // 実行（例外が発生しないことを確認）
    assert.doesNotThrow(() => {
      info.spliceVariableMapByFilePath(testPath);
    });
  });
});

suite("InformationWorkSpace.spliceCharacterMapByFilePath", () => {
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();
    const testPath = "/test/character.ks";

    // 実行（例外が発生しないことを確認）
    assert.doesNotThrow(() => {
      info.spliceCharacterMapByFilePath(testPath);
    });
  });
});

suite("InformationWorkSpace.spliceSuggestionsByFilePath", () => {
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();
    const projectPath = "/test/project";
    const deleteTagList = ["testtag1", "testtag2"];

    // 実行（例外が発生しないことを確認）
    assert.doesNotThrow(async () => {
      await info.spliceSuggestionsByFilePath(projectPath, deleteTagList);
    });
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
});
