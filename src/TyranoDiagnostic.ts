import * as vscode from 'vscode';
import * as fs from 'fs';
import { InformationWorkSpace as workspace } from './InformationWorkSpace';
import { TextDecoder } from 'util';
import { InformationProjectData as project } from './InformationProjectData';
import { TyranoLogger } from './TyranoLogger';
import { PassThrough } from 'stream';

const acornLoose = require("acorn-loose");
const estraverse = require("estraverse");

export class TyranoDiagnostic {

	public static diagnosticCollection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection('tyranoDiagnostic');

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

	//基本タグを取得
	private tyranoDefaultTag: string[] = this.infoPd.getDefaultTag();

	private isDiagnosing: boolean = false;

	constructor() {
		this.tyranoProjectPaths.forEach(element => {
			TyranoLogger.print(element + "をプロジェクトとして読み込みました。");
		});
	}


	/**
	 * 
	 * @param changedTextDocument 変更されたテキストドキュメント、もしくは現在のアクティブテキストエディタのパス
	 * @returns 
	 */
	public async createDiagnostics(changedTextDocument: vscode.TextDocument | undefined) {

		//診断実行中もしくは変更されたテキストエディタが無いなら診断しない
		if (this.isDiagnosing || changedTextDocument === undefined) {
			return;
		}

		//ログへの変更なら診断しない
		if (changedTextDocument.fileName === "extension-output-orukred-tyranosyntax.tyranosyntax-#1-TyranoScript syntax") {
			return;
		}



		//changeTextDocumentの値でresourceFileMapを更新


		//メモリに保存しているMapに対して診断開始
		this.isDiagnosing = true;





		TyranoLogger.print(`diagnostic start.`);
		let diagnosticArray: any[] = [];//診断結果を一時的に保存する配列
		for (let path of this.tyranoProjectPaths) {
			TyranoLogger.print(`[${path}] parsing start.`);
			const absoluteScenarioFilePaths = this.infoWs.getProjectFiles(path + this.infoWs.DATA_DIRECTORY, [".ks"], true);//dataディレクトリ内の.ksファイルを取得
			TyranoLogger.print(`[${path}] .ks file paths got.`);
			const absoluteJavaScriptModuleFilePaths: string[] = this.infoWs.getProjectFiles(path + this.infoWs.DATA_DIRECTORY, [".js"], true);//dataディレクトリ内の.jsファイルを取得
			TyranoLogger.print(`[${path}] .js file paths got.`);
			//シナリオからマクロ定義を読み込む  jsで定義されたタグ以外は問題なさそう
			let tyranoTag: string[] = await this.loadDefinedMacroByScenarios(this.tyranoDefaultTag.slice(), path);
			TyranoLogger.print(`[${path}] macro tag definition loaded.`);
			//プラグインで追加したタグを追加
			tyranoTag = tyranoTag.concat(await this.SearchJavaScriptForAddedTags(path));
			TyranoLogger.print(`[${path}] plugin tag definition loaded.`);
			//未定義のマクロを使用しているか検出
			await this.detectionNotDefineMacro(tyranoTag, diagnosticArray, path);
			TyranoLogger.print(`[${path}] macro detection finished.`);
			//存在しないシナリオファイル、未定義のラベルを検出
			await this.detectionNotExistScenarioAndLabels(absoluteScenarioFilePaths, diagnosticArray, path);
			TyranoLogger.print(`[${path}] scenario and label detection finished.`);
		}


		//診断結果をセット
		TyranoLogger.print(`diagnostic set`);
		TyranoDiagnostic.diagnosticCollection.set(diagnosticArray);
		TyranoLogger.print("diagnostic end");
		this.isDiagnosing = false;


	}



	/**
	 * シナリオで定義されているタグを返却します。
	 * @param 現在定義されているティラノスクリプトのタグのリスト
	 * @return ティラノ公式タグ+読み込んだ定義済みマクロの名前の配列
	 */
	private async loadDefinedMacroByScenarios(tyranoTag: string[], projectPath: string): Promise<string[]> {

		for (const scenario of vscode.workspace.textDocuments) {
			//.ks拡張子以外、もしくはプロジェクトに存在しないファイルならスキップ
			if (!scenario.uri.toString().endsWith(".ks") || !await this.isFileExistInFolder("", "")) {
				continue;
			}
			const parsedData: object = this.parser.tyranoParser.parseScenario((scenario).getText()); //構文解析
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
	private async detectionNotDefineMacro(tyranoTag: string[], diagnosticArray: any[], projectPath: string) {
		for (const scenario of vscode.workspace.textDocuments) {
			//.ks拡張子以外、もしくはプロジェクトに存在しないファイルならスキップ
			if (!scenario.uri.toString().endsWith(".ks") || !await this.isFileExistInFolder("", "")) {
				continue;
			}
			console.log("OK");
			const parsedData: object = this.parser.tyranoParser.parseScenario(scenario.getText()); //構文解析
			const array_s = parsedData["array_s"];
			let diagnostics: vscode.Diagnostic[] = [];
			for (let data in array_s) {
				//タグが定義されていない場合
				if (!tyranoTag.includes(array_s[data]["name"])) {

					let tagFirstIndex = scenario.lineAt(array_s[data]["line"]).text.indexOf(array_s[data]["name"]);	// 該当行からタグの定義場所(開始位置)探す
					let tagLastIndex = scenario.lineAt(array_s[data]["line"]).text.lastIndexOf(array_s[data]["name"]);	// 該当行からタグの定義場所(終了位置)探す

					let range = new vscode.Range(array_s[data]["line"], tagFirstIndex, array_s[data]["line"], tagLastIndex);
					let diag = new vscode.Diagnostic(range, "タグ" + array_s[data]["name"] + "は未定義です。", vscode.DiagnosticSeverity.Error);
					diagnostics.push(diag);

				}
			}
			if (diagnostics.length !== 0) {
				diagnosticArray.push([scenario.uri, diagnostics]);
			}

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
			if (diagnostics.length !== 0) {
				diagnosticArray.push([scenarioDocument.uri, diagnostics]);
			}

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


	/**
	 * 引数で渡した配列のファイルパスのjsモジュールを読み込み、タグ追加構文があれば配列にまとめて返却します。
	 * @param absoluteFilesPaths jsmoduleの絶対パスの配列
	 * @returns 
	 */
	public async SearchJavaScriptForAddedTags(projectPath: string): Promise<string[]> {

		//戻り値で返却するjsモジュールに定義されているタグ名の配列
		let returnTags: string[] = [];

		for (const scenario of vscode.workspace.textDocuments) {
			//.ks拡張子以外、もしくはプロジェクトに存在しないファイルならスキップ
			if (!scenario.uri.toString().endsWith(".js") || !await this.isFileExistInFolder("", "")) {
				console.log(`${scenario.fileName}は通さない`);
				continue;
			}
			console.log(`★★${scenario.fileName}は通す★★`);
			const parsedData: object = acornLoose.parse(scenario.getText());
			await estraverse.traverse(parsedData, {
				enter: (node: any) => {
					try {
						if (node.type === "AssignmentExpression" && node.operator === "=") {
							if (node.left.object.object.object.object.name.toUpperCase() === "TYRANO" &&
								node.left.object.object.object.property.name === "kag" &&
								node.left.object.object.property.name === "ftag" &&
								node.left.object.property.name === "master_tag") {
								returnTags.push(node.left.property.name);
							}
						}
					} catch (error) {
						//例外が発生した場合は何もしない
						//読み込み方の都合上どうしても意図せずに例外が発生することがあるため、
						//例外が発生した場合はスキップするためにcatchを使用する
					}
				}
			});
		}

		returnTags = [...new Set(returnTags)];// 重複を削除
		console.log(returnTags);
		return returnTags;

	}

	/**
 * 引数で与えたファイルが、引数で与えたフォルダの中に存在しているか再帰的に調べる。
 * @param file 
 * @param folder 
 * @returns 
 */
	private async isFileExistInFolder(file: string, folder: string): Promise<boolean> {
		// !scenario.fileName.includes(projectPath) //これはダメ
		return true;
	}
}