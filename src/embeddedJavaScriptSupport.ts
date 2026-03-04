/**
 * [iscript]〜[endscript] ブロック内での JavaScript 言語サポート
 * 仮想ドキュメントを作成し、VS Code 組み込みの JS 言語サービスに委譲する。
 */
import * as vscode from "vscode";
import { CrossFileContextManager } from "./CrossFileContextManager";

// ── 型定義 ──────────────────────────────────────────

/**
 * [iscript]〜[endscript] で囲まれた領域の情報
 */
export interface ScriptBlock {
  /** [iscript] タグのある行番号 */
  tagStartLine: number;
  /** JavaScript コンテンツの開始行 ([iscript] の次の行) */
  contentStartLine: number;
  /** JavaScript コンテンツの終了行 ([endscript] の前の行) */
  contentEndLine: number;
  /** [endscript] タグのある行番号 */
  tagEndLine: number;
}

/** ドキュメントごとのキャッシュ */
interface DocumentCache {
  /** キャッシュ生成時のドキュメントバージョン */
  version: number;
  /** [iscript] が存在するか */
  hasBlocks: boolean;
  /** スクリプトブロック一覧 */
  blocks: ScriptBlock[];
  /** 仮想 JS コンテンツ */
  virtualContent: string;
}

// ── 正規表現 ──────────────────────────────────────────
// [iscript] は属性付き (例: [iscript cond="..."]) にも対応、大文字小文字不問
const ISCRIPT_TAG_REGEX = /^\s*\[iscript(\s.*?)?\]\s*$/i;
const ENDSCRIPT_TAG_REGEX = /^\s*\[endscript\]\s*$/i;
const ISCRIPT_AT_REGEX = /^\s*@iscript(\s.*)?$/i;
const ENDSCRIPT_AT_REGEX = /^\s*@endscript(\s.*)?$/i;

// hasScriptBlocks 用の高速チェック正規表現（大文字小文字不問）
const HAS_ISCRIPT_REGEX = /\[iscript[\s\]]|@iscript(?:\s|$)/i;

// ── 定数 ──────────────────────────────────────────
const EMBEDDED_SCHEME = "embedded-javascript";
/** onDidChangeTextDocument のデバウンス間隔 (ms) */
const DEBOUNCE_DELAY_MS = 150;

// ── 仮想ドキュメント管理 ──────────────────────────
/** 仮想 URI → 仮想 JS コンテンツ */
const virtualContentMap = new Map<string, string>();
/** 仮想 URI → 元ドキュメント URI (文字列) */
const virtualToOriginalMap = new Map<string, string>();
/** 元ドキュメント URI → キャッシュ */
const documentCacheMap = new Map<string, DocumentCache>();
/** 仮想ドキュメントを既に開いたかどうか */
const openedVirtualDocs = new Set<string>();
/** デバウンス用タイマー */
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

let contentProvider: EmbeddedJSDocumentProvider;
let crossFileContext: CrossFileContextManager;

// ── キャッシュ付きユーティリティ関数 ──────────────────

/**
 * ドキュメントのキャッシュを取得する。バージョンが変わっていたら再計算する。
 */
function getDocumentCache(document: vscode.TextDocument): DocumentCache {
  const key = document.uri.toString();
  const cached = documentCacheMap.get(key);
  if (cached && cached.version === document.version) {
    return cached;
  }

  // 高速チェック: [iscript] が含まれるか
  const text = document.getText();
  const hasBlocks = HAS_ISCRIPT_REGEX.test(text);

  let blocks: ScriptBlock[] = [];
  let virtualContent = "";

  if (hasBlocks) {
    blocks = computeScriptBlocks(document);
    virtualContent = computeVirtualContent(document, blocks);
  }

  const cache: DocumentCache = {
    version: document.version,
    hasBlocks,
    blocks,
    virtualContent,
  };
  documentCacheMap.set(key, cache);
  return cache;
}

/**
 * ドキュメント内のすべての [iscript]〜[endscript] ブロックを検出する（内部実装）
 */
function computeScriptBlocks(document: vscode.TextDocument): ScriptBlock[] {
  const blocks: ScriptBlock[] = [];
  let tagStartLine = -1;

  for (let i = 0; i < document.lineCount; i++) {
    const lineText = document.lineAt(i).text;

    if (ISCRIPT_TAG_REGEX.test(lineText) || ISCRIPT_AT_REGEX.test(lineText)) {
      tagStartLine = i;
    } else if (
      (ENDSCRIPT_TAG_REGEX.test(lineText) ||
        ENDSCRIPT_AT_REGEX.test(lineText)) &&
      tagStartLine >= 0
    ) {
      blocks.push({
        tagStartLine,
        contentStartLine: tagStartLine + 1,
        contentEndLine: i - 1,
        tagEndLine: i,
      });
      tagStartLine = -1;
    }
  }

  return blocks;
}

/**
 * 仮想 JavaScript コンテンツを生成する（内部実装）
 */
function computeVirtualContent(
  document: vscode.TextDocument,
  blocks: ScriptBlock[],
): string {
  // スクリプトブロック内の行番号を Set に収集
  const scriptLines = new Set<number>();
  for (const block of blocks) {
    for (let i = block.contentStartLine; i <= block.contentEndLine; i++) {
      scriptLines.add(i);
    }
  }

  const lines: string[] = [];
  for (let i = 0; i < document.lineCount; i++) {
    if (scriptLines.has(i)) {
      lines.push(document.lineAt(i).text);
    } else {
      lines.push("");
    }
  }

  return lines.join("\n");
}

// ── 公開 API（キャッシュ経由） ──────────────────────

/**
 * ドキュメント内のすべての [iscript]〜[endscript] ブロックを検出する
 */
export function findScriptBlocks(document: vscode.TextDocument): ScriptBlock[] {
  return getDocumentCache(document).blocks;
}

/**
 * 指定された位置が [iscript]〜[endscript] ブロック内にあるかどうかを判定する
 */
export function isInsideScriptBlock(
  document: vscode.TextDocument,
  position: vscode.Position,
): boolean {
  const blocks = getDocumentCache(document).blocks;
  return blocks.some(
    (block) =>
      position.line >= block.contentStartLine &&
      position.line <= block.contentEndLine,
  );
}

/**
 * ドキュメントから仮想 JavaScript コンテンツを生成する。
 * JavaScript 以外の行は空行で埋められ、行番号が元ドキュメントと一致するようにする。
 */
export function getVirtualJavaScriptContent(
  document: vscode.TextDocument,
): string {
  return getDocumentCache(document).virtualContent;
}

/**
 * ドキュメントに [iscript] が含まれるかどうかの高速チェック
 */
export function hasScriptBlocks(document: vscode.TextDocument): boolean {
  return getDocumentCache(document).hasBlocks;
}

// ── 仮想 URI 管理 ─────────────────────────────────

/**
 * 元ドキュメントに対応する仮想 JavaScript URI を生成する。
 * URI は `.js` で終わるため、VS Code が language ID を `javascript` に設定する。
 */
function getVirtualUri(document: vscode.TextDocument): vscode.Uri {
  const encoded = encodeURIComponent(document.uri.toString());
  return vscode.Uri.parse(
    `${EMBEDDED_SCHEME}://javascript/${encoded}/embedded.js`,
  );
}

/**
 * 仮想 URI から元ドキュメント URI 文字列を取得する
 */
function getOriginalUriString(virtualUri: vscode.Uri): string | undefined {
  return virtualToOriginalMap.get(virtualUri.toString());
}

/**
 * 仮想ドキュメントの内容を更新する。
 * 自ファイルの JS コンテンツに加え、ワークスペース内の他ファイルの JS コンテンツを
 * 末尾に追記することで、クロスファイル補完を実現する。
 */
function updateVirtualContent(document: vscode.TextDocument): void {
  const cache = getDocumentCache(document);
  const virtualUri = getVirtualUri(document);
  const key = virtualUri.toString();

  if (!cache.hasBlocks) {
    const oldContent = virtualContentMap.get(key);

    // [iscript] ブロックが削除された場合は、仮想ドキュメント側の内容と
    // マッピングをクリアし、変更イベントを発火して診断等を更新する。
    if (oldContent !== undefined) {
      virtualContentMap.delete(key);
      virtualToOriginalMap.delete(key);
      if (contentProvider) {
        contentProvider.fireChange(virtualUri);
      }
    }
    return;
  }
  // 自ファイルの JS コンテンツ + 他ファイルの JS コンテンツ
  let content = cache.virtualContent;
  if (crossFileContext) {
    const otherContent = crossFileContext.getOtherFilesContent(
      document.uri.toString(),
    );
    if (otherContent.length > 0) {
      content = cache.virtualContent + "\n" + otherContent;
    }
  }

  const oldContent = virtualContentMap.get(key);

  // コンテンツが変わっていなければ何もしない
  if (oldContent === content) {
    return;
  }

  virtualContentMap.set(key, content);
  virtualToOriginalMap.set(key, document.uri.toString());
  if (contentProvider) {
    contentProvider.fireChange(virtualUri);
  }
}

/**
 * 仮想ドキュメントが VS Code に開かれた (=TS/JS 言語サーバーが認識した) 状態にする
 */
async function ensureVirtualDocument(
  document: vscode.TextDocument,
): Promise<vscode.Uri> {
  const virtualUri = getVirtualUri(document);
  const key = virtualUri.toString();

  updateVirtualContent(document);

  // 初回のみ openTextDocument を呼ぶ
  if (!openedVirtualDocs.has(key)) {
    try {
      await vscode.workspace.openTextDocument(virtualUri);
      openedVirtualDocs.add(key);
    } catch {
      // すでに開いている場合は無視
      openedVirtualDocs.add(key);
    }
  }
  return virtualUri;
}

// ── TextDocumentContentProvider ───────────────────
class EmbeddedJSDocumentProvider implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  public readonly onDidChange = this._onDidChange.event;

  provideTextDocumentContent(_uri: vscode.Uri): string {
    return virtualContentMap.get(_uri.toString()) || "";
  }

  fireChange(uri: vscode.Uri): void {
    this._onDidChange.fire(uri);
  }
}

// ── メイン登録関数 ────────────────────────────────

/**
 * [iscript]〜[endscript] ブロック内での JavaScript 言語サポートを登録する。
 * activate() から呼び出す。
 *
 * 開いているドキュメントの仮想ドキュメントをすべて再構築する
 */
function refreshAllVirtualDocuments(): void {
  for (const doc of vscode.workspace.textDocuments) {
    if (
      doc.uri.scheme !== EMBEDDED_SCHEME &&
      doc.languageId === "tyrano" &&
      hasScriptBlocks(doc)
    ) {
      updateVirtualContent(doc);
    }
  }
}

export function registerEmbeddedJavaScriptSupport(
  context: vscode.ExtensionContext,
): void {
  contentProvider = new EmbeddedJSDocumentProvider();
  crossFileContext = new CrossFileContextManager();

  // 仮想ドキュメントスキーム登録
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      EMBEDDED_SCHEME,
      contentProvider,
    ),
  );

  // --- クロスファイルコンテキストの初期化 ---
  crossFileContext.init().then(() => {
    console.log(
      `[iscript] CrossFileContext initialized: ${crossFileContext.cachedFileCount} files cached`,
    );
    // 初期化完了後、すでに開いているドキュメントの仮想ドキュメントを準備
    for (const doc of vscode.workspace.textDocuments) {
      if (doc.languageId === "tyrano" && hasScriptBlocks(doc)) {
        ensureVirtualDocument(doc);
      }
    }
  });
  context.subscriptions.push(crossFileContext);

  // --- クロスファイルコンテキスト変更時: 全仮想ドキュメントを再構築 ---
  context.subscriptions.push(
    crossFileContext.onDidChange(() => {
      refreshAllVirtualDocuments();
    }),
  );

  // --- ドキュメント開閉・変更イベント ---
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (doc.languageId === "tyrano" && hasScriptBlocks(doc)) {
        ensureVirtualDocument(doc);
      }
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const doc = event.document;
      if (doc.uri.scheme === EMBEDDED_SCHEME || doc.languageId !== "tyrano") {
        return;
      }

      // キャッシュを無効化（次回アクセス時に再計算される）
      documentCacheMap.delete(doc.uri.toString());

      // エディタ上の変更をクロスファイルキャッシュにも即時反映
      if (crossFileContext && doc.uri.scheme === "file") {
        crossFileContext.updateFromDocument(doc);
      }

      // デバウンスして仮想ドキュメントを更新（キーストロークごとの更新を抑制）
      const docKey = doc.uri.toString();
      const existingTimer = debounceTimers.get(docKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      debounceTimers.set(
        docKey,
        setTimeout(() => {
          debounceTimers.delete(docKey);
          // ドキュメントがまだ開いているか確認
          const currentDoc = vscode.workspace.textDocuments.find(
            (d) => d.uri.toString() === docKey,
          );
          if (currentDoc) {
            updateVirtualContent(currentDoc);

            // .ks ファイルが変更された場合、他の開いている .ks ファイルの
            // 仮想ドキュメントも再構築する（他ファイルの JS コンテンツが変わるため）
            if (hasScriptBlocks(currentDoc)) {
              for (const otherDoc of vscode.workspace.textDocuments) {
                if (
                  otherDoc.uri.toString() !== currentDoc.uri.toString() &&
                  otherDoc.uri.scheme !== EMBEDDED_SCHEME &&
                  otherDoc.languageId === "tyrano" &&
                  hasScriptBlocks(otherDoc)
                ) {
                  updateVirtualContent(otherDoc);
                }
              }
            }
          }
        }, DEBOUNCE_DELAY_MS),
      );
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) => {
      if (doc.uri.scheme === EMBEDDED_SCHEME) {
        // 仮想ドキュメントが閉じられた場合:
        // その仮想URI自体をキーとしてクリーンアップする
        const key = doc.uri.toString();
        virtualContentMap.delete(key);
        virtualToOriginalMap.delete(key);
        openedVirtualDocs.delete(key);
        // documentCacheMap / debounceTimers は元ドキュメントの URI をキーとしているため触らない
      } else {
        // 元ドキュメントが閉じられた場合:
        // 対応する仮想URIをキーとしてクリーンアップし、
        // 元ドキュメントに紐づくキャッシュやタイマーも削除する
        const virtualUri = getVirtualUri(doc);
        const key = virtualUri.toString();
        virtualContentMap.delete(key);
        virtualToOriginalMap.delete(key);
        openedVirtualDocs.delete(key);
        const docKey = doc.uri.toString();
        documentCacheMap.delete(docKey);
        const timer = debounceTimers.get(docKey);
        if (timer) {
          clearTimeout(timer);
          debounceTimers.delete(docKey);
        }
      }
    }),
  );

  // --- ドキュメントセレクタ (tyrano言語のみ) ---
  const selector: vscode.DocumentSelector = [
    { scheme: "file", language: "tyrano" },
    { scheme: "untitled", language: "tyrano" },
  ];

  // =============================================
  //  補完 (Completion)
  // =============================================
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      selector,
      {
        async provideCompletionItems(
          document,
          position,
          _token,
          completionContext,
        ) {
          if (!hasScriptBlocks(document)) {
            return undefined;
          }
          if (!isInsideScriptBlock(document, position)) {
            return undefined;
          }

          const virtualUri = await ensureVirtualDocument(document);

          try {
            const result =
              await vscode.commands.executeCommand<vscode.CompletionList>(
                "vscode.executeCompletionItemProvider",
                virtualUri,
                position,
                completionContext.triggerCharacter,
                5,
              );
            return result;
          } catch (e) {
            console.error("[iscript] Completion error:", e);
            return undefined;
          }
        },
      },
      ".", // オブジェクトメンバー
      "'",
      '"',
      "`",
      "/", // 正規表現・パス
    ),
  );

  // =============================================
  //  ホバー (Hover)
  // =============================================
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(selector, {
      async provideHover(document, position, _token) {
        if (!hasScriptBlocks(document)) {
          return undefined;
        }
        if (!isInsideScriptBlock(document, position)) {
          return undefined;
        }

        const virtualUri = await ensureVirtualDocument(document);

        try {
          const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
            "vscode.executeHoverProvider",
            virtualUri,
            position,
          );
          return hovers && hovers.length > 0 ? hovers[0] : undefined;
        } catch (e) {
          console.error("[iscript] Hover error:", e);
          return undefined;
        }
      },
    }),
  );

  // =============================================
  //  定義ジャンプ (Go to Definition)
  // =============================================
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, {
      async provideDefinition(document, position, _token) {
        if (!hasScriptBlocks(document)) {
          return undefined;
        }
        if (!isInsideScriptBlock(document, position)) {
          return undefined;
        }

        const virtualUri = await ensureVirtualDocument(document);

        try {
          const definitions = await vscode.commands.executeCommand<
            vscode.Location[]
          >("vscode.executeDefinitionProvider", virtualUri, position);

          if (!definitions) {
            return undefined;
          }

          // 仮想ドキュメント内の位置を元ドキュメントにマッピング
          return definitions.map((def) => {
            if (def.uri.toString() === virtualUri.toString()) {
              return new vscode.Location(document.uri, def.range);
            }
            return def;
          });
        } catch (e) {
          console.error("[iscript] Definition error:", e);
          return undefined;
        }
      },
    }),
  );

  // =============================================
  //  シグネチャヘルプ (Signature Help)
  // =============================================
  context.subscriptions.push(
    vscode.languages.registerSignatureHelpProvider(
      selector,
      {
        async provideSignatureHelp(
          document,
          position,
          _token,
          signatureContext,
        ) {
          if (!hasScriptBlocks(document)) {
            return undefined;
          }
          if (!isInsideScriptBlock(document, position)) {
            return undefined;
          }

          const virtualUri = await ensureVirtualDocument(document);

          try {
            const result =
              await vscode.commands.executeCommand<vscode.SignatureHelp>(
                "vscode.executeSignatureHelpProvider",
                virtualUri,
                position,
                signatureContext.triggerCharacter,
              );
            return result;
          } catch (e) {
            console.error("[iscript] SignatureHelp error:", e);
            return undefined;
          }
        },
      },
      "(",
      ",",
    ),
  );

  // =============================================
  //  診断情報の転送 (Diagnostics Forwarding)
  // =============================================
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("iscript-javascript");
  context.subscriptions.push(diagnosticCollection);

  context.subscriptions.push(
    vscode.languages.onDidChangeDiagnostics((event) => {
      for (const uri of event.uris) {
        if (uri.scheme !== EMBEDDED_SCHEME) {
          continue;
        }

        const originalUriStr = getOriginalUriString(uri);
        if (!originalUriStr) {
          continue;
        }

        const originalDoc = vscode.workspace.textDocuments.find(
          (d) => d.uri.toString() === originalUriStr,
        );
        if (!originalDoc) {
          continue;
        }

        const diagnostics = vscode.languages.getDiagnostics(uri);
        const blocks = findScriptBlocks(originalDoc);

        // スクリプトブロック内の診断のみを転送
        const filtered = diagnostics.filter((d) =>
          blocks.some(
            (block) =>
              d.range.start.line >= block.contentStartLine &&
              d.range.end.line <= block.contentEndLine,
          ),
        );

        const originalUri = vscode.Uri.parse(originalUriStr);
        diagnosticCollection.set(originalUri, filtered);
      }
    }),
  );

  console.log("[iscript] Embedded JavaScript Support registered");
}

/**
 * 仮想ドキュメントのクリーンアップ
 */
export function cleanupEmbeddedJavaScript(): void {
  virtualContentMap.clear();
  virtualToOriginalMap.clear();
  documentCacheMap.clear();
  openedVirtualDocs.clear();
  for (const timer of debounceTimers.values()) {
    clearTimeout(timer);
  }
  debounceTimers.clear();
}
