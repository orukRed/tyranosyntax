/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DebugSession,
  InitializedEvent,
  TerminatedEvent,
  StoppedEvent,
  OutputEvent,
  Thread,
  StackFrame,
  Source,
  Scope,
  Variable,
  Breakpoint,
} from "@vscode/debugadapter";
import { DebugProtocol } from "@vscode/debugprotocol";
import { TyranoDebugRuntime } from "./TyranoDebugRuntime";
import { TyranoDebugServer } from "./TyranoDebugServer";
import { Parser } from "../Parser";
import * as path from "path";
import * as fs from "fs";
import open from "open";

const THREAD_ID = 1;

interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
  projectRoot?: string;
  scenario?: string;
  httpPort?: number;
  wsPort?: number;
}

/**
 * TyranoScript 用 Debug Adapter Protocol セッション。
 * VS Code の DAP クライアントと通信し、ゲームのデバッグを制御する。
 */
export class TyranoDebugSession extends DebugSession {
  private runtime: TyranoDebugRuntime;
  private server: TyranoDebugServer | undefined;
  private projectRoot = "";
  private extensionPath = "";
  private parser: Parser;
  private breakpointMap = new Map<string, DebugProtocol.Breakpoint[]>();
  private browserProcess: any;

  // スコープ参照ID
  private static SCOPE_F = 1;
  private static SCOPE_SF = 2;
  private static SCOPE_TF = 3;
  private static SCOPE_MP = 4;

  public constructor(extensionPath: string) {
    super();
    this.extensionPath = extensionPath;
    this.runtime = new TyranoDebugRuntime();
    this.parser = Parser.getInstance();

    // ランタイムイベントを DAP イベントに変換
    this.runtime.on("stopped", (data: any) => {
      this.sendEvent(new StoppedEvent(data.reason, THREAD_ID));
    });
    this.runtime.on("output", (data: any) => {
      this.sendEvent(
        new OutputEvent(data.text + "\n", data.category || "console"),
      );
    });
    this.runtime.on("terminated", () => {
      this.sendEvent(new TerminatedEvent());
    });
  }

  /**
   * DAP: initialize — デバッグアダプターの機能を宣言
   */
  protected initializeRequest(
    response: DebugProtocol.InitializeResponse,
    _args: DebugProtocol.InitializeRequestArguments,
  ): void {
    response.body = response.body || {};
    response.body.supportsConfigurationDoneRequest = true;
    response.body.supportsBreakpointLocationsRequest = false;
    response.body.supportsFunctionBreakpoints = false;
    response.body.supportsConditionalBreakpoints = false;
    response.body.supportsEvaluateForHovers = true;
    response.body.supportsStepBack = false;
    response.body.supportsSetVariable = false;
    response.body.supportsRestartRequest = false;
    response.body.supportsModulesRequest = false;

    this.sendResponse(response);
    this.sendEvent(new InitializedEvent());
  }

  /**
   * DAP: launch — ゲームを起動しデバッグ開始
   */
  protected async launchRequest(
    response: DebugProtocol.LaunchResponse,
    args: LaunchRequestArguments,
  ): Promise<void> {
    this.projectRoot = args.projectRoot || "";
    const httpPort = args.httpPort || 3300;
    const wsPort = args.wsPort || 8200;

    try {
      // WebSocket サーバー起動
      await this.runtime.start(wsPort);

      // ブリッジ再接続時にブレークポイントを再同期する（ブラウザリロード対応）
      this.runtime.on("connected", () => {
        this.syncBreakpointsToRuntime();
      });

      // HTTP サーバー起動
      this.server = new TyranoDebugServer(
        this.projectRoot,
        wsPort,
        this.extensionPath,
      );
      const url = await this.server.start(httpPort);

      this.sendEvent(
        new OutputEvent(`Debug server started: ${url}\n`, "console"),
      );

      // ブラウザでゲームを起動
      this.browserProcess = await open(url);

      this.sendResponse(response);
    } catch (err: any) {
      this.sendErrorResponse(response, 1, `Failed to launch: ${err.message}`);
    }
  }

  /**
   * DAP: configurationDone — ブレークポイント等の設定完了通知
   */
  protected configurationDoneRequest(
    response: DebugProtocol.ConfigurationDoneResponse,
    _args: DebugProtocol.ConfigurationDoneArguments,
  ): void {
    // ブリッジが接続されるまで待ち、接続後に resume を送信して実行開始
    if (this.runtime.isConnected) {
      this.runtime.resume();
    } else {
      this.runtime.once("connected", () => {
        // ブレークポイント同期は launchRequest で登録した persistent listener が処理する
        this.runtime.resume();
      });
    }
    this.sendResponse(response);
  }

  /**
   * DAP: setBreakPoints — ブレークポイントの設定
   */
  protected setBreakPointsRequest(
    response: DebugProtocol.SetBreakpointsResponse,
    args: DebugProtocol.SetBreakpointsArguments,
  ): void {
    const sourcePath = args.source.path || "";
    const requestedLines = args.breakpoints?.map((bp) => bp.line) || [];

    // Parser で有効な行か検証
    // DAP は 1-based、Parser/Bridge は 0-based なので変換が必要
    let validLines0 = requestedLines.map((l) => l - 1); // 0-based に変換
    try {
      const text = fs.readFileSync(sourcePath, "utf-8");
      const validBreakpointLines = this.parser.getValidBreakpointLines(text); // 0-based
      validLines0 = validLines0.map((line) => {
        // 要求された行が有効な行に含まれていればそのまま、なければ最も近い有効行を使用
        if (validBreakpointLines.includes(line)) {
          return line;
        }
        // 近い有効行を探す
        if (validBreakpointLines.length === 0) return line;
        const closest = validBreakpointLines.reduce(
          (prev, curr) =>
            Math.abs(curr - line) < Math.abs(prev - line) ? curr : prev,
          validBreakpointLines[0],
        );
        return closest;
      });
    } catch {
      // ファイル読み込みに失敗した場合はそのまま使用
    }

    // シナリオファイルの相対パスを計算（ゲーム内での参照用）
    const scenarioRelativePath = this.getScenarioRelativePath(sourcePath);

    // DAP 応答は 1-based に戻す
    const breakpoints: DebugProtocol.Breakpoint[] = validLines0.map(
      (line, i) => {
        const bp = new Breakpoint(true, line + 1); // 1-based
        bp.setId(i);
        return bp;
      },
    );

    this.breakpointMap.set(scenarioRelativePath, breakpoints);

    // ブリッジに送信（0-based）
    if (this.runtime.isConnected) {
      this.runtime.setBreakpoints(scenarioRelativePath, validLines0);
    }

    response.body = { breakpoints };
    this.sendResponse(response);
  }

  /**
   * DAP: threads — スレッド一覧（TyranoScript はシングルスレッド）
   */
  protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
    response.body = {
      threads: [new Thread(THREAD_ID, "TyranoScript Main")],
    };
    this.sendResponse(response);
  }

  /**
   * DAP: stackTrace — コールスタック取得
   */
  protected async stackTraceRequest(
    response: DebugProtocol.StackTraceResponse,
    _args: DebugProtocol.StackTraceArguments,
  ): Promise<void> {
    try {
      const result = await this.runtime.getCallStack();
      // Bridge は配列または { frames: [...] } で返す場合がある
      const frames = Array.isArray(result)
        ? result
        : (result as any).frames || [];
      const stackFrames: StackFrame[] = frames.map((frame: any, i: number) => {
        const source = new Source(
          path.basename(frame.file),
          this.resolveScenarioPath(frame.file),
        );
        return new StackFrame(i, frame.name, source, (frame.line || 0) + 1); // 0-based → 1-based
      });

      response.body = {
        stackFrames,
        totalFrames: stackFrames.length,
      };
    } catch {
      response.body = {
        stackFrames: [],
        totalFrames: 0,
      };
    }
    this.sendResponse(response);
  }

  /**
   * DAP: scopes — 変数スコープ一覧
   */
  protected scopesRequest(
    response: DebugProtocol.ScopesResponse,
    _args: DebugProtocol.ScopesArguments,
  ): void {
    response.body = {
      scopes: [
        new Scope("Game Variables (f)", TyranoDebugSession.SCOPE_F, false),
        new Scope("System Variables (sf)", TyranoDebugSession.SCOPE_SF, false),
        new Scope(
          "Temporary Variables (tf)",
          TyranoDebugSession.SCOPE_TF,
          false,
        ),
        new Scope("Macro Parameters (mp)", TyranoDebugSession.SCOPE_MP, false),
      ],
    };
    this.sendResponse(response);
  }

  /**
   * DAP: variables — 変数一覧取得
   */
  protected async variablesRequest(
    response: DebugProtocol.VariablesResponse,
    args: DebugProtocol.VariablesArguments,
  ): Promise<void> {
    const scopeMap: Record<number, string> = {
      [TyranoDebugSession.SCOPE_F]: "f",
      [TyranoDebugSession.SCOPE_SF]: "sf",
      [TyranoDebugSession.SCOPE_TF]: "tf",
      [TyranoDebugSession.SCOPE_MP]: "mp",
    };

    const scopeName = scopeMap[args.variablesReference];
    if (!scopeName) {
      response.body = { variables: [] };
      this.sendResponse(response);
      return;
    }

    try {
      const vars = await this.runtime.getVariables(scopeName);
      const variables: Variable[] = vars.map(
        (v) => new Variable(v.name, String(v.value), 0),
      );
      response.body = { variables };
    } catch {
      response.body = { variables: [] };
    }
    this.sendResponse(response);
  }

  /**
   * DAP: evaluate — ウォッチ式・ホバー評価
   * "f.hoge" や "sf.flag" のようなTyranoScript変数式を評価する。
   */
  protected async evaluateRequest(
    response: DebugProtocol.EvaluateResponse,
    args: DebugProtocol.EvaluateArguments,
  ): Promise<void> {
    try {
      const result = await this.runtime.evaluate(args.expression);
      response.body = {
        result: result.value,
        variablesReference: 0,
      };
    } catch {
      response.body = {
        result: "<unavailable>",
        variablesReference: 0,
      };
    }
    this.sendResponse(response);
  }

  /**
   * DAP: continue — 実行再開
   */
  protected continueRequest(
    response: DebugProtocol.ContinueResponse,
    _args: DebugProtocol.ContinueArguments,
  ): void {
    this.runtime.resume();
    this.sendResponse(response);
  }

  /**
   * DAP: next — ステップオーバー
   */
  protected nextRequest(
    response: DebugProtocol.NextResponse,
    _args: DebugProtocol.NextArguments,
  ): void {
    this.runtime.stepOver();
    this.sendResponse(response);
  }

  /**
   * DAP: stepIn — ステップイン（マクロ内部に入る）
   */
  protected stepInRequest(
    response: DebugProtocol.StepInResponse,
    _args: DebugProtocol.StepInArguments,
  ): void {
    this.runtime.stepIn();
    this.sendResponse(response);
  }

  /**
   * DAP: stepOut — ステップアウト（マクロから出る）
   */
  protected stepOutRequest(
    response: DebugProtocol.StepOutResponse,
    _args: DebugProtocol.StepOutArguments,
  ): void {
    this.runtime.stepOut();
    this.sendResponse(response);
  }

  /**
   * DAP: pause — 実行一時停止
   */
  protected pauseRequest(
    response: DebugProtocol.PauseResponse,
    _args: DebugProtocol.PauseArguments,
  ): void {
    this.runtime.pause();
    this.sendResponse(response);
  }

  /**
   * DAP: disconnect — デバッグ終了
   */
  protected disconnectRequest(
    response: DebugProtocol.DisconnectResponse,
    _args: DebugProtocol.DisconnectArguments,
  ): void {
    this.runtime.stop();
    if (this.server) {
      this.server.stop();
      this.server = undefined;
    }
    this.sendResponse(response);
  }

  /**
   * breakpointMap の内容をすべてブリッジに再送信する。
   * ブラウザリロード等で新しいブリッジが接続した際に、
   * 最新のブレークポイント状態を同期するために使用する。
   */
  private syncBreakpointsToRuntime(): void {
    for (const [file, bps] of this.breakpointMap) {
      const lines = bps.map((bp) => bp.line! - 1); // 1-based → 0-based
      this.runtime.setBreakpoints(file, lines);
    }
  }

  // ── ユーティリティ ──

  /**
   * ファイルシステムのパスからシナリオの相対パスを取得
   * 例: C:\project\data\scenario\first.ks → first.ks
   */
  private getScenarioRelativePath(absolutePath: string): string {
    const scenarioDir = path.join(this.projectRoot, "data", "scenario");
    const relative = path.relative(scenarioDir, absolutePath);
    return relative.replace(/\\/g, "/");
  }

  /**
   * シナリオの相対パスからファイルシステムの絶対パスを解決
   */
  private resolveScenarioPath(scenarioRelative: string): string {
    return path.join(this.projectRoot, "data", "scenario", scenarioRelative);
  }
}
