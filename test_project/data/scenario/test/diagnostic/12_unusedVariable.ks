; =====================================================================
; 12. unusedVariable (Warning)
; 期待メッセージ: 「変数 "XXX" は未使用です。」
; ソース: src/subscriptions/TyranoDiagnostic.ts 1397-1422
; =====================================================================

; --- 発火する例 ---
; eval で定義するだけで読み取りが無い f / sf / tf
[eval exp="f.unused_var_alone = 1"]
[eval exp="sf.unused_sf_alone = 2"]
[eval exp="tf.unused_tf_alone = 3"]

; iscript 内での代入のみで他から読まれない変数
[iscript]
f.unused_in_iscript = 10;
[endscript]

; --- 発火しない例 ---
; 定義してから emb で読み取る
[eval exp="f.used_var_alone = 1"]
こんにちは [emb exp="f.used_var_alone"] さん

; 自己参照（RHS で自身を読み取る）
[eval exp="f.used_self_ref = 0"]
[eval exp="f.used_self_ref = f.used_self_ref + 1"]

; 複合代入（左辺も読み取り扱い）
[eval exp="f.used_compound = 0"]
[eval exp="f.used_compound += 1"]
