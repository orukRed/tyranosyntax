; =====================================================================
; 03. jumpAndCallInIfStatement (Warning)
; 期待メッセージ: 「ifの中でのXXXは正常に動作しない可能性があります...」
; ソース: src/subscriptions/TyranoDiagnostic.ts 299-326
; =====================================================================

; --- 発火する例 ---
; if〜endif の内側に jump / call タグを直接配置
[if exp="1==1"]
  [jump target="*if_local_label"]
  [call target="*if_local_label"]
[endif]

; --- 発火しない例 ---
; if の外側の jump（cond パラメータで分岐）
[jump cond="1==1" target="*if_local_label"]
[call cond="1==1" target="*if_local_label"]

*if_local_label
