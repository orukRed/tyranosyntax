/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Application } from "express";
import { Server } from "http";
import * as fs from "fs";
import * as path from "path";

/**
 * デバッグ用 HTTP サーバー。
 * TyranoScript プロジェクトの静的ファイルを配信し、
 * index.html に debugBridge.js を自動注入する。
 */
export class TyranoDebugServer {
  private app: Application | undefined;
  private server: Server | undefined;
  private projectRoot: string;
  private wsPort: number;
  private extensionPath: string;

  constructor(projectRoot: string, wsPort: number, extensionPath: string) {
    this.projectRoot = projectRoot;
    this.wsPort = wsPort;
    this.extensionPath = extensionPath;
  }

  /**
   * HTTP サーバーを起動する
   */
  public start(httpPort: number): Promise<string> {
    return new Promise((resolve, reject) => {
      this.app = express();

      // index.html はデバッグブリッジスクリプトを注入して配信
      this.app.get("/", (_req, res) => {
        const indexPath = path.join(this.projectRoot, "index.html");
        try {
          let html = fs.readFileSync(indexPath, "utf-8");
          html = this.injectDebugBridge(html);
          res.type("html").send(html);
        } catch (_err) {
          res.status(500).send("Failed to load index.html");
        }
      });

      // index.html 以外のルートアクセス（index.html直接指定にも対応）
      this.app.get("/index.html", (_req, res) => {
        const indexPath = path.join(this.projectRoot, "index.html");
        try {
          let html = fs.readFileSync(indexPath, "utf-8");
          html = this.injectDebugBridge(html);
          res.type("html").send(html);
        } catch (_err) {
          res.status(500).send("Failed to load index.html");
        }
      });

      // debugBridge.js をバンドルから配信
      this.app.get("/tyrano_debug_bridge.js", (_req, res) => {
        const bridgePath = path.join(
          this.extensionPath,
          "out",
          "debug",
          "debugBridge.js",
        );
        try {
          const script = fs.readFileSync(bridgePath, "utf-8");
          res.type("application/javascript").send(script);
        } catch (_err) {
          res.status(500).send("Failed to load debug bridge script");
        }
      });

      // 残りは全て静的ファイルとして配信
      this.app.use(express.static(this.projectRoot));

      this.server = this.app.listen(httpPort, () => {
        const url = `http://localhost:${httpPort}`;
        resolve(url);
      });

      this.server.on("error", (err) => {
        reject(err);
      });
    });
  }

  /**
   * HTTP サーバーを停止する
   */
  public stop(): void {
    if (this.server) {
      this.server.close();
      this.server = undefined;
    }
    this.app = undefined;
  }

  /**
   * index.html に debugBridge.js の <script> タグを注入する。
   * </head> の直前に挿入する。
   */
  private injectDebugBridge(html: string): string {
    const bridgeScript = `<script>window.__TYRANO_DEBUG_WS_PORT__ = ${this.wsPort};</script>\n<script src="/tyrano_debug_bridge.js"></script>`;

    // </body> の直前に挿入（ゲームの初期化後にフックするため）
    if (html.includes("</body>")) {
      return html.replace("</body>", `${bridgeScript}\n</body>`);
    }
    // </body> がなければ末尾に追加
    return html + `\n${bridgeScript}`;
  }
}
