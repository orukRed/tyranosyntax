# 課題一覧(Issue化用ドラフト)

コードベース調査(2026-07-07 時点、v3.2.0 / master 6135c37)で見つかった課題の一覧です。
各項目はそのまま GitHub Issue として登録できる形式(タイトル / ラベル / 本文)になっています。
既存の Open Issue(#416, #253, #240, #207, #171, #84, #22)と重複しないよう選定しています。

---

## 🔴 致命的(CI・リリース・セキュリティに直結)

---

### Issue 1: package-lock.json が 3.1.2 のままで `npm ci` が失敗する

**ラベル:** `bug`

## バグの概要

`package.json` の version は `3.2.0` だが、`package-lock.json` のルート version が `3.1.2` のまま更新されていない。
`.github/workflows/test.yml` と `release.yml` はどちらも `npm ci` を使用しており、`npm ci` は package.json と lock の同期を要求するため、CI・リリースの両ワークフローが失敗する可能性が高い。

## 再現手順

1. リポジトリを clone する
2. `npm ci` を実行する

## 期待される結果

依存関係がインストールされる。

## 実際の結果

`npm ci can only install packages when your package.json and package-lock.json are in sync` エラーで失敗する。

## 該当箇所

- `package.json` … `"version": "3.2.0"`
- `package-lock.json` … `"version": "3.1.2"`(ルートおよび `packages[""]`)

## 改善案

- `npm install --package-lock-only` で lock を再生成してコミットする
- 今後のバージョン更新は `npm version` コマンドを使い、package.json と lock を同時に更新する運用にする

---

### Issue 2: Web 版ビルド(webpack)が壊れている

**ラベル:** `bug`

## バグの概要

`webpack.config.js` の entry が存在しないファイル `./src/index.ts` を指しており(実際のエントリは `src/extension.ts`)、さらに config が参照する `ts-loader` と、`webpack` CLI 実行に必要な `webpack-cli` が依存関係に存在しない。`npm run compile-web` / `package-web` は現状動作しない。

## 再現手順

1. `npm install` する
2. `npm run compile-web` を実行する

## 期待される結果

Web 拡張用のバンドルが生成される。

## 実際の結果

entry 不在・loader 欠落によりビルドが失敗する。

## 該当箇所

- `webpack.config.js:8` … `entry: "./src/index.ts"`(ファイル不在)
- `webpack.config.js:20-21` … `loader: "ts-loader"`(依存に無い)
- `package.json` … `ts-loader` / `webpack-cli` が devDependencies に無い。`browser` フィールドは tsc の CommonJS 出力 `./out/extension.js` を指しており Web 拡張の要件を満たさない

## 改善案

- Web 対応が不要なら: `webpack.config.js`・`browser` フィールド・`*-web` スクリプトを削除してビルドフローを tsc に一本化
- Web 対応するなら: entry を `./src/extension.ts` に修正し、`ts-loader`(または esbuild-loader)と `webpack-cli` を devDependencies に追加

---

### Issue 3: プレビュー用ローカルサーバーがプロジェクト全体を LAN に無認証公開している

**ラベル:** `bug`

## バグの概要

プレビュー機能の HTTP サーバー(port 3100)と WebSocket サーバー(port 8100)が host 指定なし(既定 `0.0.0.0` = 全ネットワークインターフェース)で listen しており、さらに `express.static(projectPath)` でプロジェクトルート全体を配信している。同一 LAN 内の他ホストから `http://<開発機IP>:3100/` で開発中プロジェクトの全ファイルへ無認証アクセスが可能。WebSocket も外部から接続でき、オリジン検証・認証は一切ない。

## 再現手順

1. プレビュー機能を起動する
2. 同一 LAN 内の別マシンから `http://<開発機のIP>:3100/data/scenario/first.ks` 等にアクセスする

## 期待される結果

ローカルマシン(127.0.0.1)からのみアクセスできる。

## 実際の結果

LAN 内の任意のホストからプロジェクトの全ファイルが取得できる。

## 該当箇所

- `src/subscriptions/TyranoPreview.ts:127` … `new WebSocket.Server({ port: 8100 })`
- `src/subscriptions/TyranoPreview.ts:271` … `app.use(express.static(projectPath))`
- `src/subscriptions/TyranoPreview.ts:277` … `app.listen(3100, ...)`

## 改善案

- `app.listen(3100, "127.0.0.1")`、`new WebSocket.Server({ port: 8100, host: "127.0.0.1" })` でループバック限定にする
- WebSocket にオリジン検証を追加する

---

## 🟠 高(バグ・リソースリーク・品質ゲートの機能不全)

---

### Issue 4: プレビューサーバーが閉じられず、ポート 3100 / 8100 を占有し続ける

**ラベル:** `bug`

## バグの概要

WebSocket の `close` ハンドラ内でサーバーを閉じる処理が「リロード時に接続が切れてサーバーが閉じてしまう」問題の暫定回避としてコメントアウトされたまま(`TODO` 残置)。プレビューを閉じてもサーバーが起動しっぱなしになり、ポートを占有し続ける。`deactivate()` でも close されない。またサーバー起動処理が `withProgress` 内で `await` されておらず、起動失敗してもユーザーには成功したように見える。

## 該当箇所

- `src/subscriptions/TyranoPreview.ts:283-289` … `//TODO:リロード処理入れると接続切れてサーバー閉じちゃうみたいなので一時的にコメントアウト`
- `src/subscriptions/TyranoPreview.ts:304-313` … `createServer()` が await されていない
- ポート番号(3100 / 8100)がハードコードで設定不可。`EADDRINUSE` 時のユーザー通知もない

## 改善案

- リロードの一時切断は「猶予タイマー(再接続が数秒無ければ close)」で判定する
- サーバーインスタンスを `context.subscriptions` に dispose 登録し、拡張終了時に確実に close する
- `await createServer()` に修正し、起動失敗を `showErrorMessage` で通知する
- ポートを設定化するか空きポートを動的取得する

---

### Issue 5: FileSystemWatcher 3 つが dispose されずリークする

**ラベル:** `bug`

## バグの概要

`extension.ts` の activate 内で生成される 3 つの `createFileSystemWatcher`(scenario / script / resource)が `context.subscriptions` に登録されておらず、`deactivate()` でも破棄されない。拡張の再アクティブ化などでウォッチャーがリークし、同一ファイル変更でパース・診断が多重発火する恐れがある。

## 該当箇所

- `src/extension.ts:531` 付近 … `scenarioFileSystemWatcher`
- `src/extension.ts:569` 付近 … `scriptFileSystemWatcher`
- `src/extension.ts:601` 付近 … `resourceFileSystemWatcher`
- 登録されているのは `onDidRenameFiles` と `onDidChangeTextEditorSelection` のみ

## 改善案

`context.subscriptions.push(scenarioFileSystemWatcher, scriptFileSystemWatcher, resourceFileSystemWatcher)` を追加する。あわせて `TyranoLogger` の OutputChannel も dispose 登録する。

---

### Issue 6: TyranoDiagnostic.ts に統合済みの旧診断メソッド約 290 行が死蔵されている

**ラベル:** `enhancement`(リファクタリング)

## 概要

`diagnoseSingleScenarioFile` への統合(コメントに「元の detectionUndefineMacro」等と明記)が完了しているのに、旧メソッド 3 つが削除されず残っている。grep で確認したところ、以下はどこからも呼び出されていない。

- `detectionUndefineMacro`(`src/subscriptions/TyranoDiagnostic.ts:871-920`、約 50 行)
- `detectionMissingScenariosAndLabels`(同 928-1107、約 180 行)
- `detectJumpAndCallInIfStatement`(同 1142-1204、約 62 行)

## 問題点

- 同一ロジック・同一エラーメッセージが 2 箇所に重複(例: 「storageパラメータは末尾が'.ks'である必要があります。」が 371 行と 983 行)しており、片方だけ修正するバグの温床になる
- ファイル冒頭の `/* eslint-disable @typescript-eslint/no-unused-vars */`(2行目)がこの死蔵を隠蔽している

## 改善案

旧メソッド 3 つを削除し、不要になった eslint-disable を撤去する(約 290 行削減)。

---

### Issue 7: 未使用の LSP 実装(src/server/)と廃止コード(deprecate/)の削除

**ラベル:** `enhancement`(リファクタリング)

## 概要

- `src/server/server.ts`(136 行)は先頭に「XXX:未使用 LSPでの実装にしたかったけど、いったんvscode-apiでの実装にする」とあり、どこからも import されていない
- `src/subscriptions/deprecate/__TyranoRenameProvider.ts`(173 行)は上記 server.ts からのみ参照される廃止実装で、現役の `TyranoRenameProvider.ts` と名前が紛らわしい
- なお `server.ts:44-59` の `getAllKsFiles` には「再帰呼び出しの戻り値を捨てているためサブディレクトリの .ks が収集されない」というバグもあるが、ファイルごと未使用のため修正ではなく削除が妥当
- 同様に旧テストランナー `src/test/runTest.ts` / `src/test/suite/index.ts` / `.vscode-test.mjs`(「FIXME:不要ぽいので削除」と自認済み)も現行の `.vscode-test.js`(@vscode/test-cli)構成では未使用
- `vsc-extension-quickstart.md`(yo code 雛形の残骸)も削除候補

## 改善案

`src/server/`・`src/subscriptions/deprecate/` をディレクトリごと削除し、旧テストランナー関連ファイルも整理する。LSP 移行を将来検討する場合は Issue で管理する。

---

### Issue 8: eslint の ignores パターンが実ディレクトリ名と不一致で機能していない

**ラベル:** `bug`

## バグの概要

`eslint.config.mjs:9` の `ignores: ["testproject/**"]` は、実際のディレクトリ名 `test_project/`(アンダースコア入り)と一致しないため無視設定として機能していない。

## 改善案

`ignores: ["test_project/**"]` に修正する。あわせて `lint` スクリプトが `eslint src` のみを対象にしている点も見直す。

---

### Issue 9: .vscodeignore が存在せず、vsix に test_project/ 等が同梱される

**ラベル:** `bug`

## バグの概要

`.vscodeignore` が存在しないため、`vsce package` 時に `test_project/`(265 ファイル)、`test_ks.ks`、開発用アセットなどが vsix にまるごと同梱され、配布サイズが不要に肥大化する。さらに `.gitignore` の 1 行目が `*.vscodeignore` となっており、`.vscodeignore` を作成してもコミットされない罠がある。

## 該当箇所

- `.gitignore:1` … `*.vscodeignore`
- `.vscodeignore` … 不在

## 改善案

1. `.gitignore` から `*.vscodeignore` を削除する
2. `.vscodeignore` を作成し、`test_project/`・`src/`・`test_ks.ks`・`ofuse_img/` など配布不要物を除外する

---

### Issue 10: 正規表現に ReDoS リスクと未エスケープの動的パターンがある

**ラベル:** `bug`

## バグの概要

1. `src/subscriptions/TyranoOutlineProvider.ts:119` の `/((\w+))\s*((\S*)="?(\w*)"?)*()/` は、外側 `*` の内側に貪欲な `\S*` を持つネスト量指定子で、`=` を含む長い行に対しバックトラッキングが爆発する典型的な ReDoS 構造。アウトライン生成時に全行へ適用されるため、長い行でエディタがフリーズしうる。
2. `src/subscriptions/TyranoHoverProvider.ts:107` も alternation + 量指定子で、閉じ `]` を欠く行でコスト増大の可能性。
3. `src/subscriptions/TyranoRenameProvider.ts:79,157,324,329,330,370` 等で、ユーザー入力(識別子)を正規表現エスケープせずに `new RegExp()` に埋め込んでいる(`TyranoOutlineProvider.ts:174,177` はエスケープ済みなので同様の対応を横展開すればよい)。

## 改善案

- Outline のタグ判定は既存 `Parser` に置き換えるか、曖昧性のない先頭一致(`/^\s*[[@](\w+)/` 等)に簡略化する
- 動的正規表現の埋め込み前に必ず `replace(/[.*+?^${}()|[\]\\]/g, "\\$&")` を通す共通ヘルパを作る

---

### Issue 11: マクロの `*` パラメータ抽出(MacroParameterExtractor)が機能していない

**ラベル:** `bug`

## バグの概要

`src/MacroParameterExtractor.ts:53` に `//FIXME:ちゃんと動いていないので要修正` と残されている `*` パラメータ(全パラメータ継承記法)の抽出が動作していない。調査の結果、複合要因と考えられる:

1. `hasAsteriskParameter`(165-170)は `"*" in data["pm"]` を条件にするが、Parser が `*` を pm のキーとして保持していない可能性がある
2. `getTagDefinition`(228-246)は `suggestions` の値を `Object.values` で走査して `.name === tagName` を探すが、`suggestions` は**タグ名をキー**とした構造(`InformationWorkSpace.initializeMaps` 参照)のため探索が常に失敗し早期 return している可能性が高い
3. パースループ内で書き換え中の `this.suggestions` を同時に参照しており(`InformationWorkSpace.ts:757,768`)、結果が非決定的

## 改善案

- Parser の出力に `*` が含まれるか確認し、含まれない場合は raw 行から検出する
- `getTagDefinition` をタグ名キーの直接参照(`suggestionsByTag[tagName]`)に変更し、`parameters` のスキーマを型で固定する
- `suggestions` はパース開始時のスナップショットを渡す
- `src/test/suite/MacroParameterExtractor.test.ts` の `*` パラメータ関連スイートを拡充して挙動を固定する

---

## 🟡 中(型安全性・テスト・CI・パフォーマンス)

---

### Issue 12: tsconfig の strict モードが無効

**ラベル:** `enhancement`

## 概要

`tsconfig.json:79` で `"strict": false`。`noImplicitAny` / `strictNullChecks` / `noUnusedLocals` / `noImplicitReturns` もすべてコメントアウトで無効。13,000 行超のコードベースで null/undefined 起因のバグを型で防げていない。あわせて `Parser.parseText` の戻り値が実質 `any` のため、`data["pm"]["storage"]` のような文字列キーアクセスが全診断・補完ロジックに散在し、8 ファイルでファイル先頭の広域 `eslint-disable`(`no-explicit-any` 等)を招いている。

## 改善案

1. まず `Parser` の戻り値に `interface TyranoTag { name: string; pm: Record<string, string>; line: number; column: number }` を定義して any を排除(これだけで広域 eslint-disable の多くが不要になる)
2. `noImplicitAny` → `strictNullChecks` → `strict: true` の順で段階的に有効化
3. Babel AST 部分は `@babel/types` の型定義を利用する

---

### Issue 13: CI の品質ゲートが機能していない(master 未実行 / lint 無視 / カバレッジ空)

**ラベル:** `enhancement`

## 概要

- `.github/workflows/test.yml:3` … トリガーが `on: [pull_request]` のみで、**master への push/merge 後にテストが走らない**
- `test.yml:26-28` … `npm run lint` に `continue-on-error: true` が付いており、lint 失敗が無視される(warn 設定の sonarjs ルールも実効性なし)
- `test.yml:44-52` … `coverage/` を artifact アップロードしているが、カバレッジを生成する仕組み(c8/nyc)が存在せず常に空
- `test.yml:11` … Node 22.x/24.x でテストするが `@types/node` は `^17` で乖離
- `release.yml:19-24` … ブランチ名をそのままタグ名に流用しており、package.json の version と照合していない

## 改善案

- test トリガーに `push: [master]` を追加
- lint の `continue-on-error` を削除
- `@vscode/test-cli` + c8 でカバレッジを実生成する
- release はタグを package.json の version から導出・照合する

---

### Issue 14: 空テスト・`assert.ok(true)` による「偽陽性」テストの解消

**ラベル:** `enhancement`

## 概要

実行しても何も検証しないのに緑になるテストが複数ある:

- `src/test/suite/subscriptions/TyranoHoverProvider.test.ts:8-10` … 正常系・異常系とも**中身が空**
- `src/test/suite/subscriptions/TyranoCreateTagByShortcutKey.test.ts:11-26` … `assert.ok(true)` 1 件 + 空テスト 2 件
- `src/test/suite/extension.test.ts:11-14` … yo code 雛形の「Sample test」のまま
- `src/test/suite/InformationWorkSpace.test.ts:29-32 ほか` … ワークスペース未オープン時に `return` でサイレント素通り(`this.skip()` 未使用のため「成功」と表示される)

また、以下の大きめの機能はテストが一切ない: `TyranoPreview.ts`(501行)、`debug/` 配下(計815行)、`CrossFileContextManager.ts`(291行)、`TyranoFlowchart.ts`(291行)、`UnusedResourcePanel.ts`(271行)、`TyranoJumpProvider.ts`(200行)、および **v3.2.0 の新機能 `TyranoToggleComment.ts`(93行)**。

## 改善案

- 空テストは実装するか `test.skip` で未実装を明示、条件付き return は `this.skip()` に置換
- 優先度: 新機能 `TyranoToggleComment` と純ロジックの `CrossFileContextManager` からテスト追加

---

### Issue 15: 依存関係の整理(分類ミス・廃止パッケージ・バージョン乖離)

**ラベル:** `enhancement`

## 概要

- **分類ミス**: `@vscode/vsce`(パッケージング CLI)と `npm-check-updates` が `dependencies` に入っている。拡張の実行には不要で devDependencies に移すべき
- **廃止パッケージの残置**: deprecated な旧 `vscode-test@^1.5.0` と `@vscode/test-electron@^2.5.2` が両方存在(旧側は未使用の `runTest.ts` からのみ参照)
- **バージョン乖離**: `@types/node: ^17`(CI は Node 22/24)、`mocha: ^9`(現行 10 系)、`glob: ^8` に対し `@types/glob: ^7`、ESLint 本体 8 系に `@eslint/js ^9` / `typescript-eslint ^7` の混在
- `engines.vscode: ^1.79.1`(2023 年半ば)が下限として古いまま

## 改善案

ビルド系を devDependencies へ移動、旧 `vscode-test` を削除、`@types/node` を Node 22 相当へ、mocha / glob / eslint をメジャー更新、`engines.vscode` の下限を引き上げる。

---

### Issue 16: 同期 I/O によるエディタ応答性の低下(カーソル移動ごとのディスク走査)

**ラベル:** `bug`

関連: #416(補完の速度改善)

## バグの概要

1. `InformationWorkSpace.getProjectPathByFilePath`(`src/InformationWorkSpace.ts:1276-1296`)は `fs.readdirSync` でディレクトリ階層を遡る同期処理だが、`onDidChangeTextEditorSelection`(`extension.ts:636-640`)→ プレビューのホットリロード経由で**カーソル移動のたび**に呼ばれる。キャッシュもない
2. `getTyranoScriptProjectRootPaths`(同 248-265)はワークスペース全体を `readdirSync` で同期再帰走査し(`node_modules` 除外なし)、結果をキャッシュせず各所から繰り返し呼ばれる
3. 補完・ホバー・診断・ファイル監視ハンドラの各所に `fs.readFileSync` が残っており、大量ファイル操作(git checkout 等)時にイベントが殺到して UI がブロックされる

## 改善案

- ファイルパス→プロジェクトパスの解決結果を Map でキャッシュ
- カーソル移動ハンドラをデバウンス
- ホットパスを `vscode.workspace.fs`(非同期)へ移行、走査から巨大ディレクトリを除外
- #416 の調査と合わせて計測(`console.time` / プロファイラ)を入れる

---

### Issue 17: エラーハンドリングの統一と TyranoLogger の改善

**ラベル:** `enhancement`

## 概要

エラー処理の出口が `console.log` / `TyranoLogger` / 空 catch / re-throw と統一されておらず、失敗時の挙動が予測しづらい:

- `src/subscriptions/TyranoPreview.ts:34-37, 92-94, 397-399` … `console.log(error)` のみで空文字 return(ユーザーへの通知なし)
- `src/subscriptions/TyranoDiagnostic.ts:2101-2103` … catch 後にダミー範囲 `new vscode.Range(line,1,line,2)` を返し波線位置がずれる
- `src/InformationWorkSpace.ts:617, 652, 1253, 1289, 1316` … 実質空 catch
- `src/debug/debugBridge.js:651, 660, 669, 693` … `catch (_) {}` が 4 箇所

TyranoLogger 自体にも問題がある:

- `src/TyranoLogger.ts:21-28` … 設定をクラスロード時に 1 回だけスナップショットしており、`logger.enabled` の変更がリロードまで反映されない
- 同 52-64 … `printStackTrace` が `e instanceof Error` 以外(文字列 throw 等)を黙殺する
- OutputChannel が dispose 登録されていない

## 改善案

エラーは `TyranoLogger` 経由に統一し、ユーザー影響があるものは `showErrorMessage` で通知。Logger は設定を都度取得(または `onDidChangeConfiguration` 購読)し、非 Error 値も `String(e)` で記録する。

---

### Issue 18: 巨大クラスの分割(責務の整理)

**ラベル:** `enhancement`

## 概要

- `src/subscriptions/TyranoDiagnostic.ts`(2187 行) … 単一クラスが 10 種類以上の診断を抱え、`diagnoseSingleScenarioFile` は 1 メソッド 300 行の巨大ディスパッチャ
- `src/InformationWorkSpace.ts`(1519 行) … シングルトンが 11 個の Map と更新・削除・getter・Babel での JS 解析まで担う God Object。`updateMacroLabelVariableDataMapByKs` は約 265 行
- `src/subscriptions/TyranoCompletionItemProvider.ts`(1139 行) … `provideCompletionItems` が約 220 行の if/else-if チェーンで、ほぼ同一の条件式が 5 ブロック連続(184-277 行)
- `src/extension.ts`(806 行) … `activate` が単一関数で 620 行

## 改善案

- 診断は「1 診断 = 1 クラス」の Rule パターンへ分割し、TyranoDiagnostic は登録・実行・集約のみに縮小
- InformationWorkSpace は種類別リポジトリ(Macro/Label/Resource…)へ分離、Babel 解析は `JsMacroParser` として独立
- 補完は「コンテキスト解析」と「種別ごとの補完生成」に分離
- activate は `registerSidebarCommands` / `registerFileWatchers` / `registerDocumentListeners` 等へ分割
- あわせて本番コードに残る `hoge` / `piyo` / `fuga` 変数(`TyranoDiagnostic.ts:1331,1345,1350`)も意味のある名前に変更

---

## 🟢 低(ドキュメント)

---

### Issue 19: README の日英同期漏れとコメントトグル機能の記載漏れ

**ラベル:** `enhancement`

関連: #84(ローカライズ対応)

## 概要

- v3.2.0 の新機能「`Ctrl+/` コメントトグル(iscript 内は `//`、html 内は `<!-- -->`)」が README.md / README_EN.md の**両方に記載がない**(CHANGELOG のみ)
- README.md(596 行)に対し README_EN.md(517 行)は約 80 行遅れており、章立てもずれている
- 同一機能の状態表記が矛盾: `TyranoScript syntax.plugin.parameter` が README.md:108 では「**非推奨**」、README_EN.md:84 では「**beta version**」
- CONTRIBUTING.md は日本語版のみ

## 改善案

コメントトグル機能の節を日英に追加し、README_EN を再同期、非推奨/beta 表記を統一する。CONTRIBUTING の英語版追加も検討。
