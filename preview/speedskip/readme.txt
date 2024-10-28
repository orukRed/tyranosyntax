【爆速スキッププラグイン】

スキップ中、時間指定系のパラメータの値を小さくして爆速でスキップできるようにするプラグインです。


■できること
・時間指定系のパラメータの値を変更
・時間変更時の値指定


■使い方
このテキストが入っているフォルダごと「data/others/plugin」フォルダに置きます。
それからfirst.ksとかに以下のように記述してください。
記述した時点からスキップが爆速になります。

[plugin name=speedskip]
指定可能属性
speed：スキップ中の演出時間をミリ秒で指定、未指定の場合10


■使い方のコツ
スキップ中に演出時間をカットするパラメータは以下のとおりです。
すべてのタグを対象に、以下のパラメータが含まれる場合、パラメータに指定された値を変更します。
time
speed
in_delay
out_delay
show_time
show_delay
select_time
select_delay
reject_time
reject_delay
pos_change_time
talk_anim_time

また、以下のタグは値変更の対象外です。
configdelay


■ライセンス
このプラグインはMITライセンスです。
©2023 さくた@skt_tyrano
原文：https://opensource.org/licenses/mit-license.php
和訳：https://licenses.opensource.jp/MIT/MIT.html


■注意事項
ティラノスクリプトv520以降で動作確認しています。
このプラグインを使用したことで生じたあらゆる問題について、製作者は責任を負いません。


■製作者
さくた（@skt_tyrano）
https://skskpnt.app


■更新履歴
2023/06/03  v1.0.0
・正式版公開