; =====================================================================
; 08. parameterSpacing (Error)
; 期待メッセージ: 「パラメータ間に半角スペースがありません。...」
; ソース: src/subscriptions/TyranoDiagnostic.ts 1630-1681
; =====================================================================

; --- 発火する例 ---
; ダブルクォート直後にパラメータ名が続く
[bg storage="room.jpg"time="1000"]
; シングルクォートでも同様
[bg storage='room.jpg'time='1000']

; --- 発火しない例 ---
[bg storage="room.jpg" time="1000"]
[bg storage='room.jpg' time='1000']
