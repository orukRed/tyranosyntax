; =====================================================================
; 07. undefinedParameter (Error)
; 期待メッセージ: 「タグ[XXX]のパラメータ "YYY" はタグ "XXX" に定義されていません。」
; ソース: src/subscriptions/TyranoDiagnostic.ts 1690-1804
; =====================================================================

; --- 発火する例 ---
; bg タグに undef_badparam は未定義
[bg storage="room.jpg" undef_badparam="x"]

; --- 発火しない例 ---
; time は bg の正規パラメータ
[bg storage="room.jpg" time="1000"]
; cond は全タグで許容
[bg storage="room.jpg" cond="1==1"]
