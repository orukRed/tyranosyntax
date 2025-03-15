
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

;テスト用のキャラの登録
[chara_new name="test_preview" storage="chara/test/normal.png" jname="テストキャラ"  ]
;
[chara_layer  name="test_preview"  part="icon"  id="none"  storage="none"  zindex="1"  ]
[chara_layer  name="test_preview"  part="icon"  id="exist"  storage="chara/test/a01.png"  zindex="1"  ]

[iscript ]
tf.test_top = 100;
tf.test_left = 200;
[endscript ]
*
#

;chara_showのテストです
chara_showのテストです。[p]
[chara_show name="test_preview" top="&tf.test_top" left="&tf.test_left"  ]
期待値：立ち絵が表示されること。[p]
期待値：変数を用いても立ち絵が表示されること[p]

;chara_partのテストです
chara_partのテストです。[p]
[chara_part name="test_preview" icon="exist"  ]
期待値：立ち絵が切り替わること[p]

; bgm関連のテストです。
playbgmのテストです。[p]
[playbgm storage="music.ogg" ]
期待値：音楽は再生されること[p]
期待値：クリック待ちがないこと[p]

テスト終了です。[p]
[s]