; =====================================================================
; 11. unusedLabel (Warning)
; 期待メッセージ: 「ラベル "*XXX" は未使用です。」
; ソース: src/subscriptions/TyranoDiagnostic.ts 1239-1261
; =====================================================================

; --- 発火する例 ---
; どこからも jump / call されないラベル
*unused_label_alone

; --- 発火しない例 ---
; 同ファイル内 jump から参照されるラベル
*used_label_alone
[jump target="*used_label_alone"]
