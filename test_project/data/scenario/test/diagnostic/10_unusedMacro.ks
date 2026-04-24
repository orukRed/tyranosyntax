; =====================================================================
; 10. unusedMacro (Warning)
; 期待メッセージ: 「マクロ "XXX" は未使用です。」
; ソース: src/subscriptions/TyranoDiagnostic.ts 1160-1227
;
; 注記: 定義本体を空にして、マクロ本体内の他診断が混ざらないよう
;       にしている。
; =====================================================================

; --- 発火する例 ---
; 定義だけしてどこからも呼ばれないマクロ
[macro name="unused_macro_alone"]
[endmacro]

; --- 発火しない例 ---
; 定義して呼び出すマクロ
[macro name="used_macro_alone"]
[endmacro]
[used_macro_alone]
