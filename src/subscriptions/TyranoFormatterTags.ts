/**
 * フォーマッタが使用するタグ定義。
 * 出典: language-configuration.json のコメント部および syntaxes/tyrano.tmLanguage.json。
 */

/** 開始タグ -> 終了タグ。インデント深さの算出に使用する。 */
export const PAIRED_TAGS: ReadonlyMap<string, string> = new Map([
  ["macro", "endmacro"],
  ["if", "endif"],
  ["iscript", "endscript"], // 終了は "endscript"（"endiscript" ではない）
  ["html", "endhtml"],
  ["ignore", "endignore"],
  ["nowait", "endnowait"],
  ["skipstart", "skipstop"],
  ["autostart", "autostop"],
  ["nolog", "endnolog"],
  ["link", "endlink"],
  ["vibrate", "vibrate_stop"],
  ["keyframe", "endkeyframe"],
  ["kanim", "stop_kanim"],
  ["xanim", "stop_xanim"],
  ["vostart", "vostop"],
  ["speak_on", "speak_off"],
  ["3d_event_start", "3d_event_stop"],
  ["3d_anim", "3d_anim_stop"],
  ["3d_gyro", "3d_gyro_stop"],
  ["bgcamera", "stop_bgcamera"],
]);

/** 終了タグ -> 開始タグ。PAIRED_TAGS から導出。 */
export const END_TO_START: ReadonlyMap<string, string> = new Map(
  Array.from(PAIRED_TAGS, ([start, end]) => [end, start]),
);

/** 中間タグ。深さ-1 で出力し、深さの純増減はしない（if に属する）。 */
export const MID_TAGS: ReadonlySet<string> = new Set([
  "elsif",
  "elseif",
  "else",
]);

/** 内側を生のまま取り出して prettier に渡すタグ。値は prettier のパーサ名。 */
export const RAW_CAPTURE_TAGS: ReadonlyMap<string, "babel" | "html"> = new Map([
  ["iscript", "babel"],
  ["html", "html"],
]);
