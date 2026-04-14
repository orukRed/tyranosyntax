# Plan: TyranoScript デバッグ機能の実装

## TL;DR
VS Code Debug Adapter Protocol (DAP) を実装し、TyranoScript (.ks) ファイルのステップ実行・ブレークポイント・変数ウォッチ・コールスタック閲覧を可能にする。ゲームランタイムとの通信はWebSocketで行い、ゲームに注入するデバッグブリッジスクリプトがランタイムの `ftag.nextOrder()` をフックして制御する。ブラウザ起動とElectron起動の両方に対応する。

## アーキテクチャ概要

```
VS Code (DAP Client)
    ↕ Debug Adapter Protocol (インライン)
TyranoDebugSession (DAP Server)
    ↕ WebSocket (port 8200)
debugBridge.js (ゲームに注入)
    ↕ ランタイムフック
kag.tag.js ftag.nextOrder() (TyranoScript実行エンジン)
```

---

## Phase 1: 基盤セットアップ（依存関係・package.json・スキャフォールド）

### Step 1: 依存関係の追加 ✅
- [x] `@vscode/debugadapter` をdependenciesに追加
- [x] `@types/ws` をdevDependenciesに追加（既存の`ws`相当のWebSocket型。ただし既にexpressで使っているWebSocketは`ws`パッケージ）
- [x] `ws` パッケージをdependenciesに追加

### Step 2: package.json にデバッガー貢献ポイントを追加 ✅
- [x] `contributes.debuggers` に `tyranoDebug` タイプを登録
  - `label`: "TyranoScript Debug"
  - `languages`: ["tyrano"]
  - `configurationAttributes`: launch設定スキーマ（projectRoot, scenario, httpPort, wsPort）
  - `initialConfigurations`: デフォルトのlaunch.json テンプレート
  - `configurationSnippets`: launch.json用スニペット
- [x] `contributes.breakpoints` に `{ "language": "tyrano" }` を追加

### Step 3: launch.json テンプレート設計 ✅
```json
{
  "type": "tyranoDebug",
  "request": "launch",
  "name": "TyranoScript Debug",
  "projectRoot": "${workspaceFolder}",
  "scenario": "first.ks"
}
```

---

## Phase 2: デバッグアダプター実装

### Step 4: `src/debug/TyranoDebugSession.ts` — DAP セッション ✅
`DebugSession`（@vscode/debugadapter）を継承し、以下のDAP requestを実装:

| DAP Request | 実装内容 | 状態 |
|------------|---------|------|
| `initializeRequest` | capability宣言（supportsConfigurationDoneRequest等） | ✅ |
| `launchRequest` | ゲーム起動（HTTP+WebSocket サーバー起動→ブラウザ起動） | ✅ |
| `setBreakPointsRequest` | Parser.tsで行検証→ブリッジに送信 | ✅ |
| `configurationDoneRequest` | ブリッジにresume送信（初期化完了通知） | ✅ |
| `threadsRequest` | 単一スレッド返却（TyranoScriptはシングルスレッド） | ✅ |
| `stackTraceRequest` | ブリッジからcall/macroスタック取得→StackFrame[] に変換 | ✅ |
| `scopesRequest` | f, sf, tf, mp の4スコープを返却 | ✅ |
| `variablesRequest` | 各スコープの変数一覧をブリッジから取得 | ✅ |
| `continueRequest` | ブリッジにresume送信 | ✅ |
| `nextRequest` | ブリッジにstepOver送信 | ✅ |
| `stepInRequest` | ブリッジにstepIn送信（マクロ内部に入る） | ✅ |
| `stepOutRequest` | ブリッジにstepOut送信（マクロから出る） | ✅ |
| `pauseRequest` | ブリッジにpause送信 | ✅ |
| `disconnectRequest` | サーバー停止、ブラウザプロセス終了 | ✅ |

### Step 5: `src/debug/TyranoDebugRuntime.ts` — ランタイム通信抽象化 ✅
- [x] WebSocketサーバー (port 8200) の管理
- [x] ブリッジとのメッセージ送受信プロトコル定義
- [x] EventEmitter パターンでセッションに通知

**メッセージプロトコル（JSON）:**
```
// Adapter → Bridge
{ type: "setBreakpoints", data: { file: string, lines: number[] } }
{ type: "resume" }
{ type: "stepOver" }
{ type: "stepIn" }
{ type: "stepOut" }
{ type: "pause" }
{ type: "getVariables", data: { scope: "f"|"sf"|"tf"|"mp" }, requestId: number }
{ type: "getCallStack", data: {}, requestId: number }

// Bridge → Adapter
{ type: "stopped", data: { reason: "breakpoint"|"step"|"pause", file: string, line: number } }
{ type: "variables", data: [...], requestId: number }
{ type: "callStack", data: { frames: [...] }, requestId: number }
{ type: "output", data: { text: string, category: "console"|"stdout" } }
{ type: "terminated" }
```

### Step 6: `src/debug/TyranoDebugServer.ts` — HTTPサーバー ✅
- [x] Express HTTPサーバー (port 3200) でゲームファイルを配信
- [x] index.html配信時にdebugBridge.jsを自動注入（`</body>` 直前に挿入）
- [x] debugBridge.js を `out/debug/` から配信
- [x] 静的ファイル配信（data/, tyrano/ 等）

### Step 7: `src/debug/TyranoDebugConfigProvider.ts` — 設定プロバイダー ✅
- [x] `vscode.DebugConfigurationProvider` を実装
- [x] launch.jsonが無い場合のデフォルト設定生成
- [x] プロジェクトルート自動検出（`InformationWorkSpace.getTyranoScriptProjectRootPaths()`を利用）

---

## Phase 3: デバッグブリッジ（ゲーム側注入スクリプト）

### Step 8: `src/debug/debugBridge.js` — ランタイムフックスクリプト ✅
- [x] **WebSocket接続**: ws://localhost:{port} に接続（ポートは `window.__TYRANO_DEBUG_WS_PORT__` から取得）
- [x] **nextOrder()フック**: `TYRANO.kag.ftag.nextOrder` をラップ
  - 元の `nextOrder` を保存
  - 各タグ実行前にブレークポイント判定
  - ブレークポイントヒット時は実行を一時停止し、`stopped` イベント送信
  - resume/step指示の待機
- [x] **ブレークポイント管理**: `{ file: { line: true } }` で保持
- [x] **変数収集**: `TYRANO.kag.stat.f`, `TYRANO.kag.variable.sf`, `TYRANO.kag.variable.tf`, `TYRANO.kag.stat.mp` を取得
- [x] **コールスタック収集**: `TYRANO.kag.stat.stack.call` + `TYRANO.kag.stat.stack.macro` から構築
- [x] **ステップ実行制御**:
  - stepOver: マクロスタック深度が同じか浅い場合に停止
  - stepIn: 次のタグで無条件停止
  - stepOut: マクロスタック深度が1つ浅くなったら停止

---

## Phase 4: Parser.ts 拡張

### Step 9: `src/Parser.ts` にメソッド追加 ✅
- [x] `getValidBreakpointLines(text: string): number[]` — ブレークポイント設定可能な行番号一覧
- [x] `getTagAtLine(parsedData: any[], line: number): any | undefined` — 指定行のタグオブジェクト取得

---

## Phase 5: 拡張機能への統合

### Step 10: `src/extension.ts` にデバッグ機能を登録 ✅
- [x] `vscode.debug.registerDebugAdapterDescriptorFactory("tyranoDebug", factory)` でインラインDAP登録
- [x] `vscode.debug.registerDebugConfigurationProvider("tyranoDebug", configProvider)` で設定プロバイダー登録

### Step 11: launch.json自動生成サポート ✅
- [x] package.jsonの`configurationSnippets`で「TyranoScript Debug」テンプレートを提供

---

## Relevant Files

### 新規作成 ✅
- [x] `src/debug/TyranoDebugSession.ts` — DAP セッション実装（メイン）
- [x] `src/debug/TyranoDebugRuntime.ts` — WebSocket通信・ランタイム抽象化
- [x] `src/debug/TyranoDebugServer.ts` — デバッグ用HTTPサーバー
- [x] `src/debug/TyranoDebugConfigProvider.ts` — デバッグ設定プロバイダー
- [x] `src/debug/debugBridge.js` — ゲーム注入デバッグブリッジスクリプト

### 既存修正 ✅
- [x] `package.json` — debuggers, breakpoints貢献ポイント追加、依存関係追加
- [x] `src/extension.ts` — デバッグアダプターファクトリー登録
- [x] `src/Parser.ts` — `getValidBreakpointLines()`, `getTagAtLine()` メソッド追加

### 参考ファイル（変更なし）
- `src/subscriptions/TyranoPreview.ts` — Express+WebSocketサーバーの実装パターン参考
- `test_project/tyrano/plugins/kag/kag.tag.js` — `ftag.nextOrder()` フック対象
- `test_project/tyrano/plugins/kag/kag.studio.js` — Electron IPC統合パターン参考
- `test_project/tyrano/plugins/kag/kag.js` — `pushStack`/`popStack` コールスタック構造
- `test_project/tyrano/plugins/kag/kag.parser.js` — ランタイムパーサーの行番号付与の仕組み

---

## Verification

1. **ユニットテスト**: `src/test/suite/` に `TyranoDebugSession.test.ts` を追加
   - [ ] Parser.tsの新メソッド (`getValidBreakpointLines`, `getTagAtLine`) のテスト
   - [ ] メッセージプロトコルのシリアライズ/デシリアライズテスト
2. **統合テスト手順**:
   - [ ] test_project を開いた状態でF5 → launch.json生成確認
   - [ ] ブラウザでゲームが起動しWebSocket接続確立を確認
   - [ ] .ksファイルにブレークポイント設置 → ゲーム実行時に停止確認
   - [ ] 停止時に変数パネルで f, sf, tf, mp が表示されることを確認
   - [ ] ステップオーバー → 次のタグで停止確認
   - [ ] マクロタグに対してステップイン → マクロ内部に入ることを確認
   - [ ] コールスタックパネルにマクロ呼び出し履歴が表示されることを確認
   - [ ] Continue → 次のブレークポイントまで実行確認
3. **ビルド確認**:
   - [x] `npm run compile` が成功すること
   - [x] `npm run lint` がエラーなし（既存warningのみ）

---

## Decisions

- **DAP方式**: インラインDebugAdapter（別プロセスではなく拡張機能内で直接実行）
- **通信方式**: WebSocket（ブラウザ・Electron両対応の唯一の共通プロトコル）
- **ポート**: HTTP 3200, WebSocket 8200（既存Preview 3100/8100との衝突回避）
- **スコープ（初回）**: 基本機能のみ（ブレークポイント、変数ウォッチ、ステップ実行、コールスタック）
- **スコープ外（将来）**: 条件付きブレークポイント、ログポイント、式の評価、ホットリロード連携
- **Parser.ts**: 既存の `parseText()` 機能は十分。ブレークポイント検証用の薄いラッパーメソッド2つを追加するだけで良い
- **test_project内のランタイムファイルは変更しない**: debugBridge.jsはHTMLインジェクションで注入

## Further Considerations

1. **Electron起動パス**: Electron版ではNW.jsまたはElectronの実行ファイルパスをlaunch.jsonで指定する必要がある。初回はブラウザ版のみ実装し、Electron対応はPhase 6として後回しにすることを推奨
2. **ポートの設定可能性**: WebSocket/HTTPポートはlaunch.jsonで変更可能にすべきか → 推奨: デフォルトは固定値、launch.jsonで上書き可能にする
3. **debugBridge.jsのバンドル**: webpackでバンドルする必要はあるか → 推奨: 単一JSファイルとしてout/に直接コピー。外部依存なし


## TODO
- [ ] ウォッチ式でf.hogeが評価されない。ブレークポイントで止まった時、変数欄にhogeの値は出ているのでウォッチ式でも同様にしたい。
- [ ] デバッグ実行時、ポートは3300で実行するようにしたい。
