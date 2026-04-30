; issue-134 iscript内でjumpした際にendscriptのstop指定漏れを警告するテスト
; iscript内のJSで startTag('jump'/'call', ...) を検出し、対応する [endscript] に
; stop="true" が無ければ警告が出る

*start

; ====================================================================
; ケース1: iscript内でjumpを呼んでいるが [endscript] に stop="true" が無い
; → [endscript] の "endscript" 部分に黄色い波線が出るはず
; ====================================================================
[iscript]
TYRANO.kag.ftag.startTag('jump', {storage: 'first.ks'});
[endscript]

; ====================================================================
; ケース2: iscript内でjumpを呼んでいて、[endscript stop="true"] になっている
; （警告が出ないこと）
; ====================================================================
[iscript]
TYRANO.kag.ftag.startTag('jump', {storage: 'first.ks'});
[endscript stop="true"]

; ====================================================================
; ケース3: iscript内でcallを呼んでいるが [endscript] に stop="true" が無い
; → [endscript] の "endscript" 部分に黄色い波線が出るはず
; ====================================================================
[iscript]
TYRANO.kag.ftag.startTag('call', {storage: 'first.ks'});
[endscript]

; ====================================================================
; ケース4: iscript内でjump/callを呼んでいない場合（警告が出ないこと）
; ====================================================================
[iscript]
f.issue134_score = 10;
tf.issue134_flag = true;
[endscript]

; ====================================================================
; ケース5: 単に "jump" という単語を含むだけ (変数名等) では警告は出ない
; ====================================================================
[iscript]
var jumpCount = 0;
f.issue134_jump_message = "jump here";
[endscript]

; ====================================================================
; ケース6: ダブルクォート版 startTag("jump", ...) も検出される
; → [endscript] の "endscript" 部分に黄色い波線が出るはず
; ====================================================================
[iscript]
kag.ftag.startTag("jump", {storage: "first.ks"});
[endscript]

[s]
