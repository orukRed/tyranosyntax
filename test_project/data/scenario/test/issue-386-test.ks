; issue-386 プロジェクト全体のフローチャートも表示できるようにしたい
;
; 検証手順:
;   1. Ctrl+Alt+F でフローチャートを開く
;   2. シナリオ一覧の test_project プロジェクト見出し直下の
;      「プロジェクト全体のフローチャート」緑ボタンを押す
;   3. 凡例パネル / 矢印の色 / ファイル絞り込み / 検索ハイライトなどを確認
;   4. このファイル単体（issue-386-test.ks）を開いて緑リーフをクリックすると、
;      該当ファイルの単一ファイルフローチャートに遷移すること

; ====================================================================
; ケース1: タグ別の色分け（凡例の通り）
; jump=青 / button=橙 / glink=緑 / call=紫 を確認
; ====================================================================
*start
タグごとに色が分かれることを確認します。[p]
[jump target="*labelA"]

*labelA
button タグへの遷移。[p]
[button storage="test/issue-386-test.ks" target="*labelB" graphic="hoge.png"]
[s]

*labelB
glink タグへの遷移。[p]
[glink storage="test/issue-386-test.ks" target="*labelC" text="次へ"]
[s]

*labelC
call タグでサブルーチンへ。[p]
[call target="*subroutine"]
[jump target="*condBranch"]

*subroutine
サブルーチン処理。[p]
[return]

; ====================================================================
; ケース2: 条件分岐（cond=...）は破線で表示されること
; ====================================================================
*condBranch
条件分岐のテスト。[p]
[jump target="*flagOn" cond="f.flag==1"]
[jump target="*flagOff" cond="f.flag!=1"]

*flagOn
flag が立っているルート。[p]
[jump target="*crossFile"]

*flagOff
flag が立っていないルート。[p]
[jump target="*crossFile"]

; ====================================================================
; ケース3: クロスファイルジャンプ
; プロジェクト全体表示では issue-386-test2.ks の subgraph 内ノードへ
; 直接エッジが刺さること。単一ファイル表示では緑リーフとして表示され、
; クリックで該当ファイルへ遷移できること。
; ====================================================================
*crossFile
別ファイルのラベルへ遷移します。[p]
[jump storage="test/issue-386-test2.ks" target="*chap2_start"]

*crossFileEntry
storage のみ（target なし）の遷移。target ファイルの先頭へ。[p]
[jump storage="test/issue-386-test3.ks"]

; ====================================================================
; ケース4: 外部ストレージ（プロジェクトの data/scenario 外を指す）
; プロジェクト全体表示では external サブグラフに緑リーフで現れること
; ====================================================================
*externalRef
プロジェクト外のリソースへの参照。[p]
[jump storage="../others/plugin/foo.ks" target="*plugin_label"]

[s]
