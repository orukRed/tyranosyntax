
*start

[cm  ]
[clearfix]
[start_keyconfig]


[bg storage="room.jpg" time="100"]

;メニューボタンの表示
@showmenubutton

;メッセージウィンドウの設定
[position layer="message0" left=160 top=500 width=1000 height=200 page=fore visible=true]

;文字が表示される領域を調整
[position layer=message0 page=fore margint="45" marginl="50" marginr="70" marginb="60"]


;メッセージウィンドウの表示
@layopt layer=message0 visible=true

;キャラクターの名前が表示される文字領域
[ptext name="chara_name_area" layer="message0" color="white" size=28 bold=true x=180 y=510]

;上記で定義した領域がキャラクターの名前表示であることを宣言（これがないと#の部分でエラーになります）
[chara_config ptext="chara_name_area"]

;このゲームで登場するキャラクターを宣言
;akane
[chara_new  name="akane" storage="chara/akane/normal.png" jname="あかね"  ]
;キャラクターの表情登録
[chara_face name="akane" face="angry" storage="chara/akane/angry.png"]
[chara_face name="akane" face="doki" storage="chara/akane/doki.png"]
[chara_face name="akane" face="happy" storage="chara/akane/happy.png"]
[chara_face name="akane" face="sad" storage="chara/akane/sad.png"]


;yamato
[chara_new  name="yamato"  storage="chara/yamato/normal.png" jname="やまと" ]


; ver2.0.0で実装するissue6のテストです。[r]
; このシナリオでは、デバッグ機能のテストを行います。[p]


; ;各種タグで止まるか
; 任意のタグにブレークポイントを置いて、動作が止まるかテストします。[p]

; ;chara_showテスト
; @chara_show name="akane"
; ;chara_moveテスト
; @chara_move name="akane" left="+=200" time="1000" anim="true"
; ;bgテスト
; @bg storage="room.jpg" time="1000"


; iscript,html内部で止まるか（できれば止めたいけど今後の対応にしてもよい）
; htmlはそもそもブレークポイントないはずなのでいったん置いておく
iscript内部が止まるかをテストします。[p]
@iscript
  f.hoge=1;
  f.hoge="test";
  f.value=0;
//  alert("テストです。");
  for(let i = 0; i < 5; i++){
      f.value += i;
      console.log(i);
  }
@endscript

変数の値を変更します。[p]

@iscript
f.hoge=12.3;
f.foobar="TEST_VALUE";
@endscript

変更されましたか？[p]

コールスタックのテストです。[r]
別のラベルに飛ばします。[p]
@call target="*next1"

*next1
@call target="next2"

*next2
コールスタックは正しく表示されますか？[r]
期待値はnext2->next1->startです。[p]
@call storage="test/issue-6-test2.ks"
[s]
