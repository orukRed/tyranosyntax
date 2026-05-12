// テスト用プラグイン: notify_show
// `const cfg = {...}; TYRANO.kag.ftag.master_tag.X = object(cfg);` という
// ラッパパターンで定義されたタグからもpm/vitalが抽出できることを検証する。
(function () {
  const p_notify = {
    vital: ["text"],
    pm: {
      name: "",
      text: "",
      height: "",
      delay: "500",
    },
    start: function (pm) {
      this.kag.ftag.nextOrder();
    },
  };

  TYRANO.kag.ftag.master_tag.p_notify = object(p_notify);
})();
