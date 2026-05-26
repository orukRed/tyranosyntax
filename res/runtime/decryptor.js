/*
 * tyrano_decryptor — tyranosyntax のパッケージング機能が自動注入する実行時復号スクリプト。
 *
 * TyranoErectron(Electron) のレンダラーでのみ動作する。Node の fs/crypto で
 * 暗号化済みの data/ 配下アセットを読み込み時に AES 復号し、エンジンのローダー
 * (jQuery の loadText / attr / css、Howl、DOM の src 代入) をフックして透過的に差し替える。
 *
 * 注意: 復号鍵はこのファイルに埋め込まれて配布されるため、これは「カジュアルな抽出を
 * 防ぐ難読化」であり、解析を完全に防ぐものではない。
 *
 * data/ の中身は単一の data.pak に束ねられている。起動時に索引を復号し、各アセットは
 * data.pak から範囲読み込み＆復号して供給する。除外ファイル(KeyConfig.js 等)は平文の
 * まま data/ に残り、索引に無いものはディスクから直接読む。
 *
 * data.pak フォーマット:
 *   [ magic 4B = "TYPK" ][ version 1B ][ salt 16B ][ indexIv 16B ][ indexLen 4B(LE) ]
 *   [ 暗号化索引(JSON) ][ DATAセクション ]。各 blob = [ iv 16B ][ ciphertext ]。
 *   鍵導出済みのため実行時は scrypt 不要(高速)。
 */
(function () {
  "use strict";

  // ブラウザ等 Node API が無い環境では何もしない
  if (
    typeof $ === "undefined" ||
    typeof $.isElectron !== "function" ||
    !$.isElectron()
  ) {
    return;
  }

  var fs, crypto, nodePath;
  try {
    fs = require("fs");
    crypto = require("crypto");
    nodePath = require("path");
  } catch (e) {
    console.error("[tyrano_decryptor] Node モジュールを読み込めませんでした", e);
    return;
  }

  // パッケージングコマンドが導出した鍵(hex)をトークン置換で埋め込む
  var KEY = Buffer.from("__INJECTED_KEY_HEX__", "hex");
  var PAK_MAGIC = Buffer.from("TYPK");
  var PAK_VERSION = 1;
  var PAK_HEADER_LENGTH = 4 + 1 + 16 + 16 + 4; // magic+version+salt+indexIv+indexLen

  // data/ パスは index.html のあるディレクトリ基準で解決する
  // (getExePath() はインストールディレクトリを返すため使わない)
  var APP_DIR =
    typeof __dirname !== "undefined" && __dirname
      ? __dirname
      : decodeURIComponent((location.pathname || "").replace(/\/[^/]*$/, "")).replace(
          /^\/([A-Za-z]:)/,
          "$1",
        );

  function toAbs(rel) {
    var clean = String(rel).replace(/^\.?\//, "").split("?")[0];
    return nodePath.join(APP_DIR, clean);
  }

  // data.pak を開いて索引を復号する
  var pakFd = -1;
  var pakIndex = null;
  var pakDataStart = 0;
  try {
    pakFd = fs.openSync(nodePath.join(APP_DIR, "data.pak"), "r");
    var head = Buffer.alloc(PAK_HEADER_LENGTH);
    fs.readSync(pakFd, head, 0, PAK_HEADER_LENGTH, 0);
    if (head.subarray(0, 4).equals(PAK_MAGIC) && head[4] === PAK_VERSION) {
      var indexIv = head.subarray(21, 37);
      var indexLen = head.readUInt32LE(37);
      var encIndex = Buffer.alloc(indexLen);
      fs.readSync(pakFd, encIndex, 0, indexLen, PAK_HEADER_LENGTH);
      var di = crypto.createDecipheriv("aes-256-cbc", KEY, indexIv);
      var indexJson = Buffer.concat([di.update(encIndex), di.final()]).toString(
        "utf8",
      );
      pakIndex = JSON.parse(indexJson);
      pakDataStart = PAK_HEADER_LENGTH + indexLen;
    }
  } catch (e) {
    console.error("[tyrano_decryptor] data.pak を開けませんでした", e);
    pakIndex = null;
  }

  function dataKey(rel) {
    return String(rel)
      .replace(/^\.?\//, "")
      .replace(/^data\//, "")
      .split("?")[0];
  }

  function decryptBlob(blob) {
    var iv = blob.subarray(0, 16);
    var ct = blob.subarray(16);
    var d = crypto.createDecipheriv("aes-256-cbc", KEY, iv);
    return Buffer.concat([d.update(ct), d.final()]);
  }

  function readDecrypted(rel) {
    if (pakIndex) {
      var ent = pakIndex[dataKey(rel)];
      if (ent) {
        var blob = Buffer.alloc(ent.l);
        fs.readSync(pakFd, blob, 0, ent.l, pakDataStart + ent.o);
        return decryptBlob(blob);
      }
    }
    // フォールバック: 除外された平文ファイル等
    return fs.readFileSync(toAbs(rel));
  }

  function isData(s) {
    return (
      typeof s === "string" &&
      /(^\.?\/)?data\//.test(s) &&
      !/^(https?:|blob:|data:)/.test(s)
    );
  }

  var MIME = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    m4v: "video/mp4",
    webm: "video/webm",
    ogv: "video/ogg",
    mp3: "audio/mpeg",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    aac: "audio/aac",
  };

  // パスごとに object URL をキャッシュ(再復号とリークを防止)
  var urlCache = new Map();
  function objUrl(rel) {
    var clean = String(rel).replace(/^\.?\//, "").split("?")[0];
    if (urlCache.has(clean)) {
      return urlCache.get(clean);
    }
    var ext = clean.split(".").pop().toLowerCase();
    var u;
    try {
      var blob = new Blob([readDecrypted(rel)], {
        type: MIME[ext] || "application/octet-stream",
      });
      u = URL.createObjectURL(blob);
    } catch (e) {
      console.error("[tyrano_decryptor] 復号に失敗しました: " + rel, e);
      return rel; // フォールバック: 元のパスを返す
    }
    urlCache.set(clean, u);
    return u;
  }

  // --- テキスト/シナリオ/Config (jQuery ajax 経由) ---
  var origLoadText = $.loadText;
  $.loadText = function (file_path, callback) {
    if (isData(file_path)) {
      try {
        return callback(readDecrypted(file_path).toString("utf8"));
      } catch (e) {
        console.error("[tyrano_decryptor]", e);
      }
    }
    return origLoadText.apply(this, arguments);
  };

  if (typeof $.loadTextSync === "function") {
    var origLoadTextSync = $.loadTextSync;
    $.loadTextSync = function (file_path) {
      if (isData(file_path)) {
        try {
          return Promise.resolve(readDecrypted(file_path).toString("utf8"));
        } catch (e) {
          console.error("[tyrano_decryptor]", e);
        }
      }
      return origLoadTextSync.apply(this, arguments);
    };
  }

  // --- <img> 等の src (jQuery.attr 経由 = setAttribute) ---
  var origAttr = $.fn.attr;
  $.fn.attr = function (name, value) {
    if (name === "src" && isData(value)) {
      return origAttr.call(this, name, objUrl(value));
    }
    if (name && typeof name === "object" && typeof name.src === "string" && isData(name.src)) {
      name = Object.assign({}, name);
      name.src = objUrl(name.src);
      return origAttr.call(this, name);
    }
    return origAttr.apply(this, arguments);
  };

  // --- CSS background-image (jQuery.css 経由) ---
  var URL_RE = /url\((['"]?)(\.?\/?data\/[^'")]+)\1\)/g;
  function rewriteCssUrls(v) {
    return v.replace(URL_RE, function (m, q, p) {
      return "url(" + objUrl(p) + ")";
    });
  }
  var origCss = $.fn.css;
  $.fn.css = function (a, b) {
    if (
      typeof a === "string" &&
      (a === "background-image" || a === "background") &&
      typeof b === "string"
    ) {
      return origCss.call(this, a, rewriteCssUrls(b));
    }
    if (a && typeof a === "object") {
      var keys = ["background-image", "background"];
      for (var i = 0; i < keys.length; i++) {
        if (typeof a[keys[i]] === "string") {
          a[keys[i]] = rewriteCssUrls(a[keys[i]]);
        }
      }
    }
    return origCss.apply(this, arguments);
  };

  // --- 音声 (Howl) ---
  if (typeof window.Howl === "function") {
    var RealHowl = window.Howl;
    var WrappedHowl = function (opts) {
      try {
        opts = Object.assign({}, opts);
        var srcs = opts.src;
        if (typeof srcs === "string") {
          srcs = [srcs];
        }
        if (Array.isArray(srcs)) {
          var fmts = [];
          opts.src = srcs.map(function (s) {
            var ext = String(s).split(".").pop().split("?")[0].toLowerCase();
            fmts.push(ext);
            return isData(s) ? objUrl(s) : s;
          });
          // object URL は拡張子からフォーマットを推測できないため明示する
          if (!opts.format) {
            opts.format = fmts;
          }
        }
      } catch (e) {
        console.error("[tyrano_decryptor]", e);
      }
      return new RealHowl(opts);
    };
    WrappedHowl.prototype = RealHowl.prototype;
    window.Howl = WrappedHowl;
  }

  // --- DOM への生 src 代入 (video / audio / img) ---
  function patchSrcSetter(proto) {
    if (!proto) {
      return;
    }
    var desc = Object.getOwnPropertyDescriptor(proto, "src");
    if (!desc || !desc.set) {
      return;
    }
    Object.defineProperty(proto, "src", {
      configurable: true,
      enumerable: desc.enumerable,
      get: desc.get,
      set: function (v) {
        desc.set.call(this, isData(v) ? objUrl(v) : v);
      },
    });
  }
  if (typeof HTMLMediaElement !== "undefined") {
    patchSrcSetter(HTMLMediaElement.prototype);
  }
  if (typeof HTMLImageElement !== "undefined") {
    patchSrcSetter(HTMLImageElement.prototype);
  }

  console.log("[tyrano_decryptor] enabled");
})();
