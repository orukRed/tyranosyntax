import * as vscode from 'vscode';
import * as fs from 'fs';
import { InformationWorkSpace as workspace } from './InformationWorkSpace';
import { TextDecoder } from 'util';
import { InformationProjectData as project } from './InformationProjectData';

export class TyranoDiagnostic {

	private diagnosticCollection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection('tyranoDiagnostic');

	//ティラノスクリプトに関する情報
	private readonly informationProjectData: project = project.getInstance();;

	//ファイルパス取得用
	private readonly informationWorkSpace: workspace = workspace.getInstance();

	//パーサー
	private loadModule = require('./lib/module-loader.js').loadModule;
	private parser = this.loadModule(__dirname + '/lib/tyrano_parser.js');
	private readonly JUMP_TAG = ["jump", "call", "link", "button", "glink", "clickable"];

	private tyranoDefaultTag: string[] = this.informationProjectData.getDefaultTag();

	constructor() {
	}


	public async createDiagnostics() {

		let variables = new Map<string, any>();//プロジェクトで定義された変数を格納<variableName,value>
		const dataFiles = this.informationWorkSpace.getProjectFiles(this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY);
		const scenarioFiles = this.informationWorkSpace.getProjectFiles(this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY + this.informationWorkSpace.DATA_SCENARIO);
		let diagnosticArray: any[] = [];//診断結果を一時的に保存する配列

		//シナリオからマクロ定義を読み込む  jsで定義されたタグ以外は問題なさそう
		let tyranoTag = await this.loadDefinedMacroByScenarios(this.tyranoDefaultTag.slice(), dataFiles);
		//シナリオ名とラベルを読み込む <scenarioName, labels>
		// let scenarioAndLabels = await this.loadDefinedScenarioAndLabels(scenarioFiles);

		//未定義のマクロを使用しているか検出
		await this.detectionNotDefineMacro(tyranoTag, dataFiles, diagnosticArray);
		//存在しないシナリオファイル、未定義のラベルを検出
		// await this.detectionNotExistScenarioAndLabels(scenarioAndLabels, scenarioFiles, diagnosticArray);


		// ラベル関係は、以下のアルゴリズムのが良さそう？
		/**
		 * 1.シナリオを順番に読み込む
		 * 2.シナリオでジャンプ系タグが来るたびに、storageがあるならstorageがプロジェクト内に存在するか確かめる。（storageに相対パスを指定する場合、カレントディレクトリはそのscenarioフォルダ）
		 * 2.5.storageがなければ現在開いているファイルをstorageとする
		 * 3.storageのファイルを構文解析にかけて目的のラベルがあるかを調べる。ないならdiagに入れる。
		 */

		//診断結果をセット
		this.diagnosticCollection.set(diagnosticArray);
	}




	/**
	 * シナリオで定義されているタグを返却します。
	 * @param 現在定義されているティラノスクリプトのタグのリスト
	 * @return ティラノ公式タグ+読み込んだ定義済みマクロの名前の配列
	 */
	private async loadDefinedMacroByScenarios(tyranoTag: string[], dataFiles: string[]): Promise<string[]> {

		for (const scenario of dataFiles) {
			if (!scenario.endsWith(".ks")) {
				continue;
			}
			const scenarioFileAbsolutePath = this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY + "/" + scenario;//dataファイルにあるシナリオの絶対パス取得

			const scenarioDocument = await vscode.workspace.openTextDocument(scenarioFileAbsolutePath);//引数のパスのシナリオ全文取得
			// let parsedData: object
			// try {
			// 	parsedData = this.parser.tyranoParser.parseScenario(scenarioDocument.getText()); //構文解析				
			// } catch (error) {
			// 	console.log(error);
			// 	parsedData = {};
			// }
			const parsedData: object = this.parser.tyranoParser.parseScenario((await scenarioDocument).getText()); //構文解析
			const array_s = parsedData["array_s"];
			for (let data in array_s) {
				//タグがマクロなら
				if (array_s[data]["name"] === "macro") {
					//マクロの名前をリストかなんかに保存しておく。
					tyranoTag.push(await array_s[data]["pm"]["name"]);
				}
			}
		}
		return tyranoTag;
	}

	/**
	 * 未定義のマクロを使用しているか検出します。
	 * @param tyranoTag 現在プロジェクトに定義しているティラノスクリプトのタグ
	 */
	private async detectionNotDefineMacro(tyranoTag: string[], dataFiles: string[], diagnosticArray: any[]) {
		for (const scenario of dataFiles) {
			if (!scenario.endsWith(".ks")) {
				continue;
			}
			const scenarioFileAbsolutePath = this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY + "/" + scenario; //dataファイルにあるシナリオの絶対パス取得
			const scenarioDocument = await vscode.workspace.openTextDocument(scenarioFileAbsolutePath);//引数のパスのシナリオ全文取得
			const parsedData: object = this.parser.tyranoParser.parseScenario(scenarioDocument.getText()); //構文解析
			const array_s = parsedData["array_s"];

			let diagnostics: vscode.Diagnostic[] = [];
			for (let data in array_s) {
				//タグが定義されていない場合
				if (!tyranoTag.includes(array_s[data]["name"])) {

					let tagFirstIndex = scenarioDocument.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["name"]);	// 該当行からタグの定義場所(開始位置)探す
					let tagLastIndex = scenarioDocument.lineAt(array_s[data]["line"]).text.lastIndexOf(array_s[data]["name"]);	// 該当行からタグの定義場所(終了位置)探す

					let range = new vscode.Range(array_s[data]["line"], tagFirstIndex, array_s[data]["line"], tagLastIndex);
					let diag = new vscode.Diagnostic(range, "タグ" + array_s[data]["name"] + "は未定義です。", vscode.DiagnosticSeverity.Error);
					diagnostics.push(diag);

				}
			}
			diagnosticArray.push([scenarioDocument.uri, diagnostics]);
		}
	}

	/**
	 * ファイルにあるシナリオと、シナリオ内で定義されたラベルを取得します。
	 * @returns 
	 */
	private async loadDefinedScenarioAndLabels(dataFiles: string[]): Promise<Map<string, string[]>> {

		let scenarioAndLabels = new Map<string, string[]>();


		for (const scenario of dataFiles) {
			if (!scenario.endsWith(".ks")) {
				continue;
			}
			const scenarioFileAbsolutePath = this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY + this.informationWorkSpace.DATA_SCENARIO + "/" + scenario; //scenarioファイルにあるシナリオの絶対パス取得

			const scenarioDocument = await vscode.workspace.openTextDocument(scenarioFileAbsolutePath);//引数のパスのシナリオ全文取得
			const parsedData: object = this.parser.tyranoParser.parseScenario(scenarioDocument.getText()); //構文解析
			const array_s = parsedData["array_s"];
			let labels = []
			for (let data in array_s) {
				//ラベルなら
				if (array_s[data]["name"] === "label") {
					labels.push("*" + array_s[data]["pm"]["label_name"]);
					labels.push(array_s[data]["pm"]["label_name"]);
				}
			}
			//シナリオ名とラベルを保存
			scenarioAndLabels.set(scenario, labels);
		}

		return scenarioAndLabels
	}

	/**
	 * jump系タグで使われているシナリオファイルとラベルが存在するor定義されたものであるか診断します。
	 * @param scenarioAndLabels 
	 * @param scenarioFiles 
	 */
	private async detectionNotExistScenarioAndLabels(scenarioAndLabels: Map<string, string[]>, dataFiles: string[], diagnosticArray: any[]) {

		for (const scenario of dataFiles) {
			if (!scenario.endsWith(".ks")) {
				continue;
			}
			const scenarioFileAbsolutePath = this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY + this.informationWorkSpace.DATA_SCENARIO + "/" + scenario; //scenarioファイルにあるシナリオの絶対パス取得
			const scenarioDocument = await vscode.workspace.openTextDocument(scenarioFileAbsolutePath);//引数のパスのシナリオ全文取得
			// const scenarioDocument = this.getScenarioDocument(scenarioFileAbsolutePath); //引数のパスのシナリオ全文取得
			const parsedData: object = this.parser.tyranoParser.parseScenario(scenarioDocument.getText()); //構文解析
			const array_s = parsedData["array_s"];

			let diagnostics: vscode.Diagnostic[] = [];
			for (let data in array_s) {

				//ジャンプ系タグなら
				if (this.JUMP_TAG.includes(array_s[data]["name"])) {

					// [...hoge]でスプレッド構文 Array.prototype.concat()相当のことが簡潔書ける
					// storageがundefinedでない && storageの値が変数でない && storageで指定した値がscenarioAndLabelsのkeyに存在している（シナリオ中に存在するシナリオファイルである）
					if (await array_s[data]["pm"]["storage"] !== undefined && !this.isValueIsVariable(array_s[data]["pm"]["storage"]) && ![...scenarioAndLabels.keys()]?.includes(array_s[data]["pm"]["storage"])) {

						let tagFirstIndex: number = scenarioDocument.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["pm"]["storage"]);	// 該当行からタグの定義場所(開始位置)探す
						let tagLastIndex: number = scenarioDocument.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["pm"]["storage"]) + array_s[data]["pm"]["storage"].length;	// 該当行からタグの定義場所(終了位置)探す
						let range = new vscode.Range(array_s[data]["line"], tagFirstIndex, array_s[data]["line"], tagLastIndex);
						if (!array_s[data]["pm"]["storage"].endsWith(".ks")) {
							let diag = new vscode.Diagnostic(range, "storageパラメータは末尾が'.ks'である必要があります。", vscode.DiagnosticSeverity.Error);
							diagnostics.push(diag);
						} else {
							let diag = new vscode.Diagnostic(range, array_s[data]["pm"]["storage"] + "は存在しないファイルです。", vscode.DiagnosticSeverity.Error);
							diagnostics.push(diag);
						}
					}

					//targeteがundefinedでない && targetが変数である && アンパサンドがないなら
					//おそらくパラメータに変数使うやつまとめて全部検出できる。全てのパラメータ文字列を配列に入れて、forで回しして、とかで。
					if (await array_s[data]["pm"]["storage"] !== undefined && this.isValueIsVariable(array_s[data]["pm"]["storage"]) && !this.isExistAmpersandAtBeginning(array_s[data]["pm"]["storage"])) {
						let tagFirstIndex: number = scenarioDocument.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["pm"]["storage"]);	// 該当行からタグの定義場所(開始位置)探す
						let tagLastIndex: number = scenarioDocument.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["pm"]["storage"]) + array_s[data]["pm"]["storage"].length;	// 該当行からタグの定義場所(終了位置)探す
						let range = new vscode.Range(array_s[data]["line"], tagFirstIndex, array_s[data]["line"], tagLastIndex);
						let diag = new vscode.Diagnostic(range, "パラメータに変数を使う場合は先頭に'&'が必要です。", vscode.DiagnosticSeverity.Error);
						diagnostics.push(diag);
					}


					//こっからtargetパラメータ---------------------------

					//storageが指定されてないなら現在開いているファイルとする
					if (array_s[data]["pm"]["storage"] === undefined) {
						array_s[data]["pm"]["storage"] = scenario;
					}

					//targetがundefinedでない && targetの値が変数でない && targetで指定したラベルがstorageで指定したファイルの中に存在していない 
					if (await array_s[data]["pm"]["target"] !== undefined && !this.isValueIsVariable(array_s[data]["pm"]["target"]) && !scenarioAndLabels.get(array_s[data]["pm"]["storage"])?.includes(array_s[data]["pm"]["target"])) {
						let tagFirstIndex: number = scenarioDocument.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["pm"]["target"]);	// 該当行からタグの定義場所(開始位置)探す
						let tagLastIndex: number = scenarioDocument.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["pm"]["target"]) + array_s[data]["pm"]["target"].length;	// 該当行からタグの定義場所(終了位置)探す
						let range = new vscode.Range(array_s[data]["line"], tagFirstIndex, array_s[data]["line"], tagLastIndex);
						let diag = new vscode.Diagnostic(range, array_s[data]["pm"]["storage"] + "にラベル" + array_s[data]["pm"]["target"] + "は存在していません。", vscode.DiagnosticSeverity.Error);
						diagnostics.push(diag);
					}

					//targeteがundefinedでない && targetが変数である && アンパサンドがないなら	
					if (await array_s[data]["pm"]["target"] !== undefined && this.isValueIsVariable(array_s[data]["pm"]["target"]) && !this.isExistAmpersandAtBeginning(array_s[data]["pm"]["target"])) {
						let tagFirstIndex: number = scenarioDocument.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["pm"]["target"]);	// 該当行からタグの定義場所(開始位置)探す
						let tagLastIndex: number = scenarioDocument.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["pm"]["target"]) + array_s[data]["pm"]["target"].length;	// 該当行からタグの定義場所(終了位置)探す
						let range = new vscode.Range(array_s[data]["line"], tagFirstIndex, array_s[data]["line"], tagLastIndex);
						let diag = new vscode.Diagnostic(range, "変数を使う場合は先頭に'&'が必要です。", vscode.DiagnosticSeverity.Error);
						diagnostics.push(diag);
					}

				}
			}
			diagnosticArray.push([scenarioDocument.uri, diagnostics]);
		}
	}

	/**
	 * 引数に入れた値の先頭に&記号があるかを判断します。
	 * @returns trueなら&がある、 falseなら&がない
	 */
	private isExistAmpersandAtBeginning(value: string): boolean {
		return value.indexOf("&") === 0 ? true : false;
	}

	/**
	 * 引数に入れた値が変数であるかどうかを判断します。
	 * @returns trueなら値は変数 falseなら値は変数でない
	 */
	private isValueIsVariable(value: string): boolean {
		//条件を「0<=value<=1」にすることで&f.hogeとf.hogeの両方を抽出
		if ((0 <= value.indexOf("f.") && value.indexOf("f.") <= 1) ||
			(0 <= value.indexOf("sf.") && value.indexOf("sf.") <= 1) ||
			(0 <= value.indexOf("tf.") && value.indexOf("tf.") <= 1)) {
			return true;
		}
		return false;
	}

	/**
	 * 未定義のマクロを使用しているか検出します。(時系列考慮バージョン)
	 * 引数で入れた値から、jump,callなどのタグを再帰的に呼び出し診断します。
	 * @param scenarioFile 診断するファイル。呼び出し時にはエントリポイント（指定したスクリプトファイルから診断開始）
	 * @param scenarioFileLabel シナリオファイルのラベル名。指定しない場合ファイルの最初から読み込む
	 */
	private async __detectionNotDefineMacro(scenarioFile: string, scenarioFileLabel: string | undefined = "") {
		{
			// let diagnostics: vscode.Diagnostic[] = [];

			//first.ksから順番にファイルを読み込んでいく処理
			//流れとしては以下で実装可能なはず
			// first.ksからjump,call,link,button,glink,clickableタグのある先へどんどん飛んでいく。
			// このとき、呼び出し順序もリストかなんかに保存しておくと後々なにかに使えそう。（jumpによる無限ループは避ける、とか。)
			// ファイルごとに全て処理をパーサーに与える
			// 各linterで必要な処理を実装
			// ※以下の処理は検出しないこと
			// ユーザー入力による変数の値の変更
			//	iscriptタグに埋め込まれた処理

			//if,elseif,else,iscript,htmlで定義された中身はスキップする(終了タグがあるまでifで分岐して処理させない)
			//array_s[data]["pm"]["cond"]がある場合はスキップする
			//ティラノスクリプトのタグ
			//初期値は公式で提供されているもの

		}
		let tyranoTag: string[] = this.tyranoDefaultTag.slice();//公式タグの定義
		const scenarioFileAbsolutePath = this.informationWorkSpace.getProjectRootPath() + this.informationWorkSpace.DATA_DIRECTORY + this.informationWorkSpace.DATA_SCENARIO + "/" + scenarioFile;//シナリオファイルの絶対パス取得
		const scenarioDocument = await vscode.workspace.openTextDocument(scenarioFileAbsolutePath);//引数のパスのシナリオ全文取得
		// const scenarioDocument = await this.getScenarioDocument(scenarioFileAbsolutePath);		//引数のパスのシナリオ全文取得
		const parsedData: object = this.parser.tyranoParser.parseScenario(scenarioDocument.getText());	//構文解析



		const array_s = parsedData["array_s"];

		let diagnostics: vscode.Diagnostic[] = [];
		let isLabelStart = false;//引数で指定したラベルにたどり着いたかどうか
		for (let data in array_s) {



			//一度ラベルにたどり着いてるなら二度とfalseにしない(ティラノの仕様としてスクリプト読み込み中にラベルに到達した場合jumpタグがなくてもそのラベルに移動するため。)
			// if (!isLabelStart) {
			// 	isLabelStart = await this.checkLoadingScriptIsDefinedLabel(scenarioFileLabel, array_s[data]["pm"]["label_name"]);
			// 	//ジャンプタグで指定したtargetに到達していないならcontinue
			// 	if (!isLabelStart) {
			// 		continue;
			// 	}
			// }




			//タグが定義済みのもの場合 ここらへんの処理を関数ワケできそう？
			if (!tyranoTag.includes(array_s[data]["name"])) {



				let tagFirstIndex = scenarioDocument.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["name"]);	// 該当行からタグの定義場所(開始位置)探す
				let tagLastIndex = scenarioDocument.lineAt(array_s[data]["line"]).text.lastIndexOf(array_s[data]["name"]);	// 該当行からタグの定義場所(終了位置)探す

				let range = new vscode.Range(array_s[data]["line"], tagFirstIndex, array_s[data]["line"], tagLastIndex);
				let diag = new vscode.Diagnostic(range, "タグ" + array_s[data]["name"] + "は未定義の可能性があります。", vscode.DiagnosticSeverity.Warning);
				diagnostics.push(diag);

			} else {
				//タグがマクロなら
				if (array_s[data]["name"] === "macro") {
					//マクロの名前をリストかなんかに保存しておく。
					tyranoTag.push(array_s[data]["pm"]["name"]);
				}
				//タグがジャンプ系のタグなら
				if (this.JUMP_TAG.includes(array_s[data]["name"])) {
					//ファイル名とターゲット名をjsonとかリストかなんかに保存
					//同じファイルかつ同じターゲットには二度と入らないようにする
					//hoge.push({"scenario":"foo.ks","label":"*bar"},)

					let nextScenarioFile: string = (array_s[data]["pm"]["storage"] === undefined ? scenarioFile : array_s[data]["pm"]["storage"]);

					//再帰関数で同じ関数を呼び出す
					this.__detectionNotDefineMacro(nextScenarioFile, array_s[data]["pm"]["target"]);

				}
			}

		}
		this.diagnosticCollection.set(scenarioDocument.uri, diagnostics);
	}



	/**
	 * 読み込んだスクリプトの現在位置がラベルで定義済みかを判断します。
	 * @param scenarioFileLabel  ジャンプ系タグで指定されたtargetの値
	 * @param loadingScriptLabel 現在読み込んでいるシナリオの現在のラベル
	 * @returns 
	 */
	private async checkLoadingScriptIsDefinedLabel(scenarioFileLabel: string, loadingScriptLabel: string): Promise<boolean> {
		//ターゲットが未指定、もしくはターゲットとラベルが一致する
		if (scenarioFileLabel === undefined || scenarioFileLabel === "" || loadingScriptLabel === scenarioFileLabel) {
			return true;
		}
		return false;
	}
}

