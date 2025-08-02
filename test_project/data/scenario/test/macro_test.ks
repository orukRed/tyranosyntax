;issue300

;mp.の始まる値はマクロのパラメータになってるかどうかのテスト
; @macro name="issue300_test1"
;   [iscript ]
;     f.hoge=mp.your_name
;   [endscript]
;     マクロにわたされた値は「[emb exp="mp.your_name"]」です。
; @endmacro

; ;%を使ったパラメータがマクロのパラメータになってるかどうかのテスト
; @macro name="issue300_test2"
;   [font color="%color|0xff0000"]
;   こんな風にマクロを作ります
;   [resetfont]
; @endmacro

;*が存在するタグの場合、未使用のパラメータすべてがマクロのパラメータになってるかどうかのテスト
;例の場合はtime,method,childrenパラメータが補完として出る）
@macro name="issue300_test3"
    [trans layer="0" *]
    [wt]
@endmacro
@back time="" 
auuua
; @issue300_test1 
; @issue300_test2 
@issue300_test3 