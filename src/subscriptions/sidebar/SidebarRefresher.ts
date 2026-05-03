import { CharacterTreeProvider } from "./CharacterTreeProvider";
import { MacroTreeProvider } from "./MacroTreeProvider";
import { UsageIndexer } from "./UsageIndexer";
import { VariableTreeProvider } from "./VariableTreeProvider";

const DEFAULT_DEBOUNCE_MS = 300;

type AnyProvider = MacroTreeProvider | VariableTreeProvider | CharacterTreeProvider;

/**
 * 3 つのサイドバー TreeProvider をまとめてリフレッシュするためのヘルパ。
 * FileSystemWatcher の onDidCreate/Change/Delete から `scheduleRefresh()` を呼ぶ。
 */
export class SidebarRefresher {
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly indexer: UsageIndexer,
    private readonly providers: AnyProvider[],
    private readonly debounceMs: number = DEFAULT_DEBOUNCE_MS,
  ) {}

  /**
   * 単一ファイルの更新通知。debounce してから全 Provider の refresh を発火する。
   */
  public scheduleRefresh(filePath: string): void {
    this.indexer.invalidate(filePath);
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.refreshAllInternal();
    }, this.debounceMs);
  }

  /**
   * 即時に全 Provider をリフレッシュ（初期ロード完了後など）。
   */
  public refreshAll(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.indexer.invalidateAll();
    this.refreshAllInternal();
  }

  /**
   * 拡張機能 deactivate 時のクリーンアップ用。
   */
  public dispose(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  private refreshAllInternal(): void {
    for (const provider of this.providers) {
      provider.refresh();
    }
  }
}
