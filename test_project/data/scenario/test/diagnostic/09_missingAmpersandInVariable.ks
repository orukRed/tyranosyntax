; =====================================================================
; 09. missingAmpersandInVariable (Warning)
; 期待メッセージ: 「タグ[XXX]のパラメータ"YYY"で変数を使用する場合は
;                 値の先頭に&...」
; ソース: src/subscriptions/TyranoDiagnostic.ts 1871-1943
;
; 注記: f.amp_var を「12. unusedVariable」で発火させないため、
;       定義と読み取りを同ファイル内で済ませている。
; =====================================================================

[eval exp="f.amp_var = 1"]

; --- 発火する例 ---
; bg.cross は storage ではないので 04 は発火しない
[bg cross="f.amp_var"]
[wait time="f.amp_var"]

; --- 発火しない例 ---
; & 先頭
[bg cross="&f.amp_var"]
; exp / cond / preexp パラメータは除外対象
[if exp="f.amp_var == 1"]
[endif]
[jump cond="f.amp_var == 1" target="*amp_local_label"]
; edit.name, dialog.name は除外対象
[edit name="f.amp_var"]
[dialog name="f.amp_var"]

*amp_local_label
