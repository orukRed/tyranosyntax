import { InformationWorkSpace } from './InformationWorkSpace';


export class InformationExtension {
	private static instance: InformationExtension = new InformationExtension();
	private constructor() { }
	public static getInstance(): InformationExtension {
		return this.instance;
	}

	public static path: string | undefined = undefined;

	//FIXME:特定環境でのみ、タグ補完が効かない場合があるのでその対応用 対応完了次第削除
	public static snippetObject = {
		"l": {
			"name": "l",
			"summary": "クリック待ち",
			"category": "メッセージ・テキスト",
			"description": "このタグの位置でプレイヤーのクリックを待ちます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"p": {
			"name": "p",
			"summary": "クリック待ち＋改ページ",
			"category": "メッセージ・テキスト",
			"description": "プレイヤーのクリックを待ちます。\nプレイヤーがクリックすると改ページされます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"graph": {
			"name": "graph",
			"summary": "インライン画像表示",
			"category": "メッセージ・テキスト",
			"description": "任意の画像をメッセージ中に表示します。絵文字や特殊文字などに活用できます。\n表示する画像はdata/imageフォルダに配置してください。\nよく使う記号についてはマクロを組んでおくと楽です。",
			"parameters": [
				{
					"name": "storage",
					"required": true,
					"description": "表示する画像ファイル名を指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"r": {
			"name": "r",
			"summary": "改行",
			"category": "メッセージ・テキスト",
			"description": "改行します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"er": {
			"name": "er",
			"summary": "メッセージレイヤの文字の消去",
			"category": "メッセージ・テキスト",
			"description": "現在の操作対象のメッセージレイヤの文字を消去します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"cm": {
			"name": "cm",
			"summary": "すべてのメッセージレイヤのクリア",
			"category": "メッセージ・テキスト",
			"description": "すべてのメッセージレイヤの文字を消去します。[button][glink][html]タグなどで表示した要素も消去されます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"ct": {
			"name": "ct",
			"summary": "メッセージレイヤにのリセット",
			"category": "メッセージ・テキスト",
			"description": "すべてのメッセージレイヤの文字が消去されます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"current": {
			"name": "current",
			"summary": "操作対象のメッセージレイヤの指定",
			"category": "メッセージ・テキスト",
			"description": "操作対象とするメッセージレイヤを指定します。以後、テキストや[font]タグでの文字属性の指定、[l]タグ等のクリック待ちなどはこのレイヤに対して行われます。",
			"parameters": [
				{
					"name": "layer",
					"required": false,
					"description": "操作対象のメッセージレイヤを指定します。省略すると、現在のメッセージレイヤとみなされます。"
				},
				{
					"name": "page",
					"required": false,
					"description": "レイヤの表ページと裏ページ、どちらを対象とするか。foreまたはbackで指定します。省略すると、表ページとみなされます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"fuki_start": {
			"name": "fuki_start",
			"summary": "メッセージレイヤをふきだし化する",
			"category": "メッセージ・テキスト",
			"description": "メッセージレイヤを漫画のふきだし風に表現できます。",
			"parameters": [
				{
					"name": "layer",
					"required": false,
					"description": "対象とするメッセージレイヤを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"fuki_stop": {
			"name": "fuki_stop",
			"summary": "メッセージレイヤのふきだし化を無効にする",
			"category": "メッセージ・テキスト",
			"description": "ふきだし表示を停止します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"fuki_chara": {
			"name": "fuki_chara",
			"summary": "ふきだしのキャラクター登録",
			"category": "メッセージ・テキスト",
			"description": "ふきだしのデザインをキャラクターごとに設定できます。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "キャラクター名を指定します。キャラクターがいないときデザインを設定するにはothersを指定します。"
				},
				{
					"name": "left",
					"required": false,
					"description": "どの位置にふきだしを表示するかを指定します。（キャラクター画像左端からの相対位置）"
				},
				{
					"name": "top",
					"required": false,
					"description": "どの位置にふきだしを表示するかを指定します。（キャラクター画像上端からの相対位置）"
				},
				{
					"name": "sippo",
					"required": false,
					"description": "しっぽをどの方向に表示するかを指定します。top(上)、 bottom(下)、left(左)、right(右)"
				},
				{
					"name": "sippo_left",
					"required": false,
					"description": "ふきだしの位置がtopかbottomの場合、しっぽを表示する左端からの位置を指定できます。"
				},
				{
					"name": "sippo_top",
					"required": false,
					"description": "ふきだしの位置がleftかrightの場合、しっぽを表示する上端からの位置を指定できます。"
				},
				{
					"name": "sippo_width",
					"required": false,
					"description": "しっぽの幅を指定できます。"
				},
				{
					"name": "sippo_top",
					"required": false,
					"description": "しっぽの高さを指定できます。"
				},
				{
					"name": "max_width",
					"required": false,
					"description": "ふきだしのサイズは自動的に調整されますが、その際の横幅の上限サイズを指定できます。"
				},
				{
					"name": "fix_width",
					"required": false,
					"description": "これを指定することで、ふきだしの横幅の自動調節機能を停止し、指定した横幅で固定できます。"
				},
				{
					"name": "color",
					"required": false,
					"description": "ふきだしの表示色を0xRRGGBB形式で指定します。"
				},
				{
					"name": "border_color",
					"required": false,
					"description": "外枠の線の色を0xRRGGBB形式で指定します。border_sizeの指定が同時に必要です。"
				},
				{
					"name": "border_size",
					"required": false,
					"description": "外枠の線の太さを指定します。0を指定すると外枠は表示されません。初期値は0。"
				},
				{
					"name": "opacity",
					"required": false,
					"description": "ふきだしの不透明度を0～255の数値で指定します。0で完全に透明。（文字の不透明度や、レイヤ自体の不透明度ではありません）"
				},
				{
					"name": "radius",
					"required": false,
					"description": "ふきだしの角の丸みを数値で指定します。例：10(控えめな角丸)、30(普通の角丸)、100(巨大な角丸)"
				},
				{
					"name": "font_color",
					"required": false,
					"description": "フォントの色を0xRRGGBB形式で指定します。"
				},
				{
					"name": "font_size",
					"required": false,
					"description": "フォントサイズを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"ptext": {
			"name": "ptext",
			"summary": "レイヤにテキストを表示",
			"category": "メッセージ・テキスト",
			"description": "前景レイヤにテキストを表示します。メッセージウィンドウのテキストとは別に画面上にテキストを出したいときに使用できます。",
			"parameters": [
				{
					"name": "layer",
					"required": true,
					"description": "対象とする前景レイヤを0以上の整数で指定します。"
				},
				{
					"name": "page",
					"required": false,
					"description": "レイヤの表ページと裏ページ、どちらを対象とするか。foreまたはbackで指定します。省略すると、表ページとみなされます。"
				},
				{
					"name": "text",
					"required": false,
					"description": "表示するテキストの内容。"
				},
				{
					"name": "x",
					"required": true,
					"description": "テキストの左端位置を指定します。（ピクセル）"
				},
				{
					"name": "y",
					"required": true,
					"description": "テキストの上端位置を指定します。（ピクセル）"
				},
				{
					"name": "vertical",
					"required": false,
					"description": "縦書きにするかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "size",
					"required": false,
					"description": "フォントサイズをピクセル単位で指定します。"
				},
				{
					"name": "face",
					"required": false,
					"description": "フォントの種類を指定します。非KAG互換ですが、ウェブフォントも使用できます。"
				},
				{
					"name": "color",
					"required": false,
					"description": "フォントの色を0xRRGGBB形式で指定します。"
				},
				{
					"name": "bold",
					"required": false,
					"description": "太字にする場合はboldと指定します。（このパラメータをCSSのfont-styleにセットします）\nV515以降：trueでも太字にできるようにしました。"
				},
				{
					"name": "edge",
					"required": false,
					"description": "文字の縁取りを有効にできます。縁取りする文字色を0xRRGGBB形式で指定します。\nV515以降：縁取りの太さもあわせて指定できます。4px 0xFF0000のように、色の前に縁取りの太さをpx付きで記述します。太さと色は半角スペースで区切ってください。さらに4px 0xFF0000, 2px 0xFFFFFFのようにカンマ区切りで複数の縁取りを指定できます。"
				},
				{
					"name": "shadow",
					"required": false,
					"description": "文字に影をつけます。影の色を0xRRGGBB形式で指定します。縁取りをしている場合は無効化されます。"
				},
				{
					"name": "name",
					"required": false,
					"description": "[anim]タグなどからこの名前でアニメーションさせられます。カンマで区切ることで複数指定できます。（高度な知識：name属性で指定した値はHTMLのクラス属性になります）"
				},
				{
					"name": "width",
					"required": false,
					"description": "テキスト表示部分の横幅をピクセルで指定します。"
				},
				{
					"name": "align",
					"required": false,
					"description": "文字の横方向に関する位置を指定できます。widthパラメータを同時に指定する必要があります。left(左寄せ)、center(中央寄せ)、right（右寄せ)"
				},
				{
					"name": "time",
					"required": false,
					"description": "フェードイン時間をミリ秒単位で指定します。これを指定すると、画像が透明な状態から徐々に表示されていきます。省略すると、一瞬で表示されます。"
				},
				{
					"name": "overwrite",
					"required": false,
					"description": "上書きするかどうかをtrueまたはfalseで指定します。trueを指定すると、同じnameが指定されたテキストがすでに存在している場合に、新規テキストを追加するのではなく既存のテキストの内容を書き変える処理を行います。"
				},
				{
					"name": "gradient",
					"required": false,
					"description": "V515以降：文字にグラデーションを適用することができます。CSSのグラデーション関数を指定します。グラデーション関数とはlinear-gradient(45deg, red 0%, yellow 100%)のような文字列です。\nグラデーション関数を簡単に作れるサイトがWeb上にいくつか存在しますので、「CSS グラデーション ジェネレーター」で検索してみてください。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"mtext": {
			"name": "mtext",
			"summary": "演出テキスト",
			"category": "メッセージ・テキスト",
			"description": "多彩な演出効果をもったテキストを画面上に表示します。",
			"parameters": [
				{
					"name": "layer",
					"required": false,
					"description": "対象とする前景レイヤを0以上の整数で指定します。"
				},
				{
					"name": "page",
					"required": false,
					"description": "レイヤの表ページと裏ページ、どちらを対象とするか。foreまたはbackで指定します。省略すると、表ページとみなされます。"
				},
				{
					"name": "text",
					"required": false,
					"description": "表示するテキストの内容を指定します。"
				},
				{
					"name": "x",
					"required": true,
					"description": "テキストの左端位置を指定します。（ピクセル）"
				},
				{
					"name": "y",
					"required": true,
					"description": "テキストの上端位置を指定します。（ピクセル）"
				},
				{
					"name": "vertical",
					"required": false,
					"description": "縦書きにするかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "size",
					"required": false,
					"description": "フォントサイズをピクセルで指定します。"
				},
				{
					"name": "face",
					"required": false,
					"description": "フォントの種類を指定します。Webフォントを使用する場合はtyrano/css/font.cssに定義を記述してください。"
				},
				{
					"name": "color",
					"required": false,
					"description": "フォントの色を0xRRGGBB形式で指定します。"
				},
				{
					"name": "width",
					"required": false,
					"description": "テキスト表示部分の横幅をピクセルで指定します。"
				},
				{
					"name": "align",
					"required": false,
					"description": "文字の横方向に関する位置を指定できます。同時にwidthパラメータを指定する必要があります。left(左寄せ)、center(中央寄せ)、right(右寄せ)"
				},
				{
					"name": "name",
					"required": false,
					"description": "[anim]タグなどからこの名前でアニメーションさせられます。カンマで区切ることで複数指定できます。（高度な知識：name属性で指定した値はHTMLのクラス属性になります）"
				},
				{
					"name": "bold",
					"required": false,
					"description": "太字にする場合はboldと指定します。"
				},
				{
					"name": "edge",
					"required": false,
					"description": "文字の縁取りを有効にできます。縁取り色を0xRRGGBB形式で指定します。"
				},
				{
					"name": "shadow",
					"required": false,
					"description": "文字に影をつけます。影の色を0xRRGGBB形式で指定します。縁取りをしている場合は無効化されます。"
				},
				{
					"name": "fadeout",
					"required": false,
					"description": "テキスト表示後にフェードアウトを実行するか否かをtrueまたはfalseで指定します。残った文字を消す場合は[freeimage]タグや[free]タグを使います。"
				},
				{
					"name": "time",
					"required": false,
					"description": "テキストが静止している時間をミリ秒で指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "アニメーションの完了を待つかどうか。trueまたはfalseを指定します。falseを指定すると、テキストの演出完了を待たずに次のタグに進みます。"
				},
				{
					"name": "in_effect",
					"required": false,
					"description": "文字が表示される際のアニメーション演出を指定します。"
				},
				{
					"name": "in_delay",
					"required": false,
					"description": "文字が表示される際の速度を指定します。何秒遅れて1文字が表示されるかをミリ秒で指定します。"
				},
				{
					"name": "in_delay_scale",
					"required": false,
					"description": "１文字にかかるアニメーションの比率を指定します。"
				},
				{
					"name": "in_sync",
					"required": false,
					"description": "trueを指定すると、すべての文字が同時にアニメーションを開始します。"
				},
				{
					"name": "in_shuffle",
					"required": false,
					"description": "trueを指定すると、文字アニメーションのタイミングがランダムに実行されます。"
				},
				{
					"name": "in_reverse",
					"required": false,
					"description": "trueを指定すると、文字が後ろから表示されていきます。\""
				},
				{
					"name": "out_effect",
					"required": false,
					"description": "文字が消える際のアニメーション演出を指定します。指定できるアニメーションは http://tyrano.jp/mtext/ を参照。"
				},
				{
					"name": "out_delay",
					"required": false,
					"description": "文字が消える際の速度を指定します。何秒遅れて1文字が消えるかをミリ秒で指定します。"
				},
				{
					"name": "out_delay_scale",
					"required": false,
					"description": "１文字にかかるアニメーションの比率を指定します。"
				},
				{
					"name": "out_sync",
					"required": false,
					"description": "trueを指定すると、すべての文字が同時にアニメーションを開始します。"
				},
				{
					"name": "out_shuffle",
					"required": false,
					"description": "trueを指定すると、文字アニメーションのタイミングがランダムに実行されます。"
				},
				{
					"name": "out_reverse",
					"required": false,
					"description": "trueを指定すると、文字が後ろから消えていきます。\""
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"ruby": {
			"name": "ruby",
			"summary": "ルビを振る",
			"category": "メッセージ・テキスト",
			"description": "次の一文字に対するルビを指定します。\nルビを表示させたい場合は毎回指定する必要があります。\n複数の文字にルビを振る場合は、一文字毎にルビを指定する必要があります。",
			"parameters": [
				{
					"name": "text",
					"required": true,
					"description": "ルビとして表示させる文字を指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"mark": {
			"name": "mark",
			"summary": "テキストマーカー",
			"category": "メッセージ・テキスト",
			"description": "テキストに蛍光ペンでマーカーを引いたような効果をつけることができます。\n色やサイズも指定可能。",
			"parameters": [
				{
					"name": "color",
					"required": false,
					"description": "マーカーの色を0xRRGGBB形式で指定します。デフォルトは黄色。"
				},
				{
					"name": "font_color",
					"required": false,
					"description": "マーカーを引いたときのフォントの色を0xRRGGBB形式で指定します。省略すると、ゲーム中のフォント色を継承します。"
				},
				{
					"name": "size",
					"required": false,
					"description": "マーカーのサイズを0〜100で指定します。たとえば50だとテキストの下半分にマーカーが引かれます。10だとただの下線に近くなります。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"endmark": {
			"name": "endmark",
			"summary": "テキストマーカー終了",
			"category": "メッセージ・テキスト",
			"description": "[mark]タグで開始したテキストマーカーを終了します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"config_record_label": {
			"name": "config_record_label",
			"summary": "既読管理の設定",
			"category": "メッセージ関連の設定",
			"description": "既読管理の設定を変更できます。",
			"parameters": [
				{
					"name": "color",
					"required": false,
					"description": "既読テキスト色を0xRRGGBB形式で指定します。"
				},
				{
					"name": "skip",
					"required": false,
					"description": "プレイヤーが未読テキストをスキップできるかどうか。trueまたはfalseで指定します。falseを指定すると、プレイヤーが未読テキストに到達したときにスキップが解除されます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"position": {
			"name": "position",
			"summary": "メッセージウィンドウの属性変更",
			"category": "メッセージ関連の設定",
			"description": "メッセージウィンドウに対する様々な属性を指定します。\nいずれの属性も、省略すれば設定は変更されません。",
			"parameters": [
				{
					"name": "layer",
					"required": false,
					"description": "対象とするメッセージレイヤを指定します。"
				},
				{
					"name": "page",
					"required": false,
					"description": "レイヤの表ページと裏ページ、どちらを対象とするか。foreまたはbackで指定します。省略すると、表ページとみなされます。"
				},
				{
					"name": "left",
					"required": false,
					"description": "メッセージウィンドウの左端位置を指定します。（ピクセル）"
				},
				{
					"name": "top",
					"required": false,
					"description": "メッセージウィンドウの上端位置を指定します。（ピクセル）"
				},
				{
					"name": "width",
					"required": false,
					"description": "メッセージウィンドウの横幅を指定します。（ピクセル）"
				},
				{
					"name": "height",
					"required": false,
					"description": "メッセージウィンドウの高さを指定します。（ピクセル）"
				},
				{
					"name": "frame",
					"required": false,
					"description": "メッセージウィンドウのフレーム画像として表示させる画像を指定します。\n画像サイズはwidthとheight属性に準じて調整してください。margin属性で実際にメッセージが表示される箇所の調整も行いましょう。\nnoneと指定することで標準枠に戻すこともできます。"
				},
				{
					"name": "color",
					"required": false,
					"description": "メッセージウィンドウの表示色を0xRRGGBB形式で指定します。"
				},
				{
					"name": "border_color",
					"required": false,
					"description": "外枠の線が有効な場合の色を0xRRGGBB形式で指定します。border_size属性の指定が同時に必要です"
				},
				{
					"name": "border_size",
					"required": false,
					"description": "外枠の線が有効な場合の太さを指定します。0を指定すると外枠は表示されません。初期値は0です。"
				},
				{
					"name": "opacity",
					"required": false,
					"description": "メッセージウィンドウの不透明度を0～255の数値で指定します。0で完全に透明。（文字の不透明度や、レイヤ自体の不透明度ではありません）"
				},
				{
					"name": "marginl",
					"required": false,
					"description": "メッセージウィンドウの左余白を指定します。"
				},
				{
					"name": "margint",
					"required": false,
					"description": "メッセージウィンドウの上余白を指定します。"
				},
				{
					"name": "marginr",
					"required": false,
					"description": "メッセージウィンドウの右余白を指定します。"
				},
				{
					"name": "marginb",
					"required": false,
					"description": "メッセージウィンドウの下余白を指定します。"
				},
				{
					"name": "margin",
					"required": false,
					"description": "メッセージウィンドウの余白を一括で指定します。たとえば30と指定すると上下左右すべてに30pxの余白ができます。\nカンマ区切りで方向ごとの余白を一括指定することもできます。上下,左右、上,左右,下、上,右,下,左のように指定できます（方向の部分は数値に変えてください）。"
				},
				{
					"name": "radius",
					"required": false,
					"description": "メッセージウィンドウの角の丸みを数値で指定します。例：10(控えめな角丸)、30(普通の角丸)、100(巨大な角丸)"
				},
				{
					"name": "vertical",
					"required": false,
					"description": "メッセージウィンドウを縦書きモードにするかどうか。trueまたはfalseで指定します。trueで縦書き、falseで横書き。"
				},
				{
					"name": "visible",
					"required": false,
					"description": "メッセージレイヤを表示状態にするかどうか。trueまたはfalseを指定すると、同時にメッセージレイヤの表示状態を操作できます。"
				},
				{
					"name": "gradient",
					"required": false,
					"description": "背景にグラデーションを適用することができます。CSSグラデーション形式で指定します。CSSグラデーションとは、たとえばlinear-gradient(45deg, red 0%, yellow 100%)のような形式です。\nCSSグラデーションを簡単に作れるサイトがWeb上にいくつか存在しますので、「CSS グラデーション ジェネレーター」で検索してみてください。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"hidemessage": {
			"name": "hidemessage",
			"summary": "メッセージレイヤの一時的な非表示",
			"category": "メッセージ関連の設定",
			"description": "メッセージレイヤを一時的に隠してクリックを待ちます。テキストは消去されません。メニューから「メッセージを消す」を選んだのと同じ動作を行います。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"font": {
			"name": "font",
			"summary": "テキストスタイルの変更",
			"category": "メッセージ関連の設定",
			"description": "テキストのスタイルを変更します。スタイルはメッセージレイヤごとに個別に設定できます。",
			"parameters": [
				{
					"name": "size",
					"required": false,
					"description": "文字サイズを指定します"
				},
				{
					"name": "color",
					"required": false,
					"description": "文字色を0xRRGGBB形式で指定します。"
				},
				{
					"name": "bold",
					"required": false,
					"description": "太字にするかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "italic",
					"required": false,
					"description": "イタリック体にするかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "face",
					"required": false,
					"description": "フォントの種類を指定します。Webフォントを使用する場合はtyrano/css/font.cssに定義を記述してください。"
				},
				{
					"name": "edge",
					"required": false,
					"description": "文字の縁取りを有効にできます。縁取り色を0xRRGGBB形式等で指定します。縁取りを解除する場合はnoneと指定します。\nV515以降：縁取りの太さもあわせて指定できます。4px 0xFF0000のように、色の前に縁取りの太さをpx付きで記述します。太さと色は半角スペースで区切ってください。さらに4px 0xFF0000, 2px 0xFFFFFFのようにカンマ区切りで複数の縁取りを指定できます。"
				},
				{
					"name": "edge_method",
					"required": false,
					"description": "縁取りの実装方式を選択できます。指定できるキーワードはshadowまたはfilter。"
				},
				{
					"name": "shadow",
					"required": false,
					"description": "文字に影をつけます。影の色を0xRRGGBB形式で指定します。影を解除する場合はnoneと指定します。"
				},
				{
					"name": "effect",
					"required": false,
					"description": "フォントの表示演出にアニメーションを設定できます。noneを指定すると無効。指定できるキーワードは以下のとおり。fadeInfadeInDownfadeInLeftfadeInRightfadeInUprotateInzoomInslideInbounceInvanishInpuffInrollInnone"
				},
				{
					"name": "effect_speed",
					"required": false,
					"description": "effectパラメータがnone以外の場合に、表示されるまでの時間を指定します。デフォルトは0.2sです。sは秒を表します。"
				},
				{
					"name": "gradient",
					"required": false,
					"description": "V515以降：文字にグラデーションを適用することができます。CSSグラデーション形式で指定します。CSSグラデーションとは、たとえばlinear-gradient(45deg, red 0%, yellow 100%)のような形式です。\nCSSグラデーションを簡単に作れるサイトがWeb上にいくつか存在しますので、「CSS グラデーション ジェネレーター」で検索してみてください。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"deffont": {
			"name": "deffont",
			"summary": "デフォルトのテキストスタイル設定",
			"category": "メッセージ関連の設定",
			"description": "現在操作対象のメッセージレイヤに対する、デフォルトのテキストスタイルを指定します。",
			"parameters": [
				{
					"name": "size",
					"required": false,
					"description": "文字サイズを指定します"
				},
				{
					"name": "color",
					"required": false,
					"description": "文字色を0xRRGGBB形式で指定します。"
				},
				{
					"name": "bold",
					"required": false,
					"description": "太字にするかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "italic",
					"required": false,
					"description": "イタリック体にするかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "face",
					"required": false,
					"description": "フォントの種類を指定します。Webフォントも利用可能。Webフォントを使用する場合、フォントファイルをdata/othersフォルダに配置し、tyrano.cssで@font-faceを設定する必要があります。"
				},
				{
					"name": "edge",
					"required": false,
					"description": "文字の縁取りを有効にできます。縁取り色を0xRRGGBB形式等で指定します。縁取りを解除する場合はnoneと指定します。\nV515以降：縁取りの太さもあわせて指定できます。4px 0xFF0000のように、色の前に縁取りの太さをpx付きで記述します。太さと色は半角スペースで区切ってください。さらに4px 0xFF0000, 2px 0xFFFFFFのようにカンマ区切りで複数の縁取りを指定できます。"
				},
				{
					"name": "edge_method",
					"required": false,
					"description": "縁取りの実装方式を選択できます。指定できるキーワードはshadowまたはfilter。"
				},
				{
					"name": "shadow",
					"required": false,
					"description": "文字に影をつけます。影の色を0xRRGGBB形式で指定します。影を解除する場合はnoneと指定します。"
				},
				{
					"name": "effect",
					"required": false,
					"description": "フォントの表示演出にアニメーションを設定できます。noneを指定すると無効。指定できるキーワードは以下。fadeInfadeInDownfadeInLeftfadeInRightfadeInUprotateInzoomInslideInbounceInvanishInpuffInrollInnone"
				},
				{
					"name": "effect_speed",
					"required": false,
					"description": "effectパラメータがnone以外の場合に、表示されるまでの時間を指定します。デフォルトは0.2sです。sは秒を表します。"
				},
				{
					"name": "gradient",
					"required": false,
					"description": "V515以降：文字にグラデーションを適用することができます。CSSのグラデーション関数を指定します。グラデーション関数とはlinear-gradient(45deg, red 0%, yellow 100%)のような文字列です。\nグラデーション関数を簡単に作れるサイトがWeb上にいくつか存在しますので、「CSS グラデーション ジェネレーター」で検索してみてください。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"message_config": {
			"name": "message_config",
			"summary": "メッセージコンフィグ",
			"category": "メッセージ関連の設定",
			"description": "ティラノスクリプトV515以降。\nメッセージに関連する詳細な設定を行えます。\n省略した属性の設定は変更されません。",
			"parameters": [
				{
					"name": "ch_speed_in_click",
					"required": false,
					"description": "文字表示の途中でクリックされたあとの文字表示速度。1文字あたりの表示時間をミリ秒で指定します。\ndefaultと指定した場合はクリック前の文字表示速度を引き継ぐようになります。"
				},
				{
					"name": "effect_speed_in_click",
					"required": false,
					"description": "文字表示の途中でクリックされたあとの文字エフェクト速度。0.2s、200ms、あるいは単に200などで指定します。例はいずれも200ミリ秒となります。\ndefaultと指定した場合はクリック前の文字表示速度を引き継ぐようになります。"
				},
				{
					"name": "edge_overlap_text",
					"required": false,
					"description": "縁取りテキストの縁をひとつ前の文字に重ねるかどうか。trueまたはfalseで指定します。現状はedge_methodがstrokeの場合にのみ有効なパラメータです。"
				},
				{
					"name": "speech_bracket_float",
					"required": false,
					"description": "キャラのセリフの最初のカギカッコを左側に浮かして、開始カギカッコの下に文字が周りこまないようにするための設定です。trueを指定すると、開始カギカッコだけが左側にずれます。falseで無効。trueのかわりに20のような数値を指定することで、開始カギカッコを左側にずらす量を直接指定できます。"
				},
				{
					"name": "speech_margin_left",
					"required": false,
					"description": "speech_bracket_floatが有効のときに、さらにテキスト全体を右側に動かすことができます。trueで有効、falseで無効。20のように数値で直接指定することで全体を右側にずらす量を直接指定できます。"
				},
				{
					"name": "kerning",
					"required": false,
					"description": "字詰めを有効にするか。trueまたはfalseで指定します。フォント、もともとの字間設定、プレイヤーの使用ブラウザによっては効果が見られないこともあります。（高度な知識：CSSのfont-feature-settingsプロパティを設定する機能です）"
				},
				{
					"name": "add_word_nobreak",
					"required": false,
					"description": "ワードブレイク(単語の途中で自然改行される現象)を禁止する単語を追加できます。カンマ区切りで複数指定可能。"
				},
				{
					"name": "remove_word_nobreak",
					"required": false,
					"description": "一度追加したワードブレイク禁止単語を除外できます。カンマ区切りで複数指定可能。"
				},
				{
					"name": "line_spacing",
					"required": false,
					"description": "行間のサイズをpx単位で指定できます。"
				},
				{
					"name": "letter_spacing",
					"required": false,
					"description": "字間のサイズをpx単位で指定できます。"
				},
				{
					"name": "control_line_break",
					"required": false,
					"description": "禁則処理を手動で行なうかどうかをtrueまたはfalseで指定します。。や、などの特定の文字が行頭に来ていたとき、そのひとつ前の文字で改行するようにします。基本的にはこれを指定しなくても自動で禁則処理が行われますが、フォントの設定（エフェクトや縁取りなど）によっては禁則処理が自動で行われなくなることがあるので、その場合はこのパラメータにtrueを指定してみてください。"
				},
				{
					"name": "control_line_break_chars",
					"required": false,
					"description": "行頭に来ていたときに禁則処理を行なう文字をまとめて指定します。デフォルトでは、。）」』】,.)]が禁則処理の対象です。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"delay": {
			"name": "delay",
			"summary": "文字の表示速度の設定",
			"category": "メッセージ関連の設定",
			"description": "文字の表示速度を指定します。\n文字表示をノーウェイトにするには[nowait]タグを使うこともできます。",
			"parameters": [
				{
					"name": "speed",
					"required": false,
					"description": "文字の表示速度を指定します。小さいほど早くなります。\nここで指定した値は、次の1文字を表示するまでの時間（ミリ秒）として解釈されます。たとえば1000と指定すると1秒ごとに1文字ずつ表示されます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"resetdelay": {
			"name": "resetdelay",
			"summary": "文字の表示速度をデフォルトに戻す",
			"category": "メッセージ関連の設定",
			"description": "文字の表示速度をデフォルト速度に戻します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"configdelay": {
			"name": "configdelay",
			"summary": "デフォルトの文字の表示速度の設定",
			"category": "メッセージ関連の設定",
			"description": "デフォルトの文字の表示速度を指定します。\nつまり、[resetdelay]タグを使用したときにこの速度に戻るようになります。\nコンフィグ画面などでゲーム全体の文字速度を変更したい場合にこのタグを使います。",
			"parameters": [
				{
					"name": "speed",
					"required": false,
					"description": "文字の表示速度を指定します。小さいほど早くなります。\nここで指定した値は、次の1文字を表示するまでの時間（ミリ秒単位）として解釈されます。たとえば1000と指定すると1秒ごとに1文字表示されていきます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"nowait": {
			"name": "nowait",
			"summary": "テキスト瞬間表示モードの開始",
			"category": "メッセージ関連の設定",
			"description": "テキスト瞬間表示モードを開始します。このモード中は、テキスト全体が一瞬で表示されます。文字が1文字ずつ追加されていく処理（通常の処理）は行われません。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"endnowait": {
			"name": "endnowait",
			"summary": "テキスト瞬間表示モードの停止",
			"category": "メッセージ関連の設定",
			"description": "[nowait]によるテキスト瞬間表示モードを停止します。\nテキストの表示速度は[nowait]タグを指定する前の状態に戻ります。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"resetfont": {
			"name": "resetfont",
			"summary": "テキストスタイルのリセット",
			"category": "メッセージ関連の設定",
			"description": "テキストスタイルをもとに戻します。すなわち[deffont]で指定されたスタイルにリセットされます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"skipstart": {
			"name": "skipstart",
			"summary": "スキップモード開始",
			"category": "メッセージ関連の設定",
			"description": "スキップモードを開始します。テキストが一瞬で表示されるようになります。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"skipstop": {
			"name": "skipstop",
			"summary": "スキップモード停止",
			"category": "メッセージ関連の設定",
			"description": "スキップモードを解除します。[cancelskip]と同じ動作。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"cancelskip": {
			"name": "cancelskip",
			"summary": "スキップモード解除",
			"category": "メッセージ関連の設定",
			"description": "スキップモードを解除します。[skipstop]と同じ動作。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"autostart": {
			"name": "autostart",
			"summary": "オートモード開始",
			"category": "メッセージ関連の設定",
			"description": "オートモードを開始します。テキストの文字数に応じた時間経過によってクリック待ちを自動的で通過するようになります。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"autostop": {
			"name": "autostop",
			"summary": "オートモード停止",
			"category": "メッセージ関連の設定",
			"description": "オートモードを停止します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"autoconfig": {
			"name": "autoconfig",
			"summary": "オート設定",
			"category": "メッセージ関連の設定",
			"description": "オートモードに関する設定を行います。",
			"parameters": [
				{
					"name": "speed",
					"required": false,
					"description": "オートモード時のスピードをミリ秒で指定してください"
				},
				{
					"name": "clickstop",
					"required": false,
					"description": "画面クリック時にオートモードを停止するかどうか。trueまたはfalseで指定します。falseを指定すると、画面をクリックしてもオートモードが止まらないようになります。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"position_filter": {
			"name": "position_filter",
			"summary": "メッセージウィンドウ裏にフィルター効果",
			"category": "メッセージ関連の設定",
			"description": "メッセージウィンドウの裏側にフィルター効果をかけることができます。\nこれによって、たとえばメッセージウィンドウをすりガラスのように見せることができます。",
			"parameters": [
				{
					"name": "layer",
					"required": false,
					"description": "対象とするメッセージレイヤを指定します。"
				},
				{
					"name": "page",
					"required": false,
					"description": "レイヤの表ページと裏ページ、どちらを対象とするか。foreまたはbackで指定します。省略すると、表ページとみなされます。"
				},
				{
					"name": "remove",
					"required": false,
					"description": "trueまたはfalse。trueを指定すると、フィルターを除去する処理を行います。"
				},
				{
					"name": "grayscale",
					"required": false,
					"description": "0(デフォルト)～100を指定することで、画像の表示をグレースケールに変換できます。"
				},
				{
					"name": "sepia",
					"required": false,
					"description": "0(デフォルト)～100を指定することで、画像の表示をセピア調に変換できます。"
				},
				{
					"name": "saturate",
					"required": false,
					"description": "0～100(デフォルト)を指定してあげることで、画像の表示の彩度（色の鮮やかさ）を変更できます。"
				},
				{
					"name": "hue",
					"required": false,
					"description": "0(デフォルト)～360を指定することで、画像の表示の色相を変更できます。"
				},
				{
					"name": "invert",
					"required": false,
					"description": "0(デフォルト)～100を指定することで、画像の表示の階調を反転させることができます。"
				},
				{
					"name": "opacity",
					"required": false,
					"description": "0～100(デフォルト)を指定することで、画像の表示の透過度を変更できます。"
				},
				{
					"name": "brightness",
					"required": false,
					"description": "100(デフォルト)を基準とする数値を指定することで、画像の明度を変更できます。0で真っ暗に、100以上の数値でより明るくなります。"
				},
				{
					"name": "contrast",
					"required": false,
					"description": "0～100(デフォルト)を指定することで、画像の表示のコントラストを変更できます。"
				},
				{
					"name": "blur",
					"required": false,
					"description": "0(デフォルト)～任意の値を指定することで、画像の表示をぼかすことができます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"nolog": {
			"name": "nolog",
			"summary": "バックログ記録の一時停止",
			"category": "メッセージ関連の設定",
			"description": "このタグに到達すると、テキストがバックログに記録されなくなります。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"endnolog": {
			"name": "endnolog",
			"summary": "バックログ記録の再開",
			"category": "メッセージ関連の設定",
			"description": "[nolog]タグで一時停止したバックログへの記録を再開します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"pushlog": {
			"name": "pushlog",
			"summary": "バックログにテキスト追加",
			"category": "メッセージ関連の設定",
			"description": "バックログに任意のテキストを追加できます。",
			"parameters": [
				{
					"name": "text",
					"required": true,
					"description": "バックログに追加するテキストを指定します。"
				},
				{
					"name": "join",
					"required": false,
					"description": "バックログを前のテキストに連結するかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"jump": {
			"name": "jump",
			"summary": "シナリオのジャンプ",
			"category": "ラベル・ジャンプ操作",
			"description": "指定シナリオファイルの指定ラベルに移動します。",
			"parameters": [
				{
					"name": "storage",
					"required": false,
					"description": "ジャンプ先のシナリオファイル名を指定します。省略すると、現在のシナリオファイルとみなされます。"
				},
				{
					"name": "target",
					"required": false,
					"description": "ジャンプ先のラベル名を指定します。省略すると、シナリオファイルの先頭にジャンプします。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"link": {
			"name": "link",
			"summary": "ハイパーリンク（選択肢）の開始",
			"category": "ラベル・ジャンプ操作",
			"description": "[link]タグと[endlink]タグで囲まれた部分のテキストをリンク化します。選択肢の表示として使用可能。",
			"parameters": [
				{
					"name": "storage",
					"required": false,
					"description": "ジャンプ先のシナリオファイル名を指定します。省略すると、現在のシナリオファイルとみなされます。"
				},
				{
					"name": "target",
					"required": false,
					"description": "ジャンプ先のラベル名を指定します。省略すると、シナリオファイルの先頭にジャンプします。"
				},
				{
					"name": "keyfocus",
					"required": false,
					"description": "falseを指定すると、キーボードやゲームパッドで選択できなくなります。また1や2などの数値を指定すると、キーコンフィグのfocus_nextアクションでボタンを選択していくときの順序を指定できます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"endlink": {
			"name": "endlink",
			"summary": "ハイパーリンク（選択肢）の終了",
			"category": "ラベル・ジャンプ操作",
			"description": "[link]タグと組み合わせて使います。リンク化を終了します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"button": {
			"name": "button",
			"summary": "グラフィカルボタンの表示",
			"category": "ラベル・ジャンプ操作",
			"description": "グラフィカルボタンを表示します。[link]タグの画像版となります。",
			"parameters": [
				{
					"name": "graphic",
					"required": false,
					"description": "ボタンにする画像を指定します。ファイルはdata/imageフォルダに配置します。"
				},
				{
					"name": "folder",
					"required": false,
					"description": "画像が入っているフォルダを指定できます。デフォルトでは前景レイヤ用の画像はfgimageフォルダ、背景レイヤ用の画像はbgimageフォルダと決まっていますが、これを変更できます。"
				},
				{
					"name": "storage",
					"required": false,
					"description": "ジャンプ先のシナリオファイル名を指定します。省略すると、現在のシナリオファイルとみなされます。"
				},
				{
					"name": "target",
					"required": false,
					"description": "ジャンプ先のラベル名を指定します。省略すると、シナリオファイルの先頭にジャンプします。"
				},
				{
					"name": "name",
					"required": false,
					"description": "[anim]タグなどからこの名前でアニメーションさせられます。カンマで区切ることで複数指定できます。（高度な知識：name属性で指定した値はHTMLのクラス属性になります）"
				},
				{
					"name": "x",
					"required": false,
					"description": "ボタンの横位置を指定します"
				},
				{
					"name": "y",
					"required": false,
					"description": "ボタンの縦位置を指定します。"
				},
				{
					"name": "width",
					"required": false,
					"description": "ボタンの横幅をピクセルで指定できます"
				},
				{
					"name": "height",
					"required": false,
					"description": "ボタンの高さをピクセルで指定できます"
				},
				{
					"name": "fix",
					"required": false,
					"description": "固定ボタン（セーブボタンなどの常に表示しておくボタン）にするかどうか。trueまたはfalseで指定します。通常の選択肢ボタンはfalse(デフォルト)。選択肢ボタンとは異なり、固定ボタンはそれが表示されている間も画面をクリックしてふつうにシナリオを読み進めることができます。\ntrueを指定すると、fixレイヤという特殊なレイヤにボタンが配置されます。fixレイヤに追加した要素を消す場合は[clearfix]タグを使います。\nfixにtrueを指定した場合は別のstorageのtargetを指定して、そこにボタンが押されたときの処理を記述する必要があります。\nfixにtrueを指定した場合、コールスタックが残ります。コールスタックが消化されるまではボタンが有効にならないのでご注意ください。"
				},
				{
					"name": "role",
					"required": false,
					"description": "ボタンに特別な機能を割り当てることができます。この場合、storageやtargetは無視されます。また、強制的にfix属性がtrueになります。指定できるキーワードは以下のとおりです。\nsave(セーブ画面を表示)\nload(ロード画面を表示)\ntitle(タイトル画面に戻る)\nmenu(メニュー画面を表示)\nwindow(メッセージウィンドウの非表示)\nskip(スキップモードを開始)\nbacklog（バックログを表示）\nfullscreen(フルスクリーン切り替え)\nquicksave(クイックセーブ実行)\nquickload(クイックロード実行)\nauto(オートモード開始)\nsleepgame(ゲームの状態を保存してジャンプ)"
				},
				{
					"name": "exp",
					"required": false,
					"description": "ボタンがクリックされた時に実行されるJSを指定できます。"
				},
				{
					"name": "preexp",
					"required": false,
					"description": "タグが実行された時点で、この属性に指定した値が変数preexpに格納されます。そしてボタンがクリックされた時にexp内でpreexpという変数が利用できるようになります。"
				},
				{
					"name": "hint",
					"required": false,
					"description": "マウスカーソルをボタンの上で静止させたときに表示されるツールチップの文字列を指定できます。"
				},
				{
					"name": "clickse",
					"required": false,
					"description": "ボタンをクリックした時に再生される効果音を設定できます。効果音ファイルはsoundフォルダに配置してください。"
				},
				{
					"name": "enterse",
					"required": false,
					"description": "ボタンの上にマウスカーソルが乗った時に再生する効果音を設定できます。効果音ファイルはsoundフォルダに配置してください"
				},
				{
					"name": "leavese",
					"required": false,
					"description": "ボタンの上からマウスカーソルが外れた時に再生する効果音を設定できます。効果音ファイルはsoundフォルダに配置してください。"
				},
				{
					"name": "activeimg",
					"required": false,
					"description": "ボタンの上でマウスボタンを押している間に切り替える画像ファイルを指定できます。ファイルはimageフォルダに配置してください。"
				},
				{
					"name": "clickimg",
					"required": false,
					"description": "ボタンをクリックしたあとに切り替える画像ファイルを指定できます。ファイルはimageフォルダに配置してください。"
				},
				{
					"name": "enterimg",
					"required": false,
					"description": "ボタンの上にマウスカーソルが乗った時に切り替える画像ファイルを指定できます。ファイルはimageフォルダに配置してください。"
				},
				{
					"name": "autoimg",
					"required": false,
					"description": "オートモードが開始されたときに切り替える画像ファイルを指定できます。ファイルはimageフォルダに配置してください。"
				},
				{
					"name": "skipimg",
					"required": false,
					"description": "スキップモードが開始されたときに切り替える画像ファイルを指定できます。ファイルはimageフォルダに配置してください。"
				},
				{
					"name": "visible",
					"required": false,
					"description": "最初からボタンを表示するかどうか。trueで表示、falseで非表示となります。"
				},
				{
					"name": "auto_next",
					"required": false,
					"description": "trueまたはfalseを指定します。これにfalseが指定してあり、かつfix=trueの場合、[return]で戻ったときに次のタグに進まなくなります。"
				},
				{
					"name": "savesnap",
					"required": false,
					"description": "trueまたはfalseで指定します。trueにすると、このボタンが押された時点でのセーブスナップを確保します。セーブ画面へ移動する場合はここをtrueにして、保存してからセーブを実行します。"
				},
				{
					"name": "keyfocus",
					"required": false,
					"description": "falseを指定すると、キーボードやゲームパッドで選択できなくなります。また1や2などの数値を指定すると、キーコンフィグのfocus_nextアクションでボタンを選択していくときの順序を指定できます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"glink_config": {
			"name": "glink_config",
			"summary": "グラフィカルリンクの設定",
			"category": "ラベル・ジャンプ操作",
			"description": "V515以降で使用可能。",
			"parameters": [
				{
					"name": "auto_place",
					"required": false,
					"description": "[glink]の自動配置を有効にするかどうか。trueを指定すると、xとyが指定されていない[glink]を対象とする自動配置を有効にします。falseで無効。"
				},
				{
					"name": "auto_place_force",
					"required": false,
					"description": "trueを指定すると、xとyが指定されている[glink]も強制的に自動配置の対象にします。"
				},
				{
					"name": "margin_x",
					"required": false,
					"description": "ボタンの外側に付ける横余白を数値(px)で指定します。"
				},
				{
					"name": "margin_y",
					"required": false,
					"description": "ボタンの外側に付ける縦余白を数値(px)で指定します。"
				},
				{
					"name": "padding_x",
					"required": false,
					"description": "ボタンの内側に付ける横余白を数値(px)で指定します。defaultを指定すると調整を行いません。"
				},
				{
					"name": "padding_y",
					"required": false,
					"description": "ボタンの内側に付ける縦余白を数値(px)で指定します。defaultを指定すると調整を行いません。"
				},
				{
					"name": "width",
					"required": false,
					"description": "maxと指定すると、ボタンの横幅を『一番横幅の大きいボタンの横幅』に揃えることができます。数値を直接指定することで共通の横幅を指定することもできます。defaultを指定すると調整を行いません。"
				},
				{
					"name": "height",
					"required": false,
					"description": "maxと指定すると、ボタンの高さを『一番横幅の大きいボタンの高さ』に揃えることができます。数値を直接指定することで共通の高さを指定することもできます。defaultを指定すると調整を行いません。"
				},
				{
					"name": "vertical",
					"required": false,
					"description": "ボタンの縦方向の揃え方をtop(上揃え)、center(中央揃え)、bottom(下揃え)のいずれかで指定します。"
				},
				{
					"name": "horizontal",
					"required": false,
					"description": "ボタンの横方向の揃え方をleft(左揃え)、center(中央揃え)、right(右揃え)のいずれかで指定します。"
				},
				{
					"name": "wrap",
					"required": false,
					"description": "wrapを指定すると、ボタンが収まりきらないときの折り返しが有効になります。"
				},
				{
					"name": "place_area",
					"required": false,
					"description": "揃え方の基準となる領域の位置や大きさを指定できます。auto(デフォルト)を指定すると、メッセージウィンドウ考慮して自動で領域を調整します。coverだと画面全体を基準にします。領域の位置とサイズを直接指定したい場合は100,100,1000,1000のようにカンマ区切りで数値を4つ指定してください。そうすると、順にleft, top, width, heightとして解釈されます。"
				},
				{
					"name": "show_time",
					"required": false,
					"description": "表示アニメーションにかける時間をミリ秒単位で指定します。0を指定するとアニメーションを行いません。なお、アニメーション中はクリックすることができません。"
				},
				{
					"name": "show_effect",
					"required": false,
					"description": "表示アニメーションのエフェクトを以下のキーワードから指定できます。\nfadeInfadeInDownfadeInLeftfadeInRightfadeInUplightSpeedInrotateInrotateInDownLeftrotateInDownRightrotateInUpLeftrotateInUpRightzoomInzoomInDownzoomInLeftzoomInRightzoomInUpbounceInbounceInDownbounceInLeftbounceInRightbounceInUprollInvanishInpuffIn"
				},
				{
					"name": "show_keyframe",
					"required": false,
					"description": "表示アニメーションとして[keyframe]タグで定義したキーフレームアニメーションのnameを指定できます。これを指定した場合、show_effectは無視されます。"
				},
				{
					"name": "show_delay",
					"required": false,
					"description": "各ボタンを表示していく際の遅延をミリ秒で指定できます。0だとすべてのボタンが同時に表示され、たとえば100と指定すると100ミリ秒ごとに1個ずつボタンが表示されます。"
				},
				{
					"name": "show_easing",
					"required": false,
					"description": "表示アニメーションの変化パターンを指定できます。以下のキーワードが指定できます。デフォルトはlinear。\nease(開始時点と終了時点を滑らかに再生する)\nlinear(一定の間隔で再生する)\nease-in(開始時点をゆっくり再生する)\nease-out(終了時点をゆっくり再生する)\nease-in-out(開始時点と終了時点をゆっくり再生する)\nこの他にcubic-bezier関数を使って独自のイージングを指定することも可能です。"
				},
				{
					"name": "select_time",
					"required": false,
					"description": "ボタンが選択されたときの退場アニメーションにかける時間をミリ秒単位で指定します。0を指定するとアニメーションを行いません。"
				},
				{
					"name": "select_effect",
					"required": false,
					"description": "選択時の退場アニメーションのエフェクトを以下のキーワードが指定できます。\nfadeOutfadeOutDownBigfadeOutLeftBigfadeOutRightBigfadeOutUpBigflipOutXflipOutYlightSpeedOutrotateOutrotateOutDownLeftrotateOutDownRightrotateOutUpLeftrotateOutUpRightzoomOutzoomOutDownzoomOutLeftzoomOutRightzoomOutUpslideOutDownslideOutLeftslideOutRightslideOutUpbounceOut bounceOutDownbounceOutLeftbounceOutRightbounceOutUp"
				},
				{
					"name": "select_keyframe",
					"required": false,
					"description": "選択時の退場アニメーションとして[keyframe]タグで定義したキーフレームアニメーションのnameを指定できます。これを指定した場合、select_effectは無視されます。"
				},
				{
					"name": "select_delay",
					"required": false,
					"description": "選択時の退場アニメーションを開始するまでの遅延をミリ秒単位で指定します。"
				},
				{
					"name": "select_easing",
					"required": false,
					"description": "選択時の退場アニメ―ションのイージングを指定します。"
				},
				{
					"name": "reject_time",
					"required": false,
					"description": "ボタンが選択されなかったときの退場アニメーションにかける時間をミリ秒単位で指定します。0を指定するとアニメーションを行いません。"
				},
				{
					"name": "reject_effect",
					"required": false,
					"description": "非選択時の退場アニメーションのエフェクトを以下のキーワードが指定できます。\nfadeOutfadeOutDownBigfadeOutLeftBigfadeOutRightBigfadeOutUpBigflipOutXflipOutYlightSpeedOutrotateOutrotateOutDownLeftrotateOutDownRightrotateOutUpLeftrotateOutUpRightzoomOutzoomOutDownzoomOutLeftzoomOutRightzoomOutUpslideOutDownslideOutLeftslideOutRightslideOutUpbounceOut bounceOutDownbounceOutLeftbounceOutRightbounceOutUp"
				},
				{
					"name": "reject_keyframe",
					"required": false,
					"description": "非選択時の退場アニメーションとして[keyframe]タグで定義したキーフレームアニメーションのnameを指定できます。これを指定した場合、reject_effectは無視されます。"
				},
				{
					"name": "reject_delay",
					"required": false,
					"description": "選択時の退場アニメーションを開始するまでの遅延をミリ秒単位で指定します。"
				},
				{
					"name": "reject_easing",
					"required": false,
					"description": "選択時の退場アニメ―ションのイージングを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"glink": {
			"name": "glink",
			"summary": "グラフィカルリンク",
			"category": "ラベル・ジャンプ操作",
			"description": "グラフィカルリンク(テキストボタン)を表示できます。画像は必要ありません。",
			"parameters": [
				{
					"name": "color",
					"required": false,
					"description": "ボタンの色をキーワードで指定できます。デフォルトはblackです。blackgraywhiteorangeredbluerosygreenpinkのキーワードが指定できます。\nV501c以降では200パターン以上のデザインが追加されました。詳しくは https://tyrano.jp/sample2/code/siryou/1 をご覧ください。"
				},
				{
					"name": "font_color",
					"required": false,
					"description": "フォントの色を0xRRGGBB形式で指定します。"
				},
				{
					"name": "storage",
					"required": false,
					"description": "ジャンプ先のシナリオファイル名を指定します。省略すると、現在のシナリオファイルとみなされます。"
				},
				{
					"name": "target",
					"required": false,
					"description": "ジャンプ先のラベル名を指定します。省略すると、シナリオファイルの先頭にジャンプします。"
				},
				{
					"name": "name",
					"required": false,
					"description": "[anim]タグなどからこの名前でアニメーションさせられます。カンマで区切ることで複数指定できます。（高度な知識：name属性で指定した値はHTMLのクラス属性になります）"
				},
				{
					"name": "text",
					"required": false,
					"description": "テキストの内容を指定します。"
				},
				{
					"name": "font_color",
					"required": false,
					"description": "フォントの色を指定できます。"
				},
				{
					"name": "x",
					"required": false,
					"description": "ボタンの横位置を指定します。"
				},
				{
					"name": "y",
					"required": false,
					"description": "ボタンの縦位置を指定します。"
				},
				{
					"name": "width",
					"required": false,
					"description": "ボタンの横幅をピクセルで指定できます。"
				},
				{
					"name": "height",
					"required": false,
					"description": "ボタンの高さをピクセルで指定できます。"
				},
				{
					"name": "size",
					"required": false,
					"description": "フォントサイズを指定できます。"
				},
				{
					"name": "face",
					"required": false,
					"description": "フォントを指定できます。Webフォントを使用する場合はtyrano/css/font.cssに定義を記述してください。"
				},
				{
					"name": "graphic",
					"required": false,
					"description": "ボタンの背景画像を指定します。ファイルはdata/imageフォルダに入れてください。画像が指定された場合はcolorは無視されます。"
				},
				{
					"name": "enterimg",
					"required": false,
					"description": "graphicが指定されている時に有効。カーソルが重なった時の画像を指定できます"
				},
				{
					"name": "clickse",
					"required": false,
					"description": "ボタンをクリックした時に再生される効果音を設定できます。効果音ファイルはdata/soundフォルダに配置してください"
				},
				{
					"name": "enterse",
					"required": false,
					"description": "ボタンの上にマウスカーソルが乗った時に再生する効果音を設定できます。効果音ファイルはsoundフォルダに配置してください"
				},
				{
					"name": "leavese",
					"required": false,
					"description": "ボタンの上からマウスカーソルが外れた時に再生する効果音を設定できます。効果音ファイルはsoundフォルダに配置してください。"
				},
				{
					"name": "cm",
					"required": false,
					"description": "ボタンクリック後に[cm]を実行するかどうか。[glink]は通常、ボタンクリック後に自動的に[cm]が実行されますが、falseを指定するとこの[cm]を実行しません。\nプレイヤー入力などの決定を[glink]で行いたい場合はfalseを指定しておき、[commit]後に手動で[cm]を実行してボタンや入力ボックスを消してください。"
				},
				{
					"name": "exp",
					"required": false,
					"description": "ボタンがクリックされた時に実行されるJSを指定できます。"
				},
				{
					"name": "preexp",
					"required": false,
					"description": "タグが実行された時点で、この属性に指定した値が変数preexpに格納されます。そしてボタンがクリックされた時にexp内でpreexpという変数が利用できるようになります。"
				},
				{
					"name": "bold",
					"required": false,
					"description": "太字にする場合はtrueを指定します。"
				},
				{
					"name": "opacity",
					"required": false,
					"description": "領域の不透明度を0～255の数値で指定します。0で完全に透明です。"
				},
				{
					"name": "edge",
					"required": false,
					"description": "文字の縁取りを有効にできます。縁取り色を0xRRGGBB形式等で指定します。\nV515以降：縁取りの太さもあわせて指定できます。4px 0xFF0000のように、色の前に縁取りの太さをpx付きで記述します。太さと色は半角スペースで区切ってください。さらに4px 0xFF0000, 2px 0xFFFFFFのようにカンマ区切りで複数の縁取りを指定できます。"
				},
				{
					"name": "shadow",
					"required": false,
					"description": "文字に影をつけます。影の色を0xRRGGBB形式で指定します。"
				},
				{
					"name": "keyfocus",
					"required": false,
					"description": "falseを指定すると、キーボードやゲームパッドで選択できなくなります。また1や2などの数値を指定すると、キーコンフィグのfocus_nextアクションでボタンを選択していくときの順序を指定できます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"clickable": {
			"name": "clickable",
			"summary": "クリック可能な領域を設定",
			"category": "ラベル・ジャンプ操作",
			"description": "透明なクリック可能領域を設定できます。",
			"parameters": [
				{
					"name": "width",
					"required": true,
					"description": "領域の横幅を指定します。"
				},
				{
					"name": "height",
					"required": true,
					"description": "領域の高さを指定します。"
				},
				{
					"name": "x",
					"required": false,
					"description": "領域の左端位置のX座標を指定します。"
				},
				{
					"name": "y",
					"required": false,
					"description": "領域の左端位置のY座標を指定します。"
				},
				{
					"name": "borderstyle",
					"required": false,
					"description": "領域に表示する線のデザインを指定できます。線の太さ:線の種類:線の色のフォーマットで記述してください。各項目はCSSの記法で記述します。線の種類はsoliddoublegroovedashed dottedなどが指定できます。"
				},
				{
					"name": "color",
					"required": false,
					"description": "表示色を0xRRGGBB形式で指定します。"
				},
				{
					"name": "opacity",
					"required": false,
					"description": "領域の不透明度を0～255の数値で指定します。0で完全に透明です。"
				},
				{
					"name": "mouseopacity",
					"required": false,
					"description": "領域にマウスが乗ったときの不透明度を指定できます。"
				},
				{
					"name": "storage",
					"required": false,
					"description": "ジャンプ先のシナリオファイル名を指定します。省略すると、現在のシナリオファイルとみなされます。"
				},
				{
					"name": "target",
					"required": false,
					"description": "ジャンプ先のラベル名を指定します。省略すると、シナリオファイルの先頭にジャンプします。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"chara_ptext": {
			"name": "chara_ptext",
			"summary": "キャラクターの名前表示と表情変更",
			"category": "キャラクター操作",
			"description": "キャラクターの名前を表示するためのタグです。いましゃべっているキャラクターの名前をメッセージウィンドウの上部に出すのが主な使い方になるでしょう。face属性を指定することで、名前を出すと同時にそのキャラクターの表情を変更することもできます。",
			"parameters": [
				{
					"name": "name",
					"required": false,
					"description": "[chara_new]タグで定義したnameを指定します。それをひもついたjnameがテキストエリアに表示されます。そのnameのキャラクター定義が存在しなかった場合、nameに指定された内容がそのままテキストエリアに表示されます。"
				},
				{
					"name": "face",
					"required": false,
					"description": "[chara_face]タグで定義したfaceを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"chara_config": {
			"name": "chara_config",
			"summary": "キャラクター操作タグの基本設定",
			"category": "キャラクター操作",
			"description": "キャラクター操作タグの基本設定を変更できます",
			"parameters": [
				{
					"name": "pos_mode",
					"required": false,
					"description": "trueまたはfalseを指定します。デフォルトはtrueです。trueの場合、[chara_show]タグでキャラクターを表示したときの立ち位置を自動的に計算して配置します。"
				},
				{
					"name": "ptext",
					"required": false,
					"description": "[ptext]で作っておいた、キャラクターの名前を表示するためのテキスト領域のnameを指定します。詳しくは[chara_ptext]の項目を参照してください。"
				},
				{
					"name": "time",
					"required": false,
					"description": "[chara_mod]タグで表情を変える際のクロスフェード時間をミリ秒で指定します。0を指定すると瞬間的に切り替わります。"
				},
				{
					"name": "memory",
					"required": false,
					"description": "キャラクターを退場させたときの表情を記憶しておくかどうか。trueまたはfalseを指定します。trueを指定すると、キャラクターを再登場させたときに、前回退場時の表情のまま表示されます。"
				},
				{
					"name": "anim",
					"required": false,
					"description": "pos_mode=trueによってキャラクターの自動配置が有効になっている場合に、キャラクターの立ち位置変化のアニメーションを行うかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "pos_change_time",
					"required": false,
					"description": "キャラクターの位置を自動で調整する際のアニメーション時間をミリ秒で指定します。"
				},
				{
					"name": "talk_focus",
					"required": false,
					"description": "現在話しているキャラクターの立ち絵を目立たせる演出を有効にするための設定です。以下のキーワードが指定できます。brightness(明度)、blur(ぼかし)、none(無効)\n現在誰が話しているかの指定は[chara_ptext]タグもしくはその省略表記である#akaneのような記述で行います。"
				},
				{
					"name": "brightness_value",
					"required": false,
					"description": "talk_focus=brightnessの場合の、話していないキャラクターの明度を0〜100で指定します。デフォルトは60。つまり、話していないキャラクターをちょっと暗くします。"
				},
				{
					"name": "blur_value",
					"required": false,
					"description": "talk_focus=blurの場合の、話していないキャラクターのぼかし度合を数値で指定します。デフォルトは2。数値が大きくなるほど強くぼけるようになります。"
				},
				{
					"name": "talk_anim",
					"required": false,
					"description": "キャラクターが話し始めるときに、キャラクターの立ち絵にピョンと跳ねるようなアニメーション演出を自動で加えることができる設定です。以下のキーワードが指定できます。up（上に跳ねる）、down(下に沈む)、zoom（拡大）、none(無効)"
				},
				{
					"name": "talk_anim_time",
					"required": false,
					"description": "talk_animが有効な場合の、アニメーション時間をミリ秒で指定できます。"
				},
				{
					"name": "talk_anim_value",
					"required": false,
					"description": "talk_animが有効な場合の、キャラクターの移動量を指定できます。（ピクセル）"
				},
				{
					"name": "talk_anim_zoom_rate",
					"required": false,
					"description": "talk_animでzoomを使用している場合の拡大率を指定します。デフォルトは1.2"
				},
				{
					"name": "effect",
					"required": false,
					"description": "キャラクターが位置を入れ替わる際のエフェクト（動き方）を指定できます。指定できるキーワードは次のとおりです。jswingdefeaseInQuadeaseOutQuadeaseInOutQuadeaseInCubiceaseOutCubiceaseInOutCubiceaseInQuarteaseOutQuarteaseInOutQuarteaseInQuinteaseOutQuinteaseInOutQuinteaseInSineeaseOutSineeaseInOutSineeaseInExpoeaseOutExpoeaseInOutExpoeaseInCirceaseOutCirceaseInOutCirceaseInElasticeaseOutElasticeaseInOutElasticeaseInBackeaseOutBackeaseInOutBackeaseInBounceeaseOutBounceeaseInOutBounce"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"chara_new": {
			"name": "chara_new",
			"summary": "キャラクターの定義",
			"category": "キャラクター操作",
			"description": "登場するキャラクターの情報を定義します。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "キャラクターを管理するための名前を半角英数で指定します。このnameは必ずユニーク（一意、固有）である必要があります。すなわち、他のキャラクターとnameが重複してはいけません。また[ptext][image]などのタグに指定するnameとも重複してはいけません。"
				},
				{
					"name": "storage",
					"required": true,
					"description": "キャラクター画像を指定します。画像ファイルはdata/fgimageフォルダに配置します。"
				},
				{
					"name": "width",
					"required": false,
					"description": "画像の横幅を指定できます。"
				},
				{
					"name": "height",
					"required": false,
					"description": "画像の高さを指定できます。"
				},
				{
					"name": "reflect",
					"required": false,
					"description": "画像を左右反転するかどうか。trueまたはfalseで指定します。trueを指定すると、画像を左右反転して表示します。"
				},
				{
					"name": "color",
					"required": false,
					"description": "キャラクターの名前を表示するときの色を指定できます。0xRRGGBB形式で指定します。"
				},
				{
					"name": "jname",
					"required": false,
					"description": "このキャラクターをネームスペースに表示する場合、適用する名称を指定できます。例えば、#yuko と指定すると　メッセージエリアに　ゆうこ　と表示できます"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"chara_show": {
			"name": "chara_show",
			"summary": "キャラクターの登場",
			"category": "キャラクター操作",
			"description": "定義しておいたキャラクターを画面に表示します。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "[chara_new]で定義したname属性を指定します。"
				},
				{
					"name": "time",
					"required": false,
					"description": "ミリ秒で指定します。指定した時間をかけて登場します。"
				},
				{
					"name": "layer",
					"required": false,
					"description": "キャラクターを配置するレイヤを0以上の整数で指定します。"
				},
				{
					"name": "zindex",
					"required": false,
					"description": "キャラクターの重なりを指定できます。ここで指定した値が大きいほうが前に表示できます。省略すると、後に登場するキャラクターが前に表示されます。\""
				},
				{
					"name": "depth",
					"required": false,
					"description": "zindexが同一な場合の重なりをfront(最前面)、back(最後面) で指定できます。"
				},
				{
					"name": "page",
					"required": false,
					"description": "foreかbackを指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "trueを指定すると、キャラクターの登場完了を待ちます。"
				},
				{
					"name": "face",
					"required": false,
					"description": "[chara_face]タグで定義したface属性を指定します。"
				},
				{
					"name": "storage",
					"required": false,
					"description": "変更する画像ファイルを指定します。画像ファイルはdata/fgimageフォルダに配置します。"
				},
				{
					"name": "reflect",
					"required": false,
					"description": "画像を左右反転するかどうか。trueまたはfalseで指定します。trueを指定すると、画像を左右反転して表示します。"
				},
				{
					"name": "width",
					"required": false,
					"description": "キャラクターの横幅を指定できます。"
				},
				{
					"name": "height",
					"required": false,
					"description": "キャラクターの縦幅を指定できます。"
				},
				{
					"name": "left",
					"required": false,
					"description": "キャラクターの横位置を指定できます。指定した場合、自動配置が有効であっても無効になります。"
				},
				{
					"name": "top",
					"required": false,
					"description": "キャラクターの縦位置を指定できます。指定した場合、自動配置が有効であっても無効になります。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"chara_hide": {
			"name": "chara_hide",
			"summary": "キャラクターの退場",
			"category": "キャラクター操作",
			"description": "[chara_show]タグで表示したキャラクターを退場させます。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "[chara_new]で定義したname属性を指定します。"
				},
				{
					"name": "time",
					"required": false,
					"description": "フェードアウト時間をミリ秒で指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "フェードアウトの完了を待つかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "layer",
					"required": false,
					"description": "削除対象のレイヤ。[chara_show]でにレイヤ指定した場合はここでも指定します。"
				},
				{
					"name": "pos_mode",
					"required": false,
					"description": "キャラクターの立ち位置自動調整が有効な場合に、このパラメータにfalseを指定すると退場後に立ち位置の調整を行いません。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"chara_hide_all": {
			"name": "chara_hide_all",
			"summary": "キャラクターを全員退場",
			"category": "キャラクター操作",
			"description": "[chara_show]タグで表示したキャラクターを全員退場させます。",
			"parameters": [
				{
					"name": "time",
					"required": false,
					"description": "フェードアウト時間をミリ秒で指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "フェードアウトの完了を待つかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "layer",
					"required": false,
					"description": "削除対象のレイヤ。[chara_show]でにレイヤ指定した場合はここでも指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"chara_delete": {
			"name": "chara_delete",
			"summary": "キャラクター情報の削除",
			"category": "キャラクター操作",
			"description": "キャラクターの定義情報を削除します。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "[chara_new]で定義したname属性を指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"chara_mod": {
			"name": "chara_mod",
			"summary": "キャラクター画像変更",
			"category": "キャラクター操作",
			"description": "キャラクター画像を変更します。表情変更に活用できます。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "[chara_new]で定義したnameを指定します。"
				},
				{
					"name": "face",
					"required": false,
					"description": "[chara_face]で定義したfaceを指定します。"
				},
				{
					"name": "time",
					"required": false,
					"description": "[chara_mod]タグで表情を変える際のクロスフェード時間をミリ秒で指定します。0を指定すると瞬間的に切り替わります。"
				},
				{
					"name": "storage",
					"required": false,
					"description": "変更する画像ファイルを指定します。画像ファイルはdata/fgimageフォルダに配置します。"
				},
				{
					"name": "reflect",
					"required": false,
					"description": "画像を左右反転するかどうか。trueまたはfalseで指定します。trueを指定すると、画像を左右反転して表示します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "表情変更のクロスフェードが終わるのを待つかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "cross",
					"required": false,
					"description": "クロスフェードの方式をtrueまたはfalseを指定します。trueを指定すると、旧画像がフェードアウトさせるのと同時に新画像をフェードインさせます。falseを指定すると、旧画像を残したままその上に新画像をフェードインさせます。\ntrueの場合、クロスフェードの瞬間にキャラクターが若干透けて背景が見えてしまうことがあります。そのような場合はfalseを指定することでキャラクターを透けさせずに表情変更ができます。ただし透けなくはなりますが、シルエットが変わるような表情変更の場合は違和感が出ることがあります。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"chara_move": {
			"name": "chara_move",
			"summary": "キャラクターの位置変更",
			"category": "キャラクター操作",
			"description": "キャラクターの立ち位置や大きさを変更します。指定時間をかけてアニメ―ションさせることもできます。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "[chara_new]で定義したnameを指定します。"
				},
				{
					"name": "left",
					"required": false,
					"description": "変更後の横位置を指定できます。left=\"+=200\"left=\"-=200\"のように指定すると、「いまの場所からどれだけ動くか」という相対指定ができます。"
				},
				{
					"name": "top",
					"required": false,
					"description": "変更後の縦位置を指定できます。top=\"+=100\"top=\"-=100\"のように指定すると、「いまの場所からどれだけ動くか」という相対指定ができます。"
				},
				{
					"name": "width",
					"required": false,
					"description": "変更後の横幅を指定できます。"
				},
				{
					"name": "height",
					"required": false,
					"description": "変更後の高さを指定できます。"
				},
				{
					"name": "anim",
					"required": false,
					"description": "アニメーションさせるかどうか。trueかfalseで指定します。trueを指定すると、位置を変更するときにアニメーションさせることができます。この場合、アニメーション効果は[chara_config]のeffectパラメータを参照します。"
				},
				{
					"name": "time",
					"required": false,
					"description": "アニメーション時間をミリ秒で指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "アニメーションの完了を待つかどうか。trueかfalseで指定します。"
				},
				{
					"name": "effect",
					"required": false,
					"description": "変化のエフェクトを指定します。以下のキーワードが指定できます。jswingdefeaseInQuadeaseOutQuadeaseInOutQuadeaseInCubiceaseOutCubiceaseInOutCubiceaseInQuarteaseOutQuarteaseInOutQuarteaseInQuinteaseOutQuinteaseInOutQuinteaseInSineeaseOutSineeaseInOutSineeaseInExpoeaseOutExpoeaseInOutExpoeaseInCirceaseOutCirceaseInOutCirceaseInElasticeaseOutElasticeaseInOutElasticeaseInBackeaseOutBackeaseInOutBackeaseInBounceeaseOutBounceeaseInOutBounce"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"chara_face": {
			"name": "chara_face",
			"summary": "キャラクター表情登録",
			"category": "キャラクター操作",
			"description": "キャラクターの表情画像を登録できます。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "表情を登録するキャラクターの名前。[chara_new]で定義したname属性を指定します。"
				},
				{
					"name": "face",
					"required": true,
					"description": "登録する表情の名前を指定します。happyangryなど、自分がわかりやすいものを自由につけましょう。"
				},
				{
					"name": "storage",
					"required": true,
					"description": "画像ファイルを指定します。画像ファイルはdata/fgimageフォルダに配置します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"chara_layer": {
			"name": "chara_layer",
			"summary": "キャラクターの差分パーツ定義",
			"category": "キャラクター操作",
			"description": "キャラクターの表情を差分パーツを定義します。\nデフォルトのパーツは一番最初に登録したものになります。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "パーツを登録するキャラクターの名前。[chara_new]で定義したname属性を指定します。"
				},
				{
					"name": "part",
					"required": true,
					"description": "パーツとして登録する名前を指定します。例えば目というパーツをpartを登録しておき、このpartの中で他の差分をいくつでも登録できます。"
				},
				{
					"name": "id",
					"required": true,
					"description": "パーツの中の差分を識別するための名前を指定します。例えば目というpartの中で笑顔の目泣いてる目のようにidを分けて登録できます。"
				},
				{
					"name": "storage",
					"required": true,
					"description": "差分として登録する画像を指定します。画像はdata/fgimageフォルダの中に配置します。noneを指定すると、デフォルトでそのパーツがない状態を表現できます。"
				},
				{
					"name": "zindex",
					"required": false,
					"description": "このパーツが他のパーツと重なった時にどちらが前面に表示されるかを決定するための優先度を数字で指定します。数字が大きいほど前面に表示されます。一度登録しておけば、同パーツの他の差分にも適用されます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"chara_layer_mod": {
			"name": "chara_layer_mod",
			"summary": "キャラクターの差分の定義を変更",
			"category": "キャラクター操作",
			"description": "[chara_layer]タグで定義した設定を変更できます。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "パーツ定義の変更対象となるキャラクターの名前。[chara_new]で定義したname属性を指定します。"
				},
				{
					"name": "part",
					"required": true,
					"description": "変更したいパーツ名を指定します。"
				},
				{
					"name": "zindex",
					"required": false,
					"description": "このパーツが他のパーツと重なった時にどちらが前面に表示されるかを決定するための優先度を数字で指定します。数字が大きいほど前面に表示されます。この設定は即時反映されません。次回表示時に反映されます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"chara_part": {
			"name": "chara_part",
			"summary": "キャラクターの差分パーツ変更",
			"category": "キャラクター操作",
			"description": "[chara_layer]タグで定義したパーツ差分の実際の表示を切り替えます。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "[chara_new]で指定したキャラクター名を指定します。"
				},
				{
					"name": "time",
					"required": false,
					"description": "パーツが表示されるまでのフェードイン時間を指定できます。ミリ秒で指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "フェードインの完了を待つかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "allow_storage",
					"required": false,
					"description": "trueまたはfalse。trueを指定すると、partの指定にidではなく直接画像ファイルを指定できます。画像はfgimageフォルダに配置してください。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"chara_part_reset": {
			"name": "chara_part_reset",
			"summary": "キャラクターの差分パーツをデフォルトに戻す",
			"category": "キャラクター操作",
			"description": "[chara_part]で差分を変更した際、デフォルトの表情に戻すことができます。\nキャラクターが表示されている場合は即時デフォルトに戻ります。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "[chara_new]で指定したキャラクター名を指定します。"
				},
				{
					"name": "part",
					"required": false,
					"description": "特定のpartに絞ってリセットすることが可能です。カンマ区切りで複数指定が可能です。省略すると、すべてのパーツをデフォルトに戻します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"image": {
			"name": "image",
			"summary": "画像を表示",
			"category": "画像・背景・レイヤ操作",
			"description": "指定したレイヤに画像を追加します。キャラクター表示や背景切り替えなどに使用できます。",
			"parameters": [
				{
					"name": "storage",
					"required": false,
					"description": "画像ファイル名を指定します。ファイルは背景レイヤならdata/bgimage、前景レイヤならdata/fgimageに入れてください。"
				},
				{
					"name": "layer",
					"required": false,
					"description": "画像を追加するレイヤを指定します。\nbaseを指定すると背景レイヤ。0以上の整数を指定すると対応する前景レイヤに画像を表示します。"
				},
				{
					"name": "page",
					"required": false,
					"description": "レイヤの表ページと裏ページ、どちらを対象とするか。foreまたはbackで指定します。省略すると、表ページとみなされます。"
				},
				{
					"name": "visible",
					"required": false,
					"description": "trueまたはfalseを指定します。trueを指定すると、画像を追加すると同時に対象レイヤを表示状態にします。つまり、[layopt visible=\"true\"]を省略できます。"
				},
				{
					"name": "left",
					"required": false,
					"description": "画像の左端位置を指定します。（ピクセル）"
				},
				{
					"name": "top",
					"required": false,
					"description": "画像の上端位置を指定します。（ピクセル）"
				},
				{
					"name": "x",
					"required": false,
					"description": "画像の左端位置を指定します。leftと同様。こちらが優先度高。（ピクセル）"
				},
				{
					"name": "y",
					"required": false,
					"description": "画像の上端位置を指定します。topと同様。こちらが優先度高。（ピクセル）"
				},
				{
					"name": "width",
					"required": false,
					"description": "画像の横幅を指定します。（ピクセル）"
				},
				{
					"name": "height",
					"required": false,
					"description": "画像の高さを指定します。（ピクセル）"
				},
				{
					"name": "folder",
					"required": false,
					"description": "画像が入っているフォルダを指定できます。デフォルトでは前景レイヤ用の画像はfgimageフォルダ、背景レイヤ用の画像はbgimageフォルダと決まっていますが、これを変更できます。"
				},
				{
					"name": "name",
					"required": false,
					"description": "[anim]タグなどからこの名前でアニメーションさせられます。カンマで区切ることで複数指定できます。（高度な知識：name属性で指定した値はHTMLのクラス属性になります）"
				},
				{
					"name": "time",
					"required": false,
					"description": "フェードイン時間をミリ秒単位で指定します。これを指定すると、画像が透明な状態から徐々に表示されていきます。省略すると、一瞬で表示されます。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "フェードインの完了を待つかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "zindex",
					"required": false,
					"description": "画像同士の重なりを指定できます。数値が大きい方が前に表示されます。"
				},
				{
					"name": "depth",
					"required": false,
					"description": "zindexが同一な場合の重なりを指定できます。front(最前面)またはback(最後面)で指定します。デフォルトはfront。"
				},
				{
					"name": "reflect",
					"required": false,
					"description": "trueを指定すると左右反転します。"
				},
				{
					"name": "pos",
					"required": false,
					"description": "画像の位置をキーワードで決定します。\n指定できるキーワードはleft(左端)、left_center(左寄り)、center(中央)、right_center(右寄り)、right(右端)。各キーワードに対応する実際の座標はConfig.tjsで設定されており、自由に編集できます。\n各キーワードにはそれぞれ省略形があり、l、lc、c、rc、rと指定することもできます。動作は同じです。\nこの属性を指定した場合はleftパラメータは無視されます。\nlayerをbaseと指定した場合、この属性は指定しないでください。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"freeimage": {
			"name": "freeimage",
			"summary": "レイヤのクリア",
			"category": "画像・背景・レイヤ操作",
			"description": "指定したレイヤに存在する画像などをすべて削除します。",
			"parameters": [
				{
					"name": "layer",
					"required": true,
					"description": "対象のレイヤを指定します。"
				},
				{
					"name": "page",
					"required": false,
					"description": "レイヤの表ページと裏ページ、どちらを対象とするか。foreまたはbackで指定します。省略すると、表ページとみなされます。"
				},
				{
					"name": "time",
					"required": false,
					"description": "フェードアウト時間をミリ秒単位で指定します。これを指定すると、画像が徐々に透明になっていきます。省略すると、一瞬で消去されます。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "フェードアウトの完了を待つかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"free": {
			"name": "free",
			"summary": "オブジェクトの解放",
			"category": "画像・背景・レイヤ操作",
			"description": "レイヤに追加されたnameで指定された要素をすべて削除します。name指定は必須です。",
			"parameters": [
				{
					"name": "layer",
					"required": true,
					"description": "対象のレイヤを指定します。"
				},
				{
					"name": "name",
					"required": true,
					"description": "削除する要素のnameを指定します。レイヤ内のあらゆる要素に適応できます。"
				},
				{
					"name": "time",
					"required": false,
					"description": "フェードアウト時間をミリ秒単位で指定します。これを指定すると、画像が徐々に透明になっていきます。省略すると、一瞬で消去されます。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "フェードアウトの完了を待つかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"backlay": {
			"name": "backlay",
			"summary": "レイヤ情報の表ページから裏ページへのコピー",
			"category": "画像・背景・レイヤ操作",
			"description": "指定したレイヤ（あるいはすべてのレイヤ）の情報を、表ページから裏ページにコピーします。",
			"parameters": [
				{
					"name": "layer",
					"required": false,
					"description": "対象となるレイヤを指定します。baseを指定すると背景レイヤに、0以上の整数を指定すると前景レイヤに、message0やmessage1のように指定するとメッセージレイヤになります。messageとのみ指定した場合は[current]タグで指定してある現在の操作対象のメッセージレイヤが対象になります。省略すると、すべてのレイヤの情報が裏ページにコピーされます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"wt": {
			"name": "wt",
			"summary": "トランジションの終了待ち",
			"category": "画像・背景・レイヤ操作",
			"description": "トランジションが終了するまで、待ちます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"layopt": {
			"name": "layopt",
			"summary": "レイヤの属性設定",
			"category": "画像・背景・レイヤ操作",
			"description": "レイヤの属性を指定します。",
			"parameters": [
				{
					"name": "layer",
					"required": true,
					"description": "対象となる前景レイヤまたはメッセージレイヤを指定します。messageとのみ指定した場合は、[current]タグで指定した現在の操作対象のメッセージレイヤが対象となります。"
				},
				{
					"name": "page",
					"required": false,
					"description": "対象レイヤの表ページと裏ページのどちらを対象とするか。foreかbackで指定します。ただしlayer属性にmessageとのみ指定し、さらにこの属性を省略した場合には、現在操作対象のページが選択されます。"
				},
				{
					"name": "visible",
					"required": false,
					"description": "layer属性で指定したレイヤを表示するかどうか。trueを指定するとレイヤは表示状態に、falseを指定すると非表示状態になります。省略すると、表示状態は変更されません。"
				},
				{
					"name": "left",
					"required": false,
					"description": "layer属性で指定したレイヤの左端位置を指定します。省略すると位置は変更されません。（メッセージウィンドウの位置やデザインを調整したい場合はこのタグの代わりに[position]タグを使用します）"
				},
				{
					"name": "top",
					"required": false,
					"description": "layer属性で指定したレイヤの上端位置を指定します。省略すると位置は変更されません。（メッセージウィンドウの位置やデザインを調整したい場合はこのタグの代わりに[position]タグを使用します）"
				},
				{
					"name": "opacity",
					"required": false,
					"description": "レイヤの不透明度を0～255の範囲で指定します。0で完全に透明、255で完全に不透明。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"locate": {
			"name": "locate",
			"summary": "表示位置の指定",
			"category": "画像・背景・レイヤ操作",
			"description": "グラフィックボタンの表示位置を指定します。\nテキストには対応していません。",
			"parameters": [
				{
					"name": "x",
					"required": false,
					"description": "横方向の位置を指定します。（ピクセル）"
				},
				{
					"name": "y",
					"required": false,
					"description": "縦方向の位置を指定します。（ピクセル）"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"trans": {
			"name": "trans",
			"summary": "レイヤのトランジション",
			"category": "画像・背景・レイヤ操作",
			"description": "指定したレイヤでトランジションを行います。",
			"parameters": [
				{
					"name": "layer",
					"required": true,
					"description": "対象となるレイヤを指定します。baseを指定すると背景レイヤ、0以上の整数を指定すると前景レイヤ、message0やmessage1を指定するとメッセージレイヤを指定できます。messageとのみ指定した場合は、[current]タグで指定した現在の操作対象のメッセージレイヤが対象になります。（通常は背景の変更などに使用されます）"
				},
				{
					"name": "time",
					"required": true,
					"description": "トランジション時間をミリ秒で指定します。"
				},
				{
					"name": "method",
					"required": false,
					"description": "切り替えのタイプを指定します。デフォルトはfadeInです。指定できる演出は次の通りです。\n【V450以降】fadeInfadeInDownfadeInLeftfadeInRightfadeInUplightSpeedInrotateInrotateInDownLeftrotateInDownRightrotateInUpLeftrotateInUpRightzoomInzoomInDownzoomInLeftzoomInRightzoomInUpslideInDownslideInLeftslideInRightslideInUpbounceIn bounceInDownbounceInLeftbounceInRightbounceInUprollInvanishInpuffIn\n【V450以前】crossfadeexplodeslideblindbounceclipdropfoldpuffscaleshakesize"
				},
				{
					"name": "children",
					"required": false,
					"description": "【廃止】falseの場合、layerで指定した場所だけトランジションします。デフォルトはfalseです。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"bg": {
			"name": "bg",
			"summary": "背景の切り替え",
			"category": "画像・背景・レイヤ操作",
			"description": "背景の切り替えを簡易的に実行できます。\n常にforeのレイヤに対して切り替えが実行されます。",
			"parameters": [
				{
					"name": "storage",
					"required": true,
					"description": "画像ファイル名を指定します。ファイルはdata/bgimageに配置してください"
				},
				{
					"name": "time",
					"required": false,
					"description": "背景の切り替えにかける時間をミリ秒で指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "背景の切り替えを待つかどうか。trueまたはfalseで指定します。falseを指定すると、切り替えの完了を待たずに次のタグに進みます。"
				},
				{
					"name": "cross",
					"required": false,
					"description": "trueまたはfalseを指定します。デフォルトはfalse。trueを指定すると、2つの画像が同じタイミングで透明になりながら入れ替わります。falseを指定すると、古い背景を残しながら上に重ねる形で新しい背景を表示します。CG差分などで使用する場合はfalseが良いでしょう。"
				},
				{
					"name": "position",
					"required": false,
					"description": "省略すると、画像がゲーム画面いっぱいに引き伸ばされます（比率は崩れる）。この値を指定すると、背景画像と画面サイズの比率が異なる場合に、比率を崩さずに背景を配置できます。配置位置を次のキーワードから選択してください。left(左寄せ)、center(中央寄せ)、right(右寄せ)、top(上寄せ)、bottom(下寄せ)"
				},
				{
					"name": "method",
					"required": false,
					"description": "切り替えのタイプを指定します。デフォルトはfadeInです。指定できる演出は次の通りです。\n【V450以降】fadeInfadeInDownfadeInLeftfadeInRightfadeInUplightSpeedInrotateInrotateInDownLeftrotateInDownRightrotateInUpLeftrotateInUpRightzoomInzoomInDownzoomInLeftzoomInRightzoomInUpslideInDownslideInLeftslideInRightslideInUpbounceIn bounceInDownbounceInLeftbounceInRightbounceInUprollInvanishInpuffIn\n【V450以前】crossfadeexplodeslideblindbounceclipdropfoldpuffscaleshakesize"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"bg2": {
			"name": "bg2",
			"summary": "背景の切り替え",
			"category": "画像・背景・レイヤ操作",
			"description": "背景の切り替えを簡易的に実行できます。\n常にforeのレイヤに対して切り替えが実行されます。",
			"parameters": [
				{
					"name": "name",
					"required": false,
					"description": "[anim]タグなどからこの名前でアニメーションさせられます。カンマで区切ることで複数指定できます。（高度な知識：name属性で指定した値はHTMLのクラス属性になります）"
				},
				{
					"name": "storage",
					"required": true,
					"description": "画像ファイルの名前を指定します。ファイルはdata/bgimage以下に配置します。"
				},
				{
					"name": "left",
					"required": false,
					"description": "画像左端の位置をピクセル単位で指定します。0でゲーム画面の上端に表示されます。"
				},
				{
					"name": "top",
					"required": false,
					"description": "画像上端の位置をピクセル単位で指定します。0でゲーム画面の上端に表示されます。"
				},
				{
					"name": "width",
					"required": false,
					"description": "画像の横幅をピクセル単位で指定します。省略すると、ゲーム画面いっぱいに引き伸ばされます。"
				},
				{
					"name": "height",
					"required": false,
					"description": "画像の高さ位置をピクセル単位で指定します。省略すると、ゲーム画面いっぱいに引き伸ばされます。"
				},
				{
					"name": "time",
					"required": false,
					"description": "背景の切り替えにかける時間をミリ秒で指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "背景の切り替えを待つかどうか。trueまたはfalseで指定します。falseを指定すると、切り替えの完了を待たずに次のタグに進みます。"
				},
				{
					"name": "cross",
					"required": false,
					"description": "trueまたはfalseを指定します。デフォルトはfalse。trueを指定すると、2つの画像が同じタイミングで透明になりながら入れ替わります。falseを指定すると、古い背景を残しながら上に重ねる形で新しい背景を表示します。CG差分などで使用する場合はfalseが良いでしょう。"
				},
				{
					"name": "method",
					"required": false,
					"description": "切り替えのタイプを指定します。デフォルトはfadeInです。指定できる演出は次の通りです。\n【V450以降】fadeInfadeInDownfadeInLeftfadeInRightfadeInUplightSpeedInrotateInrotateInDownLeftrotateInDownRightrotateInUpLeftrotateInUpRightzoomInzoomInDownzoomInLeftzoomInRightzoomInUpslideInDownslideInLeftslideInRightslideInUpbounceIn bounceInDownbounceInLeftbounceInRightbounceInUprollInvanishInpuffIn\n【V450以前】crossfadeexplodeslideblindbounceclipdropfoldpuffscaleshakesize"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"clearfix": {
			"name": "clearfix",
			"summary": "fixレイヤーのクリア",
			"category": "画像・背景・レイヤ操作",
			"description": "fixレイヤーの要素を消去します。name属性を指定することで特定の要素のみを消去することもできます。",
			"parameters": [
				{
					"name": "name",
					"required": false,
					"description": "これを指定すると、該当する要素だけを消去することができます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"quake": {
			"name": "quake",
			"summary": "画面を揺らす",
			"category": "演出・効果・動画",
			"description": "指定したミリ秒だけ、画面を揺らします。\nvmax属性を0に設定すると横揺れに、hmax属性を0に設定すると縦揺れになります。",
			"parameters": [
				{
					"name": "count",
					"required": false,
					"description": "揺らす回数を指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "揺れの終了を待つかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "time",
					"required": true,
					"description": "１回揺れるのにかかる時間をミリ秒で指定します。"
				},
				{
					"name": "hmax",
					"required": false,
					"description": "揺れの横方向への最大振幅を指定します。"
				},
				{
					"name": "vmax",
					"required": false,
					"description": "揺れの縦方向への最大振幅を指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"quake2": {
			"name": "quake2",
			"summary": "画面を揺らす",
			"category": "演出・効果・動画",
			"description": "指定したミリ秒だけ画面を揺らします。",
			"parameters": [
				{
					"name": "time",
					"required": false,
					"description": "揺れ全体の時間をミリ秒で指定します。"
				},
				{
					"name": "hmax",
					"required": false,
					"description": "揺れの横方向への最大振幅を指定します。"
				},
				{
					"name": "vmax",
					"required": false,
					"description": "揺れの縦方向への最大振幅を指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "揺れの終了を待つかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "copybase",
					"required": false,
					"description": "trueを指定した場合、画面が揺れている間、ベースレイヤの背景のコピーが最後面に固定されます。これによって、たとえば画面が上に揺れた瞬間に下側にできる隙間から黒色がのぞくことがなくなります。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"vibrate": {
			"name": "vibrate",
			"summary": "スマホ・パッドの振動",
			"category": "演出・効果・動画",
			"description": "プレイヤーが使用しているモバイル端末やゲームパッドを振動させることができます。",
			"parameters": [
				{
					"name": "time",
					"required": false,
					"description": "振動させる時間(ミリ秒)。600,200,1000,200,600のようにカンマ区切りで複数の数値を指定すると、600ミリ秒振動→200ミリ秒静止→1000ミリ秒静止→…というパターンを指定することができます。"
				},
				{
					"name": "power",
					"required": false,
					"description": "振動させる強さ(0～100)。ゲームパッドを振動させるときのみ有効なパラメータです。"
				},
				{
					"name": "count",
					"required": false,
					"description": "振動を繰り返す回数。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"vibrate_stop": {
			"name": "vibrate_stop",
			"summary": "スマホ・パッドの振動停止",
			"category": "演出・効果・動画",
			"description": "[vibrate]で開始したモバイル端末やゲームパッドの振動を途中で停止することができます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"layermode": {
			"name": "layermode",
			"summary": "レイヤーモード",
			"category": "演出・効果・動画",
			"description": "ゲーム画面上に画像を合成できます。乗算、スクリーン、オーバーレイなどの合成方法を選べます。",
			"parameters": [
				{
					"name": "name",
					"required": false,
					"description": "合成する画像につける名前を指定します。ここで指定した名前は[free_layremovde]で特定の合成のみを消したい際に使用します。"
				},
				{
					"name": "graphic",
					"required": false,
					"description": "合成する画像ファイルを指定します。ファイルはimageフォルダに配置します。"
				},
				{
					"name": "color",
					"required": false,
					"description": "画像を使わず単色を合成することもできます。その場合、このパラメータに合成色を0xRRGGBB形式で指定します。"
				},
				{
					"name": "mode",
					"required": false,
					"description": "合成方法を指定できます。以下のキーワードが指定できます。\nmultiply(乗算)\nscreen(スクリーン)\noverlay(オーバーレイ)\ndarken(暗く)\nlighten(明るく)\ncolor-dodge(覆い焼きカラー)\ncolor-burn(焼き込みカラー)\nhard-light(ハードライト)\nsoft-light(ソフトライト)\ndifference(差の絶対値)\nexclusion(除外)\nhue(色相)\nsaturation(彩度)\ncolor(カラー)\nluminosity(輝度)"
				},
				{
					"name": "folder",
					"required": false,
					"description": "graphicで指定する画像のフォルダを変更できます。たとえばbgimageと指定するとbgimageから画像を取得します。"
				},
				{
					"name": "opacity",
					"required": false,
					"description": "不透明度を0～255の数値で指定します。0で完全に透明になります。"
				},
				{
					"name": "time",
					"required": false,
					"description": "フェードイン時間をミリ秒単位で指定します。これを指定すると、画像が透明な状態から徐々に表示されていきます。省略すると、一瞬で表示されます。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "フェードインの完了を待つかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"layermode_movie": {
			"name": "layermode_movie",
			"summary": "レイヤーモード（動画）",
			"category": "演出・効果・動画",
			"description": "ゲーム画面上に動画レイヤを合成できます。IEなど一部の古いブラウザでは動作しないため、ブラウザゲームとして公開する場合は注意してください。",
			"parameters": [
				{
					"name": "name",
					"required": false,
					"description": "合成するレイヤに名前をつけることができます。この名前は[free_layremovde]タグで特定の合成レイヤのみを消したい場合に使用します。"
				},
				{
					"name": "video",
					"required": true,
					"description": "合成する動画ファイルを指定します。ファイルはdata/videoフォルダに配置します。"
				},
				{
					"name": "volume",
					"required": false,
					"description": "合成する動画の音量を0〜100で指定します。"
				},
				{
					"name": "mute",
					"required": false,
					"description": "動画の音をミュートするかどうか。trueまたはfalseで指定します。ブラウザ上では動画を再生する前にユーザアクション（タップなど）が必要という制限がありますが、trueを指定することでこの制限を無視できます。"
				},
				{
					"name": "loop",
					"required": false,
					"description": "動画をループするかどうか。trueまたはfalseで指定します。デフォルトはtrue。ループ指定した場合、[free_layermode]を行うまで演出が残ります。"
				},
				{
					"name": "speed",
					"required": false,
					"description": "動画の再生スピードを指定できます。2を指定すると2倍速、0.5を指定すると半分の速度で再生されます。"
				},
				{
					"name": "mode",
					"required": false,
					"description": "合成方法を指定できます。デフォルトは「multiply」 次の効果が使えます→ multiply（乗算）screen（スクリーン）overlay（オーバーレイ）darken（暗く）lighten（明るく）color-dodge（覆い焼きカラー）color-burn（焼き込みカラー）hard-light（ハードライト）soft-light（ソフトライト）difference（差の絶対値）exclusion（除外）hue（色相）saturation（彩度）color（カラー）luminosity（輝度）"
				},
				{
					"name": "opacity",
					"required": false,
					"description": "不透明度を0～255の数値で指定します。0で完全に透明になります。"
				},
				{
					"name": "time",
					"required": false,
					"description": "フェードイン時間をミリ秒単位で指定します。"
				},
				{
					"name": "left",
					"required": false,
					"description": "合成レイヤの位置を指定できます。（ピクセル）"
				},
				{
					"name": "top",
					"required": false,
					"description": "合成レイヤの位置を指定できます。（ピクセル）"
				},
				{
					"name": "width",
					"required": false,
					"description": "合成レイヤの横幅を指定します。（ピクセル）"
				},
				{
					"name": "height",
					"required": false,
					"description": "合成レイヤの高さを指定します。（ピクセル）"
				},
				{
					"name": "fit",
					"required": false,
					"description": "合成レイヤをゲーム画面いっぱいに引き伸ばすかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "合成した動画の再生完了を待つかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"free_layermode": {
			"name": "free_layermode",
			"summary": "合成レイヤの消去",
			"category": "演出・効果・動画",
			"description": "合成レイヤを消去します。",
			"parameters": [
				{
					"name": "name",
					"required": false,
					"description": "消去する合成レイヤのnameを指定します。省略すると、すべての合成レイヤが消去されます。"
				},
				{
					"name": "time",
					"required": false,
					"description": "フェードアウト時間をミリ秒で指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "フェードアウトの完了を待つかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"movie": {
			"name": "movie",
			"summary": "動画の再生",
			"category": "演出・効果・動画",
			"description": "ゲーム画面上で動画を再生します。動画ファイルはdata/videoフォルダに配置します。",
			"parameters": [
				{
					"name": "storage",
					"required": true,
					"description": "再生する動画ファイルを指定します。"
				},
				{
					"name": "skip",
					"required": false,
					"description": "動画を途中でスキップできるようにするかどうか。trueまたはfalseで指定します。trueを指定すると、プレイヤーが画面クリックで動画を飛ばせるようになります。"
				},
				{
					"name": "mute",
					"required": false,
					"description": "動画の音をミュートするかどうか。trueまたはfalseで指定します。ブラウザ上では動画を再生する前にユーザアクション（タップなど）が必要という制限がありますが、trueを指定することでこの制限を無視できます。"
				},
				{
					"name": "volume",
					"required": false,
					"description": "動画の音量を0〜100で指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"bgmovie": {
			"name": "bgmovie",
			"summary": "背景ムービーの再生",
			"category": "演出・効果・動画",
			"description": "ゲーム画面の背景に動画を使用できます。動画ファイルはdata/videoフォルダに配置します。",
			"parameters": [
				{
					"name": "storage",
					"required": true,
					"description": "再生する動画ファイルを指定します。"
				},
				{
					"name": "time",
					"required": false,
					"description": "フェードイン時間をミリ秒で指定します。"
				},
				{
					"name": "mute",
					"required": false,
					"description": "動画の音をミュートするかどうか。trueまたはfalseで指定します。ブラウザ上では動画を再生する前にユーザアクション（タップなど）が必要という制限がありますが、trueを指定することでこの制限を無視できます。"
				},
				{
					"name": "volume",
					"required": false,
					"description": "動画の音量を0〜100で指定します。"
				},
				{
					"name": "loop",
					"required": false,
					"description": "背景動画をループさせるかどうか。trueまたはfalseで指定します。falseを指定すると動画の最後の状態で停止します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"wait_bgmovie": {
			"name": "wait_bgmovie",
			"summary": "背景ムービーの再生完了を待つ",
			"category": "演出・効果・動画",
			"description": "再生中の背景ムービーの完了を待ちます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"stop_bgmovie": {
			"name": "stop_bgmovie",
			"summary": "背景ムービーの停止",
			"category": "演出・効果・動画",
			"description": "bgmovieで再生した背景動画を停止します。",
			"parameters": [
				{
					"name": "time",
					"required": false,
					"description": "フェードアウト時間をミリ秒で指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "フェードアウト完了を待つかどうかをtrueまたはfalseで指定できます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"filter": {
			"name": "filter",
			"summary": "フィルター効果演出",
			"category": "演出・効果・動画",
			"description": "レイヤやオブジェクトを指定して、様々なフィルター効果を追加できます。",
			"parameters": [
				{
					"name": "layer",
					"required": false,
					"description": "フィルタをかけるレイヤを指定します。省略すると、もしくはallと指定するとゲーム画面全てに効果がかかります。"
				},
				{
					"name": "name",
					"required": false,
					"description": "特定の要素にフィルタをかけたい場合に、その要素のnameを指定します。"
				},
				{
					"name": "grayscale",
					"required": false,
					"description": "0(デフォルト)～100を指定することで、画像の表示をグレースケールに変換できます。"
				},
				{
					"name": "sepia",
					"required": false,
					"description": "0(デフォルト)～100を指定することで、画像の表示をセピア調に変換できます。"
				},
				{
					"name": "saturate",
					"required": false,
					"description": "0～100(デフォルト)を指定してあげることで、画像の表示の彩度（色の鮮やかさ）を変更できます。"
				},
				{
					"name": "hue",
					"required": false,
					"description": "0(デフォルト)～360を指定することで、画像の表示の色相を変更できます。"
				},
				{
					"name": "invert",
					"required": false,
					"description": "0(デフォルト)～100を指定することで、画像の表示の階調を反転させることができます。"
				},
				{
					"name": "opacity",
					"required": false,
					"description": "0～100(デフォルト)を指定することで、画像の表示の透過度を変更できます。"
				},
				{
					"name": "brightness",
					"required": false,
					"description": "100(デフォルト)を基準とする数値を指定することで、画像の明度を変更できます。0で真っ暗に、100以上の数値でより明るくなります。"
				},
				{
					"name": "contrast",
					"required": false,
					"description": "0～100(デフォルト)を指定することで、画像の表示のコントラストを変更できます。"
				},
				{
					"name": "blur",
					"required": false,
					"description": "0(デフォルト)～任意の値を指定することで、画像の表示をぼかすことができます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"free_filter": {
			"name": "free_filter",
			"summary": "フィルター効果消去",
			"category": "演出・効果・動画",
			"description": "レイヤやオブジェクトを指定して、[filter]効果を無効にします。",
			"parameters": [
				{
					"name": "layer",
					"required": false,
					"description": "フィルターを消去するレイヤを指定します。指定がない場合、すべてのフィルターが消去されます。"
				},
				{
					"name": "name",
					"required": false,
					"description": "特定の要素のフィルターを消去したい場合に、その要素のnameを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"mask": {
			"name": "mask",
			"summary": "スクリーンマスク表示",
			"category": "演出・効果・動画",
			"description": "ゲーム画面全体を豊富な効果とともに暗転させることができます。\n暗転中にゲーム画面を再構築して[mask_off]タグでゲームを再開する使い方ができます。",
			"parameters": [
				{
					"name": "time",
					"required": false,
					"description": "暗転が完了するまでの時間をミリ秒で指定できます。"
				},
				{
					"name": "effect",
					"required": false,
					"description": "暗転の効果を指定できます。以下のキーワードが指定できます。\nfadeInfadeInDownBigfadeInLeftBigfadeInRightBigfadeInUpBigflipInXflipInYlightSpeedInrotateInrotateInDownLeftrotateInDownRightrotateInUpLeftrotateInUpRightzoomInzoomInDownzoomInLeftzoomInRightzoomInUpslideInDownslideInLeftslideInRightslideInUpbounceIn bounceInDownbounceInLeftbounceInRightbounceInUprollIn"
				},
				{
					"name": "color",
					"required": false,
					"description": "暗転の色を0xRRGGBB形式で指定します。デフォルトは黒。"
				},
				{
					"name": "graphic",
					"required": false,
					"description": "指定すると、暗転部分に画像を使用できます。画像はdata/imageフォルダに配置します。"
				},
				{
					"name": "folder",
					"required": false,
					"description": "graphicで指定するフォルダをimage以外に変更したい場合はこちらに記述します。bgimagefgimageなどを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"mask_off": {
			"name": "mask_off",
			"summary": "スクリーンマスク消去",
			"category": "演出・効果・動画",
			"description": "スクリーンマスクを消去してゲームを再開します。",
			"parameters": [
				{
					"name": "time",
					"required": false,
					"description": "暗転が完了するまでの時間をミリ秒で指定できます。"
				},
				{
					"name": "effect",
					"required": false,
					"description": "暗転の効果を指定できます。以下のキーワードが指定できます。\nfadeOutfadeOutDownBigfadeOutLeftBigfadeOutRightBigfadeOutUpBigflipOutXflipOutYlightSpeedOutrotateOutrotateOutDownLeftrotateOutDownRightrotateOutUpLeftrotateOutUpRightzoomOutzoomOutDownzoomOutLeftzoomOutRightzoomOutUpslideOutDownslideOutLeftslideOutRightslideOutUpbounceOut bounceOutDownbounceOutLeftbounceOutRightbounceOutUp"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"anim": {
			"name": "anim",
			"summary": "アニメーション",
			"category": "アニメーション",
			"description": "画像やボタン、レイヤなどの中身をアニメーションさせることができます。",
			"parameters": [
				{
					"name": "name",
					"required": false,
					"description": "ここで指定した値が設定されている要素に対してアニメーションを開始します。name属性で指定した値です。"
				},
				{
					"name": "layer",
					"required": false,
					"description": "name属性が指定されている場合は無視されます。前景レイヤを指定します。必ずforeページに対して実施されます。"
				},
				{
					"name": "left",
					"required": false,
					"description": "指定した横位置にアニメーションで移動します。"
				},
				{
					"name": "top",
					"required": false,
					"description": "指定した縦位置にアニメーションで移動します。"
				},
				{
					"name": "width",
					"required": false,
					"description": "幅を指定します"
				},
				{
					"name": "height",
					"required": false,
					"description": "高さを指定します"
				},
				{
					"name": "opacity",
					"required": false,
					"description": "0～255の値を指定します。指定した透明度へアニメーションします"
				},
				{
					"name": "color",
					"required": false,
					"description": "色指定"
				},
				{
					"name": "time",
					"required": false,
					"description": "アニメーションにかける時間をミリ秒で指定してください。デフォルトは2000ミリ秒です"
				},
				{
					"name": "effect",
					"required": false,
					"description": "変化のエフェクトを指定します。以下のキーワードが指定できます。jswingdefeaseInQuadeaseOutQuadeaseInOutQuadeaseInCubiceaseOutCubiceaseInOutCubiceaseInQuarteaseOutQuarteaseInOutQuarteaseInQuinteaseOutQuinteaseInOutQuinteaseInSineeaseOutSineeaseInOutSineeaseInExpoeaseOutExpoeaseInOutExpoeaseInCirceaseOutCirceaseInOutCirceaseInElasticeaseOutElasticeaseInOutElasticeaseInBackeaseOutBackeaseInOutBackeaseInBounceeaseOutBounceeaseInOutBounce"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"wa": {
			"name": "wa",
			"summary": "アニメーション終了待ち",
			"category": "アニメーション",
			"description": "実行中のアニメーションすべて終了するまで処理を待ちます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"stopanim": {
			"name": "stopanim",
			"summary": "アニメーション強制停止",
			"category": "アニメーション",
			"description": "実行中のアニメーションを強制的に停止します。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "アニメーションを強制停止する要素のnameを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"keyframe": {
			"name": "keyframe",
			"summary": "キーフレームアニメーション定義の開始",
			"category": "アニメーション",
			"description": "キーフレームアニメーションの定義を開始します。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "キーブレームアニメーションの名前を指定します。[kanim]タグで使用します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"endkeyframe": {
			"name": "endkeyframe",
			"summary": "キーフレームアニメーション定義の終了",
			"category": "アニメーション",
			"description": "キーフレームアニメーション定義を終了します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"frame": {
			"name": "frame",
			"summary": "キーフレームアニメーション定義",
			"category": "アニメーション",
			"description": "キーフレームをひとつ定義します。[keyframe]と[endkeyframe]の間に記述します。",
			"parameters": [
				{
					"name": "p",
					"required": true,
					"description": "キーフレームの位置をパーセンテージ（0%〜100%）で指定します。たとえば50%と指定すれば、全体の長さが4秒のアニメーションのなかの2秒目、となります。0%のキーフレームを省略することで前回のアニメーション状態を継承できます。"
				},
				{
					"name": "x",
					"required": false,
					"description": "X軸方向へのアニメーション量をピクセル単位で指定してください。*(アスタリスク)で始めることで、絶対位置として指定できます。\n例） x＝\"100\"(前へ100px移動する)、x=\"*100\"(画面左端から100pxの位置へ移動する)"
				},
				{
					"name": "y",
					"required": false,
					"description": "Y軸方向へのアニメーション量をピクセル単位で指定してください。*(アスタリスク)で始めることで、絶対位置として指定できます。"
				},
				{
					"name": "z",
					"required": false,
					"description": "Z軸方向へのアニメーション量をピクセル単位で指定してください。*(アスタリスク)で始めることで、絶対位置として指定できます。\n\nこのパラメータを使用することで三次元的な表現が可能ですが、対応しているのは一部のブラウザのみとなります。"
				},
				{
					"name": "rotate",
					"required": false,
					"description": "対象を回転させることができます。たとえば180度回転させたい場合、180degのように指定します。"
				},
				{
					"name": "rotateX",
					"required": false,
					"description": "対象をX軸を軸として回転させることができます。"
				},
				{
					"name": "rotateY",
					"required": false,
					"description": "対象をY軸を軸として回転させることができます。"
				},
				{
					"name": "rotateZ",
					"required": false,
					"description": "対象をZ軸を軸として回転させることができます。"
				},
				{
					"name": "scale",
					"required": false,
					"description": "対象を拡大または縮小できます。2倍に拡大するには2を、半分に縮小するには0.5を指定します。"
				},
				{
					"name": "scaleX",
					"required": false,
					"description": "X方向に拡大または縮小できます。"
				},
				{
					"name": "scaleY",
					"required": false,
					"description": "Y方向に拡大または縮小できます。"
				},
				{
					"name": "scaleZ",
					"required": false,
					"description": "Z方向に拡大または縮小できます。"
				},
				{
					"name": "skew",
					"required": false,
					"description": "傾斜を指定できます。"
				},
				{
					"name": "skewX",
					"required": false,
					"description": "X傾斜を指定できます。"
				},
				{
					"name": "skewY",
					"required": false,
					"description": "Y傾斜を指定できます。"
				},
				{
					"name": "perspective",
					"required": false,
					"description": "遠近効果を付与できます。一部ブラウザのみ対応。"
				},
				{
					"name": "opacity",
					"required": false,
					"description": "不透明度を0～255の数値で指定します。0で完全に透明になります。"
				},
				{
					"name": "その他",
					"required": false,
					"description": "CSSのスタイルを各種指定できます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"kanim": {
			"name": "kanim",
			"summary": "キーフレームアニメーションの実行",
			"category": "アニメーション",
			"description": "キーフレームアニメーションを実行します。事前に[keyframe]タグでキーフレームアニメーションを定義しておく必要があります。",
			"parameters": [
				{
					"name": "name",
					"required": false,
					"description": "アニメーションさせる画像やテキストのnameを指定します。"
				},
				{
					"name": "layer",
					"required": false,
					"description": "nameを指定せずにlayerを指定することで、そのレイヤに存在するすべての要素をアニメーションさせることができます。"
				},
				{
					"name": "keyframe",
					"required": true,
					"description": "適用するキーフレームアニメーションのnameを指定します。"
				},
				{
					"name": "time",
					"required": false,
					"description": "アニメーション時間をミリ秒で指定します。"
				},
				{
					"name": "easing",
					"required": false,
					"description": "アニメーションの変化パターンを指定できます。以下のキーワードが指定できます。\nease(開始時点と終了時点を滑らかに再生する)\nlinear(一定の間隔で再生する)\nease-in(開始時点をゆっくり再生する)\nease-out(終了時点をゆっくり再生する)\nease-in-out(開始時点と終了時点をゆっくり再生する)\nこの他にcubic-bezier関数を使って独自のイージングを指定することも可能です。"
				},
				{
					"name": "count",
					"required": false,
					"description": "再生回数を指定できます。infiniteを指定することで無限ループさせることもできます。"
				},
				{
					"name": "delay",
					"required": false,
					"description": "開始までの時間を指定できます。初期値は0、つまり遅延なしです。"
				},
				{
					"name": "direction",
					"required": false,
					"description": "アニメーションを複数回ループさせる場合に、偶数回目のアニメーションを逆再生にするかを設定できます。偶数回目を逆再生にする場合はalternateを指定します。"
				},
				{
					"name": "mode",
					"required": false,
					"description": "アニメーションの最後のフレームの状態（位置、回転など）をアニメーション終了後も維持するかを設定できます。forwards(デフォルト)で維持。noneを指定すると、アニメーション再生前の状態に戻ります。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"stop_kanim": {
			"name": "stop_kanim",
			"summary": "キーフレームアニメーションの停止",
			"category": "アニメーション",
			"description": "キーフレームアニメーションを停止します。",
			"parameters": [
				{
					"name": "name",
					"required": false,
					"description": "アニメーションを停止する画像やテキストのnameを指定します。"
				},
				{
					"name": "layer",
					"required": false,
					"description": "nameを指定せずにlayerを指定することで、そのレイヤに存在するすべての要素のアニメーションを停止できます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"xanim": {
			"name": "xanim",
			"summary": "汎用アニメーションの実行",
			"category": "アニメーション",
			"description": "V515以降で使用可能。",
			"parameters": [
				{
					"name": "name",
					"required": false,
					"description": "アニメーションさせる画像やテキストのnameを指定します。"
				},
				{
					"name": "layer",
					"required": false,
					"description": "nameを指定せずにlayerを指定することで、そのレイヤに存在するすべての要素をアニメーションさせることができます。"
				},
				{
					"name": "keyframe",
					"required": false,
					"description": "適用するキーフレームアニメーションのnameを指定します。"
				},
				{
					"name": "time",
					"required": false,
					"description": "アニメーション時間をミリ秒で指定します。"
				},
				{
					"name": "easing",
					"required": false,
					"description": "[anim]タグに指定できるキーワードと[kanim]に指定できるキーワードがすべて使用可能です。"
				},
				{
					"name": "count",
					"required": false,
					"description": "再生回数を指定できます。infiniteを指定することで無限ループさせることもできます。"
				},
				{
					"name": "delay",
					"required": false,
					"description": "開始までの時間を指定できます。初期値は0、つまり遅延なしです。"
				},
				{
					"name": "direction",
					"required": false,
					"description": "アニメーションを複数回ループさせる場合に、偶数回目のアニメーションを逆再生にするかを設定できます。偶数回目を逆再生にする場合はalternateを指定します。"
				},
				{
					"name": "mode",
					"required": false,
					"description": "アニメーションの最後のフレームの状態（位置、回転など）をアニメーション終了後も維持するかを設定できます。forwards(デフォルト)で維持。noneを指定すると、アニメーション再生前の状態に戻ります。"
				},
				{
					"name": "svg",
					"required": false,
					"description": "svgファイルを指定できます。svgファイルはimageフォルダに配置します。これを指定すると、svgファイル内で定義されたに沿ってアニメーションさせることができます。"
				},
				{
					"name": "svg_x",
					"required": false,
					"description": "svgファイルを指定したとき、X座標をに沿わせるかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "svg_y",
					"required": false,
					"description": "svgファイルを指定したとき、Y座標をに沿わせるかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "svg_rotate",
					"required": false,
					"description": "svgファイルを指定したとき、角度をに沿わせるかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "アニメーションの完了を待つかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "他",
					"required": false,
					"description": "この他、[anim]タグに指定できるパラメータや、各種CSSプロパティをアニメーション対象にすることができます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"stop_xanim": {
			"name": "stop_xanim",
			"summary": "[xanim]の停止",
			"category": "アニメーション",
			"description": "V515以降で使用可能。\n[xanim]で開始したアニメーションを停止します。",
			"parameters": [
				{
					"name": "name",
					"required": false,
					"description": "アニメーションを停止する画像やテキストのnameを指定します。"
				},
				{
					"name": "layer",
					"required": false,
					"description": "nameを指定せずにlayerを指定することで、そのレイヤに存在するすべての要素のアニメーションを停止できます。"
				},
				{
					"name": "complete",
					"required": false,
					"description": "trueを指定すると、当初アニメーションするはずだった地点まで一瞬で移動させます。falseの場合はその場で止まります。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"camera": {
			"name": "camera",
			"summary": "カメラを移動する",
			"category": "カメラ操作",
			"description": "カメラのズームやパンのような演出ができます。\nカメラ機能を使うことで、キャラクターの立ち絵の表情にフォーカスをあてたり、一枚絵のいろんな個所をズームしてみたりと多彩な演出ができます。",
			"parameters": [
				{
					"name": "time",
					"required": false,
					"description": "カメラが座標へ移動する時間をミリ秒で指定します。"
				},
				{
					"name": "x",
					"required": false,
					"description": "カメラの移動するX座標を指定します。"
				},
				{
					"name": "y",
					"required": false,
					"description": "カメラの移動するY座標を指定します"
				},
				{
					"name": "zoom",
					"required": false,
					"description": "カメラの拡大率を指定します。２と指定すると2倍ズームとなります。"
				},
				{
					"name": "rotate",
					"required": false,
					"description": "カメラの傾きを指定します。20と指定するとカメラが20度傾きます。"
				},
				{
					"name": "from_x",
					"required": false,
					"description": "カメラの移動開始時のX座標を指定できます。"
				},
				{
					"name": "from_y",
					"required": false,
					"description": "カメラの移動開始時のY座標を指定できます。"
				},
				{
					"name": "from_zoom",
					"required": false,
					"description": "カメラの移動開始時の倍率を指定できます。"
				},
				{
					"name": "from_rotate",
					"required": false,
					"description": "カメラの移動開始時の傾きを指定できます。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "カメラ移動の完了を待つかどうかをtrueまたはfalseで指定します。falseを指定するとカメラ移動中もゲームを進行できます。"
				},
				{
					"name": "layer",
					"required": false,
					"description": "カメラの効果を与えるレイヤを指定します。背景ならbase、前景レイヤなら0以上の数字。これを指定すると、カメラの影響を特定レイヤに限定できます。通常はすべてのレイヤに対して影響を及ぼします。"
				},
				{
					"name": "ease_type",
					"required": false,
					"description": "カメラの移動演出を指定できます。\nease(開始時点と終了時点を滑らかに再生する)\nlinear(一定の速度で再生する)\nease-in(開始時点をゆっくり再生する)\nease-out(終了時点をゆっくり再生する)\nease-in-out(開始時点と終了時点をゆっくり再生する)"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"reset_camera": {
			"name": "reset_camera",
			"summary": "カメラをリセットする",
			"category": "カメラ操作",
			"description": "カメラの位置を初期値に戻します。",
			"parameters": [
				{
					"name": "time",
					"required": false,
					"description": "カメラの移動時間をミリ秒で指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "カメラ移動の完了を待つかどうかをtrueまたはfalseで指定します。falseを指定するとカメラ移動中もゲームを進行できます。"
				},
				{
					"name": "layer",
					"required": false,
					"description": "カメラの効果を与えるレイヤを指定します。背景ならbase、前景レイヤなら0以上の数字。これを指定すると、カメラの影響を特定レイヤに限定できます。通常はすべてのレイヤに対して影響を及ぼします。"
				},
				{
					"name": "ease_type",
					"required": false,
					"description": "カメラの移動演出を指定できます。\nease(開始時点と終了時点を滑らかに再生する)\nlinear(一定の速度で再生する)\nease-in(開始時点をゆっくり再生する)\nease-out(終了時点をゆっくり再生する)\nease-in-out(開始時点と終了時点をゆっくり再生する)"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"wait_camera": {
			"name": "wait_camera",
			"summary": "カメラの演出を待つ",
			"category": "カメラ操作",
			"description": "カメラが演出中である場合、その完了を待つことができます。wait=falseを指定した[camera]タグと組み合わせて使います。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"s": {
			"name": "s",
			"summary": "ゲームを停止する",
			"category": "システム操作",
			"description": "シナリオファイルの実行を停止します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"wait": {
			"name": "wait",
			"summary": "ウェイト",
			"category": "システム操作",
			"description": "ウェイトを入れます。time属性で指定した時間、操作できなくなります。",
			"parameters": [
				{
					"name": "time",
					"required": true,
					"description": "ウェイトをミリ秒で指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"wait_cancel": {
			"name": "wait_cancel",
			"summary": "ウェイトのキャンセル",
			"category": "システム操作",
			"description": "[wait]タグによるウェイト状態をキャンセルできます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"close": {
			"name": "close",
			"summary": "ウィンドウを閉じる",
			"category": "システム操作",
			"description": "PCアプリの場合、ウィンドウを閉じます。\nブラウザゲームの場合、タブを閉じます。",
			"parameters": [
				{
					"name": "ask",
					"required": false,
					"description": "終了の確認をするかどうか。trueまたはfalseで指定します。デフォルトはtrue。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"savesnap": {
			"name": "savesnap",
			"summary": "セーブスナップの作成",
			"category": "システム操作",
			"description": "現在のプレイ状況を一時保存します。その後、tyrano.ks拡張の[setsave]を行うことで、ここで記録したセーブデータが保存されます。",
			"parameters": [
				{
					"name": "title",
					"required": true,
					"description": "セーブデータのタイトルを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"autosave": {
			"name": "autosave",
			"summary": "オートセーブを実行",
			"category": "システム操作",
			"description": "このタグに到達した際、自動的にプレイ状況を保存します。",
			"parameters": [
				{
					"name": "title",
					"required": false,
					"description": "セーブデータのタイトルを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"autoload": {
			"name": "autoload",
			"summary": "オートロードを実行",
			"category": "システム操作",
			"description": "[autosave]タグで保存されたデータを読み込みます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"screen_full": {
			"name": "screen_full",
			"summary": "フルスクリーン",
			"category": "システム操作",
			"description": "ゲーム画面をフルスクリーンにします。再度呼び出すことでフルスクリーンからウィンドウに戻ります。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"dialog": {
			"name": "dialog",
			"summary": "ダイアログ表示",
			"category": "システム操作",
			"description": "確認用のダイアログを表示します。",
			"parameters": [
				{
					"name": "type",
					"required": false,
					"description": "ダイアログの種類を以下のキーワードのいずれかで指定します。\nalert(警告)\nconfirm(確認)\ninput(入力)"
				},
				{
					"name": "name",
					"required": false,
					"description": "入力ダイアログの場合に、入力内容を保存する変数名を指定します。f.nameなど。"
				},
				{
					"name": "text",
					"required": false,
					"description": "ダイアログに表示するメッセージを記述します。"
				},
				{
					"name": "storage",
					"required": false,
					"description": "OKボタンが押されたときのジャンプ先のシナリオファイルを指定します。省略すると、現在のシナリオファイルとみなされます。"
				},
				{
					"name": "target",
					"required": false,
					"description": "OKボタンが押されたときのジャンプ先のラベルを指定します。省略すると、シナリオファイルの先頭とみなされます。\n\nなお、storageとtargetが両方省略されている場合、単に次のタグに進みます。"
				},
				{
					"name": "storage_cancel",
					"required": false,
					"description": "キャンセルボタンが押されたときのジャンプ先のシナリオファイルを指定します。省略すると、現在のシナリオファイルとみなされます。"
				},
				{
					"name": "target_cancel",
					"required": false,
					"description": "キャンセルボタンが押されたときのジャンプ先のラベルを指定します。省略すると、シナリオファイルの先頭とみなされます。"
				},
				{
					"name": "label_ok",
					"required": false,
					"description": "OKボタンのテキストを変更できます。"
				},
				{
					"name": "label_cancel",
					"required": false,
					"description": "キャンセルボタンのテキストを変更できます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"start_keyconfig": {
			"name": "start_keyconfig",
			"summary": "キーコンフィグ操作の有効化",
			"category": "システム操作",
			"description": "[stop_keyconfig]で無効化したキーコンフィグを有効化できます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"stop_keyconfig": {
			"name": "stop_keyconfig",
			"summary": "キーコンフィグ操作の無効化",
			"category": "システム操作",
			"description": "キーコンフィグを一時的に無効化します。[start_keyconfig]で再び有効化できます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"apply_local_patch": {
			"name": "apply_local_patch",
			"summary": "パッチファイルの適用",
			"category": "システム操作",
			"description": "V470以降で使用可。PCアプリとして配布している場合のみ有効です。",
			"parameters": [
				{
					"name": "file",
					"required": true,
					"description": "パッチファイルのパスを指定します。exeファイルの階層を起点として指定します"
				},
				{
					"name": "reload",
					"required": false,
					"description": "trueまたはfalseを指定します。trueを指定すると、パッチ反映後にゲームが自動的に再起動されます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"check_web_patch": {
			"name": "check_web_patch",
			"summary": "アップデートのチェック",
			"category": "システム操作",
			"description": "V470以降で使用可。PCアプリとして配布している場合のみ有効です。",
			"parameters": [
				{
					"name": "url",
					"required": true,
					"description": "パッチのjsonファイルのURLを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"closeconfirm_on": {
			"name": "closeconfirm_on",
			"summary": "終了時の確認の有効化",
			"category": "システム操作",
			"description": "このタグを通過してからは、タグが進行する度にゲームが「未保存状態」になります。ゲームが「未保存状態」のときにプレイヤーがゲームを閉じようとすると、確認ダイアログが出ます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"closeconfirm_off": {
			"name": "closeconfirm_off",
			"summary": "終了時の確認の無効化",
			"category": "システム操作",
			"description": "このタグを通過すると、ゲームが「未保存状態」のときにプレイヤーがゲームを閉じようとしても確認ダイアログが出なくなります。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"glyph": {
			"name": "glyph",
			"summary": "クリック待ちグリフの設定",
			"category": "システムデザイン変更",
			"description": "クリック待ちグリフ（[l]や[p]でクリックを待つ状態のときにメッセージの末尾に表示される画像）の設定が変更できます。使用する画像を変更したり、位置をメッセージの最後ではなく画面上の固定位置に出すようにしたりできます。",
			"parameters": [
				{
					"name": "line",
					"required": false,
					"description": "グリフに使用する画像を指定できます。画像ファイルは、デフォルトではtyrano/images/systemフォルダ（nextpage.gifがあるフォルダ）から探されます。folderパラメータで変更可。"
				},
				{
					"name": "fix",
					"required": false,
					"description": "trueを指定すると、グリフがメッセージの末尾ではなくゲーム画面上の固定位置に表示されます。"
				},
				{
					"name": "left",
					"required": false,
					"description": "グリフを表示する横の位置を指定します。（fix属性をtrueにした場合に有効）"
				},
				{
					"name": "top",
					"required": false,
					"description": "グリフを表示する縦の位置を指定します。（fix属性をtrueにした場合に有効）"
				},
				{
					"name": "folder",
					"required": false,
					"description": "グリフの画像を探すフォルダを指定できます。"
				},
				{
					"name": "width",
					"required": false,
					"description": "グリフの横幅をpx単位で指定できます。"
				},
				{
					"name": "height",
					"required": false,
					"description": "グリフの高さをpx単位で指定できます。"
				},
				{
					"name": "marginl",
					"required": false,
					"description": "グリフの左側の余白をpx単位で指定できます。"
				},
				{
					"name": "marginb",
					"required": false,
					"description": "グリフの下側の余白をpx単位で指定できます。"
				},
				{
					"name": "anim",
					"required": false,
					"description": "グリフに適用するアニメーションを以下のキーワードから指定できます。\nflash_momentary(瞬間的な点滅)\nflash(滑らかな点滅)\nspin_x(X軸を中心に回転)\nspin_y(Y軸を中心に回転)\nspin_z(Z軸を中心に回転)\nbounce(バウンド)\nrotate_bounce(回転しながらバウンド)\nsoft_bounce(ぽよんと弾むバウンド)\nzoom(拡縮)"
				},
				{
					"name": "time",
					"required": false,
					"description": "グリフに適用するアニメーションの時間をミリ秒単位で指定します。"
				},
				{
					"name": "figure",
					"required": false,
					"description": "グリフに使用する図形を以下のキーワードから指定できます。\ncircle(円)\ntriangle(三角形)\nv_triangle(下向き三角形)\nrectangle(四角形)\ndiamond(ひし形)\nstart(星)"
				},
				{
					"name": "color",
					"required": false,
					"description": "グリフに図形を使用する場合に、図形の色を指定できます。"
				},
				{
					"name": "name",
					"required": false,
					"description": "グリフに付けるクラス名を指定できます。（上級者向け）"
				},
				{
					"name": "html",
					"required": false,
					"description": "グリフのコンテンツとしてHTMLを直接指定できます。（上級者向け）"
				},
				{
					"name": "keyframe",
					"required": false,
					"description": "適用するキーフレームアニメーションのnameを指定します。animと併用することはできません。"
				},
				{
					"name": "easing",
					"required": false,
					"description": "アニメーションの変化パターンを指定できます。以下のキーワードが指定できます。\nease(開始時点と終了時点を滑らかに再生する)\nlinear(一定の間隔で再生する)\nease-in(開始時点をゆっくり再生する)\nease-out(終了時点をゆっくり再生する)\nease-in-out(開始時点と終了時点をゆっくり再生する)\nこの他にcubic-bezier関数を使って独自のイージングを指定することも可能です。"
				},
				{
					"name": "count",
					"required": false,
					"description": "再生回数を指定できます。infiniteを指定することで無限ループさせることもできます。"
				},
				{
					"name": "delay",
					"required": false,
					"description": "開始までの時間を指定できます。初期値は0、つまり遅延なしです。"
				},
				{
					"name": "direction",
					"required": false,
					"description": "アニメーションを複数回ループさせる場合に、偶数回目のアニメーションを逆再生にするかを設定できます。偶数回目を逆再生にする場合はalternateを指定します。"
				},
				{
					"name": "mode",
					"required": false,
					"description": "アニメーションの最後のフレームの状態（位置、回転など）をアニメーション終了後も維持するかを設定できます。forwards(デフォルト)で維持。noneを指定すると、アニメーション再生前の状態に戻ります。"
				},
				{
					"name": "koma_anim",
					"required": false,
					"description": "グリフに使用するコマアニメの画像を指定できます。コマアニメに使用する画像は「すべてのコマが横並びで連結されたひとつの画像ファイル」である必要があります。"
				},
				{
					"name": "koma_count",
					"required": false,
					"description": "コマアニメを使用する場合、画像に含まれるコマ数を指定します。これを指定した場合、koma_widthを省略できます。"
				},
				{
					"name": "koma_width",
					"required": false,
					"description": "コマアニメを使用する場合、1コマあたりの横幅をpx単位で指定します。これを指定した場合、koma_countを省略できます。"
				},
				{
					"name": "koma_anim_time",
					"required": false,
					"description": "コマアニメが1周するまでの時間をミリ秒単位で指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"glyph_skip": {
			"name": "glyph_skip",
			"summary": "スキップモードグリフの設定",
			"category": "システムデザイン変更",
			"description": "スキップモード中に表示されるグリフを設定できます。",
			"parameters": [
				{
					"name": "use",
					"required": false,
					"description": "すでに画面上に出ている要素をスキップモード中のグリフとして扱うようにできます。[ptext]や[image]に設定したnameをここに指定します。"
				},
				{
					"name": "delete",
					"required": false,
					"description": "trueを指定した場合、グリフの定義を削除する処理を実行します。"
				},
				{
					"name": "その他",
					"required": false,
					"description": "[glyph]と同じパラメータが指定できます。ただしfixパラメータはtrueで固定されます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"glyph_auto": {
			"name": "glyph_auto",
			"summary": "オートモードグリフの設定",
			"category": "システムデザイン変更",
			"description": "オートモード中に表示されるグリフを設定できます。",
			"parameters": [
				{
					"name": "fix",
					"required": false,
					"description": "画面固定グリフの設定をするならtrue、メッセージ末尾のグリフの設定をするならfalseを指定します。オートモードグリフに限り、固定グリフと非固定グリフを両方設定できます。"
				},
				{
					"name": "use",
					"required": false,
					"description": "すでに画面上に出ている要素を画面固定グリフとして扱うようにできます。[ptext]や[image]に設定したnameをここに指定します。"
				},
				{
					"name": "delete",
					"required": false,
					"description": "trueを指定した場合、グリフの定義を削除する処理を実行します。"
				},
				{
					"name": "その他",
					"required": false,
					"description": "[glyph]と同じパラメータが指定できます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"showmenubutton": {
			"name": "showmenubutton",
			"summary": "メニューボタンの表示",
			"category": "システムデザイン変更",
			"description": "メニューボタンを表示します。",
			"parameters": [
				{
					"name": "keyfocus",
					"required": false,
					"description": "trueを指定すると、キーボードやゲームパッドで選択できるようになります。また1や2などの数値を指定すると、キーコンフィグのfocus_nextアクションでボタンを選択していくときの順序を指定できます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"hidemenubutton": {
			"name": "hidemenubutton",
			"summary": "メニューボタンの非表示",
			"category": "システムデザイン変更",
			"description": "メニューボタンを非表示にします。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"body": {
			"name": "body",
			"summary": "ゲーム画面外の設定",
			"category": "システムデザイン変更",
			"description": "ゲーム画面サイズやゲーム画面外側の黒帯部分をカスタマイズできます。黒帯部分の色を変更したり、黒帯部分に画像を設定したり、ゲーム画面サイズをゲーム中に変更したりできます。",
			"parameters": [
				{
					"name": "bgimage",
					"required": false,
					"description": "ゲーム画面外の背景に設定する画像を指定します。bgimageフォルダに配置してください。"
				},
				{
					"name": "bgrepeat",
					"required": false,
					"description": "背景に画像を指定した際の表示パターンを指定します。デフォルトは縦横に繰り返し表示されます。\nrepeat-x(水平方向のみ繰り返し)\nrepeat-y(垂直方向のみ繰り返し)\nround(比率を崩して覆うように全画面繰り返し)\nno-repeat(繰り返しなし)"
				},
				{
					"name": "bgcolor",
					"required": false,
					"description": "背景色を0xRRGGBB形式で指定します。bgimageが設定されている場合は無視されます。"
				},
				{
					"name": "bgcover",
					"required": false,
					"description": "背景画像を画面全体に引き伸ばすかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "scWidth",
					"required": false,
					"description": "ゲーム画面のオリジナルの横幅をゲーム中に変更できます。レスポンシブ対応を想定したタグです。Config.tjsのscWidthに相当します。\n※「オリジナルの」は「ウィンドウサイズにフィットさせるためにゲーム画面の拡縮を行う前の」という意味で用いられています。"
				},
				{
					"name": "scHeight",
					"required": false,
					"description": "ゲーム画面のオリジナルの高さをゲーム中に変更できます。レスポンシブ対応を想定したタグです。Config.tjsのscHeightに相当します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"title": {
			"name": "title",
			"summary": "タイトル指定",
			"category": "システムデザイン変更",
			"description": "ゲームタイトルを指定します。たとえば、章ごとにタイトルを変えるとプレイヤーがわかりやすくなります。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "表示したいタイトルを指定します"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"cursor": {
			"name": "cursor",
			"summary": "マウスカーソルに画像を設定",
			"category": "システムデザイン変更",
			"description": "マウスカーソルに画像を設定することができます。画像はdata/imageフォルダに配置してください。使用可能な画像形式はgifpngjpgです。",
			"parameters": [
				{
					"name": "storage",
					"required": false,
					"description": "マウスカーソルに設定する画像ファイルを指定します。画像はdata/imageフォルダに配置します。defaultと指定するとデフォルトのカーソルに戻せます。"
				},
				{
					"name": "x",
					"required": false,
					"description": "指定した数値の分だけ、マウスカーソルに設定する画像を左側にずらすことができます。"
				},
				{
					"name": "y",
					"required": false,
					"description": "指定した数値の分だけ、マウスカーソルに設定する画像を上側にずらすことができます。"
				},
				{
					"name": "type",
					"required": false,
					"description": "ボタン類にマウスを載せたときのカーソルを変更したい場合、このパラメータにpointerを指定します。"
				},
				{
					"name": "auto_hide",
					"required": false,
					"description": "プレイヤーが一定時間マウス操作をしなかった場合にマウスカーソルを自動で非表示にするための設定です。trueで自動非表示が有効、falseで自動非表示が無効（常にマウスカーソル表示）になります。また、2000のように数値を指定することで、マウスカーソルの自動非表示を有効にした上でマウスカーソルを非表示にするまでの時間をミリ秒単位で設定できます。"
				},
				{
					"name": "click_effect",
					"required": false,
					"description": "クリックエフェクトを有効にするかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "e_width",
					"required": false,
					"description": "クリックエフェクトの横幅をpx単位で指定します。"
				},
				{
					"name": "e_opacity",
					"required": false,
					"description": "クリックエフェクトの最初の不透明度を0～255で指定します。"
				},
				{
					"name": "e_time",
					"required": false,
					"description": "クリックエフェクトの表示時間をミリ秒単位で指定します。"
				},
				{
					"name": "e_color",
					"required": false,
					"description": "クリックエフェクトの色を指定します。"
				},
				{
					"name": "e_blend",
					"required": false,
					"description": "クリックエフェクトの合成モードを指定します。[layermode]タグのmodeパラメータと同じキーワードが指定可能です。normalやoverlayなど。"
				},
				{
					"name": "e_scale",
					"required": false,
					"description": "クリックエフェクトの拡大率をパーセント単位で指定します。たとえば200と指定すると、エフェクトサイズが最終的に200%になるように拡大されていきます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"sysview": {
			"name": "sysview",
			"summary": "システム画面変更",
			"category": "システムデザイン変更",
			"description": "システム系機能で使用するHTMLファイルを変更できます。",
			"parameters": [
				{
					"name": "type",
					"required": true,
					"description": "saveloadbacklogmenuが指定可能です。"
				},
				{
					"name": "storage",
					"required": true,
					"description": "HTMLファイルのパスを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"save_img": {
			"name": "save_img",
			"summary": "セーブデータのサムネイル変更",
			"category": "システムデザイン変更",
			"description": "セーブデータのサムネイルに好きな画像を指定できます。",
			"parameters": [
				{
					"name": "storage",
					"required": false,
					"description": "サムネイルに設定したい画像ファイルを設定します。bgimageフォルダに配置してください。defaultを指定すると画面キャプチャに戻ります。"
				},
				{
					"name": "folder",
					"required": false,
					"description": "画像をbgimageフォルダ以外から取得したい場合は、ここに指定します。たとえばothersfgimageimageなど。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"set_resizecall": {
			"name": "set_resizecall",
			"summary": "レスポンシブデザイン対応",
			"category": "システムデザイン変更",
			"description": "プレイ端末の画面比率が入れ替わったタイミングでシナリオを呼び出すことができます。",
			"parameters": [
				{
					"name": "storage",
					"required": true,
					"description": "ジャンプ先のシナリオファイル名を指定します。省略すると、現在のシナリオファイルとみなされます。"
				},
				{
					"name": "target",
					"required": false,
					"description": "ジャンプ先のラベル名を指定します。省略すると、シナリオファイルの先頭にジャンプします。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"dialog_config": {
			"name": "dialog_config",
			"summary": "確認ダイアログのデザイン変更",
			"category": "システムデザイン変更",
			"description": "タイトルに戻っていいかどうかを確認するときなどに表示される確認ダイアログのデザインを変更することができます。ダイアログのデザインを変更するタグには以下の4種類があります。",
			"parameters": [
				{
					"name": "btntype",
					"required": false,
					"description": "ボタンのタイプをまとめて指定できます。指定できるキーワードは[glink]のcolorパラメータに準じます。"
				},
				{
					"name": "btnwidth",
					"required": false,
					"description": "ボタンの横幅をpx単位でまとめて指定できます。"
				},
				{
					"name": "btnmargin",
					"required": false,
					"description": "ボタンの外余白をpx単位でまとめて指定できます。カンマ区切りに対応。10,20のように指定すると、縦余白が10、横余白が20と指定したことになります。"
				},
				{
					"name": "btnpadding",
					"required": false,
					"description": "ボタンの内余白をpx単位でまとめて指定できます。カンマ区切りに対応。10,20のように指定すると、縦余白が10、横余白が20と指定したことになります。"
				},
				{
					"name": "fontsize",
					"required": false,
					"description": "メッセージの文字サイズを指定します。"
				},
				{
					"name": "fontbold",
					"required": false,
					"description": "メッセージを太字にする場合はtrueを指定します。"
				},
				{
					"name": "fontface",
					"required": false,
					"description": "メッセージのフォントを指定します。"
				},
				{
					"name": "fontcolor",
					"required": false,
					"description": "メッセージの文字色を指定します。"
				},
				{
					"name": "btnfontsize",
					"required": false,
					"description": "ボタンの文字サイズを指定します。"
				},
				{
					"name": "btnfontbold",
					"required": false,
					"description": "ボタンを文字を太字にする場合はtrueを指定します。"
				},
				{
					"name": "btnfontface",
					"required": false,
					"description": "ボタンのフォントを指定します。"
				},
				{
					"name": "btnfontcolor",
					"required": false,
					"description": "ボタンの文字色を指定します。"
				},
				{
					"name": "boxcolor",
					"required": false,
					"description": "メッセージボックスの背景色を指定できます。"
				},
				{
					"name": "boxopacity",
					"required": false,
					"description": "メッセージボックスの不透明度を0～255で指定できます。255で完全に不透明です。"
				},
				{
					"name": "boxradius",
					"required": false,
					"description": "メッセージボックスの角に丸みを付けたいときにその丸みの半径を数値で指定します。"
				},
				{
					"name": "boxwidth",
					"required": false,
					"description": "メッセージボックスの横幅をpx単位で指定できます。"
				},
				{
					"name": "boxheight",
					"required": false,
					"description": "メッセージボックスの高さpx単位で指定できます。"
				},
				{
					"name": "boxpadding",
					"required": false,
					"description": "メッセージボックスの内余白をpx単位で指定できます。10,20,10のようなカンマ区切りの指定に対応します。"
				},
				{
					"name": "boximg",
					"required": false,
					"description": "メッセージボックスの背景画像を指定できます。ファイルの場所はimageが基準となります。"
				},
				{
					"name": "boximgpos",
					"required": false,
					"description": "メッセージボックスの背景画像の表示位置を指定できます。たとえばcenterと指定すると画面中央、left topで左上、right topで右上、right bottomで右下、left bottomで左下となります。"
				},
				{
					"name": "boximgrepeat",
					"required": false,
					"description": "メッセージボックスの背景画像の繰り返しを指定できます。画像を繰り返して敷き詰める場合はrepeat、繰り返したくない場合はno-repeatを指定します。"
				},
				{
					"name": "boximgsize",
					"required": false,
					"description": "メッセージボックスの背景画像のサイズをpx単位で指定できます。"
				},
				{
					"name": "bgcolor",
					"required": false,
					"description": "ダイアログ外側の背景色を指定できます。"
				},
				{
					"name": "bgopacity",
					"required": false,
					"description": "ダイアログ外側の不透明度を0～255で指定できます。255で完全に不透明です。"
				},
				{
					"name": "bgimg",
					"required": false,
					"description": "ダイアログ外側の背景画像を指定できます。ファイルの場所はimageが基準となります。"
				},
				{
					"name": "bgimgpos",
					"required": false,
					"description": "ダイアログ外側の背景画像の表示位置を指定できます。たとえばcenterと指定すると画面中央、left topで左上、right topで右上、right bottomで右下、left bottomで左下となります。"
				},
				{
					"name": "bgimgrepeat",
					"required": false,
					"description": "ダイアログ外側の背景画像の繰り返しを指定できます。画像を繰り返して敷き詰める場合はrepeat、繰り返したくない場合はno-repeatを指定します。"
				},
				{
					"name": "bgimgsize",
					"required": false,
					"description": "ダイアログ外側の背景画像のサイズをpx単位で指定できます。"
				},
				{
					"name": "openeffect",
					"required": false,
					"description": "ダイアログを開いたときのエフェクトを指定できます。指定できるキーワードは[mask]に準じます。"
				},
				{
					"name": "opentime",
					"required": false,
					"description": "ダイアログを開いたときのエフェクト時間をミリ秒単位で指定できます。"
				},
				{
					"name": "closeeffect",
					"required": false,
					"description": "ダイアログを開いたときのエフェクトを指定できます。指定できるキーワードは[mask_off]に準じます。"
				},
				{
					"name": "closetime",
					"required": false,
					"description": "ダイアログを開いたときのエフェクト時間をミリ秒単位で指定できます。"
				},
				{
					"name": "gotitle",
					"required": false,
					"description": "タイトルに戻っていいかを確認するときのテキストを変更できます。"
				},
				{
					"name": "okpos",
					"required": false,
					"description": "「OK」ボタンの位置を左に変更したい場合はleft、右に変更したい場合はrightを指定します。"
				},
				{
					"name": "ingame",
					"required": false,
					"description": "ディスプレイ全体ではなくゲーム画面の範囲内に確認ダイアログを収めたい場合にはtrueを指定します。falseでもとに戻ります。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"dialog_config_ok": {
			"name": "dialog_config_ok",
			"summary": "確認ダイアログのデザイン変更（OKボタン）",
			"category": "システムデザイン変更",
			"description": "タイトルに戻っていいかどうかを確認するときなどに表示される確認ダイアログのデザインを変更することができます。ダイアログのデザインを変更するタグには以下の4種類があります。",
			"parameters": [
				{
					"name": "text",
					"required": false,
					"description": "OKボタンのテキストを指定できます。"
				},
				{
					"name": "type",
					"required": false,
					"description": "OKボタンのタイプを指定できます。指定できるキーワードは[glink]のcolorパラメータに準じます。"
				},
				{
					"name": "width",
					"required": false,
					"description": "OKボタンの横幅をpx単位で指定できます。"
				},
				{
					"name": "margin",
					"required": false,
					"description": "OKボタンの外余白をpx単位で指定できます。カンマ区切りに対応。10,20のように指定すると、縦余白が10、横余白が20と指定したことになります。"
				},
				{
					"name": "padding",
					"required": false,
					"description": "OKボタンの内余白をpx単位で指定できます。カンマ区切りに対応。10,20のように指定すると、縦余白が10、横余白が20と指定したことになります。"
				},
				{
					"name": "fontsize",
					"required": false,
					"description": "OKボタンの文字サイズを指定します。"
				},
				{
					"name": "fontbold",
					"required": false,
					"description": "OKボタンを文字を太字にする場合はtrueを指定します。"
				},
				{
					"name": "fontface",
					"required": false,
					"description": "OKボタンのフォントを指定します。"
				},
				{
					"name": "fontcolor",
					"required": false,
					"description": "OKボタンの文字色を指定します。"
				},
				{
					"name": "img",
					"required": false,
					"description": "OKボタンに画像を使うことができます。imageフォルダを基準とした画像ファイルの場所を指定します。"
				},
				{
					"name": "imgwidth",
					"required": false,
					"description": "OKボタンの画像の横幅をpx単位で指定できます。"
				},
				{
					"name": "enterimg",
					"required": false,
					"description": "マウスがOKボタンの上に乗ったときの画像ファイル。imageフォルダから探します。"
				},
				{
					"name": "activeimg",
					"required": false,
					"description": "マウスがOKボタンを押し込んでから放されるまでの画像ファイル。imageフォルダから探します。"
				},
				{
					"name": "clickimg",
					"required": false,
					"description": "マウスがOKボタンをクリックした後の画像ファイル。imageフォルダから探します。"
				},
				{
					"name": "enterse",
					"required": false,
					"description": "マウスがOKボタンの上に乗ったときに再生する音声ファイル。soundフォルダから探します。"
				},
				{
					"name": "leavese",
					"required": false,
					"description": "マウスがOKボタンの上から離れたときに再生する音声ファイル。soundフォルダから探します。"
				},
				{
					"name": "clickse",
					"required": false,
					"description": "マウスがOKボタンを押し込んだときに再生する音声ファイル。soundフォルダから探します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"dialog_config_ng": {
			"name": "dialog_config_ng",
			"summary": "確認ダイアログのデザイン変更（キャンセルボタン）",
			"category": "システムデザイン変更",
			"description": "タイトルに戻っていいかどうかを確認するときなどに表示される確認ダイアログのデザインを変更することができます。ダイアログのデザインを変更するタグには以下の4種類があります。",
			"parameters": [
				{
					"name": "text",
					"required": false,
					"description": "キャンセルボタンのテキストを指定できます。"
				},
				{
					"name": "type",
					"required": false,
					"description": "キャンセルボタンのタイプを指定できます。指定できるキーワードは[glink]のcolorパラメータに準じます。"
				},
				{
					"name": "width",
					"required": false,
					"description": "キャンセルボタンの横幅をpx単位で指定できます。"
				},
				{
					"name": "margin",
					"required": false,
					"description": "キャンセルボタンの外余白をpx単位で指定できます。カンマ区切りに対応。10,20のように指定すると、縦余白が10、横余白が20と指定したことになります。"
				},
				{
					"name": "padding",
					"required": false,
					"description": "キャンセルボタンの内余白をpx単位で指定できます。カンマ区切りに対応。10,20のように指定すると、縦余白が10、横余白が20と指定したことになります。"
				},
				{
					"name": "fontsize",
					"required": false,
					"description": "キャンセルボタンの文字サイズを指定します。"
				},
				{
					"name": "fontbold",
					"required": false,
					"description": "キャンセルボタンを文字を太字にする場合はtrueを指定します。"
				},
				{
					"name": "fontface",
					"required": false,
					"description": "キャンセルボタンのフォントを指定します。"
				},
				{
					"name": "fontcolor",
					"required": false,
					"description": "キャンセルボタンの文字色を指定します。"
				},
				{
					"name": "img",
					"required": false,
					"description": "キャンセルボタンに画像を使うことができます。imageフォルダを基準とした画像ファイルの場所を指定します。"
				},
				{
					"name": "imgwidth",
					"required": false,
					"description": "キャンセルボタンの画像の横幅をpx単位で指定できます。"
				},
				{
					"name": "enterimg",
					"required": false,
					"description": "マウスがキャンセルボタンの上に乗ったときの画像ファイル。imageフォルダから探します。"
				},
				{
					"name": "activeimg",
					"required": false,
					"description": "マウスがキャンセルボタンを押し込んでから放されるまでの画像ファイル。imageフォルダから探します。"
				},
				{
					"name": "clickimg",
					"required": false,
					"description": "マウスがキャンセルボタンをクリックした後の画像ファイル。imageフォルダから探します。"
				},
				{
					"name": "enterse",
					"required": false,
					"description": "マウスがキャンセルボタンの上に乗ったときに再生する音声ファイル。soundフォルダから探します。"
				},
				{
					"name": "leavese",
					"required": false,
					"description": "マウスがキャンセルボタンの上から離れたときに再生する音声ファイル。soundフォルダから探します。"
				},
				{
					"name": "clickse",
					"required": false,
					"description": "マウスがキャンセルボタンを押し込んだときに再生する音声ファイル。soundフォルダから探します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"dialog_config_filter": {
			"name": "dialog_config_filter",
			"summary": "確認ダイアログのデザイン変更（フィルター）",
			"category": "システムデザイン変更",
			"description": "タイトルに戻っていいかどうかを確認するときなどに表示される確認ダイアログのデザインを変更することができます。ダイアログのデザインを変更するタグには以下の4種類があります。",
			"parameters": [
				{
					"name": "layer",
					"required": false,
					"description": "フィルタをかけるレイヤを指定します。省略すると、もしくはallと指定するとゲーム画面全てに効果がかかります。"
				},
				{
					"name": "name",
					"required": false,
					"description": "特定の要素にフィルタをかけたい場合に、その要素のnameを指定します。"
				},
				{
					"name": "grayscale",
					"required": false,
					"description": "0(デフォルト)～100を指定することで、画像の表示をグレースケールに変換できます。"
				},
				{
					"name": "sepia",
					"required": false,
					"description": "0(デフォルト)～100を指定することで、画像の表示をセピア調に変換できます。"
				},
				{
					"name": "saturate",
					"required": false,
					"description": "0～100(デフォルト)を指定してあげることで、画像の表示の彩度（色の鮮やかさ）を変更できます。"
				},
				{
					"name": "hue",
					"required": false,
					"description": "0(デフォルト)～360を指定することで、画像の表示の色相を変更できます。"
				},
				{
					"name": "invert",
					"required": false,
					"description": "0(デフォルト)～100を指定することで、画像の表示の階調を反転させることができます。"
				},
				{
					"name": "opacity",
					"required": false,
					"description": "0～100(デフォルト)を指定することで、画像の表示の透過度を変更できます。"
				},
				{
					"name": "brightness",
					"required": false,
					"description": "100(デフォルト)を基準とする数値を指定することで、画像の明度を変更できます。0で真っ暗に、100以上の数値でより明るくなります。"
				},
				{
					"name": "contrast",
					"required": false,
					"description": "0～100(デフォルト)を指定することで、画像の表示のコントラストを変更できます。"
				},
				{
					"name": "blur",
					"required": false,
					"description": "0(デフォルト)～任意の値を指定することで、画像の表示をぼかすことができます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"mode_effect": {
			"name": "mode_effect",
			"summary": "モード変化エフェクト",
			"category": "システムデザイン変更",
			"description": "次のタイミングで画面中央にエフェクトを出すことができます。",
			"parameters": [
				{
					"name": "skip",
					"required": false,
					"description": "スキップモード開始時に表示されるエフェクト。none、default、またはimageフォルダを基準とする画像ファイルの場所を指定します。noneだとエフェクトなし、defaultだとデフォルトのエフェクト、画像ファイルを指定するとその画像を出すことができます。"
				},
				{
					"name": "auto",
					"required": false,
					"description": "オートモード開始時に表示されるエフェクト。skipパラメータと同様に指定します。"
				},
				{
					"name": "stop",
					"required": false,
					"description": "スキップモードまたはオートモード停止時に表示されるエフェクト。skipパラメータと同様に指定します。"
				},
				{
					"name": "holdskip",
					"required": false,
					"description": "ホールドスキップモード開始時に表示されるエフェクト。skipパラメータと同様に指定します。"
				},
				{
					"name": "holdstop",
					"required": false,
					"description": "ホールドストップモード停止時に表示されるエフェクト。skipパラメータと同様に指定します。"
				},
				{
					"name": "all",
					"required": false,
					"description": "5種類のエフェクトをまとめて指定できます。skipパラメータと同様に指定します。"
				},
				{
					"name": "env",
					"required": false,
					"description": "allpcphoneのいずれかを指定します。pcを指定すると、プレイヤーがPCでゲームを遊んでいるとき限定のエフェクトを設定できます。phoneを指定すると、プレイヤーがスマホ・タブレットでゲームを遊んでいるとき限定のエフェクトを設定できます。all(デフォルト)の場合は2つの環境の設定をまとめて行います。"
				},
				{
					"name": "width",
					"required": false,
					"description": "エフェクトの横幅を指定したい場合、数値(px単位)を指定します。"
				},
				{
					"name": "height",
					"required": false,
					"description": "エフェクトの高さを指定したい場合、数値(px単位)を指定します。"
				},
				{
					"name": "color",
					"required": false,
					"description": "エフェクトにdefaultを使用する場合に、図形部分の色を指定できます。"
				},
				{
					"name": "bgcolor",
					"required": false,
					"description": "エフェクトにdefaultを使用する場合に、図形を囲む丸部分の色を指定できます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"loading_log": {
			"name": "loading_log",
			"summary": "ローディングログ",
			"category": "システムデザイン変更",
			"description": "素材の読み込みを行っているときやセーブ処理が走っているときなど、ゲームが一時的に止まっているタイミングで画面端に「Loading...」のようなログを出すことができます。",
			"parameters": [
				{
					"name": "preload",
					"required": false,
					"description": "素材の読み込み中に表示するテキストを自由に設定できます。noneを指定するとログを無効にできます。defaultを指定するとデフォルトのログになります。notextを指定するとテキストなしでローディングアイコンだけを出すことができます。"
				},
				{
					"name": "save",
					"required": false,
					"description": "セーブ処理中に表示するテキストを自由に設定できます。preload パラメータと同様に、none、default、notextというキーワードが指定可能。"
				},
				{
					"name": "all",
					"required": false,
					"description": "preload、save パラメータをまとめて指定できます。たとえば、all=\"default\"とすればすべてのログにデフォルトのテキストを設定できます。"
				},
				{
					"name": "dottime",
					"required": false,
					"description": "テキストの後ろに「...」というドットが増えていくアニメーションの所要時間をミリ秒で指定できます。0を指定するとドットアニメーションを無くすことができます。"
				},
				{
					"name": "icon",
					"required": false,
					"description": "ローディングアイコンを表示するかどうかをtrueまたはfalseで指定します。ローディングアイコンを非表示にしてテキストのみにしたい場合にはfalseを指定してください。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"showsave": {
			"name": "showsave",
			"summary": "セーブ画面の表示",
			"category": "メニュー・HTML表示",
			"description": "セーブ画面を表示します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"showload": {
			"name": "showload",
			"summary": "ロード画面の表示",
			"category": "メニュー・HTML表示",
			"description": "ロード画面を表示します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"showmenu": {
			"name": "showmenu",
			"summary": "メニュー画面の表示",
			"category": "メニュー・HTML表示",
			"description": "メニュー画面を表示します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"showlog": {
			"name": "showlog",
			"summary": "バックログの表示",
			"category": "メニュー・HTML表示",
			"description": "バックログを表示します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"web": {
			"name": "web",
			"summary": "Webサイトを開く",
			"category": "メニュー・HTML表示",
			"description": "指定したWebサイトをブラウザで開くことができます。",
			"parameters": [
				{
					"name": "url",
					"required": true,
					"description": "開きたいWebサイトのURLを指定します。ゲーム内の画像ファイルなどを開きたい場合、ファイルの場所をdataから初めて記述します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"html": {
			"name": "html",
			"summary": "HTMLをレイヤ追加",
			"category": "メニュー・HTML表示",
			"description": "[html]と[endhtml]の間に記述したHTMLを表示できます。このHTMLは最前面に表示されます。",
			"parameters": [
				{
					"name": "left",
					"required": false,
					"description": "HTMLの左端位置を指定します。（ピクセル）"
				},
				{
					"name": "top",
					"required": false,
					"description": "HTMLの上端位置を指定します。（ピクセル）"
				},
				{
					"name": "name",
					"required": false,
					"description": "HTML領域に名前を指定できます。この名前を使って、HTML領域に対してアニメーションを実行することができます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"endhtml": {
			"name": "endhtml",
			"summary": "HTMLの終了",
			"category": "メニュー・HTML表示",
			"description": "HTMLの記述を終了します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"clearstack": {
			"name": "clearstack",
			"summary": "スタックの消去",
			"category": "マクロ・分岐・サブルーチン関連",
			"description": "システムが管理するスタックを消去します。帰るべきスタックがない場面（タイトルや章の始まりなど、きりの良い場面）でこのタグを配置しておくことをオススメします。",
			"parameters": [
				{
					"name": "stack",
					"required": false,
					"description": "call、if、macroのいずれかを指定できます。特定のスタックのみ削除できます。省略すると、全てのスタックを削除します。\nV515以降：animを指定できます。animを指定した場合、現在実行中のアニメーション数を強制的にゼロにして、[wa]で確実に次のタグに進むようにできます。なお、stackパラメータを省略した場合はこの操作は行われません。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"if": {
			"name": "if",
			"summary": "条件分岐",
			"category": "マクロ・分岐・サブルーチン関連",
			"description": "条件分岐を行います。",
			"parameters": [
				{
					"name": "exp",
					"required": true,
					"description": "評価するJavaScriptの式を指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"elsif": {
			"name": "elsif",
			"summary": "条件分岐（複数の条件）",
			"category": "マクロ・分岐・サブルーチン関連",
			"description": "[if]タグと[endif]タグの間で使います。分岐の条件を増やして、複雑な分岐を行なうことができます。",
			"parameters": [
				{
					"name": "exp",
					"required": true,
					"description": "評価する JS 式を指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"else": {
			"name": "else",
			"summary": "条件分岐（条件を満たさなかったとき）",
			"category": "マクロ・分岐・サブルーチン関連",
			"description": "[if]もしくは[elsif]タグと[endif]タグの間で用いられます。 このタグまでに記述された[if][elsif]タグの条件をまだ満たしていない場合に、このタグから[endif]までの記述が実行されます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"endif": {
			"name": "endif",
			"summary": "条件分岐の終了",
			"category": "マクロ・分岐・サブルーチン関連",
			"description": "[if]文を終了します。[if]文の終わりに必ず記述する必要があります。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"call": {
			"name": "call",
			"summary": "サブルーチンの呼び出し",
			"category": "マクロ・分岐・サブルーチン関連",
			"description": "指定したシナリオファイル・ラベルにジャンプします。",
			"parameters": [
				{
					"name": "storage",
					"required": false,
					"description": "呼び出したいサブルーチンのあるのシナリオファイルを 指定します。省略すると、現在 のシナリオファイル内であるとみなされます。"
				},
				{
					"name": "target",
					"required": false,
					"description": "呼び出すサブルーチンのラベルを指定します。省略すると、ファイルの先頭から実行されます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"return": {
			"name": "return",
			"summary": "サブルーチンから戻る",
			"category": "マクロ・分岐・サブルーチン関連",
			"description": "サブルーチンから呼び出し元に戻ります。詳細は[call]の項目を参照してください。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"macro": {
			"name": "macro",
			"summary": "マクロ定義の開始",
			"category": "マクロ・分岐・サブルーチン関連",
			"description": "マクロ記述を開始します。自分で新しいタグを定義することが出来ます。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "マクロの名前を指定します。以後、この名前をタグのように記述することで、マクロを呼び出せるようになります。\n★重要\nティラノスクリプトにすでに使用されているタグ名は使わないでください。またtextやlabelも使えません。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"endmacro": {
			"name": "endmacro",
			"summary": "マクロ定義の終了",
			"category": "マクロ・分岐・サブルーチン関連",
			"description": "マクロの記述を終了します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"erasemacro": {
			"name": "erasemacro",
			"summary": "マクロの削除",
			"category": "マクロ・分岐・サブルーチン関連",
			"description": "登録したマクロを削除します。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "削除するマクロ名を指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"ignore": {
			"name": "ignore",
			"summary": "条件によりシナリオを無視",
			"category": "マクロ・分岐・サブルーチン関連",
			"description": "expに指定されたJavaScriptの式を評価します。その結果がtrue(真)ならば、[ignore]と[endignore]で囲まれた文章やタグが無視されます。",
			"parameters": [
				{
					"name": "exp",
					"required": true,
					"description": "評価するJavaScriptの式を指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"endignore": {
			"name": "endignore",
			"summary": "[ignore]の終了",
			"category": "マクロ・分岐・サブルーチン関連",
			"description": "[ignore]の記述を終了します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"sleepgame": {
			"name": "sleepgame",
			"summary": "ゲームの一時停止",
			"category": "マクロ・分岐・サブルーチン関連",
			"description": "このタグに到達した時点でゲームの状態を保存した上で、他のシナリオにジャンプできます。ジャンプ先で[awakegame]に到達するとゲームの状態が[sleepgame]時点に復帰します。",
			"parameters": [
				{
					"name": "storage",
					"required": false,
					"description": "ジャンプ先のシナリオファイル名を指定します。省略すると、現在のシナリオファイルとみなされます。"
				},
				{
					"name": "target",
					"required": false,
					"description": "ジャンプ先のラベル名を指定します。省略すると、シナリオファイルの先頭にジャンプします。"
				},
				{
					"name": "next",
					"required": false,
					"description": "trueまたはfalseを指定します。falseを指定すると[awakegame]で戻ってきたときに次のタグに進まなくなります。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"awakegame": {
			"name": "awakegame",
			"summary": "ゲームの一時停止からの復帰",
			"category": "マクロ・分岐・サブルーチン関連",
			"description": "[sleepgame]タグで保存されたゲームの状態に復帰します。",
			"parameters": [
				{
					"name": "variable_over",
					"required": false,
					"description": "trueまたはfalseを指定します。trueを指定すると、[sleepgame]中のゲーム変数の変更を復帰後に引き継ぎます。"
				},
				{
					"name": "bgm_over",
					"required": false,
					"description": "trueまたはfalseを指定します。trueを指定すると、[sleepgame]中のBGMを復帰後に引き継ぎます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"breakgame": {
			"name": "breakgame",
			"summary": "ゲームの停止データの削除",
			"category": "マクロ・分岐・サブルーチン関連",
			"description": "[sleepgame]タグで保存した休止状態を破棄します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"loadjs": {
			"name": "loadjs",
			"summary": "外部JavaScriptファイル読み込み",
			"category": "変数・JS操作・ファイル読込",
			"description": "外部JavaScriptファイルをロードします。無制限な機能拡張が可能です。\nJavaScriptファイルはdata/othersフォルダに配置してください。",
			"parameters": [
				{
					"name": "storage",
					"required": true,
					"description": "ロードするJavaScriptファイルを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"eval": {
			"name": "eval",
			"summary": "式の評価",
			"category": "変数・JS操作・ファイル読込",
			"description": "expに指定されたJavaScriptの文を実行します。主に変数に値をセットする際に活用できます。",
			"parameters": [
				{
					"name": "exp",
					"required": true,
					"description": "実行するJavaScript文を指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"clearvar": {
			"name": "clearvar",
			"summary": "変数の消去",
			"category": "変数・JS操作・ファイル読込",
			"description": "変数を消去します。特定の変数だけを消去することもできます。",
			"parameters": [
				{
					"name": "exp",
					"required": false,
					"description": "消去する変数名を指定します。f.nameやsf.flagのように指定します。nameflagでは動作しません。\n省略すると、すべての変数が消去されます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"clearsysvar": {
			"name": "clearsysvar",
			"summary": "システム変数の全消去",
			"category": "変数・JS操作・ファイル読込",
			"description": "システム変数を全消去します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"trace": {
			"name": "trace",
			"summary": "コンソールへの値の出力",
			"category": "変数・JS操作・ファイル読込",
			"description": "expパラメータで指定された式を評価し、結果をコンソールに出力します。",
			"parameters": [
				{
					"name": "exp",
					"required": false,
					"description": "評価するJS式を指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"iscript": {
			"name": "iscript",
			"summary": "JavaScriptの記述",
			"category": "変数・JS操作・ファイル読込",
			"description": "[iscript]と[endscript]に囲まれた箇所にJavaScriptの文を記述できます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"endscript": {
			"name": "endscript",
			"summary": "JavaScriptの終了",
			"category": "変数・JS操作・ファイル読込",
			"description": "JavaScriptの記述を終了します。",
			"parameters": [
				{
					"name": "stop",
					"required": false,
					"description": "【高度】trueを指定すると、[endscript]に到達したときに次のタグに進まなくなります。JavaScriptの記述によってシナリオをジャンプさせたい場合にtrueを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"emb": {
			"name": "emb",
			"summary": "式評価結果の埋め込み",
			"category": "変数・JS操作・ファイル読込",
			"description": "expで指定されたJavaScriptの文を評価し、その結果をテキストとして表示します。",
			"parameters": [
				{
					"name": "exp",
					"required": true,
					"description": "評価するJavaScriptの式を指定します。基本的には変数の名前を指定すればよいでしょう。f.namesf.textなど。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"preload": {
			"name": "preload",
			"summary": "素材ファイルの事前読み込み",
			"category": "変数・JS操作・ファイル読込",
			"description": "[preload]タグを使用することで、素材ファイル（画像や音楽）を事前に読み込むことができます。\n実際に素材を使用する際に表示がスムーズになります。",
			"parameters": [
				{
					"name": "storage",
					"required": true,
					"description": "プリロードするファイルをフルパスで指定します。JavaScriptの配列を指定することもできます。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "trueを指定すると、すべての読み込みが完了するまでゲームを停止します。trueにする場合は画面に「Now Loading」などと表示しておき、素材のロード中であることをプレイヤーに知らせるべきでしょう。"
				},
				{
					"name": "single_use",
					"required": false,
					"description": "音声ファイルを読み込む場合にのみ意味を持つパラメータです。true(デフォルト)を指定するとプリロードデータが使い捨てとなり、[playbgm]などでプリロードデータを一度使用した時点でプリロードデータが破棄されます（メモリを圧迫しないようにするため）。一度使ったあともプリロードデータを保持したい場合はfalseを指定してください。falseを指定した場合であっても[unload]タグを使うことでプリロードデータを明示的に破棄できます。"
				},
				{
					"name": "name",
					"required": false,
					"description": "音声ファイルを読み込む場合にのみ意味を持つパラメータです。たとえば\"bgm\"、\"se\"、\"section1\"などのグループ名を付けておくことで、あとで[unload]タグでデータを破棄する際に対象をまとめて指定できます。カンマ区切りで複数指定可。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"unload": {
			"name": "unload",
			"summary": "音声プリロードデータの破棄",
			"category": "変数・JS操作・ファイル読込",
			"description": "[preload]タグにsingle_use=\"false\"を指定したうえで多数の音声ファイルをプリロードしていると、音声プリロードデータがメモリを圧迫して動作に悪影響を及ぼすことがあります。",
			"parameters": [
				{
					"name": "storage",
					"required": false,
					"description": "破棄する音声プリロードデータの場所。[preload]に指定していたものを指定します。"
				},
				{
					"name": "name",
					"required": false,
					"description": "[preload]に指定したnameを使って対象をまとめて指定できます。"
				},
				{
					"name": "all_sound",
					"required": false,
					"description": "trueを指定すると、すべての音声プリロードデータを破棄します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"plugin": {
			"name": "plugin",
			"summary": "プラグイン読み込み",
			"category": "変数・JS操作・ファイル読込",
			"description": "外部プラグインを読み込むことができます。\nプラグインはdata/others/pluginフォルダに配置します。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "読み込むプラグインの名前を指定します。プラグインはdata/others/pluginフォルダに配置します。"
				},
				{
					"name": "storage",
					"required": false,
					"description": "最初に読み込むシナリオファイルを変更できます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"loadcss": {
			"name": "loadcss",
			"summary": "CSS反映",
			"category": "変数・JS操作・ファイル読込",
			"description": "ゲームの途中でCSSを読み込むことができます。",
			"parameters": [
				{
					"name": "file",
					"required": true,
					"description": "読み込むCSSファイルのパスを指定します。パスはdata/から記述します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"playbgm": {
			"name": "playbgm",
			"summary": "BGMの再生",
			"category": "オーディオ",
			"description": "BGMを再生します。再生する音声ファイルはdata/bgmフォルダに配置します。",
			"parameters": [
				{
					"name": "storage",
					"required": true,
					"description": "再生する音楽ファイルを指定します。"
				},
				{
					"name": "loop",
					"required": false,
					"description": "ループするかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "sprite_time",
					"required": false,
					"description": "再生する区間を指定できます。開始時刻と終了時刻をハイフン繋ぎでミリ秒単位で指定します。たとえば6000-10000と指定すると00:06～00:10の4秒間を再生します。loop属性がtrueの場合、この間をループ再生します。\nV515以降：00:06-00:10のような分:秒区切りでも指定できるようになりました。必ず:を含めてください。"
				},
				{
					"name": "volume",
					"required": false,
					"description": "再生する音量を指定できます。0〜100の範囲で指定して下さい。"
				},
				{
					"name": "html5",
					"required": false,
					"description": "通常は指定しなくてOKです。HTML5 Audioを使う場合はtrue、Web Audio APIを使う場合はfalse(デフォルト)で指定します。"
				},
				{
					"name": "restart",
					"required": false,
					"description": "この[playbgm]で再生しようとしたBGMがすでに再生されていた場合の処理を設定できます。trueなら最初から再生し直し、falseなら無視となります。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"stopbgm": {
			"name": "stopbgm",
			"summary": "BGMの停止",
			"category": "オーディオ",
			"description": "再生しているBGMの再生を停止します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"fadeinbgm": {
			"name": "fadeinbgm",
			"summary": "BGMをフェードイン再生",
			"category": "オーディオ",
			"description": "BGMを徐々に再生します。",
			"parameters": [
				{
					"name": "storage",
					"required": true,
					"description": "再生する音楽ファイルを指定します。"
				},
				{
					"name": "loop",
					"required": false,
					"description": "ループするかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "sprite_time",
					"required": false,
					"description": "再生する区間を指定できます。開始時刻と終了時刻をハイフン繋ぎでミリ秒単位で指定します。たとえば6000-10000と指定すると00:06～00:10の4秒間を再生します。loop属性がtrueの場合、この間をループ再生します。\nV515以降：00:06-00:10のような分:秒区切りでも指定できるようになりました。必ず:を含めてください。"
				},
				{
					"name": "time",
					"required": false,
					"description": "フェードイン時間をミリ秒で指定します。"
				},
				{
					"name": "volume",
					"required": false,
					"description": "再生する音量を指定できます。0〜100の範囲で指定して下さい。"
				},
				{
					"name": "html5",
					"required": false,
					"description": "通常は指定しなくてOKです。HTML5 Audioを使う場合はtrue、Web Audio APIを使う場合はfalse(デフォルト)で指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"fadeoutbgm": {
			"name": "fadeoutbgm",
			"summary": "BGMをフェードアウト停止",
			"category": "オーディオ",
			"description": "再生中のBGMをフェードアウトしながら停止します。",
			"parameters": [
				{
					"name": "time",
					"required": false,
					"description": "フェードアウト時間をミリ秒で指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"xchgbgm": {
			"name": "xchgbgm",
			"summary": "BGMのクロスフェード（入れ替え）",
			"category": "オーディオ",
			"description": "【非推奨】BGMを入れ替えます。音楽が交差して切り替わる演出に使用できます。",
			"parameters": [
				{
					"name": "storage",
					"required": true,
					"description": "次に再生するファイルを指定します。"
				},
				{
					"name": "loop",
					"required": false,
					"description": "ループするかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "time",
					"required": false,
					"description": "クロスフェードを行なっている時間をミリ秒で指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"playse": {
			"name": "playse",
			"summary": "効果音の再生",
			"category": "オーディオ",
			"description": "BGMを再生します。再生する音声ファイルはdata/soundフォルダに配置します。",
			"parameters": [
				{
					"name": "storage",
					"required": true,
					"description": "再生する音楽ファイルを指定します。"
				},
				{
					"name": "buf",
					"required": false,
					"description": "効果音を再生するスロットを指定できます。すでに指定スロットで再生中の効果音がある場合、その効果音は停止されます。"
				},
				{
					"name": "loop",
					"required": false,
					"description": "ループするかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "sprite_time",
					"required": false,
					"description": "再生する区間を指定できます。開始時刻と終了時刻をハイフン繋ぎでミリ秒単位で指定します。たとえば6000-10000と指定すると00:06～00:10の4秒間を再生します。loop属性がtrueの場合、この間をループ再生します。\nV515以降：00:06-00:10のような分:秒区切りでも指定できるようになりました。必ず:を含めてください。"
				},
				{
					"name": "clear",
					"required": false,
					"description": "trueまたはfalse。trueを指定すると、他のスロットで再生中の効果音がある場合、そちらもすべて停止します。音声などはtrueが便利でしょう。"
				},
				{
					"name": "volume",
					"required": false,
					"description": "再生する音量を指定できます。0〜100の範囲で指定して下さい。"
				},
				{
					"name": "html5",
					"required": false,
					"description": "通常は指定しなくてOKです。HTML5 Audioを使う場合はtrue、Web Audio APIを使う場合はfalse(デフォルト)で指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"stopse": {
			"name": "stopse",
			"summary": "効果音の停止",
			"category": "オーディオ",
			"description": "効果音を再生を停止します。",
			"parameters": [
				{
					"name": "buf",
					"required": false,
					"description": "効果音を停止するスロットを指定できます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"fadeinse": {
			"name": "fadeinse",
			"summary": "効果音のフェードイン",
			"category": "オーディオ",
			"description": "効果音をフェードインしながら再生します。",
			"parameters": [
				{
					"name": "storage",
					"required": true,
					"description": "再生する音楽ファイルを指定します。"
				},
				{
					"name": "loop",
					"required": false,
					"description": "ループするかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "sprite_time",
					"required": false,
					"description": "再生する区間を指定できます。開始時刻と終了時刻をハイフン繋ぎでミリ秒単位で指定します。たとえば6000-10000と指定すると00:06～00:10の4秒間を再生します。loop属性がtrueの場合、この間をループ再生します。\nV515以降：00:06-00:10のような分:秒区切りでも指定できるようになりました。必ず:を含めてください。"
				},
				{
					"name": "buf",
					"required": false,
					"description": "効果音を停止するスロットを指定できます。"
				},
				{
					"name": "time",
					"required": true,
					"description": "フェードイン時間をミリ秒で指定します。"
				},
				{
					"name": "html5",
					"required": false,
					"description": "通常は指定しなくてOKです。HTML5 Audioを使う場合はtrue、Web Audio APIを使う場合はfalse(デフォルト)で指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"fadeoutse": {
			"name": "fadeoutse",
			"summary": "効果音のフェードアウト",
			"category": "オーディオ",
			"description": "効果音をフェードアウトします。",
			"parameters": [
				{
					"name": "time",
					"required": false,
					"description": "フェードアウト時間をミリ秒で指定します。"
				},
				{
					"name": "buf",
					"required": false,
					"description": "効果音を停止するスロットを指定できます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"bgmopt": {
			"name": "bgmopt",
			"summary": "BGM設定",
			"category": "オーディオ",
			"description": "BGMの設定を変更できます。",
			"parameters": [
				{
					"name": "volume",
					"required": false,
					"description": "BGMのコンフィグ音量を0〜100で指定できます。"
				},
				{
					"name": "buf",
					"required": false,
					"description": "設定を変更するスロットを指定できます。省略すると、全スロット共通の音量が設定されます。"
				},
				{
					"name": "effect",
					"required": false,
					"description": "コンフィグ音量の変更を現在再生中のBGMに即反映するかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "time",
					"required": false,
					"description": "音量の変更を即反映する場合のフェード時間をミリ秒単位で指定できます。"
				},
				{
					"name": "tag_volume",
					"required": false,
					"description": "0〜100を指定して、現在再生中のBGMのタグ音量を変更できます。タグ音量とは[playbgm]タグに指定されていた音量のことです。この機能はたとえば、もともと[playbgm volume=\"50\"]で再生され始めたBGMの音量を、[playbgm volume=\"100\"]で再生されていた場合の音量に修正したい、というケースで使用可能です。これを指定しただけではコンフィグ音量は変更されません。これを指定すると、effectが強制的にtrueになります。"
				},
				{
					"name": "samebgm_restart",
					"required": false,
					"description": "[playbgm]タグで再生しようとしたBGMがすでに再生中だった場合の処理を設定できます。trueなら最初から再生し直し、falseならスルー。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"seopt": {
			"name": "seopt",
			"summary": "SE設定",
			"category": "オーディオ",
			"description": "SEの設定を変更できます。",
			"parameters": [
				{
					"name": "volume",
					"required": false,
					"description": "SEのコンフィグ音量を0〜100で指定できます。"
				},
				{
					"name": "buf",
					"required": false,
					"description": "設定を変更するスロットを指定できます。省略すると、全スロット共通の音量が設定されます。"
				},
				{
					"name": "effect",
					"required": false,
					"description": "コンフィグ音量の変更を現在再生中のSEに即反映するかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "time",
					"required": false,
					"description": "音量の変更を即反映する場合のフェード時間をミリ秒単位で指定できます。"
				},
				{
					"name": "tag_volume",
					"required": false,
					"description": "0〜100を指定して、現在再生中のSEのタグ音量を変更できます。タグ音量とは[playse]タグに指定されていた音量のことです。この機能はたとえば、もともと[playse volume=\"50\"]で再生され始めたSEの音量を、[playse volume=\"100\"]で再生されていた場合の音量に修正したい、というケースで使用可能です。これを指定しただけではコンフィグ音量は変更されません。これを指定すると、effectが強制的にtrueになります。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"changevol": {
			"name": "changevol",
			"summary": "再生中のオーディオの音量変更",
			"category": "オーディオ",
			"description": "現在再生中のオーディオの音量を変更できます。",
			"parameters": [
				{
					"name": "target",
					"required": false,
					"description": "BGMの音量を変更する場合は\"bgm\"、SEの音量を変更する場合は\"se\"と指定します。"
				},
				{
					"name": "volume",
					"required": false,
					"description": "音量を0〜100で指定します。"
				},
				{
					"name": "buf",
					"required": false,
					"description": "設定を変更するスロットを指定できます。省略すると、全スロットの音声に対して処理が実行されます。"
				},
				{
					"name": "time",
					"required": false,
					"description": "フェード時間をミリ秒単位で指定できます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"pausebgm": {
			"name": "pausebgm",
			"summary": "再生中のBGMの一時停止",
			"category": "オーディオ",
			"description": "現在再生中のBGMを一時停止できます。",
			"parameters": [
				{
					"name": "buf",
					"required": false,
					"description": "スロットを指定できます。省略すると、全スロットの音声に対して処理が実行されます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"resumebgm": {
			"name": "resumebgm",
			"summary": "一時停止中のオーディオの再開",
			"category": "オーディオ",
			"description": "一時停止中のオーディオを再開できます。",
			"parameters": [
				{
					"name": "buf",
					"required": false,
					"description": "スロットを指定できます。省略すると、全スロットの音声に対して処理が実行されます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"pausese": {
			"name": "pausese",
			"summary": "再生中のSEの一時停止",
			"category": "オーディオ",
			"description": "現在再生中のSEを一時停止できます。",
			"parameters": [
				{
					"name": "buf",
					"required": false,
					"description": "スロットを指定できます。省略すると、全スロットの音声に対して処理が実行されます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"resumese": {
			"name": "resumese",
			"summary": "一時停止中のSEの再開",
			"category": "オーディオ",
			"description": "一時停止中のSEを再開できます。",
			"parameters": [
				{
					"name": "buf",
					"required": false,
					"description": "スロットを指定できます。省略すると、全スロットの音声に対して処理が実行されます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"wbgm": {
			"name": "wbgm",
			"summary": "BGMの再生完了を待つ",
			"category": "オーディオ",
			"description": "BGMの再生完了を待ちます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"wse": {
			"name": "wse",
			"summary": "効果音の再生完了を待つ",
			"category": "オーディオ",
			"description": "効果音の再生完了を待ちます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"voconfig": {
			"name": "voconfig",
			"summary": "ボイスの再生設定",
			"category": "ボイス・読み上げ",
			"description": "ボイスを効率的に再生するための設定ができます。",
			"parameters": [
				{
					"name": "sebuf",
					"required": false,
					"description": "ボイスで使用する[playse]のbufを指定します。"
				},
				{
					"name": "name",
					"required": false,
					"description": "ボイスを再生するキャラクター名を指定します。[chara_new]タグのname。"
				},
				{
					"name": "vostorage",
					"required": false,
					"description": "音声ファイルとして使用するファイル名のテンプレートを指定します。{number}の部分には、再生されることに+1された数値が入っていきます。"
				},
				{
					"name": "number",
					"required": false,
					"description": "vostorageの{number}に当てはめる数値の初期値。"
				},
				{
					"name": "waittime",
					"required": false,
					"description": "オートモードにおいて、ボイスを再生し終わってから次のメッセージに進むまでに何ミリ秒待つか。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"vostart": {
			"name": "vostart",
			"summary": "ボイス自動再生開始",
			"category": "ボイス・読み上げ",
			"description": "[voconfig]で指定したボイスの自動再生を開始します。\nこれ以降、#で名前を指定したときに紐付いたボイスが再生されていきます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"vostop": {
			"name": "vostop",
			"summary": "ボイス自動再生停止",
			"category": "ボイス・読み上げ",
			"description": "[voconfig]で指定したボイスの自動再生を停止します。\nこれ以降、#で名前を指定してもボイスは再生されません。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"speak_on": {
			"name": "speak_on",
			"summary": "読み上げ機能の有効化",
			"category": "ボイス・読み上げ",
			"description": "ストーリーのシナリオを音声で読み上げることができます。",
			"parameters": [
				{
					"name": "volume",
					"required": false,
					"description": "音量を0～100で指定します。"
				},
				{
					"name": "pitch",
					"required": false,
					"description": "声の高さを100を基準とする比率で指定します。指定した数値が大きいほど声が高くなります。"
				},
				{
					"name": "rate",
					"required": false,
					"description": "声の速度を100を基準とする比率で指定します。指定した数値が大きいほど早口になります。"
				},
				{
					"name": "cancel",
					"required": false,
					"description": "テキスト読み上げ中に次のテキスト読み上げが差し込まれた場合の動作を指定できます。trueを指定すると読み上げを中断して新しいテキストを読み上げます。falseを指定すると中断は行わず、読み上げが完了次第次のテキストを読み上げるようになります。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"speak_off": {
			"name": "speak_off",
			"summary": "読み上げ機能の無効化",
			"category": "ボイス・読み上げ",
			"description": "シナリオの読み上げをオフにします。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"edit": {
			"name": "edit",
			"summary": "テキストボックス",
			"category": "入力フォーム",
			"description": "プレイヤーが入力可能なテキストボックスを表示します。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "プレイヤーの入力テキストを保存する変数名を指定してください。"
				},
				{
					"name": "initial",
					"required": false,
					"description": "テキストボックスの初期値を設定できます。"
				},
				{
					"name": "color",
					"required": false,
					"description": "文字の色を指定します。"
				},
				{
					"name": "left",
					"required": false,
					"description": "テキストボックスの横位置を指定します。"
				},
				{
					"name": "top",
					"required": false,
					"description": "テキストボックスの縦位置を指定します。"
				},
				{
					"name": "autocomplete",
					"required": false,
					"description": "入力の履歴を表示するかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "size",
					"required": false,
					"description": "文字のサイズを指定します。"
				},
				{
					"name": "width",
					"required": false,
					"description": "テキストボックスの横幅を指定します。"
				},
				{
					"name": "height",
					"required": false,
					"description": "テキストボックスの高さを指定します。"
				},
				{
					"name": "maxchars",
					"required": false,
					"description": "最大入力文字数を指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"commit": {
			"name": "commit",
			"summary": "フォームの確定",
			"category": "入力フォーム",
			"description": "[edit]で表示したテキストボックスの入力内容を確定し、name属性で指定した変数に値をセットします。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_init": {
			"name": "3d_init",
			"summary": "3D機能の初期化",
			"category": "3D関連",
			"description": "3D関連の機能を使用するために必要な宣言です。\nこのタグを通過するとき、ゲーム内に3Dを表示するための初期化が行われます。\nこのタグを通過するまで[3d_...]で始まるタグは使えません。",
			"parameters": [
				{
					"name": "layer",
					"required": false,
					"description": "3Dモデルを配置するレイヤを指定できます。"
				},
				{
					"name": "camera",
					"required": false,
					"description": "カメラのモードを指定できます。Perspective(遠近感あり)、Orthographic(遠近感なしの平行投影)"
				},
				{
					"name": "near",
					"required": false,
					"description": "カメラに近いオブジェクトをどの距離まで描画するかを設定できます。"
				},
				{
					"name": "far",
					"required": false,
					"description": "カメラから遠いオブジェクトを表示する距離を設定できます。大きすぎると不必要に遠くまで描画するため処理が重くなります。可能な限り小さい値に調整しましょう。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_model_new": {
			"name": "3d_model_new",
			"summary": "3Dモデルの作成",
			"category": "3D関連",
			"description": "外部ファイルの3Dモデルを読み込んで定義します。\nこのタグを実行しただけでは、3Dモデルはまだゲーム画面に表示されません。表示するには[3d_show]が必要です。\n3Dモデルファイルはdata/others/3d/modelフォルダに配置します。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "3Dオブジェクトの名前です。この名前をつかって表示・非表示などを制御します。"
				},
				{
					"name": "storage",
					"required": true,
					"description": "3Dモデルのファイルを指定します。対応している形式はgltf、objです。ファイルはdataothers/3d/modelフォルダに配置します。"
				},
				{
					"name": "pos",
					"required": false,
					"description": "3Dオブジェクトを配置する座標を指定します。xyz座標をそれぞれ半角カンマ区切りでまとめて指定します。"
				},
				{
					"name": "rot",
					"required": false,
					"description": "3Dオブジェクトの回転を指定します。xyz軸の回転をそれぞれ半角カンマ区切りでまとめて指定します。"
				},
				{
					"name": "scale",
					"required": false,
					"description": "3Dオブジェクトの拡大率を指定します。xyz軸の拡大率をそれぞれ半角カンマで区切ってまとめて指定します。"
				},
				{
					"name": "tonemap",
					"required": false,
					"description": "トーンマッピングが有効な場合、このオブジェクトが影響を受けるかどうか。デフォルトはtrue。無効にする場合はfalseを指定します。"
				},
				{
					"name": "motion",
					"required": false,
					"description": "3Dモデルにモーションが存在する場合、モーション名を指定できます。指定がない場合はひとつめのモーションファイルが自動的に適応されます。"
				},
				{
					"name": "folder",
					"required": false,
					"description": "ファイルの配置フォルダを変更できます。たとえばfgimageと指定すると、data/fgimageフォルダにある3Dモデルファイルを探します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_sphere_new": {
			"name": "3d_sphere_new",
			"summary": "3Dモデル(球体)",
			"category": "3D関連",
			"description": "球体の3Dモデルを定義します。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "3Dオブジェクトの名前です。この名前をつかって表示・非表示などを制御します。"
				},
				{
					"name": "texture",
					"required": false,
					"description": "球体にテクスチャを貼ることができます。画像はdata/others/3d/texture以下に配置します。画像サイズは256x256や512x512が推奨されます。"
				},
				{
					"name": "color",
					"required": false,
					"description": "球体の色を0xRRGGBB形式で指定します。"
				},
				{
					"name": "pos",
					"required": false,
					"description": "3Dオブジェクトを配置する座標を指定します。xyz座標をそれぞれ半角カンマ区切りでまとめて指定します。"
				},
				{
					"name": "rot",
					"required": false,
					"description": "3Dオブジェクトの回転を指定します。xyz軸の回転をそれぞれ半角カンマ区切りでまとめて指定します。"
				},
				{
					"name": "scale",
					"required": false,
					"description": "3Dオブジェクトの拡大率を指定します。xyz軸の拡大率をそれぞれ半角カンマで区切ってまとめて指定します。"
				},
				{
					"name": "radius",
					"required": false,
					"description": "球体の半径を指定します。"
				},
				{
					"name": "width",
					"required": false,
					"description": "球体の横幅を指定します。"
				},
				{
					"name": "height",
					"required": false,
					"description": "球体の高さを指定します。"
				},
				{
					"name": "tonemap",
					"required": false,
					"description": "トーンマッピングが有効な場合、このオブジェクトが影響を受けるかどうか。デフォルトはtrue。無効にする場合はfalseを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_sprite_new": {
			"name": "3d_sprite_new",
			"summary": "3Dモデル(スプライト)",
			"category": "3D関連",
			"description": "スプライトの3Dモデルを定義します。\nイメージとの違いはスプライトの場合、オブジェクトが常にカメラの方を向きます。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "3Dオブジェクトの名前です。この名前をつかって表示・非表示などの制御を行います。"
				},
				{
					"name": "storage",
					"required": true,
					"description": "表示する画像ファイルを指定します。ファイルは「others/3d/sprite」フォルダ以下に配置してください。"
				},
				{
					"name": "pos",
					"required": false,
					"description": "3Dオブジェクトを配置する座標を指定します。xyz座標をそれぞれ半角カンマ区切りでまとめて指定します。"
				},
				{
					"name": "rot",
					"required": false,
					"description": "3Dオブジェクトの回転を指定します。xyz軸の回転をそれぞれ半角カンマ区切りでまとめて指定します。"
				},
				{
					"name": "scale",
					"required": false,
					"description": "3Dオブジェクトの拡大率を指定します。xyz軸の拡大率をそれぞれ半角カンマで区切ってまとめて指定します。"
				},
				{
					"name": "tonemap",
					"required": false,
					"description": "トーンマッピングが有効な場合、このオブジェクトが影響を受けるかどうか。デフォルトはtrue。無効にする場合はfalseを指定します。"
				},
				{
					"name": "folder",
					"required": false,
					"description": "ファイルの配置フォルダを変更できます。たとえばfgimageと指定すると、data/fgimageフォルダにある3Dモデルファイルを探します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_event": {
			"name": "3d_event",
			"summary": "3Dイベント定義",
			"category": "3D関連",
			"description": "3Dオブジェクトがクリックされたときにイベントを発火（シナリオをジャンプ）させることができます。イベントは[s]タグに到達していないと発火しません。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "3Dオブジェクトの名前です。イベントを発生させる3Dオブジェクトのnameを指定します。"
				},
				{
					"name": "storage",
					"required": false,
					"description": "ジャンプ先のシナリオファイル名を指定します。省略すると、現在のシナリオファイルとみなされます。"
				},
				{
					"name": "target",
					"required": false,
					"description": "ジャンプ先のラベル名を指定します。省略すると、シナリオファイルの先頭にジャンプします。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_event_delete": {
			"name": "3d_event_delete",
			"summary": "3Dイベントの削除",
			"category": "3D関連",
			"description": "登録した3Dイベントを無効化します。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "3Dオブジェクトの名前です。イベントを削除する3Dオブジェクトのnameを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_event_start": {
			"name": "3d_event_start",
			"summary": "3Dイベントの開始",
			"category": "3D関連",
			"description": "登録した3Dイベントを開始します。\nイベントが一度実行された後は全イベントが無効化されるため、受付を再開したい場合はこのタグを配置する必要があります。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_event_stop": {
			"name": "3d_event_stop",
			"summary": "3Dイベントの停止",
			"category": "3D関連",
			"description": "登録した3Dイベントを一時的に停止します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_box_new": {
			"name": "3d_box_new",
			"summary": "3Dモデル(ボックス)",
			"category": "3D関連",
			"description": "立方体の3Dモデルを定義します。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "3Dオブジェクトの名前です。この名前をつかって表示・非表示を制御します。"
				},
				{
					"name": "texture",
					"required": false,
					"description": "表示する画像ファイルを指定します。ファイルはdata/others/3d/textureフォルダ以下に配置してください。１つのテクスチャの場合はすべての面が同じ画像になりますが、半角カンマで区切って６つ指定するとすべての面に異なるテクスチャを適応することもできます"
				},
				{
					"name": "color",
					"required": false,
					"description": "色を指定できます。0xRRGGBB 形式で指定します。"
				},
				{
					"name": "width",
					"required": false,
					"description": "3Dオブジェクトの横幅を指定します。デフォルトは1です"
				},
				{
					"name": "height",
					"required": false,
					"description": "3Dオブジェクトの高さを指定します。デフォルトは1です"
				},
				{
					"name": "depth",
					"required": false,
					"description": "3Dオブジェクトの深さを指定します。デフォルトは1です"
				},
				{
					"name": "pos",
					"required": false,
					"description": "3Dオブジェクトを配置する座標を指定します。xyz座標をそれぞれ半角カンマ区切りでまとめて指定します。"
				},
				{
					"name": "rot",
					"required": false,
					"description": "3Dオブジェクトの回転を指定します。xyz軸の回転をそれぞれ半角カンマ区切りでまとめて指定します。"
				},
				{
					"name": "scale",
					"required": false,
					"description": "3Dオブジェクトの拡大率を指定します。xyz軸の拡大率をそれぞれ半角カンマで区切ってまとめて指定します。"
				},
				{
					"name": "tonemap",
					"required": false,
					"description": "トーンマッピングが有効な場合、このオブジェクトが影響を受けるかどうか。デフォルトはtrue。無効にする場合はfalseを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_image_new": {
			"name": "3d_image_new",
			"summary": "3Dモデル(イメージ)",
			"category": "3D関連",
			"description": "イメージの3Dモデルを定義します。\n平面の板が3Dシーンに追加されるイメージです。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "3Dオブジェクトの名前です。この名前をつかって表示・非表示などの制御を行います。"
				},
				{
					"name": "texture",
					"required": false,
					"description": "表示する画像ファイルを指定します。ファイルは「others/3d/texture」フォルダ以下に配置してください。"
				},
				{
					"name": "width",
					"required": true,
					"description": "3Dオブジェクトの横幅を指定します。デフォルトは1です"
				},
				{
					"name": "height",
					"required": false,
					"description": "3Dオブジェクトの高さを指定します。省略した場合は画像サイズの比率を保った形で表示できます。"
				},
				{
					"name": "pos",
					"required": false,
					"description": "3Dオブジェクトを配置する座標を指定します。xyz座標をそれぞれ半角カンマ区切りでまとめて指定します。"
				},
				{
					"name": "rot",
					"required": false,
					"description": "3Dオブジェクトの回転を指定します。xyz軸の回転をそれぞれ半角カンマ区切りでまとめて指定します。"
				},
				{
					"name": "scale",
					"required": false,
					"description": "3Dオブジェクトの拡大率を指定します。xyz軸の拡大率をそれぞれ半角カンマで区切ってまとめて指定します。"
				},
				{
					"name": "tonemap",
					"required": false,
					"description": "トーンマッピングが有効な場合、このオブジェクトが影響を受けるかどうか。デフォルトはtrue。無効にする場合はfalseを指定します。"
				},
				{
					"name": "doubleside",
					"required": false,
					"description": "テクスチャを両面に表示させるかを指定します。デフォルトはfalse。trueを指定すると裏面にもテクスチャが表示されます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_show": {
			"name": "3d_show",
			"summary": "3Dオブジェクト表示",
			"category": "3D関連",
			"description": "定義した3Dオブジェクトを実際にゲーム画面に登場させます。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "3Dオブジェクトの名前です。表示させたいオブジェクトのnameを指定します"
				},
				{
					"name": "time",
					"required": false,
					"description": "表示させるまでの時間をミリ秒で指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "表示の完了を待つか否か。"
				},
				{
					"name": "pos",
					"required": false,
					"description": "3Dオブジェクトを配置する座標を指定します。xyz座標をそれぞれ半角カンマ区切りでまとめて指定します。"
				},
				{
					"name": "rot",
					"required": false,
					"description": "3Dオブジェクトの回転を指定します。xyz軸の回転をそれぞれ半角カンマ区切りでまとめて指定します。"
				},
				{
					"name": "scale",
					"required": false,
					"description": "3Dオブジェクトの拡大率を指定します。xyz軸の拡大率をそれぞれ半角カンマで区切ってまとめて指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_hide": {
			"name": "3d_hide",
			"summary": "3Dオブジェクト非表示",
			"category": "3D関連",
			"description": "3Dオブジェクトをゲーム画面から退場させます。\nこのタグを実行しても定義自体は削除されません。\nもう一度表示させるには[3d_show]タグを使います。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "退場させるオブジェクトのnameを指定します。"
				},
				{
					"name": "time",
					"required": false,
					"description": "退場させるまでの時間をミリ秒で指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "退場の完了を待つかどうか。trueまたはfalseで指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_hide_all": {
			"name": "3d_hide_all",
			"summary": "3Dオブジェクト全非表示",
			"category": "3D関連",
			"description": "すべての3Dオブジェクトをゲーム画面から退場させます。\nこのタグを実行しても定義自体は削除されません。\nもう一度表示する場合は[3d_show]タグを使ってください。",
			"parameters": [
				{
					"name": "time",
					"required": false,
					"description": "退場させるまでの時間をミリ秒で指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "退場の完了を待つかどうか。trueまたはfalseで指定します"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_delete": {
			"name": "3d_delete",
			"summary": "3Dオブジェクトの定義の削除",
			"category": "3D関連",
			"description": "3Dオブジェクトの定義を削除します。\nこのタグは[3d_hide]とは異なり3Dモデルの定義自体を削除するので、モデルを再度使用するには[3d_model_new]タグを使う必要があります。\n使用しなくなった3Dオブジェクトの定義をこまめに削除しておくことで軽量な動作が期待できます。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "削除したい3Dオブジェクトのnameを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_delete_all": {
			"name": "3d_delete_all",
			"summary": "3Dオブジェクト全削除",
			"category": "3D関連",
			"description": "3Dオブジェクトをすべて削除します。\n3Dシーンをリセットするときに利用します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_canvas_show": {
			"name": "3d_canvas_show",
			"summary": "3Dキャンバス表示",
			"category": "3D関連",
			"description": "3Dキャンバスを表示状態にします。\n対になる[3d_canvas_hide]タグと組み合わせて使います。\n3Dシーンとノベルパートを頻繁に行き来する場合に活用できます。",
			"parameters": [
				{
					"name": "time",
					"required": false,
					"description": "表示にかける時間をミリ秒で指定できます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_canvas_hide": {
			"name": "3d_canvas_hide",
			"summary": "3Dキャンバス非表示",
			"category": "3D関連",
			"description": "3Dキャンバスを非表示にします。\n3Dシーン自体は維持されます。\n3Dシーンとノベルパートを頻繁に行き来する場合に活用できます。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_close": {
			"name": "3d_close",
			"summary": "3Dシーン削除",
			"category": "3D関連",
			"description": "3Dシーンをすべて削除します。\nこのタグを使用すると3D系の機能は全て使えなくなります。\nもう一度3D系の機能を使用するには[3d_init]タグを使用してください。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_anim": {
			"name": "3d_anim",
			"summary": "3Dアニメーション",
			"category": "3D関連",
			"description": "シーン上の3Dオブジェクトをアニメーションさせます。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "アニメーション対象の3Dオブジェクトのnameを指定します。ただしcameraを指定した場合はカメラをアニメーションさせる動作となります。"
				},
				{
					"name": "pos",
					"required": false,
					"description": "アニメーション後の座標を指定します。xyz座標をそれぞれ半角カンマ区切りでまとめて指定します。"
				},
				{
					"name": "rot",
					"required": false,
					"description": "アニメーション後の回転を指定します。xyz軸の回転をそれぞれ半角カンマ区切りでまとめて指定します。"
				},
				{
					"name": "scale",
					"required": false,
					"description": "アニメーション後の拡大率を指定します。xyz軸の拡大率をそれぞれ半角カンマで区切ってまとめて指定します。"
				},
				{
					"name": "time",
					"required": false,
					"description": "アニメーションにかける時間をミリ秒で指定します。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "アニメーションの完了を待つかどうかをtrueまたはfalseで指定します。"
				},
				{
					"name": "lookat",
					"required": false,
					"description": "nameがcameraのときだけ有効。オブジェクトのnameかpos座標を指定することで、カメラを特定の方向に向けられます。"
				},
				{
					"name": "effect",
					"required": false,
					"description": "変化のエフェクトを指定します。以下のキーワードが指定できます。\njswingdefeaseInQuadeaseOutQuadeaseInOutQuadeaseInCubiceaseOutCubiceaseInOutCubiceaseInQuarteaseOutQuarteaseInOutQuarteaseInQuinteaseOutQuinteaseInOutQuinteaseInSineeaseOutSineeaseInOutSineeaseInExpoeaseOutExpoeaseInOutExpoeaseInCirceaseOutCirceaseInOutCirceaseInElasticeaseOutElasticeaseInOutElasticeaseInBackeaseOutBackeaseInOutBackeaseInBounceeaseOutBounceeaseInOutBounce"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_anim_stop": {
			"name": "3d_anim_stop",
			"summary": "3Dアニメ停止",
			"category": "3D関連",
			"description": "3Dオブジェクトのアニメーションを停止できます。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "アニメーションを停止する3Dオブジェクトのnameを指定します。"
				},
				{
					"name": "finish",
					"required": false,
					"description": "trueまたはfalseを指定します。trueを指定すると3Dオブジェクトが最終的にアニメーションする予定だった場所まで移動します。falseを指定するとその場で停止します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_scene": {
			"name": "3d_scene",
			"summary": "3Dシーン設定",
			"category": "3D関連",
			"description": "3Dシーン全体に影響する設定を行うことができます。",
			"parameters": [
				{
					"name": "tonemap",
					"required": false,
					"description": "トーンマッピングをシーンに設定できます。以下のキーワードが指定できます。NoLinearReinhardUncharted2CineonACESFilmic\nデフォルトはNo(トーンマッピングなし)"
				},
				{
					"name": "tonemap_value",
					"required": false,
					"description": "トーンマッピングの強さを設定します。"
				},
				{
					"name": "light_amb",
					"required": false,
					"description": "環境光の強さを指定します。デフォルトは1。0.5だと暗めに、2だとかなり明るくなります。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_camera": {
			"name": "3d_camera",
			"summary": "3Dカメラ",
			"category": "3D関連",
			"description": "3Dシーンのカメラを設定できます。\nカメラの座標を確認したい場合は[camera_debug]をつかって、座標や傾きをテストするのがおすすめです。",
			"parameters": [
				{
					"name": "pos",
					"required": false,
					"description": "カメラの座標を指定します。xyz座標をそれぞれ半角カンマで区切って指定します。"
				},
				{
					"name": "rot",
					"required": false,
					"description": "カメラの回転を指定します。xyz軸の回転をそれぞれ半角カンマで区切って指定します。"
				},
				{
					"name": "lookat",
					"required": false,
					"description": "シーン上の3Dオブジェクトのnameを指定することで、そのオブジェクトの方にカメラを向けることができます。もしくはxyz座標を直接指定することで、その座標にカメラを向けることもできます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_gyro": {
			"name": "3d_gyro",
			"summary": "3Dジャイロ",
			"category": "3D関連",
			"description": "ジャイロ（スマホの傾き）でカメラを制御できます。\nPCゲームの場合はマウスの位置でジャイロを再現できます。",
			"parameters": [
				{
					"name": "max_x",
					"required": false,
					"description": "X軸方向の傾き上限を角度で指定します。"
				},
				{
					"name": "max_y",
					"required": false,
					"description": "Y軸方向の傾き上限を角度で指定します。"
				},
				{
					"name": "mode",
					"required": false,
					"description": "positionまたはrotation。カメラの「座標」と「回転」のうちどちらをジャイロで制御するのかを指定できます。回転をジャイロで制御できるようするにはrotationを、座標をジャイロで制御できるようにするにはpositionを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_gyro_stop": {
			"name": "3d_gyro_stop",
			"summary": "3Dジャイロ停止",
			"category": "3D関連",
			"description": "ジャイロの動きを停止します。\nカメラの位置や回転をもとに戻したい場合、このタグの直後に[3d_camera]で指定する必要があります。\nジャイロを有効にするには再び[3d_gyro]タグを使用します。",
			"parameters": [
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_debug_camera": {
			"name": "3d_debug_camera",
			"summary": "3Dカメラデバッグ",
			"category": "3D関連",
			"description": "3Dシーンのカメラ座標をマウスでドラッグアンドドロップしながら調整できます。\nデバッグを終了する場合は画面左上のボタンを押します。",
			"parameters": [
				{
					"name": "button_text",
					"required": false,
					"description": "デバッグ終了ボタンのテキストを自由に設定できます。"
				},
				{
					"name": "menu",
					"required": false,
					"description": "デバッグのメニューを表示するかどうか。falseを指定すると終了ボタンのみになります。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_motion": {
			"name": "3d_motion",
			"summary": "モーション変更",
			"category": "3D関連",
			"description": "3Dモデルのモーションを変更できます。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "3Dオブジェクトのnameを指定します。"
				},
				{
					"name": "motion",
					"required": true,
					"description": "モーション名を指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"3d_debug": {
			"name": "3d_debug",
			"summary": "3Dデバッグ",
			"category": "3D関連",
			"description": "3Dシーンのオブジェクトをマウスでドラッグアンドドロップしながら、調整できます。\nデバッグを終了する場合は画面左上のボタンを押します。",
			"parameters": [
				{
					"name": "name",
					"required": true,
					"description": "デバッグする3Dオブジェクトのnameを指定します。"
				},
				{
					"name": "button_text",
					"required": false,
					"description": "デバッグ終了ボタンのテキストを自由に設定できます。"
				},
				{
					"name": "menu",
					"required": false,
					"description": "デバッグのメニューを表示するかどうか。falseを指定すると終了ボタンのみになります。"
				},
				{
					"name": "overlap",
					"required": false,
					"description": "trueまたはfalse。trueを指定すると、モデルが最前面に表示されます。モデルがメニューに隠れてしまう場合はここをtrueにしてください。"
				},
				{
					"name": "reset",
					"required": false,
					"description": "trueまたはfalse。trueを指定すると、デバッグ終了後にモデルの状態がデバッグ前に戻ります。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"bgcamera": {
			"name": "bgcamera",
			"summary": "ストリームカメラ背景",
			"category": "AR関連",
			"description": "プレイヤーの使用デバイスのカメラをゲームから起動させて、カメラで撮影している映像をゲーム画面の背景として映すことができます。現実の風景や自分にキャラクターを重ねて記念撮影できるアプリが簡単につくれます。",
			"parameters": [
				{
					"name": "name",
					"required": false,
					"description": "[anim]タグなどからこの名前でアニメーションさせられます。カンマで区切ることで複数指定できます。（高度な知識：name属性で指定した値はHTMLのクラス属性になります）"
				},
				{
					"name": "wait",
					"required": false,
					"description": "trueを指定するとカメラ入力の表示を待ちます。"
				},
				{
					"name": "time",
					"required": false,
					"description": "カメラ入力領域が表示されるフェードイン時間をミリ秒で指定します。"
				},
				{
					"name": "fit",
					"required": false,
					"description": "比率を崩しても全画面に配置するならtrue。比率を保持して配置するならfalse。カメラの解像度によっては黒塗りの部分ができる可能性があります。"
				},
				{
					"name": "left",
					"required": false,
					"description": "カメラを配置する位置を指定できます。（ピクセル）"
				},
				{
					"name": "top",
					"required": false,
					"description": "カメラを配置する位置を指定できます。（ピクセル）"
				},
				{
					"name": "width",
					"required": false,
					"description": "カメラを配置するエリアの幅を指定します。（ピクセル）"
				},
				{
					"name": "height",
					"required": false,
					"description": "カメラを配置するエリアの高さを指定します。（ピクセル）"
				},
				{
					"name": "mode",
					"required": false,
					"description": "front(前面カメラ)、back(背面カメラ)を指定します。何も指定しないと標準のカメラが選択されます。"
				},
				{
					"name": "qrcode",
					"required": false,
					"description": "QRコードを読み込んだときの動作を設定できます。\njump(ゲーム内移動のQRのみ反応)\nweb(他サイトへのリンクだけ反応)\ndefine([qr_define]で定義したものだけに反応)\nall(すべてに反応)\noff(QRコードに反応しない)"
				},
				{
					"name": "debug",
					"required": false,
					"description": "QRコードが読み込まれたときにURLを表示するか否かを指定できます。デフォルトはfalse。trueでURLをアラート表示できます。"
				},
				{
					"name": "audio",
					"required": false,
					"description": "音声入力も反映するか否か。trueを指定すると音声もゲームに反映されます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"qr_config": {
			"name": "qr_config",
			"summary": "QRコードの動作設定",
			"category": "AR関連",
			"description": "QRコードの各種動作設定が可能です。",
			"parameters": [
				{
					"name": "qrcode",
					"required": false,
					"description": "QRコードを読み込んだときの動作を設定できます。\njump(ゲーム内移動のQRのみ反応)\nweb(他サイトへのリンクだけ反応)\ndefine([qr_define]で定義したものだけに反応)\nall(すべてに反応)\noff(QRコードに反応しない)"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"stop_bgcamera": {
			"name": "stop_bgcamera",
			"summary": "カメラストリームの停止",
			"category": "AR関連",
			"description": "[bgcamera]を非表示にします。",
			"parameters": [
				{
					"name": "time",
					"required": false,
					"description": "ミリ秒で指定。動画をフェードアウトして削除することが可能です。"
				},
				{
					"name": "wait",
					"required": false,
					"description": "動画のフェードアウトを待つかどうかtrueまたはfalseを指定します。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		},
		"qr_define": {
			"name": "qr_define",
			"summary": "QRコードの置き換え",
			"category": "AR関連",
			"description": "QRコードの特定のURLを[jump]に置き換えることができます。\n例えば、モニュメントや商品についているQRコードをゲーム内のイベントに置き換える事ができます。",
			"parameters": [
				{
					"name": "url",
					"required": true,
					"description": "カメラを写したときに反応させるURLを定義します。"
				},
				{
					"name": "storage",
					"required": false,
					"description": "URLが読み込まれたときに発動するジャンプ先のシナリオファイルを指定します。"
				},
				{
					"name": "target",
					"required": false,
					"description": "ジャンプ先のラベルを指定します。"
				},
				{
					"name": "clear",
					"required": false,
					"description": "trueを指定すると定義を削除できます。"
				},
				{
					"name": "cond",
					"required": false,
					"description": "JS式を記述して、その結果が真の場合のみタグが実行されます。"
				}
			],
			"sample": ""
		}
	}
}