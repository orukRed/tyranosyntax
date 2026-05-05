; issue-237 ラベルへのリネーム機能テスト
; F2 (Rename Symbol) で以下のラベル名をリネームできること、
; かつ参照側 (target=) も連動して書き換わることを確認する。
;
; ## 動作確認シナリオ
;
; 1. 下記 *issue237_start のラベル名にカーソルを置いて F2
;    → 同ファイル内の [jump target="*issue237_start"] / [link target="issue237_start"] や
;      issue-237-test2.ks 側の [jump storage="test/issue-237-test.ks" target="*issue237_start"] も
;      連動してリネームされる
;
; 2. [jump target="*issue237_branch_a"] の値（"issue237_branch_a"）にカーソルを置いて F2
;    → 同ファイル内の *issue237_branch_a 定義と他の参照箇所も連動してリネームされる
;
; 3. [link target="issue237_link_target"] のように * なしの参照を F2 でリネーム
;    → ラベル定義側に * は保たれたまま名前のみ書き換わる
;
; 4. [jump target="&f.issue237_var_target"] の "f.issue237_var_target" にカーソルを置いて F2
;    → ラベルではなく変数として f. の名前空間でリネームされる
;       （ラベル定義 *issue237_var_target は変更されない）

*issue237_start

これは issue-237 ラベルリネームのテストシナリオです。[p]

; --- 同一ファイル内のラベル参照（jump / link / button / glink / call） ---
[link target="issue237_branch_a"]a[endlink] 
[link target="issue237_branch_b"]b[endlink]
[s]

*issue237_branch_a
A に来ました。[p]
[jump target="*issue237_join"]

*issue237_branch_b
B に来ました。[p]
[jump target="*issue237_join"]

*issue237_join
合流しました。[p]

; --- * なしの target も同じラベルを指す ---
[jump target="issue237_link_target"]

*issue237_link_target
* なし参照のテスト。[p]

; --- button / glink / clickable も label 型パラメータ (target) を持つ ---
[button target="*issue237_button_jump" name="btn1" graphic="dummy.png"]
[glink target="*issue237_glink_jump" text="GLINK"]
[s]

*issue237_button_jump
button から飛んできた。[p]
[jump target="*issue237_end"]

*issue237_glink_jump
glink から飛んできた。[p]
[jump target="*issue237_end"]

; --- call / return（target= をラベル名として持つ） ---
*issue237_subroutine
[return]

; ============================================================
; 変数指定の target= はラベルとして扱われないことの確認
; 下記行で "f.issue237_var_target" を F2 すると変数リネームになり、
; *issue237_var_target ラベルは触られない
; ============================================================
[eval exp="f.issue237_var_target = 1"]
[jump target="&f.issue237_var_target"]

*issue237_var_target
変数指定経由で来た。[p]

*issue237_end
[s]
