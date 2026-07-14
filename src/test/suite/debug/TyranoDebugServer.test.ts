/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import { TyranoDebugServer } from "../../../debug/TyranoDebugServer";

const WS_PORT = 12345;

/** コンストラクタはフィールドを保存するだけなのでサーバー起動は不要 */
const createServer = () =>
  new TyranoDebugServer("/dummy/project", WS_PORT, "/dummy/extension");

suite("TyranoDebugServer.injectDebugBridge", () => {
  // 注: JSDocには「</head>の直前に挿入」とあるが、実装は</body>の直前に
  // 挿入する（ゲームの初期化後にフックするため）。ここでは実装の挙動を固定する。
  test("正常系 </body>の直前にブリッジスクリプトが挿入される", () => {
    const server = createServer();
    const html = "<html><head></head><body><p>game</p></body></html>";

    const result = (server as any).injectDebugBridge(html);

    const bodyCloseIndex = result.indexOf("</body>");
    const scriptIndex = result.indexOf("tyrano_debug_bridge.js");
    assert.ok(scriptIndex >= 0, "ブリッジスクリプトが挿入されるべき");
    assert.ok(
      scriptIndex < bodyCloseIndex,
      "スクリプトは</body>より前に挿入されるべき",
    );
    assert.ok(
      result.includes("<p>game</p>"),
      "元のコンテンツは保持されるべき",
    );
  });

  test("正常系 WSポート番号がグローバル変数として埋め込まれる", () => {
    const server = createServer();
    const html = "<html><body></body></html>";

    const result = (server as any).injectDebugBridge(html);

    assert.ok(
      result.includes(`window.__TYRANO_DEBUG_WS_PORT__ = ${WS_PORT};`),
      "WSポートが埋め込まれるべき",
    );
    assert.ok(
      result.includes('src="/tyrano_debug_bridge.js"'),
      "ブリッジスクリプトのsrcが含まれるべき",
    );
  });

  test("正常系 </body>が無いHTMLでは末尾に追加される", () => {
    const server = createServer();
    const html = "<p>fragment without body</p>";

    const result = (server as any).injectDebugBridge(html);

    assert.ok(
      result.startsWith("<p>fragment without body</p>"),
      "元のコンテンツが先頭に保持されるべき",
    );
    assert.ok(
      result.includes("tyrano_debug_bridge.js"),
      "スクリプトが末尾に追加されるべき",
    );
  });

  test("正常系 空のHTMLでもスクリプトが追加される", () => {
    const server = createServer();

    const result = (server as any).injectDebugBridge("");

    assert.ok(result.includes(`window.__TYRANO_DEBUG_WS_PORT__ = ${WS_PORT};`));
  });
});

suite("TyranoDebugServer.stop", () => {
  test("正常系 未起動のサーバーをstopしても例外にならない", () => {
    const server = createServer();
    server.stop();
    server.stop(); // 二重stopも安全
  });
});
