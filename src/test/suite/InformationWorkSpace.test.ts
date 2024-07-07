import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { InformationWorkSpace } from '../../InformationWorkSpace';
import path from 'path';
// import * as myExtension from '../../extension';

suite('InformationWorkSpace.getProjectRootPath', () => {
  test('正常系', () => {


    //値定義
    const filePath = "hoge/foo/bar/sample.ks";
    const javaScriptSentence =
      `
  f.tmp_index = "message";
  f.cg_index = 12;
  f.top = 100;
  f.left = 60;
  f.hoge = {
  foo:{
      bar:1
  },
  piyo:[1,2,3],
  fufa:["a","b","c"]
};`

    const info = InformationWorkSpace.getInstance();
    // assert.strictEqual((info as any).getWorkspaceRootPath(), "");//絶対パス取得するのでgithubにあげられない。
  });


});
suite('InformationWorkSpace.getProjectRootPath', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('正常系', () => {
    //値定義
    const info = InformationWorkSpace.getInstance();
    // assert.strictEqual((info as any).getWorkspaceRootPath(), "");//絶対パス取得するのでgithubにあげられない。
  });

});

suite('InformationWorkSpace.getProjectFiles', () => {
  vscode.window.showInformationMessage('Start all tests.');
  // 配列はdeepStrictEqualを使うこと。配列を再帰的に中身まで見てくれる。
  // strictEqualだとアドレスを比較する。
  test('正常系 プロジェクトパスだとファイル多すぎるのでbgimageフォルダを指定', async () => {
    //値定義
    const info = InformationWorkSpace.getInstance();

    const expect = ["room.jpg", "rouka.jpg", "title.jpg"];
    const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
    const filePath = path.join(workspaceFolder, "data", "scenario", "first.ks",);
    const projectRootPath = await (info as any).getProjectPathByFilePath(filePath);
    const bgimagePath = path.join(projectRootPath, "data", "bgimage");

    assert.deepStrictEqual(await (info as any).getProjectFiles(bgimagePath, [".jpg", ".ogg"], false), expect);
  });
  test('異常系 不正なパスを与える', () => {
    //値定義
    const info = InformationWorkSpace.getInstance();
    assert.deepStrictEqual((info as any).getProjectFiles("hoge/foo/bar/"), []);
  });

  test('異常系 パスでない文字列を与える', () => {
    //値定義
    const info = InformationWorkSpace.getInstance();
    assert.deepStrictEqual((info as any).getProjectFiles("hoge"), []);
  });

  test('異常系 undefinedを与える', () => {
    //値定義
    const info = InformationWorkSpace.getInstance();
    assert.deepStrictEqual((info as any).getProjectFiles(undefined), []);
  });

  test('異常系 空文字を与える', () => {
    //値定義
    const info = InformationWorkSpace.getInstance();
    assert.deepStrictEqual((info as any).getProjectFiles(""), []);
  });


});