; ここにsetting.jsonで指定した処理

; storageは現在編集中のファイル
; targetは、設定から選んだファイル
*main

;---------------------------
;各種文字送り速度を最大にして音量系を0にする
;---------------------------
[iscript]
  tf._speedSkip = parseInt(mp.speed || 1)
  tf.TYRANO_SYNTAX_PREVIEW = true;//一応プレビュー中かどうかのフラグを立てておく
  TYRANO.kag.config.skipSpeed = 1;
  TYRANO.kag.config.skipEffectIgnore=true;
  TYRANO.kag.config.chSpee=1;
  TYRANO.kag.config.defaultBgmVolume = 0;
  TYRANO.kag.config.defaultSeVolume = 0;
  TYRANO.kag.config.defaultMovieVolume = 0;
//プレビュー中にアラートが出ないように上書きする
  const originalAlert = window.alert;
  // カスタムalert関数を定義
  window.alert = function(message) {
      console.log("カスタムアラート: " + message);
      // 必要に応じて元のalert関数を呼び出す
      // originalAlert(message);
  };

//各種処理をスキップするために爆速スキッププラグイン導入してみる
//ディレクトリの関係上pluginフォルダに入れられないので処理をここに書いている
{
  //爆速スキッププラグイン
  //変数定義
  let tagName = "";
  const SKIP_SPEED = TYRANO.kag.variable.tf._speedSkip;

  //一時変数消しておく
  delete TYRANO.kag.variable.tf._speedSkip;

  //対象パラメータリスト
  const paramList = [
    "time",
    "speed",
    "in_delay",
    "out_delay",
    "show_time",
    "show_delay",
    "select_time",
    "select_delay",
    "reject_time",
    "reject_delay",
    "pos_change_time",
    "talk_anim_time",
  ];

  //除外タグリスト
  //const excludeList = ["configdelay"];
  //暫定対応
  const excludeList = ["configdelay", "chara_part", "chara_show"];

  //関数定義
  const cutTime = (time) => {
    if (TYRANO.kag.stat.is_skip) {
      time = TYRANO.kag.config.skipEffectIgnore ? SKIP_SPEED : time;
    }
    return time;
  };

  //既存関数オーバーライド
  //checkCondとconvertEntityをオーバーライドしている
  const _checkCond = TYRANO.kag.ftag.checkCond;
  TYRANO.kag.ftag.checkCond = function (tag) {
    //タグ名確保しておく
    tagName = tag.name;

    //本来の処理
    return _checkCond.apply(this, arguments);
  };

  const _convertEntity = TYRANO.kag.ftag.convertEntity;
  TYRANO.kag.ftag.convertEntity = function (tag) {
    //本来の処理
    const converted = _convertEntity.apply(this, arguments);

    //タグか
    if (TYRANO.kag.ftag.master_tag[tagName] === undefined) {
      return converted;
    }

    //除外タグか
    if (excludeList.includes(tagName)) {
      return converted;
    }

    //タグのpm初期値持ってくる
    const pm = $.extend(
      true,
      {},
      $.cloneObject(TYRANO.kag.ftag.master_tag[tagName].pm),
      converted,
    );
    Object.keys(pm).forEach((key) => {
      if (paramList.includes(key)) {
        //対象パラメータ
        pm[key] = cutTime(pm[key]);
      }
      if (!pm[key]) {
        //空パラメータ
        delete pm[key];
      }
    });
    return pm;
  };
  //音楽系のタグを上書きする
  //今は処理止まりそうなところのみ。他も必要に応じて追加する
  const playbgm = {
    vital: ['storage'],
    pm: {
    },
    waitClick: function (pm) {},
    start: function (pm) {
       TG.ftag.nextOrder();
    },
    parseMilliSeconds: function (_str) {},
    play: async function (pm) {},
    analyzeAudioForLipSync(howl, name) {},
  };
  TG.ftag.master_tag["playbgm"] = playbgm;

  const fadeinbgm = {
    vital: ["storage"],
    pm: {},
    start: function (pm) {
      TG.ftag.nextOrder();
    },
  }
  TG.ftag.master_tag["fadeinbgm"] = fadeinbgm;

  const xchgbgm = {
    vital: ["storage"],
    pm: {},
    start: function (pm) {
      TG.ftag.nextOrder();
    },
  }
  TG.ftag.master_tag["xchgbgm"] = xchgbgm;

  const playse = {
    vital: ["storage"],
    pm: {},
    start: function (pm) {
      TG.ftag.nextOrder();
    }
  }
  TG.ftag.master_tag["playse"] = playse;

  const fadeinse = {
    vital: ["storage", "time"],
    pm: {},
    start: function (pm) {
      TG.ftag.nextOrder();
    }
  }
  TG.ftag.master_tag["fadeinse"] = fadeinse;

  const wbgm = {
    pm: {},
    start: function () {
      TG.ftag.nextOrder();
    }
  }
  TG.ftag.master_tag["wbgm"] = wbgm;

  const wse = {
    pm: {},
    start: function () {
      TG.ftag.nextOrder();
    }    
  }
  TG.ftag.master_tag["wse"] = wse;


  //const text_tag_bak = TG.ftag.master_tag["text"];

  //const new_text_tag = TG.ftag.master_tag["text"];
  //TG.ftag.master_tag["text"] = new_text_tag;

  //適当なとこで以下を実行してあげる
  //TG.ftag.master_tag["text"] = text_tag_bak

  //textタグのstartだけ上書きすれば行けると思ったけどうまくいかない
  let _start=tyrano.plugin.kag.tag.text.start;
  tyrano.plugin.kag.tag.text.start = function(pm){
    if (this.kag.stat.is_script == true) {
        tyrano.plugin.kag.tag.text.buildIScript(pm);
        return;
    }    

    if(TYRANO.kag.variable.tf._speedSkip==true){
        TYRANO.kag.ftag.nextOrder();
        return;
    }
  };

  tf.tyrano_preview_skip = true;


};
[endscript ]

;---------------------------
;事前に実行する処理
;---------------------------
&f.ORUKRED_TYRANO_SYNTAX_PREPROCESS


[skipstart]

;指定したファイルまでジャンプ
;カレントディレクトリは、test_projectのフォルダになる。
[jump storage="&f.ORUKRED_TYRANO_SYNTAX_STORAGE_NAME" target="&f.ORUKRED_TYRANO_SYNTAX_TARGET_NAME"]
[s]