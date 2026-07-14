/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import { CrossFileContextManager } from "../../CrossFileContextManager";

/**
 * updateFromDocumentはgetText()とuriしか参照しないため、簡易フェイクで十分。
 */
const makeFakeDoc = (fsPath: string, text: string): vscode.TextDocument =>
  ({
    uri: vscode.Uri.file(fsPath),
    getText: () => text,
  }) as any;

suite("CrossFileContextManager.updateFromDocument", () => {
  test("正常系 iscriptブロック内のJavaScriptが抽出されキャッシュされる", () => {
    const manager = new CrossFileContextManager();
    try {
      const doc = makeFakeDoc(
        "/proj/data/scenario/a.ks",
        "[iscript]\nf.hoge = 1;\nf.fuga = 2;\n[endscript]",
      );
      manager.updateFromDocument(doc);

      assert.strictEqual(manager.cachedFileCount, 1);
      assert.strictEqual(
        manager.getOtherFilesContent("file:///other"),
        "f.hoge = 1;\nf.fuga = 2;",
      );
    } finally {
      manager.dispose();
    }
  });

  test("正常系 属性付きの[iscript cond=...]にも対応する", () => {
    const manager = new CrossFileContextManager();
    try {
      const doc = makeFakeDoc(
        "/proj/data/scenario/a.ks",
        '[iscript cond="f.flag==1"]\nf.hoge = 1;\n[endscript]',
      );
      manager.updateFromDocument(doc);

      assert.strictEqual(manager.cachedFileCount, 1);
      assert.strictEqual(
        manager.getOtherFilesContent("file:///other"),
        "f.hoge = 1;",
      );
    } finally {
      manager.dispose();
    }
  });

  test("正常系 @iscript記法にも対応する", () => {
    const manager = new CrossFileContextManager();
    try {
      const doc = makeFakeDoc(
        "/proj/data/scenario/a.ks",
        "@iscript\nf.hoge = 1;\n@endscript",
      );
      manager.updateFromDocument(doc);

      assert.strictEqual(manager.cachedFileCount, 1);
      assert.strictEqual(
        manager.getOtherFilesContent("file:///other"),
        "f.hoge = 1;",
      );
    } finally {
      manager.dispose();
    }
  });

  test("正常系 複数ブロックのJavaScriptがすべて抽出される", () => {
    const manager = new CrossFileContextManager();
    try {
      const doc = makeFakeDoc(
        "/proj/data/scenario/a.ks",
        "[iscript]\nf.hoge = 1;\n[endscript]\n通常テキスト\n[iscript]\nf.fuga = 2;\n[endscript]",
      );
      manager.updateFromDocument(doc);

      assert.strictEqual(
        manager.getOtherFilesContent("file:///other"),
        "f.hoge = 1;\nf.fuga = 2;",
      );
    } finally {
      manager.dispose();
    }
  });

  test("正常系 未クローズのブロックはキャッシュされない", () => {
    const manager = new CrossFileContextManager();
    try {
      const doc = makeFakeDoc(
        "/proj/data/scenario/a.ks",
        "[iscript]\nf.hoge = 1;",
      );
      manager.updateFromDocument(doc);

      assert.strictEqual(manager.cachedFileCount, 0);
    } finally {
      manager.dispose();
    }
  });

  test("正常系 iscriptブロックが無いドキュメントはキャッシュされない", () => {
    const manager = new CrossFileContextManager();
    try {
      const doc = makeFakeDoc(
        "/proj/data/scenario/a.ks",
        "通常テキスト\n[bg storage=\"room.jpg\"]",
      );
      manager.updateFromDocument(doc);

      assert.strictEqual(manager.cachedFileCount, 0);
    } finally {
      manager.dispose();
    }
  });

  test("正常系 ブロックが消えた再更新でエントリが削除されキャッシュが無効化される", () => {
    const manager = new CrossFileContextManager();
    try {
      const fsPath = "/proj/data/scenario/a.ks";
      manager.updateFromDocument(
        makeFakeDoc(fsPath, "[iscript]\nf.hoge = 1;\n[endscript]"),
      );
      assert.strictEqual(manager.cachedFileCount, 1);
      // 結果キャッシュを作らせる
      assert.strictEqual(
        manager.getOtherFilesContent("file:///other"),
        "f.hoge = 1;",
      );

      // iscriptブロックを削除した内容で再更新
      manager.updateFromDocument(makeFakeDoc(fsPath, "通常テキストのみ"));

      assert.strictEqual(manager.cachedFileCount, 0);
      assert.strictEqual(
        manager.getOtherFilesContent("file:///other"),
        "",
        "結果キャッシュも無効化されるべき",
      );
    } finally {
      manager.dispose();
    }
  });
});

suite("CrossFileContextManager.getOtherFilesContent", () => {
  test("正常系 自身のURIのコンテンツは除外される", () => {
    const manager = new CrossFileContextManager();
    try {
      const docA = makeFakeDoc(
        "/proj/data/scenario/a.ks",
        "[iscript]\nf.fromA = 1;\n[endscript]",
      );
      const docB = makeFakeDoc(
        "/proj/data/scenario/b.ks",
        "[iscript]\nf.fromB = 2;\n[endscript]",
      );
      manager.updateFromDocument(docA);
      manager.updateFromDocument(docB);

      const contentForA = manager.getOtherFilesContent(docA.uri.toString());
      assert.strictEqual(contentForA, "f.fromB = 2;");

      const contentForB = manager.getOtherFilesContent(docB.uri.toString());
      assert.strictEqual(contentForB, "f.fromA = 1;");
    } finally {
      manager.dispose();
    }
  });

  test("正常系 キャッシュが空なら空文字を返す", () => {
    const manager = new CrossFileContextManager();
    try {
      assert.strictEqual(manager.getOtherFilesContent("file:///any"), "");
    } finally {
      manager.dispose();
    }
  });
});

suite("CrossFileContextManager.dispose", () => {
  test("正常系 disposeで全キャッシュがクリアされる", () => {
    const manager = new CrossFileContextManager();
    manager.updateFromDocument(
      makeFakeDoc(
        "/proj/data/scenario/a.ks",
        "[iscript]\nf.hoge = 1;\n[endscript]",
      ),
    );
    assert.strictEqual(manager.cachedFileCount, 1);

    manager.dispose();

    assert.strictEqual(manager.cachedFileCount, 0);
  });
});
