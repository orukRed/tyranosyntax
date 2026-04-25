; =====================================================================
; 04. existResource (Error)
; 期待メッセージ: 「リソースファイル "XXX" が見つかりません。」
; ソース: src/subscriptions/TyranoDiagnostic.ts 526-610
; =====================================================================

; --- 発火する例 ---
; data/bgimage/res_missing_bg.jpg は無い
[bg storage="res_missing_bg.jpg"]
; data/bgm/res_missing.ogg は無い
[playbgm storage="res_missing.ogg"]
; data/fgimage/res_missing_fg.png は無い
[image storage="res_missing_fg.png" layer="0"]

; --- 発火しない例 ---
; 実在するリソース
[bg storage="room.jpg"]
[playbgm storage="music.ogg"]
; storage="none" は特別扱いでエラーにならない
[image storage="none" layer="0"]
