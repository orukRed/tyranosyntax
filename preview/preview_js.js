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

  //TODO:うまくいかないのでコメントアウト
  //textタグを上書きする
  // const _text = TYRANO.kag.tag.text;
  // TYRANO.kag.tag.text = $.extend(true, {}, _text, {
  //   start: function (pm) {
  //     const that = TYRANO;
  //     if (
  //       TYRANO.kag.stat.is_script == false &&
  //       TYRANO.kag.variable.tf.is_preview_skip == true
  //     ) {
  //       that.kag.ftag.nextOrder();
  //       return;
  //     }
  //     //本来の処理
  //     // _text.start.bind(TYRANO)(pm);
  //     _text.start.apply(TYRANO, [pm]);
  //   },
  // });
  // TYRANO.kag.ftag.master_tag.text = TYRANO.kag.tag.text;
  // TYRANO.kag.ftag.master_tag.text.kag = TYRANO.kag;
})();
//音楽系のタグを上書きする
//今は処理止まりそうなところのみ。他も必要に応じて追加する
//kag.tmp.ready_audioを強制的にtrueにするだけでもいいかも？

//-----------------------------------------
//参考
//https://note.com/skt_order/n/n99b8e3ee6ac5
//https://note.com/skt_order/n/n4a856b2015b8
//https://scrapbox.io/violetgametips/%E3%83%86%E3%82%A3%E3%83%A9%E3%83%8E%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%97%E3%83%88%E3%81%A7%EF%BC%BBbutton%EF%BC%BD%E3%82%BF%E3%82%B0%E3%81%AE%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88%E5%87%A6%E7%90%86%E3%82%92%E4%B8%8A%E6%9B%B8%E3%81%8D%E3%81%99%E3%82%8B
