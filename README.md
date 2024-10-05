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

### プラグイン/マクロのパラメータ補完（β版）

> [!WARNING]
> この機能は今後変更されたり削除されたりする可能性があります。

`setting.json`の`TyranoScript syntax.plugin.parameter`を変更することで、プラグインやマクロで用いるパラメータの補完ができます。

以下の点にご注意ください。

- プラグインやマクロのパラメータの値に対して、リソースのパスやchara_newタグで指定した値などは補完することができません。
- 複数プロジェクトを開いている場合、すべてのプロジェクトに対して`TyranoScript syntax.plugin.parameter`で定義したプラグイン/マクロの補完が可能になります。
- この設定で登録したプラグイン/マクロはplugin/macroタグで未定義の場合でも診断機能でエラーが出ません。
- `setting.json`の変更後は、拡張機能を再起動してください。再起動後に`setting.json`の変更が反映されます。

下記を参考にし、`setting.json`に追加してご利用ください。
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
    }
  }
```

例として、ティラノスクリプト公式より配布されている[ダイスロールプラグイン](https://plugin.tyrano.jp/item/5038)の場合以下のようになります。

```json
  "TyranoScript syntax.plugin.parameter": {
    "dice": {
      "name": "dice",
      "description": "ゲーム中でダイスを振ることができるようになります。対応ダイスは 2,3,4,6,8,10,12,20,100面ダイスです。",
      "parameters": [
        {
          "name": "roll",
          "required": true,
          "description": "実際にふるダイスを指定します（必須）。複数指定する場合は「,」カンマで区切ってください。例えば６面ダイス２個と3面ダイス１個を振りたい場合は「6,6,3」と指定できます。また「2d6,1d3」のような書き方も可能です。"
        },
        {
          "name": "result",
          "required": false,
          "description": "ダイス結果を指定できます。例えばrollで「6,6,6」と指定してresultに「1,2,3」とした場合ダイス目がそのとおりになり合計6になります。指定しない場合はランダムな数字になります。"
        },
        {
          "name": "output",
          "required": false,
          "description": "ダイス結果を格納する変数を指定できます。例えば「f.dice_result」のようにしておくことで結果を変数に格納することができます。"
        },
        {
          "name": "output_array",
          "required": false,
          "description": "ダイス結果について、個々のダイス目を格納する変数を指定できます。例えば3d6を降った場合に4,2,6 といった感じの配列が格納されます。"
        },
        {
          "name": "layer",
          "required": false,
          "description": "ダイスを表示するレイヤを指定できます。デフォルトは０"
        },
        {
          "name": "scale",
          "required": false,
          "description": "ダイスの大きさを指定できます。デフォルトは1.5。ゲームの画面サイズによって適切な値は変わってきますので適宜調整をお願いします。"
        },
        {
          "name": "skiproll",
          "required": false,
          "description": "trueを指定するとダイスをふる演出をスキップできます。結果だけが変数に格納されます。デフォルトはfalse。"
        },
        {
          "name": "min_left",
          "required": false,
          "description": "ダイスが転がる範囲の左端を指定します。中央からの相対距離を指定します。デフォルトは-450。"
        },
        {
          "name": "max_left",
          "required": false,
          "description": "ダイスが転がる範囲の右端を指定します。中央からの相対距離を指定します。デフォルトは150。"
        },
        {
          "name": "min_top",
          "required": false,
          "description": "ダイスが転がる範囲の上端を指定します。中央からの相対距離を指定します。デフォルトは-150。"
        },
        {
          "name": "max_top",
          "required": false,
          "description": "ダイスが転がる範囲の下端を指定します。中央からの相対距離を指定します。デフォルトは50。"
        }
      ]
    },
    "dice_hide": {
      "name": "dice_hide",
      "description": "画面上のダイスを非表示にします。timeパラメータは消える時間をミリ秒で指定できます。",
      "parameters": [
        {
          "name": "time",
          "required": false,
          "description": "パラメータが消える時間をミリ秒で指定できます。"
        }
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

不要な場合、設定から`TyranoScript syntax.execute.diagnostic`の値を変更してください。

以下のように定義されていますので、不要なキーの値をfalseに変更しvscodeを再起動することで診断機能をOFFにできます。

```json
  "TyranoScript syntax.execute.diagnostic": {
    "undefinedMacro": true,
    "missingScenariosAndLabels": true,
    "jumpAndCallInIfStatement": true
  }
```

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

### 処理のフォールディング（折り畳み）

`region`と`endregion`で囲まれた範囲を折り畳むことができます。

以下のような記述を行うことで、折り畳むことができます。
```tyrano
; region
[p]
"This line can be folded."
; endregion
```

## ショートカット一覧

- Ctrl + Space : タグや変数などの補完
- F12 : タグの定義元へ移動
- Alt + J : jump系タグのジャンプ先へ移動
- Ctrl + Alt + P : プレビュー機能（β版）
- Ctrl + Alt + F : フローチャート表示
- Ctrl + / : コメントアウト

## 設定ファイルについて

TyranoScript_syntaxの一部機能は設定ファイルから変更を行うことができます。
特にマクロタグやjsから定義したタグの補完やファイルジャンプを行う場合、設定ファイルを見直してください。

### 言語設定

TyranoScript syntax.languageで言語設定を変更することができます。

日本語と英語にのみ対応しています。

You can change the language settings with TyranoScript syntax.language.

Only Japanese and English are supported.

## Release Notes

変更点については以下のリンクをご確認ください。
[CHANGELOG.md](CHANGELOG.md)

## issues

バグ報告や機能追加の要望お待ちしております！
以下のいずれかの方法で報告をお願いします。

- [Googleフォームから報告](https://forms.gle/PnWAzHiN8MYKhUrG6)
- [Twitter(@orukred)でリプライやDM](https://twitter.com/OrukRed)
- [Githubにissueを立てる（バグのみ）](https://github.com/orukRed/tyranosyntax/issues)

## 免責事項

本ツールを利用したことによって損害・不利益・事故等が
発生した場合でも、一切の責任を負いません。
