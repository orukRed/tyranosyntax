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
  tf.is_preview_skip=true;
  TYRANO.kag.config.skipSpeed = 1;
  TYRANO.kag.config.skipEffectIgnore=true;
  TYRANO.kag.config.chSpee=1;
  //復元用にデフォ値を保存しておく
  tf.defaultBgmVolume = TYRANO.kag.config.defaultBgmVolume;
  tf.defaultSeVolume = TYRANO.kag.config.defaultSeVolume;
  tf.defaultMovieVolume = TYRANO.kag.config.defaultMovieVolume;
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

[endscript ]

[loadjs storage="../../preview_js.js" ]
;---------------------------
;事前に実行する処理
;---------------------------
&f.ORUKRED_TYRANO_SYNTAX_PREPROCESS


[skipstart]

;指定したファイルまでジャンプ
;カレントディレクトリは、test_projectのフォルダになる。
[jump storage="&f.ORUKRED_TYRANO_SYNTAX_STORAGE_NAME" target="&f.ORUKRED_TYRANO_SYNTAX_TARGET_NAME"]
[s]