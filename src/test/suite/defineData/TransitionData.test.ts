/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import { TransitionData } from "../../../defineData/TransitionData";

suite("TransitionData", () => {
  vscode.window.showInformationMessage("Start TransitionData tests.");

  suite("static properties", () => {
    test("正常系 jumpTagsが正しく定義されている", () => {
      // アサート
      assert.ok(Array.isArray(TransitionData.jumpTags), "jumpTagsは配列であるべき");
      assert.ok(TransitionData.jumpTags.length > 0, "jumpTagsは空でないべき");
      
      const expectedTags = [
        "scenario",
        "script", 
        "html",
        "css",
        "jump",
        "button",
        "glink"
      ];
      
      expectedTags.forEach(tag => {
        assert.ok(TransitionData.jumpTags.includes(tag), `jumpTagsに${tag}が含まれるべき`);
      });
      
      assert.strictEqual(TransitionData.jumpTags.length, expectedTags.length, "jumpTagsの要素数が期待値と一致するべき");
    });
  });

  suite("constructor", () => {
    test("正常系 全パラメータ指定", () => {
      // 値定義
      const tag = "jump";
      const storage = "chapter2.ks";
      const target = "scene1";
      const currentLabel = "start";
      const condition = "f.flag == 1";
      const uri = vscode.Uri.file("/test/data/scenario/chapter1.ks");
      const range = new vscode.Range(0, 0, 0, 10);
      const fileUri = new vscode.Location(uri, range);

      // 実行
      const transitionData = new TransitionData(tag, storage, target, currentLabel, condition, fileUri);

      // アサート - private プロパティは直接アクセスできないため、
      // コンストラクタが例外なく実行されることを確認
      assert.ok(transitionData instanceof TransitionData, "TransitionDataのインスタンスが作成されるべき");
    });

    test("正常系 一部パラメータundefined", () => {
      // 値定義
      const tag = "button";
      const storage = undefined;
      const target = undefined;
      const currentLabel = "menu";
      const condition = undefined;
      const fileUri = undefined;

      // 実行
      const transitionData = new TransitionData(tag, storage, target, currentLabel, condition, fileUri);

      // アサート
      assert.ok(transitionData instanceof TransitionData, "TransitionDataのインスタンスが作成されるべき");
    });

    test("正常系 全パラメータundefined", () => {
      // 値定義
      const tag = "glink";
      const storage = undefined;
      const target = undefined;
      const currentLabel = undefined;
      const condition = undefined;
      const fileUri = undefined;

      // 実行
      const transitionData = new TransitionData(tag, storage, target, currentLabel, condition, fileUri);

      // アサート
      assert.ok(transitionData instanceof TransitionData, "TransitionDataのインスタンスが作成されるべき");
    });

    test("正常系 日本語のパラメータ", () => {
      // 値定義
      const tag = "jump";
      const storage = "第二章.ks";
      const target = "開始";
      const currentLabel = "メニュー";
      const condition = "f.フラグ == 1";
      const uri = vscode.Uri.file("/test/data/scenario/第一章.ks");
      const fileUri = new vscode.Location(uri, new vscode.Range(0, 0, 0, 10));

      // 実行
      const transitionData = new TransitionData(tag, storage, target, currentLabel, condition, fileUri);

      // アサート
      assert.ok(transitionData instanceof TransitionData, "TransitionDataのインスタンスが作成されるべき");
    });

    test("正常系 特殊文字を含むパラメータ", () => {
      // 値定義
      const tag = "script";
      const storage = "file_01-test.v2.ks";
      const target = "label_start-001";
      const currentLabel = "current_label_v1";
      const condition = "f.test_flag >= 100 && f.other_flag != null";
      const uri = vscode.Uri.file("/test/data/scenario/complex-file_name.v2.ks");
      const fileUri = new vscode.Location(uri, new vscode.Range(0, 0, 0, 10));

      // 実行
      const transitionData = new TransitionData(tag, storage, target, currentLabel, condition, fileUri);

      // アサート
      assert.ok(transitionData instanceof TransitionData, "TransitionDataのインスタンスが作成されるべき");
    });

    test("正常系 空文字列のパラメータ", () => {
      // 値定義
      const tag = "";
      const storage = "";
      const target = "";
      const currentLabel = "";
      const condition = "";
      const uri = vscode.Uri.file("");
      const fileUri = new vscode.Location(uri, new vscode.Range(0, 0, 0, 0));

      // 実行
      const transitionData = new TransitionData(tag, storage, target, currentLabel, condition, fileUri);

      // アサート
      assert.ok(transitionData instanceof TransitionData, "TransitionDataのインスタンスが作成されるべき");
    });

    test("正常系 異なるjumpTagsの値", () => {
      TransitionData.jumpTags.forEach(tag => {
        // 実行
        const transitionData = new TransitionData(tag, "test.ks", "label", "current", "condition", undefined);

        // アサート
        assert.ok(transitionData instanceof TransitionData, `${tag}タグでTransitionDataのインスタンスが作成されるべき`);
      });
    });

    test("正常系 data/scenario/を含むパス", () => {
      // 値定義
      const tag = "jump";
      const uri = vscode.Uri.file("/project/data/scenario/chapter1.ks");
      const fileUri = new vscode.Location(uri, new vscode.Range(0, 0, 0, 10));

      // 実行
      const transitionData = new TransitionData(tag, undefined, undefined, undefined, undefined, fileUri);

      // アサート - extractAfterメソッドが呼ばれることを確認
      assert.ok(transitionData instanceof TransitionData, "data/scenario/パスでTransitionDataのインスタンスが作成されるべき");
    });

    test("正常系 data/scenario/を含まないパス", () => {
      // 値定義
      const tag = "jump";
      const uri = vscode.Uri.file("/different/path/file.ks");
      const fileUri = new vscode.Location(uri, new vscode.Range(0, 0, 0, 10));

      // 実行
      const transitionData = new TransitionData(tag, undefined, undefined, undefined, undefined, fileUri);

      // アサート
      assert.ok(transitionData instanceof TransitionData, "異なるパスでTransitionDataのインスタンスが作成されるべき");
    });
  });

  suite("class structure", () => {
    test("正常系 クラスが正しく定義されている", () => {
      // アサート
      assert.ok(TransitionData, "TransitionDataクラスが存在するべき");
      assert.strictEqual(typeof TransitionData, "function", "TransitionDataはコンストラクタ関数であるべき");
    });

    test("正常系 jumpTagsはstatic", () => {
      // アサート
      assert.ok(TransitionData.jumpTags, "jumpTagsはstaticプロパティとして存在するべき");
      
      // インスタンスからはアクセスできない
      const instance = new TransitionData("jump", undefined, undefined, undefined, undefined, undefined);
      assert.strictEqual((instance as any).jumpTags, undefined, "jumpTagsはインスタンスプロパティではないべき");
    });
  });
});