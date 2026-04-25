; issue-386 検証用 2/3
; issue-386-test.ks からのクロスファイルジャンプ先。
; プロジェクト全体表示では、test.ks の *crossFile から
; このファイルの subgraph 内 *chap2_start ノードへ直接エッジが伸びる。

*chap2_start
chap2 の冒頭です。[p]
[jump target="*chap2_branch"]

; 同じファイル内での通常遷移
*chap2_branch
chap2 内のラベル。[p]
[jump target="*chap2_loop" cond="sf.visited!==true"]
[jump target="*chap2_end"]

*chap2_loop
ループバック（cond= で破線表示）。[p]
[eval exp="sf.visited=true"]
[jump target="*chap2_branch"]

*chap2_end
chap2 終了。第3ファイルへクロスファイル。[p]
[jump storage="test/issue-386-test3.ks" target="*chap3_start"]

; 遷移を持たない孤立ラベル（ノードとして残ること）
*chap2_orphan
このラベルはどこからも参照されない孤立ラベルです。[p]

[s]
