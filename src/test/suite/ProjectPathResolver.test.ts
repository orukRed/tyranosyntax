import * as assert from "assert";
import * as vscode from "vscode";
import path from "path";
import { ProjectPathResolver } from "../../ProjectPathResolver";

suite("ProjectPathResolver", () => {
  let resolver: ProjectPathResolver;

  setup(() => {
    resolver = new ProjectPathResolver();
  });

  suite("pathDelimiter", () => {
    test("正常系 OS依存の区切り文字を返す", () => {
      const expected = process.platform === "win32" ? "\\" : "/";
      assert.strictEqual(resolver.pathDelimiter, expected);
    });
  });

  suite("DATA定数", () => {
    test("正常系 各定数がpathDelimiterで始まる", () => {
      const d = resolver.pathDelimiter;
      assert.strictEqual(resolver.DATA_DIRECTORY, d + "data");
      assert.strictEqual(resolver.TYRANO_DIRECTORY, d + "tyrano");
      assert.strictEqual(resolver.DATA_BGIMAGE, d + "bgimage");
      assert.strictEqual(resolver.DATA_BGM, d + "bgm");
      assert.strictEqual(resolver.DATA_FGIMAGE, d + "fgimage");
      assert.strictEqual(resolver.DATA_IMAGE, d + "image");
      assert.strictEqual(resolver.DATA_OTHERS, d + "others");
      assert.strictEqual(resolver.DATA_SCENARIO, d + "scenario");
      assert.strictEqual(resolver.DATA_SOUND, d + "sound");
      assert.strictEqual(resolver.DATA_SYSTEM, d + "system");
      assert.strictEqual(resolver.DATA_VIDEO, d + "video");
    });
  });

  suite("getWorkspaceRootPath", () => {
    test("正常系 ワークスペースが開いている場合に文字列を返す", () => {
      const result = resolver.getWorkspaceRootPath();
      assert.ok(typeof result === "string", "戻り値は文字列であるべき");
    });
  });

  suite("getTyranoScriptProjectRootPaths", () => {
    test("正常系 配列を返す", () => {
      const result = resolver.getTyranoScriptProjectRootPaths();
      assert.ok(Array.isArray(result), "戻り値は配列であるべき");
    });
  });

  suite("getProjectPathByFilePath", () => {
    test("正常系 test_projectのファイルからプロジェクトパスを取得", async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : "";
      const filePath = path.join(
        workspaceFolder,
        "data",
        "scenario",
        "first.ks",
      );
      const result = resolver.getProjectPathByFilePath(filePath);
      assert.ok(
        typeof result === "string",
        "戻り値は文字列であるべき",
      );
    });

    test("異常系 存在しないパスで空文字を返す", () => {
      const result = resolver.getProjectPathByFilePath(
        "/nonexistent/path/file.ks",
      );
      assert.strictEqual(result, "");
    });
  });

  suite("getProjectFiles", () => {
    test("正常系 bgimageフォルダから相対パスのファイル一覧を取得", async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : "";
      const filePath = path.join(
        workspaceFolder,
        "data",
        "scenario",
        "first.ks",
      );
      const projectPath = resolver.getProjectPathByFilePath(filePath);
      const bgimagePath = path.join(projectPath, "data", "bgimage");

      const result = resolver.getProjectFiles(
        bgimagePath,
        [".jpg", ".ogg"],
        false,
      );
      assert.ok(Array.isArray(result), "戻り値は配列であるべき");
    });

    test("異常系 空文字で空配列を返す", () => {
      assert.deepStrictEqual(resolver.getProjectFiles(""), []);
    });

    test("異常系 不正なパスで空配列を返す", () => {
      assert.deepStrictEqual(
        resolver.getProjectFiles("hoge/foo/bar/"),
        [],
      );
    });
  });

  suite("isSamePath", () => {
    test("正常系 同じパスの場合trueを返す", () => {
      const p = "/some/path";
      assert.strictEqual(resolver.isSamePath(p, p), true);
    });

    test("正常系 異なるパスの場合falseを返す", () => {
      assert.strictEqual(
        resolver.isSamePath("/path/a", "/path/b"),
        false,
      );
    });

    test("異常系 undefinedの場合falseを返す", () => {
      assert.strictEqual(
        resolver.isSamePath(undefined as unknown as string, "/path"),
        false,
      );
    });
  });

  suite("convertToAbsolutePathFromRelativePath", () => {
    test("正常系 文字列を返す", () => {
      const result =
        resolver.convertToAbsolutePathFromRelativePath("./relative");
      assert.ok(typeof result === "string", "戻り値は文字列であるべき");
    });
  });

  suite("isSkipParse", () => {
    test("正常系 booleanを返す", () => {
      const result = resolver.isSkipParse("/some/file.ks", "/some");
      assert.ok(
        typeof result === "boolean",
        "戻り値はbooleanであるべき",
      );
    });
  });
});
