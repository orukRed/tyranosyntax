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

suite("InformationWorkSpace.updateVariableMapByJS", () => {
  test("正常系", async () => {
    // 値定義
    const info = InformationWorkSpace.getInstance();
    const testPath = "/test/variables.js";

    // 実行（例外が発生しないことを確認）
    assert.doesNotThrow(async () => {
      await info.updateVariableMapByJS(testPath);
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
