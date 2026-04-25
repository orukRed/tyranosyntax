; issue-386 検証用 3/3
; issue-386-test.ks / issue-386-test2.ks からのクロスファイルジャンプ先。
;
; - プロジェクト全体表示では、test2.ks の *chap2_end → このファイルの *chap3_start
;   へ直接エッジが伸びる。
; - test.ks の *crossFileEntry から storage のみ（target なし）で来た場合は、
;   このファイルの先頭（合成 ENTRY ノード）に着地する。
; - 最後に test.ks へクロスファイルで戻ることで、ファイル間の循環を可視化する。

*chap3_start
chap3 の冒頭。[p]
[jump target="*chap3_inner"]

*chap3_inner
chap3 の中間処理。[p]
[glink storage="test/issue-386-test3.ks" target="*chap3_inner_a" text="A"]
[glink storage="test/issue-386-test3.ks" target="*chap3_inner_b" text="B"]
[s]

*chap3_inner_a
A ルート。[p]
[jump target="*chap3_back"]

*chap3_inner_b
B ルート。[p]
[jump target="*chap3_back"]

*chap3_back
test.ks の先頭へ戻る（ファイル間循環）。[p]
[jump storage="test/issue-386-test.ks" target="*start"]

[s]
