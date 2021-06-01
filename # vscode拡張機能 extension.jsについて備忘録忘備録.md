# vscode拡張機能 extension.jsについて備忘録忘備録

# extension.js

拡張機能のエントリポイント。
基本的に最初に実行されるプログラムファイル。

package.json内で以下のように指定。

```shell:package.json
	"comment":"mainで指定したファイルがエントリポイントとなる。exntension.js(extension.ts)が慣例らしい",
	"main": "extension.js",
	"activationEvents": [
		"comment":"エントリポイントの実行タイミング。onLanguageでその言語のファイル(.jsや.py)を開いた時",
		"onLanguage:LANGUAGE_NAME"
	],
```

activationEventsについて詳細は
[https://code.visualstudio.com/api/references/activation-events](https://code.visualstudio.com/api/references/activation-events)
を参照。

# extension.jsのお作法
[https://code.visualstudio.com/api/references/activation-events](https://code.visualstudio.com/api/references/activation-events)
より引用。


>Note: 
>An extension must export an activate() function from its main module 
>and it will be invoked only once by VS Code when any of the specified activation events is emitted. 
>Also, an extension should export a deactivate() function from its main module to perform cleanup tasks on VS Code shutdown. 
>Extension must return a Promise from deactivate() if the cleanup process is asynchronous. 
>An extension may return undefined from deactivate() if the cleanup runs synchronously.

要するにこう。
* extension.jsでactivate関数を一回だけインポートしてね
* vscode落としたときはdeactivate関数エクスポートしてクリーンアップ処理してね
* clean up処理する時、非同期ならPromise返してね
* 同期時期に返すなら、undefined返してもいいよ

下記にextension.jsのテンプレを記載。


