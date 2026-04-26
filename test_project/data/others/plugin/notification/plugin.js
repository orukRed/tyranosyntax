// テスト用プラグイン: notification
// updateMacroDataMapByJs の pm/vital 抽出ロジックを検証するための固定フィクスチャ。

tyrano.plugin.kag.tag["notify_init"] = {
    pm: {
        offset_top: "10",
        offset_right: "10",
    },
    start: function (pm) {
        this.kag.ftag.nextOrder();
    },
};

tyrano.plugin.kag.tag["notify"] = {
    vital: ["text"],
    pm: {
        text: "",
        duration: "3000",
        anim_in: "300",
        anim_out: "300",
        style_class: "",
        bg_image: "",
    },
    start: function (pm) {
        this.kag.ftag.nextOrder();
    },
};

tyrano.plugin.kag.tag["notify_clear"] = {
    pm: {
        anim_out: "300",
    },
    start: function (pm) {
        this.kag.ftag.nextOrder();
    },
};
