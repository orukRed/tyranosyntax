# TyranoScript_syntax

[ティラノスクリプト](https://tyrano.jp/)でのゲーム開発のサポートを行う拡張機能です。

## 使い方

vscodeの`ファイル`→`ファイルを開く`から、
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

Ctrl + Spaceでタグやパラメータ、変数、ラベル、ファイルパス等の補完ができます。
`macroタグ`やjsで定義したタグについても補完ができます。

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

タグをマウスを乗せるとドキュメントが表示されます。

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
