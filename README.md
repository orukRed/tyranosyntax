# TyranoScript_syntax

[ティラノスクリプト](https://tyrano.jp/)でのゲーム開発のサポートを行う拡張機能です。

## 使い方

vscodeの`ファイル`→`フォルダーを開く`から、
ティラノスクリプトの`index.html` が存在するフォルダを選択してください。
その後、`.ks`拡張子のファイルを開いたタイミングで
`TyranoScript syntaxの初期化が完了しました。`と通知が出れば拡張機能が正常に読み込まれています。
※構文の強調表示など、一部の機能は上記手順を踏まなくても使用できます。

## 機能

### 構文の強調表示（Syntax Highlighting）

![](src/readme_img/highlight.png)

タグやラベルなどの構文が強調表示されます。
画像はMonokai Dimmedの場合です。

### タグ補完（Completion）

![](src/readme_img/completion.gif)

![](src/readme_img/completion_img.gif)

![](src/readme_img/completion_layer.gif)

Ctrl + Spaceでタグやパラメータ、変数、ラベル、ファイルパス、chara_newタグで指定したnameやface、chara_layerタグで指定したpartやid等の補完ができます。
`macroタグ`やjsで定義したタグについても補完ができます。

#### プラグイン/マクロのパラメータ補完（β版）

> [!WARNING]
> また、この機能は今後変更されたり削除されたりする可能性があります。

`setting.json`の`TyranoScript syntax.plugin.parameter`を変更することで、プラグインやマクロで用いるパラメータの補完ができます。

以下の点にご注意ください。

- プラグインやマクロのパラメータの値に対して、リソースのパスやchara_newタグで指定した値などは補完することができません。
- 複数プロジェクトを開いている場合、すべてのプロジェクトに対して`TyranoScript syntax.plugin.parameter`で定義したプラグイン/マクロの補完が可能になります。
- この設定で登録したプラグイン/マクロはplugin/macroタグで未定義の場合でも診断機能でエラーが出ません。
- `setting.json`の変更後は、拡張機能を再起動してください。再起動後に`setting.json`の変更が反映されます。

下記の例を参考にし、`setting.json`に追加してご利用ください。
（基本的に大文字の箇所とdescriptionの値を変更することで動きます。）

- `PLUGIN_NAME`をプラグインの名前やマクロの名前します。
- `parameters`で指定しているnameを、補完したいパラメータ名に変更します。
- `description`で補完したいパラメータの説明文を指定します。
- `required`で補完したいパラメータが必須かどうかを指定します。

```json
"TyranoScript syntax.plugin.parameter": {
    "PLUGIN_NAME1": {
      "name": "PLUGIN_NAME1",
      "description": "プラグインの説明文です。",
      "parameters": [
        {
          "name": "PARAMETER1",
          "required": true,
          "description": "parameterサンプルです。ここに説明文を書いてください。"
        },
        {
          "name": "PARAMETER2",
          "required": true,
          "description": ""
        }
      ]
    },
    "PLUGIN_NAME2": {
      "name": "PLUGIN_NAME2",
      "description": "プラグインの説明文です。",
      "parameters": [
      ]
    }
  }
```



### アウトライン表示(Outline)

![](src/readme_img/outline.png)

ラベルや変数、一部のタグがアウトラインビューに表示されます。
現在アウトラインタグで表示されるタグは以下です。（設定の`TyranoScript syntax.outline.tag`から変更可能）

- ifタグ
- elseifタグ
- elseタグ
- endif
- ignore
- endignore
- jumpタグ
- callタグ
- buttonタグ
- glinkタグ
- linkタグ
- iscriptタグ
- endscriptタグ
- loadjsタグ
- htmlタグ
- endhtmlタグ

### 診断機能(Diagnostics)

![](src/readme_img/diagnostics.png)

設定からAutoDiagnosticがONをしている場合、文字入力時にエラーを検出します。
現在検出できるエラーは以下です。

- ジャンプ系（"jump", "call", "link", "button", "glink", "clickable"）タグにてstorage,targetで指定した先が存在するかどうかの検出
- ジャンプ系タグのstorage,targetに変数を使用する場合、先頭に&があるかどうかの検出(&がない場合エラー)
- 使用しているタグがプロジェクトに存在するかの検出

### ドキュメントツールチップ表示（Hover）

![](src/readme_img/hover.gif)

### 画像ツールチップ表示（Hover image）

![](src/readme_img/hover_img.gif)

タグにマウスを乗せるとドキュメントが表示されます。

### タグのショートカット入力（Snippets）

![](src/readme_img/snippet.gif)

一部のタグ、記号はショートカットキーで入力できます。

- \[l][r] shift + enter
- [p] ctrl + enter（Macならcmd+enter）
- \#  alt + enter（Macならoption+enter）

入力する文字を変更したい場合は設定の`TyranoScript syntax.keyboard.alt + enter(option + enter)`等から変更してください。

### ジャンプ先へ移動（Go To Jump）

![](src/readme_img/jump.gif)

`alt + J(option + J)`でjumpなどのタグで指定したstorage,target先へとジャンプできます。

### 定義へ移動（Go To Definition）

![](src/readme_img/definition.gif)

`F12`を押したとき、マクロタグで定義した箇所へジャンプできます。

### プレビュー機能（β版）

`ctrl + alt + P`でプレビューを開くことができます。
将来的に現在開いているアクティブエディタのその場プレビュー機能に置き換える予定です。
> [!WARNING]
> ポート番号3100を使用しています。他のアプリケーションで使用している場合にはご注意ください。
> また、この機能は今後変更されたり削除されたりする可能性があります。

### フローチャート表示

`ctrl + alt + F`で現在開いているファイルのフローチャートを表示することができます。
ブラウザでlocalhost:3200/flowchart-list.htmlにアクセスすることシナリオ一覧へのリンクが表示されます。
フローチャートを見たいファイルのリンクをクリックしてください。


- ラベルを指定していない箇所は`NONE`と表示されます
- cond属性を指定している場合のみ、条件式が表示されます

> [!WARNING]
> ポート番号3200を使用しています。他のアプリケーションで使用している場合にはご注意ください。

![](src/readme_img/flowchart1.png)
![](src/readme_img/flowchart2.png)

## 設定ファイルについて

TyranoScript_syntaxの一部機能は設定ファイルから変更を行うことができます。
特にマクロタグやjsから定義したタグの補完やファイルジャンプを行う場合、設定ファイルを見直してください。

## Release Notes

変更点については以下のリンクをご確認ください。
[CHANGELOG.md](CHANGELOG.md)

## issues

バグ報告や機能追加の要望お待ちしております！
以下のいずれかの方法で報告をお願いします。

- [Googleフォームから報告](https://orukred.github.io/Contact.html)
- [Twitter(@orukred)でリプライやDM](https://twitter.com/OrukRed)
- [Githubにissueを立てる（バグのみ）](https://github.com/orukRed/tyranosyntax/issues)

## 免責事項

本ツールを利用したことによって損害・不利益・事故等が
発生した場合でも、一切の責任を負いません。
