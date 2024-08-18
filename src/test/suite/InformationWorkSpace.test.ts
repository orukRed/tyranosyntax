import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { InformationWorkSpace } from "../../InformationWorkSpace";
import path from "path";
// import * as myExtension from '../../extension';

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

  test("正常系", () => {
    //値定義
    const info = InformationWorkSpace.getInstance();
    const workspaceFolder = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : "";
    const expect = workspaceFolder;
    //実行
    const actual = info.getWorkspaceRootPath();
    //アサート
    assert.strictEqual(actual, expect);
  });
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
  test("正常系", async () => {});
});
suite("InformationWorkSpace.getTyranoScriptProjectRootPaths", () => {
  test("正常系", async () => {});
});
suite("InformationWorkSpace.updateScriptFileMap", () => {
  test("正常系", async () => {});
});
suite("InformationWorkSpace.updateScenarioFileMap", () => {
  test("正常系", async () => {});
});
suite("InformationWorkSpace.updateMacroDataMapByJs", () => {
  test("正常系", async () => {});
});
suite("InformationWorkSpace.updateVariableMapByJS", () => {
  test("正常系", async () => {});
});
suite("InformationWorkSpace.updateMacroLabelVariableDataMapByKs", () => {
  test("正常系", async () => {});
});
suite("InformationWorkSpace.addResourceFileMap", () => {
  test("正常系", async () => {});
});
suite("InformationWorkSpace.spliceResourceFileMapByFilePath", () => {
  test("正常系", async () => {});
});
suite("InformationWorkSpace.spliceScenarioFileMapByFilePath", () => {
  test("正常系", async () => {});
});
suite("InformationWorkSpace.spliceScriptFileMapByFilePath", () => {
  test("正常系", async () => {});
});
suite("InformationWorkSpace.spliceMacroDataMapByFilePath", () => {
  test("正常系", async () => {});
});
suite("InformationWorkSpace.spliceLabelMapByFilePath", () => {
  test("正常系", async () => {});
});
suite("InformationWorkSpace.spliceVariableMapByFilePath", () => {
  test("正常系", async () => {});
});
suite("InformationWorkSpace.spliceCharacterMapByFilePath", () => {
  test("正常系", async () => {});
});
suite("InformationWorkSpace.spliceSuggestionsByFilePath", () => {
  test("正常系", async () => {});
});
suite("InformationWorkSpace.getProjectPathByFilePath", () => {
  test("正常系", async () => {});
});
suite("InformationWorkSpace.isSamePath", () => {
  test("正常系", async () => {});
});
suite("InformationWorkSpace.convertToAbsolutePathFromRelativePath", () => {
  test("正常系", async () => {});
});


