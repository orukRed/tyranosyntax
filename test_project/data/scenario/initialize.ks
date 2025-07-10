  ;このゲームで登場するキャラクターを宣言
  ;その場プレビューのテスト用
  ;akane
  [chara_new  name="akane" storage="chara/akane/normal.png" jname="あかね"  ]
  ;キャラクターの表情登録
  [chara_face name="akane" face="angry" storage="chara/akane/angry.png"]
  [chara_face name="akane" face="doki" storage="chara/akane/doki.png"]
  [chara_face name="akane" face="happy" storage="chara/akane/happy.png"]
  [chara_face name="akane" face="sad" storage="chara/akane/sad.png"]

  ;yamato
  [chara_new  name="yamato"  storage="chara/yamato/normal.png" jname="やまと" ]

  [if exp="tf.TYRANO_SYNTAX_PREVIEW==true"]

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
  [endif]

  ;変数の初期化
  [iscript ]
    f.hoge=0;
    f.fuga="piyo"
  [endscript ]
