/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from "events";
import WebSocket from "ws";
import { IncomingMessage } from "http";

export interface TyranoBreakpoint {
  id: number;
  file: string;
  line: number;
  verified: boolean;
}

export interface TyranoVariable {
  name: string;
  value: string;
  type: string;
}

export interface TyranoStackFrame {
  name: string;
  file: string;
  line: number;
  index: number;
}

/**
 * デバッグブリッジ（ゲーム内注入スクリプト）との WebSocket 通信を管理するランタイムクラス。
 * EventEmitter パターンで DAP セッションにイベントを通知する。
 */
export class TyranoDebugRuntime extends EventEmitter {
  private wss:
    | WebSocket.Server<typeof WebSocket, typeof IncomingMessage>
    | undefined;
  private client: WebSocket | undefined;
  private breakpointId = 1;
  private pendingRequests = new Map<
    number,
    { resolve: (data: any) => void; reject: (err: Error) => void }
  >();
  private requestId = 0;

  /**
   * WebSocket サーバーを起動してブリッジからの接続を待ち受ける
   */
  public start(wsPort: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocket.Server({ port: wsPort });
        this.wss.on("connection", (ws) => {
          this.client = ws;
          ws.on("message", (data) => {
            this.handleMessage(data.toString());
          });
          ws.on("close", () => {
            // 新しいクライアントが既に接続済みの場合は上書きしない
            if (this.client === ws) {
              this.client = undefined;
            }
          });
          this.emit("connected");
        });
        this.wss.on("listening", () => {
          resolve();
        });
        this.wss.on("error", (err) => {
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * WebSocket サーバーを停止する
   */
  public stop(): void {
    if (this.client) {
      this.client.close();
      this.client = undefined;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = undefined;
    }
    this.pendingRequests.forEach((p) => p.reject(new Error("Runtime stopped")));
    this.pendingRequests.clear();
  }

  /**
   * ブリッジに接続済みか
   */
  public get isConnected(): boolean {
    return (
      this.client !== undefined && this.client.readyState === WebSocket.OPEN
    );
  }

  // ── Adapter → Bridge コマンド ──

  public setBreakpoints(file: string, lines: number[]): TyranoBreakpoint[] {
    const breakpoints: TyranoBreakpoint[] = lines.map((line) => ({
      id: this.breakpointId++,
      file,
      line,
      verified: true,
    }));
    this.send({ type: "setBreakpoints", data: { file, lines } });
    return breakpoints;
  }

  public resume(): void {
    this.send({ type: "resume" });
  }

  public stepOver(): void {
    this.send({ type: "stepOver" });
  }

  public stepIn(): void {
    this.send({ type: "stepIn" });
  }

  public stepOut(): void {
    this.send({ type: "stepOut" });
  }

  public pause(): void {
    this.send({ type: "pause" });
  }

  /**
   * ブリッジから変数一覧を取得する（リクエスト/レスポンス方式）
   */
  public getVariables(scope: string): Promise<TyranoVariable[]> {
    return this.sendRequest("getVariables", { scope });
  }

  /**
   * ブリッジからコールスタックを取得する
   */
  public getCallStack(): Promise<TyranoStackFrame[]> {
    return this.sendRequest("getCallStack", {});
  }

  /**
   * ブリッジで式を評価する
   */
  public evaluate(expression: string): Promise<{ value: string }> {
    return this.sendRequest("evaluate", { expression });
  }

  // ── 内部メソッド ──

  private send(msg: any): void {
    if (this.client && this.client.readyState === WebSocket.OPEN) {
      this.client.send(JSON.stringify(msg));
    }
  }

  private sendRequest(type: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pendingRequests.set(id, { resolve, reject });
      this.send({ type, data, requestId: id });
      // 5秒タイムアウト
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request ${type} timed out`));
        }
      }, 5000);
    });
  }

  /**
   * ブリッジからのメッセージを処理する
   */
  private handleMessage(raw: string): void {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    // リクエスト/レスポンスの応答
    if (msg.requestId && this.pendingRequests.has(msg.requestId)) {
      const pending = this.pendingRequests.get(msg.requestId)!;
      this.pendingRequests.delete(msg.requestId);
      pending.resolve(msg.data);
      return;
    }

    switch (msg.type) {
      case "stopped":
        this.emit("stopped", msg.data);
        break;
      case "output":
        this.emit("output", msg.data);
        break;
      case "terminated":
        this.emit("terminated");
        break;
    }
  }
}
