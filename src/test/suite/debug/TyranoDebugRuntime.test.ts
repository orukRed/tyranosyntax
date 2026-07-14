/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import { TyranoDebugRuntime } from "../../../debug/TyranoDebugRuntime";

/**
 * WebSocketサーバーは起動せず、送信メッセージを記録するフェイククライアントを
 * 直接注入してプロトコルロジックのみを検証する。
 * readyState: 1 は WebSocket.OPEN。
 */
const createRuntimeWithFakeClient = () => {
  const runtime = new TyranoDebugRuntime();
  const sent: any[] = [];
  (runtime as any).client = {
    readyState: 1, // WebSocket.OPEN
    send: (raw: string) => sent.push(JSON.parse(raw)),
    close: () => {},
  };
  return { runtime, sent };
};

suite("TyranoDebugRuntime.setBreakpoints", () => {
  test("正常系 ブレークポイントにIDが振られverified=trueで返る", () => {
    const { runtime, sent } = createRuntimeWithFakeClient();

    const breakpoints = runtime.setBreakpoints("first.ks", [0, 5, 10]);

    assert.strictEqual(breakpoints.length, 3);
    for (const bp of breakpoints) {
      assert.strictEqual(bp.file, "first.ks");
      assert.strictEqual(bp.verified, true);
    }
    assert.deepStrictEqual(
      breakpoints.map((bp) => bp.line),
      [0, 5, 10],
    );
    // ブリッジへsetBreakpointsメッセージが送信される
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0], {
      type: "setBreakpoints",
      data: { file: "first.ks", lines: [0, 5, 10] },
    });
  });

  test("正常系 IDは呼び出しをまたいで増加する", () => {
    const { runtime } = createRuntimeWithFakeClient();

    const first = runtime.setBreakpoints("a.ks", [0]);
    const second = runtime.setBreakpoints("b.ks", [1]);

    assert.ok(
      second[0].id > first[0].id,
      `IDは増加するべき (first=${first[0].id}, second=${second[0].id})`,
    );
  });
});

suite("TyranoDebugRuntime.handleMessage", () => {
  test("正常系 stoppedメッセージでstoppedイベントがemitされる", () => {
    const { runtime } = createRuntimeWithFakeClient();
    const events: any[] = [];
    runtime.on("stopped", (data) => events.push(data));

    (runtime as any).handleMessage(
      JSON.stringify({ type: "stopped", data: { reason: "breakpoint" } }),
    );

    assert.strictEqual(events.length, 1);
    assert.deepStrictEqual(events[0], { reason: "breakpoint" });
  });

  test("正常系 outputメッセージでoutputイベントがemitされる", () => {
    const { runtime } = createRuntimeWithFakeClient();
    const events: any[] = [];
    runtime.on("output", (data) => events.push(data));

    (runtime as any).handleMessage(
      JSON.stringify({ type: "output", data: { text: "hello" } }),
    );

    assert.deepStrictEqual(events, [{ text: "hello" }]);
  });

  test("正常系 terminatedメッセージでterminatedイベントがemitされる", () => {
    const { runtime } = createRuntimeWithFakeClient();
    let count = 0;
    runtime.on("terminated", () => count++);

    (runtime as any).handleMessage(JSON.stringify({ type: "terminated" }));

    assert.strictEqual(count, 1);
  });

  test("異常系 不正なJSONは無視される（throwもemitもしない）", () => {
    const { runtime } = createRuntimeWithFakeClient();
    const events: any[] = [];
    runtime.on("stopped", (data) => events.push(data));
    runtime.on("output", (data) => events.push(data));
    runtime.on("terminated", () => events.push("terminated"));

    (runtime as any).handleMessage("{not valid json");

    assert.strictEqual(events.length, 0);
  });

  test("異常系 未知のtypeは無視される", () => {
    const { runtime } = createRuntimeWithFakeClient();
    const events: any[] = [];
    runtime.on("stopped", (data) => events.push(data));

    (runtime as any).handleMessage(JSON.stringify({ type: "unknownType" }));

    assert.strictEqual(events.length, 0);
  });
});

suite("TyranoDebugRuntime リクエスト/レスポンス相関", () => {
  test("正常系 requestIdが一致するレスポンスでpromiseが解決される", async () => {
    const { runtime, sent } = createRuntimeWithFakeClient();

    const promise = runtime.getVariables("f");

    // 送信されたリクエストからrequestIdを取り出し、対応するレスポンスを返す
    assert.strictEqual(sent.length, 1);
    assert.strictEqual(sent[0].type, "getVariables");
    assert.deepStrictEqual(sent[0].data, { scope: "f" });
    const requestId = sent[0].requestId;
    assert.ok(requestId, "リクエストにrequestIdが付与されるべき");

    const variables = [{ name: "f.hoge", value: "1", type: "number" }];
    (runtime as any).handleMessage(
      JSON.stringify({ requestId, data: variables }),
    );

    assert.deepStrictEqual(await promise, variables);
  });

  test("正常系 evaluateも同じ相関方式で解決される", async () => {
    const { runtime, sent } = createRuntimeWithFakeClient();

    const promise = runtime.evaluate("f.hoge + 1");

    const requestId = sent[0].requestId;
    (runtime as any).handleMessage(
      JSON.stringify({ requestId, data: { value: "2" } }),
    );

    assert.deepStrictEqual(await promise, { value: "2" });
  });

  test("異常系 requestIdが一致しないレスポンスでは解決されない", async () => {
    const { runtime, sent } = createRuntimeWithFakeClient();

    const promise = runtime.getVariables("sf");
    const requestId = sent[0].requestId;

    // 別のrequestIdのレスポンスを流す
    (runtime as any).handleMessage(
      JSON.stringify({ requestId: requestId + 999, data: [] }),
    );

    // まだpendingのまま（正しいレスポンスで解決できることを確認）
    (runtime as any).handleMessage(
      JSON.stringify({ requestId, data: [{ name: "sf.test" }] }),
    );
    assert.deepStrictEqual(await promise, [{ name: "sf.test" }]);
  });
});

suite("TyranoDebugRuntime.stop", () => {
  test("正常系 ペンディング中のリクエストはRuntime stoppedでrejectされる", async () => {
    const { runtime } = createRuntimeWithFakeClient();

    const promise = runtime.getVariables("f");
    runtime.stop();

    await assert.rejects(promise, /Runtime stopped/);
  });

  test("正常系 stop後はisConnectedがfalseになる", () => {
    const { runtime } = createRuntimeWithFakeClient();
    assert.strictEqual(runtime.isConnected, true);

    runtime.stop();

    assert.strictEqual(runtime.isConnected, false);
  });
});

suite("TyranoDebugRuntime.isConnected / send", () => {
  test("正常系 クライアント未接続ならisConnectedはfalse", () => {
    const runtime = new TyranoDebugRuntime();
    assert.strictEqual(runtime.isConnected, false);
  });

  test("正常系 クライアント未接続でもresume等のコマンドはthrowしない", () => {
    const runtime = new TyranoDebugRuntime();
    runtime.resume();
    runtime.stepOver();
    runtime.stepIn();
    runtime.stepOut();
    runtime.pause();
    runtime.hotReload();
  });
});
