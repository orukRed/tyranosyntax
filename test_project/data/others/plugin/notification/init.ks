; テスト用プラグイン: notification
; updatePluginParamsFromInitKs の mp.* 抽出ロジックを検証するための固定フィクスチャ。

[loadjs storage="../others/plugin/notification/plugin.js"]

[iscript]
mp.offset_top   = mp.offset_top   || "10";
mp.offset_right = mp.offset_right || "10";
[endscript]

; [notify_init offset_top="&mp.offset_top" offset_right="&mp.offset_right"]

[return]