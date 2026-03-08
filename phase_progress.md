# Phase Progress - LSP Migration

## Phase 1: ビルドインフラ整備
- [x] vscode-uri パッケージ追加
- [x] src/shared/protocol.ts 作成（共有型定義）
- [x] protocol.ts に TyranoInitializationOptions / TyranoConfigurationSections 追加
- ~~webpack.config.js デュアルエントリ化~~ (不要: tsc で client/server 両方コンパイル可能)
- ~~eslint ルール追加~~ (既存のビルドで対応)

## Phase 2: サーバー基盤構築
- [x] src/server/TyranoLogger.ts 作成
- [x] src/server/InformationExtension.ts 作成
- [x] src/server/ProjectPathResolver.ts 作成
- [x] src/server/Parser.ts 作成
- [x] src/server/server.ts 構築（全LSPハンドラ含む ~1100行）
- [x] 設定同期メカニズム（initializationOptions 経由）

## Phase 3: コアデータ層のサーバー移行
- [x] defineData クラス群の LSP 型置換（7クラス + MacroParameterData + ResourceFileData）
- [x] MapCacheManager の vscode 依存除去
- [x] ScenarioFileParser の vscode 依存除去
- [x] ScriptFileParser の vscode 依存除去
- [x] MacroParameterExtractor の vscode 依存除去
- [x] InformationWorkSpace の vscode 依存除去
- [x] CrossFileContextManager の vscode 依存除去（サーバー側版）
- [x] サーバー側モジュール間のインポートパス修正

## Phase 4: Feature Provider のサーバー移行
- [x] TyranoHoverProvider → onHover（タグドキュメント + パラメータ画像プレビュー）
- [x] TyranoOutlineProvider → onDocumentSymbol（ラベル/タグ/変数/コメント）
- [x] TyranoCompletionItemProvider → onCompletion（タグ/パラメータ/リソース/変数/ラベル/キャラクタ）
- [x] TyranoDefinitionProvider → onDefinition
- [x] TyranoRenameProvider → onPrepareRename + onRenameRequest（マクロ・変数リネーム）
- [x] TyranoDiagnostic → runDiagnostics + connection.sendDiagnostics（9種類の診断）
- [x] TyranoReferenceProvider → onReferences（スタブ）

## Phase 5: クライアント側の書き換え
- [x] extension.ts 全面書き換え（LanguageClient パターン）
- [x] TyranoJumpProvider → カスタムリクエスト (tyrano/resolveJumpTarget)
- [x] ファイルウォッチャー → TyranoNotifications.FileChanged 通知転送
- [x] 手動診断コマンド → サーバーへファイル変更通知
- [x] クライアント側コマンド維持（ショートカット/プレビュー/フローチャート/addRAndP）

## Phase 6: embeddedJavaScriptSupport 対応
- [x] embeddedJavaScriptSupport はクライアント側に残留（VS Code API依存の仮想ドキュメント機構）
- [x] クライアント側 CrossFileContextManager は embeddedJS 用に維持

## Phase 7: テスト・検証・クリーンアップ
- [x] TypeScript コンパイルエラーなし確認（tsc --noEmit, tsc -p ./ ともにパス）
- [x] テストの LSP 対応更新
  - extension.test.ts 更新（拡張機能のアクティベーション・コマンド登録テスト）
  - 既存テスト群はクライアント側モジュールのまま（コンパイル・テスト通過確認済み）
  - サーバー側モジュールの単体テスト追加は将来対応
- [x] deprecate フォルダ整理（__TyranoRenameProvider.ts 削除、deprecate ディレクトリ消去）
- [x] ビルド出力確認（out/server/server.js, out/extension.js, out/shared/protocol.js 生成確認）
- [ ] 実行時動作確認（拡張ホストでのエンドツーエンドテスト）
