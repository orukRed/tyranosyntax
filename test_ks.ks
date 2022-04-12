;ティラノスクリプトサンプルゲーム
;テスト用のファイル。
;ksファイルを使ったテストが必要な場合はこのファイルを使うこと。

*test1-正しくタグのハイライトがされているか

*test2-マウスホバーでチップツールが出る

*test3-ラベルにアンダーバーやハイフンが使える
; 日本語は動作未確認(対象外)
*start
*12345
*test1_test
*test1-test
*test1_fa-rq22

*test4-ハイライトの見直し
;ラベルの色が変わっているか
*start

*test5-タグのハイライト方法が変更されているか
[bg storage="room" left="" top="" width="" height="" time="" wait="" cross="" method="" ]
@bg name="ssss" storage="" left="" top="" width="" height="" time="" wait="" cross="" method=""

;ハイライトされないことを確認
bg storage=room.jpg left="" top="" width="" height="" time="" wait="" cross="" method="" 
bg name="ssss" storage="" left="" top="" width="" height="" time="" wait="" cross="" method=""


;iscriptタグ内の挙動確認
;iscript内で変数や関数が正しくハイライトされているか
[iscript]
test_hoge = 1;
let tmp = 1;
function test_func(){
	console.log("test sentense.");
};
[endscript stop=""]

@iscript
f.test = 1;
function test_func(){
	console.log("test sentense.");
};
@endscript

function test_func(){
	console.log("test sentense.");
};
;embタグ内で変数が正しくハイライトされているか
;半角英数字のテスト
[emb exp="f.aaaa12345=1"]
[emb exp="f.aaaa12345=1"]
;日本語テスト
[emb exp="f.へんすう=1"]
[emb exp="f.へんすう=1"]
[emb exp="f.ヘンスウ=1"]
[emb exp="f.ヘンスウ=1"]
[emb exp="f.変数=1"]
[emb exp="f.変数=1"]
[emb exp="f.あいうえお=1"]
[emb exp="f.あいうえお=1"]
[emb exp="f.あいうえお１２３４５=1"]
[emb exp="f.あいうえお１２３４５=1"]
[emb exp="f.あいうえーお=1"]
[emb exp="f.ｱｲｳｴｵ=1"]
[emb exp="f.aaaaｱｲｳｴｵ=1"]

;複合テスト
[eval exp="f.aA01234_へんすうヘンスウ変数=1"]
[emb exp="f.aA01234_へんすうヘンスウ変数"]

;自作タグ
[hoge args="1"]
[p]
[hoge]

;一応emb以外もテスト
[l][r]
[jump storage="" target="aa"] [lr]
[bg storage=hoge.ks]
[bg storage="1" time="2" wait="3" cross="4" method="5"] [r]
[html][lr]
[endhtml]


@iscript
f.aaaa=1
f.aaaa=1
f.へんすう=1
f.へんすう=1
f.ヘンスウ=1
f.ヘンスウ=1
f.変数=1
f.変数=1
f.aA01234_へんすうヘンスウ変数=1
f.aA01234_へんすうヘンスウ変数=1
@endscript

[iscript]
f.aaaa=1
f.aaaa=1
f.へんすう=1
f.へんすう=1
f.ヘンスウ=1
f.ヘンスウ=1
f.変数=1
f.変数=1
f.aA01234_へんすうヘンスウ変数=1
f.aA01234_へんすうヘンスウ変数=1
[endscript]


;先頭数字はエラーなのでここはハイライトされなくて良い
[emb exp=f.1aaaa=1]
[emb exp=f.１ああああ=1]


;#のハイライトが変更されているか
#chara_name:chara_face

;ラベルの色が変更されているか
*label_name



*test6-設定したタグのアウトラインが表示されているか確認

[if]
[elsif]
[else] 
[endif]
[ignore]
[endignore]
[jump]
[call]
[button]
[link]
[s]
[iscript]
[endscript]
[loadjs]
[html]
[endhtml]
[hoge]


@if
@elsif
@else 
@endif
@ignore
@endignore
@jump
@call
@button
@link
@s
@iscript
@endscript
@loadjs
@html
@endhtml
@hoge

;コメントアウトしたラベルが表示されない
; *comment_label
*uncomment_label

;ブロックコメントアウトしたタグ、ラベルが表示されない
/*
[if]
[elsif]
[else] 
[endif]
[ignore]
[endignore]
[jump]
[call]
[button]
[link]
[s]
[iscript]
[endscript]
[loadjs]
[html]
[endhtml]
[hoge]


@if
@elsif
@else 
@endif
@ignore
@endignore
@jump
@call
@button
@link
@s
@iscript
@endscript
@loadjs
@html
@endhtml
@hoge

*/


;コメントアウトで表示されなくなる
[hoge]/*comment*/
/*
*comment_label
[hoge_comment]
*/

本来はアウトラインに表示されるはずだが、コードに問題があるため意図した動作とならない
１つ下のは表示されず、２つ下のは表示されてしまう
/*comment*/[hoge]
/*[hoge] comment*/

*test7-＠の前にハイライトがあるとハイライトされない問題の修正
;タブが入ってるパターン
		@bg storage="" time="" wait="" cross="" method=""


;半角スペースが入ってるパターン
              @bg storage="" time="" wait="" cross="" method=""


;全角スペースが入ってるパターン
　　　@bg storage="" time="" wait="" cross="" method=""

[bg storage="" time="" wait="" cross="" position="" method=""]


*test8-nameパラメータでダブルクォーテーション使って値を2つ挟むとハイライトされるようにする
[image layer="0" name="hoge1,hoge2" storage="button/auto.png"]
[image layer="0" name="hoge1, hoge2" storage="button/auto.png"]

@image layer="0" name="hoge1,hoge2" storage="button/auto.png"
@image layer="0" name="hoge1, hoge2" storage="button/auto.png"

image layer="0" name="hoge1,hoge2"
image layer="0" name="hoge1, hoge2"


*済test9-タグの属性の値にエンティティに使う変数が正しくハイライトされるようにするのと
*test9_1-変数が変数用の色じゃなくて属性の値の色になってる
;「&」
[jump name="&f.hoge[0]" hoge=12]
@jump name="&f.hoge[0]" hoge=12



*test10-タグの属性の値にエンティティで配列添字使った時に正しくハイライトされるようにする
;@から始まるやつだと正しくハイライトされてる
;最終的に添え字をタグ名として認識する場合もある？とにかくこれを直す。
[jump name="&f.hoge[0]" hoge="12"]
[jump name="&f.hoge[0]" hoge="12+f.hoge"]


[lr]
[jump name="&f.hoge[0]" target="*label1"]
[jump name=&f.hoge[0]]
[jump name=&f.hoge]

あいうえお[l][r]
ああああ[r]


jump name="hoge"
@jump name=f.hoge storage="hoge"
@jump name="&f.hoge[0]" hoge=12
[jump name=f.hoge[0] hoge=12]
@jump name="f.hoge[0]" hoge=12


*test11-パラメータの値に「"　"」を入れるとダブルクォーテーションの最後が正しくハイライトされるようにする
;そもそも全角スペース入れること自体が想定外の挙動？
[hoge param="　"]
@hoge param="　"

*test12-半角スペース混じりのexp属性で正しくハイライトされるようにする
[hoge param=%hoge']
[hoge exp="tf.param1='hoge1, hoge2'" cond="f.hoge2[1]<=f.hogehoge"]
@hoge param="hoge, hoge2" tab="f.hogfe"
@hoge exp="tf.param1='hoge1'" cond="f.hoge2[1]==0"
[eval exp="f.test2='文字列'"]
@eval exp="f.test2='文字列'"
;ついでにハイライトも微妙に変だから要修正
[eval exp="f.test2='文字列'"]

*test13-cond属性が正しくハイライトされるようにする
;それと今のだと変数が青色になってない
[jump cond="f.hoge[0]==0"]
[jump cond="f.hoge == 0"]
[jump cond="f.hoge[0]==0"]
[jump cond="f.hoge==0"]

*test14-一部の日本語が非対応
[jump cond="ほげ、ほげ"]
[jump cond="ほげほげ。"]

*test15-中括弧があるとハイライトされない
[voconfig  vostorage="hoge{number}.mp3" number="1" ]
@voconfig  vostorage="hoge{number}.mp3" number="1"

*test16-末尾がf.mp3のファイルが有ると正しくハイライトされない
[playse storage="hogef.mp3" cond="sf.voice_on == 1"]
@playse storage="hoge_f.mp3" cond="sf.voice_on == 1"
[playse storage="hogesf.mp3" cond="sf.voice_on == 1"]
@playse storage="hoge_sf.mp3" cond="sf.voice_on == 1"
[playse storage="hogetf.mp3" cond="sf.voice_on == 1"]
@playse storage="hoge_tf.mp3" cond="sf.voice_on == 1"

;正規表現の都合上、以下のパターンは正しくハイライトされない。
;修正難度：高
[playse storage="hoge-f.mp3" cond="sf.voice_on == 1"]
@playse storage="f.mp3" cond="sf.voice_on == 1"
[playse storage="hoge-sf.mp3" cond="sf.voice_on == 1"]
@playse storage="sf.mp3" cond="sf.voice_on == 1"
[playse storage="hoge-tf.mp3" cond="sf.voice_on == 1"]
@playse storage="tf.mp3" cond="sf.voice_on == 1"

*test17-パラメータの値で全角記号がハイライトされない

[playse storage="ああああ「」・。。、！？あF！？？”’…。。。、・・・・" cond="sf.voice_on == 1"]
@playse storage="sf.mp3" cond="sf.voice_on == 1"

;test18-一行にタグが複数個ある時正しくハイライトされていない
[emb exp="f.hoge[0]" tmp="gas"] [jump storage="" target=""]
[jump cond="f.hoge[0]==0"][l][r]
[jump cond="f.hoge==0"][l][r]
こんにちは、私は[name]です。[p][l][r]
こんにちは、私は[p]です。[p]
やれやれぼくは走り出した[l][r]
[l][r]
[p]

*test19-タグ内のパラメータの値に変数を使う時添字に変数を使うと正しくハイライトされない問題
[ptext layer="1" text="tf.tmp[hoge.id]"]
[ptext layer="1" text="&tf.tit212le[0]"]
[ptext layer="1" text="&tf.title[10]"]
[ptext layer="1" text="&tf.title[0]" hoge="aa"]
[ptext layer="1" text="&tf.title[0]" hoge="aa" ] [jump storage="" target=""]
[emb exp="f.hoge[0]" tmp="gas"] [jump storage="" target=""]



*test20-コメント、ラベル、シャープが行頭に空白あってもハイライトされる。
;hoge1
*hoge2
#hoge3

		;hoge1
		*hoge2
		#hoge3
  ;hoge1
  *hoge2
  #hoge3

;hoge1-foo_bar1
*hoge2-foo_bar2
#hoge3-foo_bar3


[p ]
[anim color="" ]


;実験用スペース

HELLO
WARNING
HINT
INFO
