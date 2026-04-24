; =====================================================================
; 02. missingScenariosAndLabels (Error)
; サブ種別:
;   2a: storage が .ks で終わらない
;       「storageパラメータは末尾が'.ks'である必要があります。」
;   2b: .ks ファイルが存在しない
;       「XXXは存在しないファイルです。」
;   2c: target ラベルが存在しない
;       「*XXXは存在しないラベルです。」
;   2d: 変数使用時に & が無い
;       「パラメータに変数を使う場合は先頭に'&'が必要です。」
; ソース: src/subscriptions/TyranoDiagnostic.ts 328-460
; =====================================================================

; --- 2a 発火する例 ---
[jump storage="ms_noext"]

; --- 2b 発火する例 ---
[jump storage="ms_nonexistent.ks"]

; --- 2c 発火する例 ---
; first.ks には *ms_nolabel は無い
[jump storage="first.ks" target="*ms_nolabel"]

; --- 2d 発火する例 ---
[jump storage="f.ms_storage_var"]
[call target="sf.ms_target_var"]

; --- 発火しない例 ---
; target は同ファイル内の *ms_local_label を参照
[jump target="*ms_local_label"]
; 変数使用時に & を付与
[jump storage="&f.ms_storage_var"]
[call target="&sf.ms_target_var"]

*ms_local_label
