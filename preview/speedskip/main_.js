//NOTE:即時関数（匿名関数）
(function () {
  /**
   *
   * 爆速スキッププラグイン
   *
   */

  /**
   * 変数定義
   */
  let tagName = '';
  const SKIP_SPEED = TYRANO.kag.variable.tf._speedSkip;

  //一時変数消しておく
  delete TYRANO.kag.variable.tf._speedSkip;

  //対象パラメータリスト
  const paramList = [
    'time',
    'speed',
    'in_delay',
    'out_delay',
    'show_time',
    'show_delay',
    'select_time',
    'select_delay',
    'reject_time',
    'reject_delay',
    'pos_change_time',
    'talk_anim_time',
  ];

  //除外タグリスト
  const excludeList = ['configdelay'];

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
   * checkCondとconvertEntityをオーバーライドしている
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
    const pm = $.extend(true, {}, $.cloneObject(TYRANO.kag.ftag.master_tag[tagName].pm), converted);
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
})();
