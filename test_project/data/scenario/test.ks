;半角英数字とアンダースコアはOK
*ok_1

;アンダースコア開始もOK
*_ok_2

;数字から始まるのはNG
*1ng_1

;空白交じりはNG
*ng_ 2

;ハイフン交じりはNG
*ng-3

;日本語などの2バイト文字は警告
;非推奨なのでハイライトもしません
*ラベル④
 

;TODO
 ;FIXME
;NOTE: TEST
;BUG
;HACK
;♦
;■
;●
;○

//TODO
//FIXME
//NOTE: TEST
//BUG
//HACK
//♦
//■
//●
//○

;重複マクロの警告確認
@macro name="test1"
@endmacro

@macro name="test1"
@endmacro

@macro name="test1"
@endmacro

@jump target="" 


@charaset
