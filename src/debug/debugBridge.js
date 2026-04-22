/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-this-alias */
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
  var pausedFile = null; // 一時停止中のファイル名
  var pausedLine = 0; // 一時停止中の行番号

  // iscript 内部行デバッグ用の状態
  var currentIScriptContext = null; // { file: string, lines: number[] }
  var pendingIScriptResume = null; // iscript 内で await 停止中の resolve コールバック

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
      paused = false;
      pausedFile = null;
      pausedLine = 0;
      if (pendingIScriptResume) {
        var r = pendingIScriptResume;
        pendingIScriptResume = null;
        r();
      }
      if (pendingResume) {
        var fn = pendingResume;
        pendingResume = null;
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
      case "evaluate":
        evaluateExpression(msg.data.expression, msg.requestId);
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
    pausedFile = null;
    pausedLine = 0;
    if (pendingIScriptResume) {
      var r = pendingIScriptResume;
      pendingIScriptResume = null;
      r();
      return;
    }
    if (pendingResume) {
      var fn = pendingResume;
      pendingResume = null;
      fn();
    }
  }

  function stepExecution(mode) {
    stepping = mode;
    paused = false;
    pausedFile = null;
    pausedLine = 0;
    stepStartDepth = getMacroStackDepth();
    if (pendingIScriptResume) {
      var r = pendingIScriptResume;
      pendingIScriptResume = null;
      r();
      return;
    }
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
    pausedFile = file;
    pausedLine = line;

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

  // ── 式の評価 ──
  function evaluateExpression(expression, requestId) {
    var value = "<unavailable>";
    try {
      // "f.hoge", "sf.flag", "tf.tmp", "mp.name" 形式をサポート
      var match = expression.match(/^(f|sf|tf|mp)\.(.+)$/);
      if (match) {
        var scope = match[1];
        var key = match[2];
        var obj = null;
        switch (scope) {
          case "f": obj = TYRANO.kag.stat.f; break;
          case "sf": obj = TYRANO.kag.variable.sf; break;
          case "tf": obj = TYRANO.kag.variable.tf; break;
          case "mp": obj = TYRANO.kag.stat.mp; break;
        }
        if (obj && key in obj) {
          value = formatValue(obj[key]);
        }
      } else {
        // スコープ指定なしの場合は f → tf → sf → mp の順で検索
        var scopes = [
          TYRANO.kag.stat.f,
          TYRANO.kag.variable.tf,
          TYRANO.kag.variable.sf,
          TYRANO.kag.stat.mp
        ];
        for (var i = 0; i < scopes.length; i++) {
          if (scopes[i] && expression in scopes[i]) {
            value = formatValue(scopes[i][expression]);
            break;
          }
        }
      }
    } catch (e) {
      // 評価失敗
    }
    send({ type: "evaluate", data: { value: value }, requestId: requestId });
  }

  // ── コールスタック用ヘルパ ──

  // storage がアクティブシナリオと同じなら array_tag を返す。
  // call/macro スタックエントリは index のみ保持するため、index→(line, label) 解決に使う。
  function getArrayTagForStorage(kag, storage) {
    if (!kag || !kag.ftag || !kag.ftag.array_tag) return null;
    if (
      storage &&
      kag.stat &&
      kag.stat.current_scenario &&
      storage !== kag.stat.current_scenario
    ) {
      return null;
    }
    return kag.ftag.array_tag;
  }

  // array_tag を index から後方走査し、最も近い先行ラベル名 ("*label") を返す。
  function findNearestLabel(kag, storage, index) {
    var arr = getArrayTagForStorage(kag, storage);
    if (!arr) return null;
    var start = Math.min(index | 0, arr.length - 1);
    for (var i = start; i >= 0; i--) {
      var t = arr[i];
      if (t && t.name === "label") {
        var n = (t.pm && t.pm.label_name) || t.val;
        if (n) return "*" + n;
      }
    }
    return null;
  }

  // array_tag[index] のソース行番号 (0-based) を返す。
  // TyranoScript の call/macro スタックエントリには line がないため index 経由で解決する。
  function findLineByIndex(kag, storage, index) {
    var arr = getArrayTagForStorage(kag, storage);
    if (!arr) return 0;
    var t = arr[index | 0];
    return (t && t.line) || 0;
  }

  function basenameNoExt(file) {
    if (!file) return "(top)";
    var base = String(file).replace(/\\/g, "/").split("/").pop();
    return base.replace(/\.ks$/i, "");
  }

  // 現在フレームの表示名を組み立てる
  function buildCurrentFrameName(currentLabel, currentTag, currentFile) {
    if (currentLabel && currentTag) {
      return currentLabel + " [" + currentTag.name + "]";
    }
    if (currentTag) return "[" + currentTag.name + "]";
    if (currentLabel) return currentLabel;
    return basenameNoExt(currentFile);
  }

  // 現在フレームの位置情報 (file/line/index/tag) を取得
  function resolveCurrentPosition(kag) {
    var currentFile = pausedFile || kag.stat.current_scenario || "unknown.ks";
    var currentLine = pausedLine || kag.stat.current_line || 0;
    var currentIndex = kag.ftag.current_order_index || 0;
    var currentTag = null;
    if (kag.ftag.array_tag && kag.ftag.array_tag[currentIndex]) {
      currentTag = kag.ftag.array_tag[currentIndex];
      if (!pausedLine) {
        currentLine = currentTag.line || currentLine;
      }
    }
    return {
      file: currentFile,
      line: currentLine,
      index: currentIndex,
      tag: currentTag,
    };
  }

  // macro スタックを逆順にフレーム化
  function buildMacroFrames(kag, currentFile) {
    var result = [];
    var macroStack = (kag.stat.stack && kag.stat.stack.macro) || [];
    for (var i = macroStack.length - 1; i >= 0; i--) {
      var entry = macroStack[i];
      if (!entry) continue;
      var macroName =
        entry.name ||
        (entry.pm && entry.pm._macro) ||
        findNearestLabel(kag, entry.storage, entry.index) ||
        "(macro)";
      result.push({
        name: macroName,
        file: entry.storage || currentFile,
        line: findLineByIndex(kag, entry.storage, entry.index),
        index: entry.index || 0,
      });
    }
    return result;
  }

  // call スタックを逆順にフレーム化（ラベル名解決を含む）
  function buildCallFrames(kag, currentFile) {
    var result = [];
    var callStack = (kag.stat.stack && kag.stat.stack.call) || [];
    for (var j = callStack.length - 1; j >= 0; j--) {
      var entry = callStack[j];
      if (!entry) continue;
      var name =
        findNearestLabel(kag, entry.storage, entry.index) ||
        basenameNoExt(entry.storage);
      result.push({
        name: name,
        file: entry.storage || currentFile,
        line: findLineByIndex(kag, entry.storage, entry.index),
        index: entry.index || 0,
      });
    }
    return result;
  }

  // ── コールスタック送信 ──
  function sendCallStack(requestId) {
    var frames = [];
    try {
      var kag = TYRANO.kag;
      var pos = resolveCurrentPosition(kag);
      var currentLabel = findNearestLabel(kag, pos.file, pos.index);
      frames.push({
        name: buildCurrentFrameName(currentLabel, pos.tag, pos.file),
        file: pos.file,
        line: pos.line,
        index: pos.index,
      });
      frames = frames.concat(buildMacroFrames(kag, pos.file));
      frames = frames.concat(buildCallFrames(kag, pos.file));
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

  // ── iscript 内部行デバッグ支援 ──

  /**
   * [iscript] タグ検出直後に array_tag を前方走査し、次の非 text タグ (endscript) までの
   * text タグの .line を順に集める。buff_script を "\n" で split した配列の要素と
   * 1 対 1 で対応する想定。
   */
  function collectIScriptLines(ftag, iscriptIndex, file) {
    var lines = [];
    var arr = ftag.array_tag;
    if (!arr) return { file: file, lines: lines };
    for (var i = iscriptIndex + 1; i < arr.length; i++) {
      var t = arr[i];
      if (!t) break;
      if (t.name === "text") {
        lines.push(typeof t.line === "number" ? t.line : -1);
      } else {
        break;
      }
    }
    return { file: file, lines: lines };
  }

  /**
   * 1 行分の JS ソースをざっくりスキャンし、括弧／文字列の深度変化を返す。
   * コメント（//, /* *\/）と文字列リテラル（'、"、`）とエスケープをケア。
   * 注入可否判定に使う「行終了時点での未閉じ状態」を返す。
   * parenDepth は ( と [ の合計、braceDepth は { の合計を別々に返す。
   */
  function scanLineTokens(line, startInString, startInBlockComment) {
    var parenDepth = 0;
    var braceDepth = 0;
    var inString = startInString || null; // null | "'" | '"' | "`"
    var inBlockComment = !!startInBlockComment;
    var i = 0;
    var n = line.length;
    while (i < n) {
      var c = line.charAt(i);
      var next = i + 1 < n ? line.charAt(i + 1) : "";

      if (inBlockComment) {
        if (c === "*" && next === "/") {
          inBlockComment = false;
          i += 2;
          continue;
        }
        i++;
        continue;
      }

      if (inString) {
        if (c === "\\") {
          i += 2;
          continue;
        }
        if (c === inString) {
          inString = null;
        }
        i++;
        continue;
      }

      // コメント開始
      if (c === "/" && next === "/") {
        break; // 行末までコメント
      }
      if (c === "/" && next === "*") {
        inBlockComment = true;
        i += 2;
        continue;
      }

      if (c === "'" || c === '"' || c === "`") {
        inString = c;
        i++;
        continue;
      }

      if (c === "(" || c === "[") {
        parenDepth++;
      } else if (c === ")" || c === "]") {
        parenDepth--;
      } else if (c === "{") {
        braceDepth++;
      } else if (c === "}") {
        braceDepth--;
      }
      i++;
    }
    return {
      parenDepth: parenDepth,
      braceDepth: braceDepth,
      inString: inString,
      inBlockComment: inBlockComment,
    };
  }

  /**
   * iscript ソースを行単位で変換し、各行先頭に await __tyranoBP(...) を挿入する。
   * 文の途中（括弧内・未閉じ文字列・ブロックコメント内）では挿入しない。
   */
  function transformIScriptSource(str, file, lines) {
    var srcLines = str.split("\n");
    var out = [];
    var parenDepth = 0;
    var inString = null;
    var inBlockComment = false;

    // オブジェクトキー様パターン: "key": / 'key': / key: の行頭
    var reObjKey = /^(?:["'][^"']*["']|[\w$]+)\s*:/;

    for (var i = 0; i < srcLines.length; i++) {
      var ksLine = i < lines.length ? lines[i] : -1;
      var trimmed = srcLines[i].trimLeft ? srcLines[i].trimLeft() : srcLines[i].replace(/^\s+/, "");
      // 丸括弧・ブラケットの深度が 0 で、文字列・ブロックコメント内でもなく、
      // かつオブジェクトキー様パターン（case/default/ラベルを含む）でない行に挿入する。
      var isObjKeyLine = reObjKey.test(trimmed);
      var canInject =
        parenDepth === 0 && inString === null && !inBlockComment && ksLine >= 0 && !isObjKeyLine;
      var prefix = canInject
        ? "await __tyranoBP(" + JSON.stringify(file) + "," + ksLine + ");"
        : "";
      out.push(prefix + srcLines[i]);
      var state = scanLineTokens(srcLines[i], inString, inBlockComment);
      parenDepth += state.parenDepth;
      inString = state.inString;
      inBlockComment = state.inBlockComment;
    }
    return out.join("\n");
  }

  /**
   * iscript 内の行で停止する非同期ヘルパー。BP またはステップ条件に該当すれば
   * stopped イベントを送信し、resume/step コマンドが来るまで Promise で待機する。
   */
  function tyranoBP(file, line) {
    if (!connected) return Promise.resolve();
    var hitBP = isBreakpoint(file, line);
    var shouldStop = hitBP;
    var reason = "breakpoint";

    if (!hitBP && stepping) {
      switch (stepping) {
        case "stepIn":
        case "stepOver":
          shouldStop = true;
          reason = "step";
          break;
        case "stepOut":
          // iscript を抜けてからタグレベルの stepOut 判定に任せる
          shouldStop = false;
          break;
      }
    }

    if (!shouldStop) return Promise.resolve();

    return new Promise(function (resolve) {
      pendingIScriptResume = resolve;
      stepping = null;
      paused = true;
      pausedFile = file;
      pausedLine = line;
      send({
        type: "stopped",
        data: { reason: reason, file: file, line: line },
      });
    });
  }

  // グローバルに公開（変換後の JS から呼ばれる）
  window.__tyranoBP = tyranoBP;

  /**
   * TYRANO.kag.evalScript をラップし、iscript 起因の eval を async IIFE に変換して実行する。
   */
  function hookEvalScript() {
    var kag = TYRANO.kag;
    if (!kag || !kag.evalScript) return false;
    var original = kag.evalScript.bind(kag);
    kag.evalScript = function (str) {
      var ctx = currentIScriptContext;
      if (!ctx || !str) {
        return original(str);
      }
      currentIScriptContext = null;

      var transformed;
      try {
        transformed = transformIScriptSource(str, ctx.file, ctx.lines);
      } catch (e) {
        console.error("[TyranoDebug] transformIScriptSource failed:", e);
        return original(str);
      }

      // evalScript 相当のスコープ束縛を再現（直接 eval でこれらが見える）
      var TG = this;
      var f = this.stat.f;
      var sf = this.variable.sf;
      var tf = this.variable.tf;
      var mp = this.stat.mp;
      void TG; void f; void sf; void tf; void mp;

      var wrapped =
        "(async function(){\n" + transformed + "\n}).call(TG)";
      try {
        var p = eval(wrapped);
        if (p && typeof p.then === "function") {
          return p.then(
            function () {
              try {
                kag.saveSystemVariable();
              } catch (_) {}
              if (kag.is_studio && kag.studio && kag.studio.notifyChangeVariable) {
                kag.studio.notifyChangeVariable();
              }
            },
            function (err) {
              console.error(err);
              try {
                kag.warning(err, true);
              } catch (_) {}
            }
          );
        }
        return p;
      } catch (e) {
        console.error(e);
        try {
          kag.warning(e, true);
        } catch (_) {}
        return Promise.resolve();
      }
    };
    return true;
  }

  /**
   * [endscript] タグの start を差し替え、evalScript が Promise を返す場合は
   * then 内で nextOrder を呼ぶように変更する。
   */
  function hookEndscript() {
    var kag = TYRANO.kag;
    if (!kag || !kag.ftag || !kag.ftag.master_tag) return false;
    var tagObj = kag.ftag.master_tag.endscript;
    if (!tagObj || !tagObj.start) return false;
    tagObj.start = function (pm) {
      kag.stat.is_script = false;
      var result;
      try {
        result = kag.evalScript(kag.stat.buff_script);
      } catch (err) {
        try {
          kag.error("error_in_iscript");
        } catch (_) {}
        console.error(err);
      }
      kag.stat.buff_script = "";
      var after = function () {
        if (pm && pm.stop === "false") {
          kag.ftag.nextOrder();
        }
      };
      if (result && typeof result.then === "function") {
        result.then(after);
      } else {
        after();
      }
    };
    return true;
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

    // iscript 内部行デバッグ用フック
    hookEvalScript();
    hookEndscript();

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

      // [iscript] 検出時、endscript までの text タグの .line を収集し、evalScript 変換用に保存
      if (tag && tag.name === "iscript") {
        currentIScriptContext = collectIScriptLines(ftag, currentIndex, currentFile);
      }

      // text / comment ノードはスキップ（ブレークポイント・ステップ・pause 判定対象外）
      var isExecutableTag = tag && tag.name !== "text" && tag.name !== "comment";

      // ── ブレークポイント判定 ──
      if (isExecutableTag && isBreakpoint(currentFile, currentLine)) {
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
      if (stepping && isExecutableTag) {
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
      if (paused && isExecutableTag) {
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
