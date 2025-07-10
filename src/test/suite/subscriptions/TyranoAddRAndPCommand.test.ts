/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import { TyranoAddRAndPCommand } from "../../../subscriptions/TyranoAddRAndPCommand";

suite("TyranoAddRAndPCommand", () => {
  vscode.window.showInformationMessage("Start TyranoAddRAndPCommand tests.");

  suite("execute", () => {
    test("正常系 メソッドが存在する", () => {
      // アサート
      assert.ok(typeof TyranoAddRAndPCommand.execute === "function", "executeメソッドが存在するべき");
    });

    test("正常系 メソッド呼び出しで例外が発生しない", () => {
      // 実行（例外が発生しないことを確認）
      // この場合エディタが開かれていないため、内部でエラーメッセージが表示されるが例外は発生しない
      assert.doesNotThrow(() => {
        TyranoAddRAndPCommand.execute();
      });
    });

    test("正常系 staticメソッドである", () => {
      // アサート
      assert.ok(TyranoAddRAndPCommand.execute, "executeはstaticメソッドであるべき");
      
      // インスタンスを作成せずに呼び出せることを確認
      assert.doesNotThrow(() => {
        TyranoAddRAndPCommand.execute();
      });
    });

    test("正常系 戻り値がvoidである", () => {
      // 実行
      const result = TyranoAddRAndPCommand.execute();
      
      // アサート
      assert.strictEqual(result, undefined, "executeメソッドの戻り値はvoidであるべき");
    });
  });

  suite("class structure", () => {
    test("正常系 クラスが正しく定義されている", () => {
      // アサート
      assert.ok(TyranoAddRAndPCommand, "TyranoAddRAndPCommandクラスが存在するべき");
      assert.strictEqual(typeof TyranoAddRAndPCommand, "function", "TyranoAddRAndPCommandはコンストラクタ関数であるべき");
    });

    test("正常系 インスタンス化できる", () => {
      // 実行（例外が発生しないことを確認）
      assert.doesNotThrow(() => {
        new TyranoAddRAndPCommand();
      });
    });

    test("正常系 インスタンス化してもexecuteメソッドはstatic", () => {
      // 値定義
      const instance = new TyranoAddRAndPCommand();
      
      // アサート - インスタンスメソッドとしてexecuteは存在しない
      assert.strictEqual((instance as any).execute, undefined, "executeはインスタンスメソッドではなくstaticメソッドであるべき");
      
      // staticメソッドとしては存在する
      assert.ok(typeof TyranoAddRAndPCommand.execute === "function", "executeはstaticメソッドとして存在するべき");
    });
  });
});