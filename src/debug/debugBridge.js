/**
 * TyranoScript Debug Bridge
 *
 * ゲームの index.html に注入され、TyranoScript ランタイム (ftag.nextOrder) をフックして
 * VS Code デバッグアダプターと WebSocket 経由で通信するスクリプト。
 *
 * グローバル変数 window.__TYRANO_DEBUG_WS_PORT__ にポート番号が設定されている前提。
 */
/* eslint-disable no-undef, @typescript-eslint/no-unused-vars */
(function () {
  "use strict";

  var wsPort = window.__TYRANO_DEBUG_WS_PORT__ || 8200;
  var ws = null;
  var connected = false;

  // ── 状態管理 ──
  var breakpoints = {}; // { "file.ks": Set<lineNumber> }
  var paused = false;
  var stepping = null; // null | "stepOver" | "stepIn" | "stepOut"
  var stepStartDepth = 0; // ステップ開始時のマクロスタック深度
  var pendingResume = null; // 一時停止中の実行再開用コールバック
  var initialized = false; // TYRANO.kag が利用可能になったか
  var waitingForInit = true; // 初期化待ち

  // ── WebSocket 接続 ──
  function connect() {
    try {
      ws = new WebSocket("ws://localhost:" + wsPort);
    } catch (e) {
      setTimeout(connect, 1000);
      return;
    }

    ws.onopen = function () {
      connected = true;
      console.log("[TyranoDebug] Connected to debug adapter");
    };

    ws.onclose = function () {
      connected = false;
      // 一時停止中なら再開して切断
      if (pendingResume) {
        var fn = pendingResume;
        pendingResume = null;
        paused = false;
        fn();
      }
      // 再接続を試みる
      setTimeout(connect, 2000);
    };

    ws.onmessage = function (event) {
      var msg;
      try {
        msg = JSON.parse(event.data);
      } catch (e) {
        return;
      }
      handleMessage(msg);
    };
  }

  // ── メッセージ処理 ──
  function handleMessage(msg) {
    switch (msg.type) {
      case "setBreakpoints":
        setBreakpoints(msg.data.file, msg.data.lines);
        break;
      case "resume":
        resumeExecution();
        break;
      case "stepOver":
        stepExecution("stepOver");
        break;
      case "stepIn":
        stepExecution("stepIn");
        break;
      case "stepOut":
        stepExecution("stepOut");
        break;
      case "pause":
        paused = true;
        stepping = null;
        break;
      case "getVariables":
        sendVariables(msg.data.scope, msg.requestId);
        break;
      case "getCallStack":
        sendCallStack(msg.requestId);
        break;
    }
  }

  // ── ブレークポイント管理 ──
  function setBreakpoints(file, lines) {
    var lineSet = {};
    for (var i = 0; i < lines.length; i++) {
      lineSet[lines[i]] = true;
    }
    breakpoints[file] = lineSet;
  }

  function isBreakpoint(file, line) {
    return breakpoints[file] && breakpoints[file][line] === true;
  }

  // ── 実行制御 ──
  function resumeExecution() {
    paused = false;
    stepping = null;
    if (pendingResume) {
      var fn = pendingResume;
      pendingResume = null;
      fn();
    }
  }

  function stepExecution(mode) {
    stepping = mode;
    paused = false;
    stepStartDepth = getMacroStackDepth();
    if (pendingResume) {
      var fn = pendingResume;
      pendingResume = null;
      fn();
    }
  }

  function getMacroStackDepth() {
    try {
      return TYRANO.kag.stat.stack.macro.length;
    } catch (e) {
      return 0;
    }
  }

  /**
   * 一時停止し、resume/step のコマンドが来るまでブロックする。
   * TyranoScript は非同期実行（タイマー/イベント駆動）のため、
   * nextOrder のコールバックチェーンを止めることで実現する。
   */
  function pauseAndWait(reason, file, line) {
    paused = true;

    // DAP に stopped イベント送信
    send({
      type: "stopped",
      data: {
        reason: reason,
        file: file,
        line: line,
      },
    });

    // nextOrder を返さないことで実行を一時停止。
    // resume/step 時に pendingResume を呼び出して元の nextOrder を再実行する。
    return true; // フックで nextOrder の実行をブロックしたことを示す
  }

  // ── 変数情報送信 ──
  function sendVariables(scope, requestId) {
    var vars = [];
    try {
      var obj = null;
      switch (scope) {
        case "f":
          obj = TYRANO.kag.stat.f;
          break;
        case "sf":
          obj = TYRANO.kag.variable.sf;
          break;
        case "tf":
          obj = TYRANO.kag.variable.tf;
          break;
        case "mp":
          obj = TYRANO.kag.stat.mp;
          break;
      }
      if (obj) {
        var keys = Object.keys(obj);
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          var val = obj[key];
          vars.push({
            name: key,
            value: formatValue(val),
            type: typeof val,
          });
        }
      }
    } catch (e) {
      // TYRANO が未初期化の場合は空配列を返す
    }
    send({ type: "variables", data: vars, requestId: requestId });
  }

  function formatValue(val) {
    if (val === null) return "null";
    if (val === undefined) return "undefined";
    if (typeof val === "object") {
      try {
        return JSON.stringify(val);
      } catch (e) {
        return "[Object]";
      }
    }
    return String(val);
  }

  // ── コールスタック送信 ──
  function sendCallStack(requestId) {
    var frames = [];
    try {
      var kag = TYRANO.kag;
      var currentFile = kag.stat.current_scenario || "unknown.ks";
      var currentLine = kag.stat.current_line || 0;
      var currentIndex = kag.ftag.current_order_index || 0;

      // 現在のタグ情報を取得
      var currentTag = null;
      if (kag.ftag.array_tag && kag.ftag.array_tag[currentIndex]) {
        currentTag = kag.ftag.array_tag[currentIndex];
        currentLine = currentTag.line || currentLine;
      }

      // 現在の実行位置をトップフレームとして追加
      frames.push({
        name: currentTag ? "[" + currentTag.name + "]" : "(current)",
        file: currentFile,
        line: currentLine,
        index: currentIndex,
      });

      // macro スタックを逆順に辿る
      var macroStack = kag.stat.stack.macro || [];
      for (var i = macroStack.length - 1; i >= 0; i--) {
        var entry = macroStack[i];
        if (entry) {
          frames.push({
            name: entry.name || "(macro)",
            file: entry.storage || currentFile,
            line: entry.line || 0,
            index: entry.index || 0,
          });
        }
      }

      // call スタックも辿る
      var callStack = kag.stat.stack.call || [];
      for (var j = callStack.length - 1; j >= 0; j--) {
        var callEntry = callStack[j];
        if (callEntry) {
          frames.push({
            name: "(call)",
            file: callEntry.storage || "unknown.ks",
            line: callEntry.line || 0,
            index: callEntry.index || 0,
          });
        }
      }
    } catch (e) {
      // TYRANO が未初期化の場合は空配列を返す
    }
    send({ type: "callStack", data: frames, requestId: requestId });
  }

  // ── WebSocket 送信 ──
  function send(msg) {
    if (ws && connected) {
      ws.send(JSON.stringify(msg));
    }
  }

  // ── nextOrder フック ──
  function hookNextOrder() {
    if (typeof TYRANO === "undefined" || !TYRANO.kag || !TYRANO.kag.ftag) {
      // TYRANO がまだ初期化されていない場合はリトライ
      setTimeout(hookNextOrder, 100);
      return;
    }

    var ftag = TYRANO.kag.ftag;
    var originalNextOrder = ftag.nextOrder.bind(ftag);
    initialized = true;
    waitingForInit = false;

    ftag.nextOrder = function () {
      if (!connected) {
        // デバッガー未接続時は通常実行
        return originalNextOrder();
      }

      var currentFile = TYRANO.kag.stat.current_scenario || "";
      var currentIndex = ftag.current_order_index + 1; // nextOrder は index++ してからタグを取得する
      var tag = null;
      var currentLine = 0;

      // 次に実行されるタグを先読み
      if (ftag.array_tag && ftag.array_tag.length > currentIndex) {
        tag = ftag.array_tag[currentIndex];
        currentLine = tag ? tag.line || 0 : 0;
      }

      // ── ブレークポイント判定 ──
      if (tag && isBreakpoint(currentFile, currentLine)) {
        // 元の nextOrder を実行（インデックスを進めてタグ情報を更新）
        // ただし、タグの start() 呼び出し前に一時停止したい
        // → nextOrder 自体の前で止め、resume 時に nextOrder を呼ぶ
        pendingResume = function () {
          originalNextOrder();
        };
        pauseAndWait("breakpoint", currentFile, currentLine);
        return false;
      }

      // ── ステップ実行判定 ──
      if (stepping && tag) {
        var currentDepth = getMacroStackDepth();
        var shouldStop = false;

        switch (stepping) {
          case "stepIn":
            // 次のタグで無条件停止
            shouldStop = true;
            break;
          case "stepOver":
            // マクロスタック深度が同じか浅い場合に停止
            shouldStop = currentDepth <= stepStartDepth;
            break;
          case "stepOut":
            // マクロスタック深度が1つ浅くなったら停止
            shouldStop = currentDepth < stepStartDepth;
            break;
        }

        if (shouldStop) {
          stepping = null;
          pendingResume = function () {
            originalNextOrder();
          };
          pauseAndWait("step", currentFile, currentLine);
          return false;
        }
      }

      // ── pause コマンド判定 ──
      if (paused && tag) {
        pendingResume = function () {
          originalNextOrder();
        };
        pauseAndWait("pause", currentFile, currentLine);
        return false;
      }

      // 通常実行
      return originalNextOrder();
    };

    console.log("[TyranoDebug] nextOrder hooked successfully");
  }

  // ── 初期化 ──
  connect();

  // DOM 読み込み完了後にフック（TYRANO の初期化を待つ）
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(hookNextOrder, 500);
    });
  } else {
    setTimeout(hookNextOrder, 500);
  }
})();
