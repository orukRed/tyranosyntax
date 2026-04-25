; =====================================================================
; 06. macroDuplicate (Warning)
; 期待メッセージ: 「マクロ名 "XXX" が重複しています。同じ名前のマクロが...」
; ソース: src/subscriptions/TyranoDiagnostic.ts 1090-1149
;
; 注記: 定義したマクロを呼び出さないと「10. unusedMacro」が併発する
;       ので、本ファイル末尾で各マクロを呼び出している（呼び出しは
;       同名マクロすべてに対して「使用」と扱われる）。
; =====================================================================

; --- 発火する例（同一ファイル内で同名マクロを 2 回定義） ---
[macro name="dup_test"]
[endmacro]

[macro name="dup_test"]
[endmacro]

; --- 発火しない例（ユニークな名前） ---
[macro name="dup_unique"]
[endmacro]

; unusedMacro 対策
[dup_test]
[dup_unique]
