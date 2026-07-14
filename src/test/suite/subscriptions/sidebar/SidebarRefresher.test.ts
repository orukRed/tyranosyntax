/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import { SidebarRefresher } from "../../../../subscriptions/sidebar/SidebarRefresher";

const DEBOUNCE_MS = 20;

/** debounce時間 + マージンだけ待つ */
const waitForDebounce = () =>
  new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS * 3));

/** 呼び出しを記録するフェイクを組み立てる */
const createFakes = () => {
  const invalidated: string[] = [];
  let invalidateAllCount = 0;
  const indexer = {
    invalidate: (filePath: string) => invalidated.push(filePath),
    invalidateAll: () => invalidateAllCount++,
  } as any;
  const refreshCounts = [0, 0];
  const providers = [
    { refresh: () => refreshCounts[0]++ },
    { refresh: () => refreshCounts[1]++ },
  ] as any[];
  return {
    indexer,
    providers,
    invalidated,
    refreshCounts,
    getInvalidateAllCount: () => invalidateAllCount,
  };
};

suite("SidebarRefresher.scheduleRefresh", () => {
  test("正常系 invalidateは同期実行され、refreshはdebounce後に実行される", async () => {
    const fakes = createFakes();
    const refresher = new SidebarRefresher(
      fakes.indexer,
      fakes.providers,
      DEBOUNCE_MS,
    );
    try {
      refresher.scheduleRefresh("/proj/data/scenario/a.ks");

      // invalidateは即時、refreshはまだ
      assert.deepStrictEqual(fakes.invalidated, ["/proj/data/scenario/a.ks"]);
      assert.deepStrictEqual(fakes.refreshCounts, [0, 0]);

      await waitForDebounce();

      assert.deepStrictEqual(
        fakes.refreshCounts,
        [1, 1],
        "debounce後に全Providerがrefreshされるべき",
      );
    } finally {
      refresher.dispose();
    }
  });

  test("正常系 連続呼び出しはdebounceで1回のrefreshにまとめられる", async () => {
    const fakes = createFakes();
    const refresher = new SidebarRefresher(
      fakes.indexer,
      fakes.providers,
      DEBOUNCE_MS,
    );
    try {
      refresher.scheduleRefresh("/proj/a.ks");
      refresher.scheduleRefresh("/proj/b.ks");
      refresher.scheduleRefresh("/proj/c.ks");

      // invalidateはファイルごとに呼ばれる
      assert.deepStrictEqual(fakes.invalidated, [
        "/proj/a.ks",
        "/proj/b.ks",
        "/proj/c.ks",
      ]);

      await waitForDebounce();

      assert.deepStrictEqual(
        fakes.refreshCounts,
        [1, 1],
        "refreshは1回にまとめられるべき",
      );
    } finally {
      refresher.dispose();
    }
  });
});

suite("SidebarRefresher.refreshAll", () => {
  test("正常系 invalidateAllと全Providerの即時refreshが実行される", () => {
    const fakes = createFakes();
    const refresher = new SidebarRefresher(
      fakes.indexer,
      fakes.providers,
      DEBOUNCE_MS,
    );
    try {
      refresher.refreshAll();

      assert.strictEqual(fakes.getInvalidateAllCount(), 1);
      assert.deepStrictEqual(
        fakes.refreshCounts,
        [1, 1],
        "待ち時間なしで即時refreshされるべき",
      );
    } finally {
      refresher.dispose();
    }
  });

  test("正常系 ペンディング中のdebounceタイマーはキャンセルされ二重発火しない", async () => {
    const fakes = createFakes();
    const refresher = new SidebarRefresher(
      fakes.indexer,
      fakes.providers,
      DEBOUNCE_MS,
    );
    try {
      refresher.scheduleRefresh("/proj/a.ks");
      refresher.refreshAll(); // ペンディングをキャンセルして即時refresh

      assert.deepStrictEqual(fakes.refreshCounts, [1, 1]);

      await waitForDebounce();

      assert.deepStrictEqual(
        fakes.refreshCounts,
        [1, 1],
        "キャンセル済みのdebounceが後から発火しないべき",
      );
    } finally {
      refresher.dispose();
    }
  });
});

suite("SidebarRefresher.dispose", () => {
  test("正常系 dispose後はペンディング中のrefreshが発火しない", async () => {
    const fakes = createFakes();
    const refresher = new SidebarRefresher(
      fakes.indexer,
      fakes.providers,
      DEBOUNCE_MS,
    );

    refresher.scheduleRefresh("/proj/a.ks");
    refresher.dispose();

    await waitForDebounce();

    assert.deepStrictEqual(
      fakes.refreshCounts,
      [0, 0],
      "dispose後にrefreshは発火しないべき",
    );
  });

  test("正常系 タイマーが無い状態でdisposeしても例外にならない", () => {
    const fakes = createFakes();
    const refresher = new SidebarRefresher(
      fakes.indexer,
      fakes.providers,
      DEBOUNCE_MS,
    );
    refresher.dispose();
    refresher.dispose(); // 二重disposeも安全
  });
});
