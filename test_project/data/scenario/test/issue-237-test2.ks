; issue-237 ラベルへのリネーム機能テスト（クロスファイル検証用）
; issue-237-test.ks のラベルを storage 指定経由で参照する。
;
; ## 動作確認シナリオ
;
; 1. issue-237-test.ks の *issue237_start を F2 でリネームすると、
;    本ファイルの [jump storage=... target="*issue237_start"] も連動して書き換わる
;
; 2. 本ファイルの [jump storage=... target="*issue237_start"] の値で F2 を行うと、
;    issue-237-test.ks の *issue237_start 定義側も連動してリネームされる
;
; 3. 同名ラベル *issue237_local_only がこのファイルにも存在するが、
;    issue-237-test.ks 側の同名ラベルとは独立してリネームされる
;    （sourceFsPath で区別されるため、誤ってクロス書き換えされないこと）

*issue237_test2_start

別ファイルから issue-237-test.ks のラベルを参照する。[p]

; --- 別ファイル (issue-237-test.ks) のラベルを storage で参照 ---
[link
  storage="test/issue-237-test.ks"
  target="*issue237_start"
  text="test.ks の start へ"
]
[link
  storage="test/issue-237-test.ks"
  target="issue237_link_target"
  text="* なし参照"
]
[s]

; --- jump / call で別ファイルのラベルへ ---
[jump storage="test/issue-237-test.ks" target="*issue237_branch_a"]

; --- このファイルにも同名ラベル issue237_local_only を置く（別ファイルのものとは独立） ---
*issue237_local_only
このファイルだけのラベル。[p]
[jump target="*issue237_local_only"]

[s]
