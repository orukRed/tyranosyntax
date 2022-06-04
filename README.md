# TyranoScript_syntax

ティラノスクリプトのハイライトやスニペットをサポートします。

## 機能

* シンタックスハイライト
  * setting.jsonのtextmateRulesを編集することでハイライト色を変更できます。
  * ![ハイライトサンプル画像](./readme_img/highlight.png,"ハイライトサンプル")
* ティラノスクリプトのタグを追加するインテリセンス（ctrl + spaceで表示、設定より@開始のタグか[ ]で囲むタグか変更可能）
* 任意のタグのアウトライン表示（setting.jsonより編集可能）
* ショートカットキーによる特定のタグ・記号の簡易出力（ショートカットキーは設定で変更可）
  * [l][r] shift + enter
  * [p] ctrl + enter（Macならcmd+enter）
  * \#  alt + enter（Macならoption+enter）
* 診断機能(※1)
  * ジャンプ系("jump", "call", "link", "button", "glink", "clickable")タグにてstorage,targetで指定した先が未定義の場合の検出
  * ジャンプ系タグにてstorage,targetで使用する場合、先頭に&があるかどうかの検出(&がない場合エラー)
* ツールチップの表示(マウスカーソルをタグに乗せることで表示されます。)

※1：ティラノスクリプトのルートプロジェクト(index.htmlが存在しているフォルダ)が含まれるフォルダを開いているときのみ使用可能です。

## 機能（Web版）

[Web版vscode](https://vscode.dev/)でも一部機能が使用可能です。
ver0.10.0現在ではシンタックスハイライト以外の機能追加予定はありません。

## 動作環境

以下の環境で動くことを想定としています。
以下の環境でない場合、正常に動作しない可能性があります。

## Release Notes

変更点については以下のリンクをご確認ください。
[CHANGELOG.md](CHANGELOG.md)

## issues

バグなどを見つけた場合、以下のいずれかでご連絡ください。
出力ウィンドウにTyranoScript syntaxから出力されたログが記載されています。
（ある場合は）ログも一緒に送ってくださると製作者が喜びます！

* [Googleフォームから報告](https://docs.google.com/forms/d/e/1FAIpQLSfnh0HFcxWe3PfNEpLvZ1-_prC5OMZbYhmb-rS8Zk1VaiarBw/viewform)
* [Twitter(@orukred)でリプライやDM](https://twitter.com/OrukRed)
* [Githubにissueを立てる](https://github.com/orukRed/tyranosyntax/issues)
