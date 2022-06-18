import * as vscode from 'vscode';
import * as fs from 'fs';
import { InformationWorkSpace as workspace } from './InformationWorkSpace';
import { TextDecoder } from 'util';
import { InformationProjectData as project } from './InformationProjectData';
import { TyranoLogger } from './TyranoLogger';
import { exit } from 'process';
import { format } from 'path';



export class TyranoDiagnostic {

	private diagnosticCollection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection('tyranoDiagnostic');

	//ティラノスクリプトに関する情報
	private readonly infoPd: project = project.getInstance();;

	//ファイルパス取得用
	private readonly infoWs: workspace = workspace.getInstance();

	//ティラノスクリプトのプロジェクトのルートパス
	private readonly tyranoProjectPaths: string[] = this.infoWs.getTyranoScriptProjectRootPaths();

	//パーサー
	private loadModule = require('./lib/module-loader.js').loadModule;
	private parser = this.loadModule(__dirname + '/lib/tyrano_parser.js');
	private readonly JUMP_TAG = ["jump", "call", "link", "button", "glink", "clickable"];

	private tyranoDefaultTag: string[] = this.infoPd.getDefaultTag();


	constructor() {
		this.tyranoProjectPaths.forEach(element => {
			TyranoLogger.print(element + "をプロジェクトとして読み込みました。");
		});
		this.hoge();

	}

	public async hoge() {
		console.log("ティラノの構文解析器がJSファイルに使えるかどうかのテスト");

		const scenarioDocument = await vscode.workspace.openTextDocument(`ここにURL`);//引数のパスのシナリオ全文取得

		//ティラノのパーサーにかける
		{
			// console.log("tyrano");
			// const parsedData: object = this.parser.tyranoParser.parseScenario(scenarioDocument.getText()); //構文解析
			// const array_s = parsedData["array_s"];
			// console.log(array_s);
		}


		//jsのパーサーにかける
		{
			//acorn-loose
			console.log("acorn-loose");
			var acornLoose = require("acorn-loose");
			const parsedData: object = acornLoose.parse(scenarioDocument.getText()); //構文解析
			const parsedData_body = parsedData["body"];
			// console.log(parsedData_body);
			const searchWord = "/^\s*TYRANO.kag.ftag.master_tag./" //行頭に「TYRANO.kag.ftag.master_tag.」が来てるなら

			var estraverse = require("estraverse");
			estraverse.traverse(parsedData, {
				// enter: function (node: { type: string; }, parent: any) {
				// 	console.log(node);
				// 	if (node.type == 'FunctionExpression' || node.type == 'FunctionDeclaration')
				// 		return estraverse.VisitorOption.Skip;
				// },
				enter: function (node: any, parent: any) {
					console.log(parent);
					if (node.type === 'CallExpression' && node.callee.name === 'eval' && node.arguments[0].type === 'Literal') {
						// node = esprima.parse(node.arguments[0].value).body[0];
						parent.init = node.expression;
						console.log(parent);
					}
				},
				leave: function (node: { type: string; id: { name: any; }; }, parent: any) {
					if (node.type == 'VariableDeclarator')
						console.log(node.id.name);
				}

			});
			// for (let data in )
			// for (let data in array_s) {
			// 	//タグがマクロなら
			// 	if (array_s[data]["name"] === "macro") {
			// 		//マクロの名前をリストかなんかに保存しておく。
			// 		tyranoTag.push(await array_s[data]["pm"]["name"]);
			// 	}
			// }

		}

	}

	public async createDiagnostics() {

		// let variables = new Map<string, any>();//プロジェクトで定義された変数を格納<variableName,value>

		let diagnosticArray: any[] = [];//診断結果を一時的に保存する配列
		for (let path of this.tyranoProjectPaths) {
			const absoluteScenarioFiles = this.infoWs.getProjectFiles(path + this.infoWs.DATA_DIRECTORY, [".ks"], true);
			// const absoluteScenarioJavaScriptFiles = this.infoWs.getProjectFiles(path + this.infoWs.DATA_DIRECTORY, [".js"], true);
			//シナリオからマクロ定義を読み込む  jsで定義されたタグ以外は問題なさそう
			let tyranoTag = await this.loadDefinedMacroByScenarios(this.tyranoDefaultTag.slice(), absoluteScenarioFiles);



			//未定義のマクロを使用しているか検出
			await this.detectionNotDefineMacro(tyranoTag, absoluteScenarioFiles, diagnosticArray);

			//存在しないシナリオファイル、未定義のラベルを検出
			await this.detectionNotExistScenarioAndLabels(absoluteScenarioFiles, diagnosticArray, path);
		}






		// let variables = new Map<string, any>();//プロジェクトで定義された変数を格納<variableName,value>
		// const absoluteScenarioFiles = this.infoWs.getProjectFiles(this.infoWs.getWorkspaceRootPath() + this.infoWs.DATA_DIRECTORY, [".ks"], true);
		// let diagnosticArray: any[] = [];//診断結果を一時的に保存する配列
		// //シナリオからマクロ定義を読み込む  jsで定義されたタグ以外は問題なさそう
		// // let tyranoTag = await this.loadDefinedMacroByScenarios(this.tyranoDefaultTag.slice(), absoluteScenarioFiles);
		// //未定義のマクロを使用しているか検出
		// // await this.detectionNotDefineMacro(tyranoTag, absoluteScenarioFiles, diagnosticArray);

		// //存在しないシナリオファイル、未定義のラベルを検出
		// await this.detectionNotExistScenarioAndLabels(absoluteScenarioFiles, diagnosticArray);





		//診断結果をセット
		this.diagnosticCollection.set(diagnosticArray);

	}




	/**
	 * シナリオで定義されているタグを返却します。
	 * @param 現在定義されているティラノスクリプトのタグのリスト
	 * @return ティラノ公式タグ+読み込んだ定義済みマクロの名前の配列
	 */
	private async loadDefinedMacroByScenarios(tyranoTag: string[], absoluteScenarioFilePaths: string[]): Promise<string[]> {

		for (const scenario of absoluteScenarioFilePaths) {
			// const scenarioFileAbsolutePath = this.infoWs.getProjectRootPath() + this.infoWs.DATA_DIRECTORY + "/" + scenario;//dataファイルにあるシナリオの絶対パス取得
			const scenarioDocument = await vscode.workspace.openTextDocument(scenario);//引数のパスのシナリオ全文取得
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
	private async detectionNotDefineMacro(tyranoTag: string[], scenarioFiles: string[], diagnosticArray: any[]) {
		for (const scenario of scenarioFiles) {
			// const scenarioFileAbsolutePath = this.infoWs.getProjectRootPath() + this.infoWs.DATA_DIRECTORY + "/" + scenario; //dataファイルにあるシナリオの絶対パス取得
			const scenarioDocument = await vscode.workspace.openTextDocument(scenario);//引数のパスのシナリオ全文取得
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
	 * jump系タグで指定したstorageやtargetに付いての診断を行います。
	 * @param scenarioFiles 診断するシナリオファイルの絶対パスのリスト
	 * @param diagnosticArray 参照渡しで更新する診断結果
	 * @param projectPath 診断するプロジェクトの絶対パス
	 */
	private async detectionNotExistScenarioAndLabels(scenarioFiles: string[], diagnosticArray: any[], projectPath: string) {
		for (const scenario of scenarioFiles) {


			const scenarioDocument = await vscode.workspace.openTextDocument(scenario);//引数のパスのシナリオ全文取得
			const parsedData: object = this.parser.tyranoParser.parseScenario(scenarioDocument.getText()); //構文解析
			const array_s = parsedData["array_s"];
			let diagnostics: vscode.Diagnostic[] = [];
			for (let data in array_s) {


				//storageに付いての処理(指定したファイルが有るかどうか)
				if (this.JUMP_TAG.includes(array_s[data]["name"])) {

					if (array_s[data]["pm"]["storage"] !== undefined) {
						let tagFirstIndex: number = scenarioDocument.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["pm"]["storage"]);	// 該当行からタグの定義場所(開始位置)探す
						let tagLastIndex: number = scenarioDocument.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["pm"]["storage"]) + array_s[data]["pm"]["storage"].length;	// 該当行からタグの定義場所(終了位置)探す
						let range = new vscode.Range(array_s[data]["line"], tagFirstIndex, array_s[data]["line"], tagLastIndex);

						if (this.isValueIsIncludeVariable(array_s[data]["pm"]["storage"])) {
							if (!this.isExistAmpersandAtBeginning(array_s[data]["pm"]["storage"])) {
								let diag = new vscode.Diagnostic(range, "パラメータに変数を使う場合は先頭に'&'が必要です。", vscode.DiagnosticSeverity.Error);
								diagnostics.push(diag);
								continue;
							}
						} else {
							if (!array_s[data]["pm"]["storage"].endsWith(".ks")) {
								let diag = new vscode.Diagnostic(range, "storageパラメータは末尾が'.ks'である必要があります。", vscode.DiagnosticSeverity.Error);
								diagnostics.push(diag);
								continue;
							}

							if (!fs.existsSync(projectPath + this.infoWs.DATA_DIRECTORY + this.infoWs.DATA_SCENARIO + "/" + array_s[data]["pm"]["storage"])) {
								let diag = new vscode.Diagnostic(range, array_s[data]["pm"]["storage"] + "は存在しないファイルです。", vscode.DiagnosticSeverity.Error);
								diagnostics.push(diag);
								continue;
							}
						}
					}

					// targetについての処理
					if (array_s[data]["pm"]["target"] !== undefined) {
						let tagFirstIndex: number = scenarioDocument.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["pm"]["target"]);	// 該当行からタグの定義場所(開始位置)探す
						let tagLastIndex: number = scenarioDocument.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["pm"]["target"]) + array_s[data]["pm"]["target"].length;	// 該当行からタグの定義場所(終了位置)探す
						let range = new vscode.Range(array_s[data]["line"], tagFirstIndex, array_s[data]["line"], tagLastIndex);
						if (this.isValueIsIncludeVariable(array_s[data]["pm"]["target"])) {
							if (!this.isExistAmpersandAtBeginning(array_s[data]["pm"]["target"])) {
								let diag = new vscode.Diagnostic(range, "パラメータに変数を使う場合は先頭に'&'が必要です。", vscode.DiagnosticSeverity.Error);
								diagnostics.push(diag);
								continue;
							}
						} else if (!this.isValueIsIncludeVariable(array_s[data]["pm"]["storage"])) {//targetがundefinedじゃない &&storageがundefinedじゃない && storageが変数でもない
							//targetから*を外して表記ゆれ防ぐ
							array_s[data]["pm"]["target"] = array_s[data]["pm"]["target"].replace("*", "");

							//ファイル探索して、該当のラベルがあればisLabelExsitをtrueにして操作打ち切る
							//storageが指定されてない(undefined)ならscenarioに入ってるパス（自分自身のシナリオファイル）を入れる
							//storageが指定されてるなら指定先を取得
							let storageScenarioDocument: vscode.TextDocument =
								(array_s[data]["pm"]["storage"] === undefined) ?
									await vscode.workspace.openTextDocument(scenario) :
									await vscode.workspace.openTextDocument(projectPath + this.infoWs.DATA_DIRECTORY + this.infoWs.DATA_SCENARIO + "/" + array_s[data]["pm"]["storage"]);
							const storageParsedData: object = this.parser.tyranoParser.parseScenario(storageScenarioDocument.getText()); //構文解析
							const storageArray_s = storageParsedData["array_s"];
							let isLabelExsit: boolean = false;//targetで指定したラベルが存在しているかどうか
							for (let storageData in storageArray_s) {
								if ((storageArray_s[storageData]["pm"]["label_name"] === array_s[data]["pm"]["target"])) {
									isLabelExsit = true;
									break;
								}
							}

							if (!isLabelExsit) {
								let diag = new vscode.Diagnostic(range, array_s[data]["pm"]["target"] + "は存在しないラベルです。", vscode.DiagnosticSeverity.Error);
								diagnostics.push(diag);
								continue;
							}
						}
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
	 * 引数に入れた値が変数を含むかどうかを判断します。
	 * @returns trueなら値は変数 falseなら値は変数でない
	 */
	private isValueIsIncludeVariable(value: string): boolean {
		if (value === undefined) {
			return false;
		}
		//いずれの変数ともマッチしないならvalueに変数は含まれていない
		if (value.match(/f\.[a-zA-Z_]\w*/) === null &&
			value.match(/sf\.[a-zA-Z_]\w*/) === null &&
			value.match(/tf\.[a-zA-Z_]\w*/) === null &&
			value.match(/mp\.[a-zA-Z_]\w*/) === null) {
			return false;
		}
		return true;

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

