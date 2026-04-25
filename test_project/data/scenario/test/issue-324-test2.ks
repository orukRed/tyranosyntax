; issue-324 未使用マクロ検出機能のテスト（クロスファイル検証用）
; issue-324-test.ks で定義された issue324_used_from_other_file を呼び出す

*cross_file_test

; 別ファイル定義のマクロを使用 → issue-324-test.ks 側で警告が出ないことを確認
[issue324_used_from_other_file]

; 重複定義（issue-324-test.ks と同名）
; このマクロはどこからも呼ばれないので未使用警告 + 重複警告の両方が出る
[macro name="issue324_duplicate"]
  こちらも重複かつ未使用のマクロです。[p]
[endmacro]

[s]
