; 診断関係のテスト用ファイル

*start
@iscript
  f.hoge = 12;
@endscript


;---------------------------------------------
;パラメータへの&もしくは%がないとエラー
;---------------------------------------------
@bg storage="&f.hoge1"

; テストファイル - 診断スコープの確認
; タグのパラメータでない場所での変数使用
f.test = 1
sf.global_flag = true

; コメント内での変数言及
; f.some_variable を使う場合は注意

; テキスト内での変数言及
;変数名表示するときはembタグ使う必要あり、これだとそのままf.nameとなるのでこの使い方する人はいないだろうけど一応。
これでf.nameと表示します
@emb exp="f.name"

; タグのパラメータ内での変数使用（エラーになるべき）
[bg cross="f.background" ]
[image depth="sf.temp_image"]

; タグのパラメータ内での正しい変数使用（エラーにならないべき）
[bg storage="&f.background"]
[image storage="&sf.temp_image"]

; exp/condパラメータ（エラーにならないべき）
[if exp="f.flag==1"]
@endif
[jump storage="test.ks" cond="f.condition==true"]

;editのname（エラーにならない
@edit name="f.hoge"

; dialogのname（エラーにならない
@dialog name="f.fuga" cond="f.foo" label_cancel="&f.bar"

; 変数でない値（エラーにならないべき）
[bg storage="room.jpg"]
