(function () {
  /**
   *
   * 爆速スキッププラグイン
   *
   */

  /**
   * 変数定義
   */
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
  const excludeList = ["configdelay"];

  /**
   * 関数定義
   */
  const cutTime = (time) => {
    if (TYRANO.kag.stat.is_skip) {
      time = TYRANO.kag.config.skipEffectIgnore ? SKIP_SPEED : time;
    }
    return time;
  };

  /**
   * 既存関数オーバーライド
   */
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

  //playbgmを改造して、クリック待ちにならないようにする
  // start処理を上書きして再生するようにすることを検討していましたが、
  // howler.jsやブラウザの仕様によりユーザーアクションがないと再生できないので、
  // playbgmのwaitClick処理を上書きしてカーソル位置に来るまで再生そのものをできないようにしています。
  const _playbgm = TYRANO.kag.tag.playbgm;
  TYRANO.kag.tag.playbgm = $.extend(true, {}, _playbgm, {
    waitClick: function (pm) {
      const that = TYRANO;
      //本来の処理
      // _playbgm.waitClick.apply(TYRANO, [pm]);
      that.kag.ftag.nextOrder();
    },
  });

  TYRANO.kag.ftag.master_tag.playbgm = TYRANO.kag.tag.playbgm;
  TYRANO.kag.ftag.master_tag.playbgm.kag = TYRANO.kag;

  //textタグを上書きして文字を表示させないようにして、カーソル位置にたどり着くまでの速度を上げる
  const _text = TYRANO.kag.tag.text;
  TYRANO.kag.tag.text = $.extend(true, {}, _text, {
    start: function (pm) {
      //【追加箇所】
      //rubyタグで指定した箇所が残ってしまっていたので、カーソルの位置につくまでは文字列を空にする
      if (TYRANO.kag.variable.tf.is_preview_skip == true) {
        TYRANO.kag.stat.ruby_str = "";
      }
      // スクリプト解析状態の場合は早期リターン
      if (TYRANO.kag.stat.is_script == true) {
        TYRANO.kag.tag.text.buildIScript(pm);
        return;
      }

      // HTML解析状態の場合は早期リターン
      if (TYRANO.kag.stat.is_html == true) {
        TYRANO.kag.tag.text.buildHTML(pm);
        return;
      }
      //【追加箇所】
      if (TYRANO.kag.variable.tf.is_preview_skip == true) {
        TYRANO.kag.ftag.nextOrder();
        return;
      }
      // ティラノイベント"tag-text-message"を発火
      TYRANO.kag.trigger("tag-text-message", { target: pm });

      // メッセージレイヤのアウターとインナーを取得
      // div.messageX_fore
      //   div.message_outer ←
      //   div.message_inner ← こいつら
      const j_outer_message = TYRANO.kag.getMessageOuterLayer();
      const j_inner_message = TYRANO.kag.getMessageInnerLayer();

      // インナーにCSSを設定
      // letter-spacing, line-height, font-family など
      TYRANO.kag.tag.text.setMessageInnerStyle(j_inner_message);

      //　現在表示中のテキストを格納
      TYRANO.kag.stat.current_message_str = pm.val;

      // 縦書きかどうか
      const is_vertical = TYRANO.kag.stat.vertical == "true";

      // 自動改ページ
      if (TYRANO.kag.config.defaultAutoReturn != "false") {
        TYRANO.kag.tag.text.autoInsertPageBreak(
          j_inner_message,
          j_outer_message,
          is_vertical,
        );
      }

      // showMessageに投げる
      TYRANO.kag.tag.text.showMessage(pm.val, is_vertical);
    },
  });
  TYRANO.kag.ftag.master_tag.text = TYRANO.kag.tag.text;
  TYRANO.kag.ftag.master_tag.text.kag = TYRANO.kag;
})();