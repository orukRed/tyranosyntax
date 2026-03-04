/**
 * ワークスペース内の Tyrano プロジェクト data/ 配下の .ks ファイルの JavaScript コンテンツをキャッシュ管理するクラス。
 * 各 .ks ファイルの仮想ドキュメントに「他ファイルの JS コンテンツ」を追記することで、
 * ファイルをまたいだ変数補完を実現する。
 */
import * as vscode from "vscode";

// [iscript] は属性付き (例: [iscript cond="..."]) にも対応、大文字小文字不問
const ISCRIPT_TAG_REGEX = /^\s*\[iscript(\s.*?)?\]\s*$/i;
const ENDSCRIPT_TAG_REGEX = /^\s*\[endscript\]\s*$/i;
const ISCRIPT_AT_REGEX = /^\s*@iscript(\s.*)?$/i;
const ENDSCRIPT_AT_REGEX = /^\s*@endscript(\s.*)?$/i;
const HAS_ISCRIPT_REGEX = /\[iscript[\s\]]|@iscript(?:\s|$)/i;

/**
 * 生テキストに [iscript] が含まれるかどうかの高速チェック
 */
function hasScriptBlocksInText(text: string): boolean {
  return HAS_ISCRIPT_REGEX.test(text);
}

interface TextScriptBlock {
  contentStartLine: number;
  contentEndLine: number;
}

/**
 * 生テキストからすべての [iscript]〜[endscript] ブロックを検出する
 */
function findScriptBlocksFromText(text: string): TextScriptBlock[] {
  const lines = text.split(/\r?\n/);
  const blocks: TextScriptBlock[] = [];
  let tagStartLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i];

    if (ISCRIPT_TAG_REGEX.test(lineText) || ISCRIPT_AT_REGEX.test(lineText)) {
      tagStartLine = i;
    } else if (
      (ENDSCRIPT_TAG_REGEX.test(lineText) ||
        ENDSCRIPT_AT_REGEX.test(lineText)) &&
      tagStartLine >= 0
    ) {
      blocks.push({
        contentStartLine: tagStartLine + 1,
        contentEndLine: i - 1,
      });
      tagStartLine = -1;
    }
  }

  return blocks;
}

/**
 * 生テキストからスクリプトブロック内の JavaScript 行のみを抽出する。
 * 行番号保持は不要（他ファイルのコンテキストとして仮想ドキュメントに追記する用途）。
 */
function extractJavaScriptFromText(text: string): string {
  const blocks = findScriptBlocksFromText(text);
  if (blocks.length === 0) {
    return "";
  }

  const lines = text.split(/\r?\n/);
  const jsLines: string[] = [];

  for (const block of blocks) {
    for (let i = block.contentStartLine; i <= block.contentEndLine; i++) {
      if (i < lines.length) {
        jsLines.push(lines[i]);
      }
    }
  }

  return jsLines.join("\n");
}

export class CrossFileContextManager implements vscode.Disposable {
  /** ファイル URI (文字列) → そのファイルの JS ブロック内容 */
  private fileJsCache = new Map<string, string>();

  /** getOtherFilesContent の結果キャッシュ (excludeUri → 結合済みコンテンツ) */
  private otherContentCache = new Map<string, string>();

  /** ファイル変更時のコールバック */
  private _onDidChange = new vscode.EventEmitter<void>();
  public readonly onDidChange = this._onDidChange.event;

  private watcher: vscode.FileSystemWatcher | undefined;
  private disposables: vscode.Disposable[] = [];

  /** デバウンス用タイマー */
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly DEBOUNCE_MS = 300;

  /**
   * 初期化: Tyrano プロジェクトの data/ 配下の .ks ファイルをスキャンしてキャッシュを構築する
   */
  async init(): Promise<void> {
    // Tyrano プロジェクトの data/ 配下の .ks ファイルのみを対象にする（InformationWorkSpace と同様）
    const KS_GLOB = "**/data/**/*.ks";
    const files = await vscode.workspace.findFiles(KS_GLOB);

    // 並列でファイルを読み込みキャッシュ
    await Promise.all(files.map((uri) => this.loadFile(uri)));

    // FileSystemWatcher で data/ 配下の .ks ファイルの変更を監視
    this.watcher = vscode.workspace.createFileSystemWatcher(KS_GLOB);

    this.watcher.onDidCreate(
      (uri) => {
        this.loadFile(uri).then(() => this.fireChangeDebounced());
      },
      undefined,
      this.disposables,
    );

    this.watcher.onDidChange(
      (uri) => {
        this.loadFile(uri).then(() => this.fireChangeDebounced());
      },
      undefined,
      this.disposables,
    );

    this.watcher.onDidDelete(
      (uri) => {
        this.fileJsCache.delete(uri.toString());
        this.otherContentCache.clear();
        this.fireChangeDebounced();
      },
      undefined,
      this.disposables,
    );

    this.disposables.push(this.watcher);
  }

  /**
   * 1ファイルを読み込み、JS コンテンツをキャッシュに格納する
   */
  private async loadFile(uri: vscode.Uri): Promise<void> {
    try {
      const raw = await vscode.workspace.fs.readFile(uri);
      const text = Buffer.from(raw).toString("utf-8");

      if (hasScriptBlocksInText(text)) {
        const js = extractJavaScriptFromText(text);
        if (js.length > 0) {
          this.fileJsCache.set(uri.toString(), js);
        } else {
          this.fileJsCache.delete(uri.toString());
        }
      } else {
        this.fileJsCache.delete(uri.toString());
      }
      this.otherContentCache.clear();
    } catch {
      // ファイル読み込みエラー（削除済み等）は無視
      this.fileJsCache.delete(uri.toString());
      this.otherContentCache.clear();
    }
  }

  /**
   * エディタで編集中のドキュメントの内容でキャッシュを更新する。
   * ファイルシステムのウォッチャーより先にエディタ上の変更を反映するために使用。
   */
  updateFromDocument(document: vscode.TextDocument): void {
    const text = document.getText();
    if (hasScriptBlocksInText(text)) {
      const js = extractJavaScriptFromText(text);
      if (js.length > 0) {
        this.fileJsCache.set(document.uri.toString(), js);
      } else {
        this.fileJsCache.delete(document.uri.toString());
      }
    } else {
      this.fileJsCache.delete(document.uri.toString());
    }
    this.otherContentCache.clear();
  }

  /**
   * 指定ファイルを除く、他の全ファイルの JS コンテンツを結合して返す。
   * 仮想ドキュメントの末尾に追記するために使用する。
   */
  getOtherFilesContent(excludeUri: string): string {
    const cached = this.otherContentCache.get(excludeUri);
    if (cached !== undefined) {
      return cached;
    }
    const parts: string[] = [];
    for (const [uri, js] of this.fileJsCache) {
      if (uri !== excludeUri && js.length > 0) {
        parts.push(js);
      }
    }
    const result = parts.join("\n");
    this.otherContentCache.set(excludeUri, result);
    return result;
  }

  /**
   * キャッシュされているファイル数を取得する
   */
  get cachedFileCount(): number {
    return this.fileJsCache.size;
  }

  /**
   * デバウンス付きで変更イベントを発火する
   */
  private fireChangeDebounced(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this._onDidChange.fire();
      this.debounceTimer = undefined;
    }, this.DEBOUNCE_MS);
  }

  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this._onDidChange.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.fileJsCache.clear();
    this.otherContentCache.clear();
  }
}
