/**
 * ワークスペース内の Tyrano プロジェクト data/ 配下の .ks ファイルの JavaScript コンテンツをキャッシュ管理するクラス（サーバー側）。
 * vscode.workspace.findFiles → Node.js fs + glob
 * vscode.workspace.fs.readFile → Node.js fs.readFileSync
 * vscode.workspace.createFileSystemWatcher → クライアントからの通知で代替
 */
import * as fs from "fs";
import * as path from "path";

const ISCRIPT_TAG_REGEX = /^\s*\[iscript(\s.*?)?\]\s*$/i;
const ENDSCRIPT_TAG_REGEX = /^\s*\[endscript\]\s*$/i;
const ISCRIPT_AT_REGEX = /^\s*@iscript(\s.*)?$/i;
const ENDSCRIPT_AT_REGEX = /^\s*@endscript(\s.*)?$/i;
const HAS_ISCRIPT_REGEX = /\[iscript[\s\]]|@iscript(?:\s|$)/i;

function hasScriptBlocksInText(text: string): boolean {
  return HAS_ISCRIPT_REGEX.test(text);
}

interface TextScriptBlock {
  contentStartLine: number;
  contentEndLine: number;
}

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

/**
 * .ksファイルからJSブロックを検索する（再帰的）
 */
function findKsFiles(dirPath: string): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        results.push(...findKsFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".ks")) {
        results.push(fullPath);
      }
    }
  } catch {
    // ディレクトリ読み込みエラーは無視
  }
  return results;
}

export class CrossFileContextManager {
  /** ファイルパス → そのファイルの JS ブロック内容 */
  private fileJsCache = new Map<string, string>();

  /** getOtherFilesContent の結果キャッシュ */
  private otherContentCache = new Map<string, string>();

  /** 変更通知用コールバック */
  private changeCallbacks: (() => void)[] = [];

  /** デバウンス用タイマー */
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly DEBOUNCE_MS = 300;

  public onDidChange(callback: () => void): void {
    this.changeCallbacks.push(callback);
  }

  /**
   * 初期化: data/ 配下の .ks ファイルをスキャンしてキャッシュを構築する
   */
  async init(dataDirectories: string[]): Promise<void> {
    for (const dataDir of dataDirectories) {
      const ksFiles = findKsFiles(dataDir);
      for (const filePath of ksFiles) {
        this.loadFileFromDisk(filePath);
      }
    }
  }

  /**
   * ディスクからファイルを読み込みキャッシュに格納
   */
  public loadFileFromDisk(filePath: string): void {
    try {
      const text = fs.readFileSync(filePath, "utf-8");
      if (hasScriptBlocksInText(text)) {
        const js = extractJavaScriptFromText(text);
        if (js.length > 0) {
          this.fileJsCache.set(filePath, js);
        } else {
          this.fileJsCache.delete(filePath);
        }
      } else {
        this.fileJsCache.delete(filePath);
      }
      this.otherContentCache.clear();
    } catch {
      this.fileJsCache.delete(filePath);
      this.otherContentCache.clear();
    }
  }

  /**
   * テキスト内容から直接キャッシュを更新する（didChange通知で使用）
   */
  updateFromText(filePath: string, text: string): void {
    if (hasScriptBlocksInText(text)) {
      const js = extractJavaScriptFromText(text);
      if (js.length > 0) {
        this.fileJsCache.set(filePath, js);
      } else {
        this.fileJsCache.delete(filePath);
      }
    } else {
      this.fileJsCache.delete(filePath);
    }
    this.otherContentCache.clear();
  }

  /**
   * ファイル削除時のキャッシュクリア
   */
  removeFile(filePath: string): void {
    this.fileJsCache.delete(filePath);
    this.otherContentCache.clear();
    this.fireChangeDebounced();
  }

  /**
   * 指定ファイルを除く、他の全ファイルの JS コンテンツを結合して返す。
   */
  getOtherFilesContent(excludePath: string): string {
    const cached = this.otherContentCache.get(excludePath);
    if (cached !== undefined) {
      return cached;
    }
    const parts: string[] = [];
    for (const [filePath, js] of this.fileJsCache) {
      if (filePath !== excludePath && js.length > 0) {
        parts.push(js);
      }
    }
    const result = parts.join("\n");
    this.otherContentCache.set(excludePath, result);
    return result;
  }

  get cachedFileCount(): number {
    return this.fileJsCache.size;
  }

  private fireChangeDebounced(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      for (const callback of this.changeCallbacks) {
        callback();
      }
      this.debounceTimer = undefined;
    }, this.DEBOUNCE_MS);
  }

  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.fileJsCache.clear();
    this.otherContentCache.clear();
    this.changeCallbacks = [];
  }
}
