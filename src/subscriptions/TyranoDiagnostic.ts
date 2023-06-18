import * as vscode from 'vscode';
import * as fs from 'fs';
import { InformationWorkSpace as workspace } from '../InformationWorkSpace';
import { TextDecoder } from 'util';
import { InformationProjectData as project } from '../InformationProjectData';
import { ErrorLevel, TyranoLogger } from '../TyranoLogger';

export class TyranoDiagnostic {

	public static diagnosticCollection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection('tyranoDiagnostic');

	//ティラノスクリプトに関する情報
	private readonly infoPd: project = project.getInstance();

	//ファイルパス取得用
	private readonly infoWs: workspace = workspace.getInstance();

	//ティラノスクリプトのプロジェクトのルートパス
	private readonly tyranoProjectPaths: string[] = this.infoWs.getTyranoScriptProjectRootPaths();

	//パーサー
	private loadModule = require('./../lib/module-loader.js').loadModule;
	private parser = this.loadModule(__dirname + '/../lib/tyrano_parser.js');
	private readonly JUMP_TAG = ["jump", "call", "link", "button", "glink", "clickable"];

	//基本タグを取得
	private tyranoDefaultTag: string[] = this.infoPd.getDefaultTag();

	private _isDiagnosing: boolean = false;
	public get isDiagnosing(): boolean {
		return this._isDiagnosing;
	}
	public set isDiagnosing(value: boolean) {
		this._isDiagnosing = value;
	}


	constructor() {
		this.tyranoProjectPaths.forEach(element => {
			TyranoLogger.print(element + "をプロジェクトとして読み込みました。");
		});
	}


	/**
	 * 
	 * @param changedTextDocumentPath 変更されたテキストドキュメント、もしくは現在のアクティブテキストエディタのパス
	 * @returns 
	 */
	public async createDiagnostics(changedTextDocumentPath: string | undefined) {

		//変更されたテキストエディタが無いなら診断しない
		if (changedTextDocumentPath === undefined) {
			return;
		}

		//ログへの変更なら診断しない
		if (changedTextDocumentPath === "extension-output-orukred-tyranosyntax.tyranosyntax-#1-TyranoScript syntax") {
			return;
		}

		const diagnosticProjectPath = await this.infoWs.getProjectPathByFilePath(changedTextDocumentPath);


		TyranoLogger.print(`diagnostic start.`);
		let diagnosticArray: any[] = [];//診断結果を一時的に保存する配列

		TyranoLogger.print(`[${diagnosticProjectPath}] parsing start.`);

		let tyranoTag: string[] = this.tyranoDefaultTag.slice();
		tyranoTag = tyranoTag.concat(Array.from(this.infoWs.defineMacroMap.get(diagnosticProjectPath)!.keys()));
		tyranoTag.push("comment");


		//未定義のマクロを使用しているか検出
		await this.detectionNotDefineMacro(tyranoTag, this.infoWs.scenarioFileMap, diagnosticArray, diagnosticProjectPath);
		TyranoLogger.print(`[${diagnosticProjectPath}] macro detection finished.`);
		//存在しないシナリオファイル、未定義のラベルを検出
		await this.detectionNotExistScenarioAndLabels(this.infoWs.scenarioFileMap, diagnosticArray, diagnosticProjectPath);
		TyranoLogger.print(`[${diagnosticProjectPath}] scenario and label detection finished.`);


		//診断結果をセット
		TyranoLogger.print(`diagnostic set`);
		TyranoDiagnostic.diagnosticCollection.set(diagnosticArray);
		TyranoLogger.print("diagnostic end");

	}

	/**
	 * 未定義のマクロを使用しているか検出します。
	 * @param tyranoTag 現在プロジェクトに定義しているティラノスクリプトのタグ
	 */
	private async detectionNotDefineMacro(tyranoTag: string[], absoluteScenarioFilePathMap: Map<string, vscode.TextDocument>, diagnosticArray: any[], projectPath: string) {
		// for (const filePath of absoluteScenarioFilePathMap.keys()) {
		for (const [filePath, scenarioDocument] of absoluteScenarioFilePathMap) {
			const projectPathOfDiagFile = await this.infoWs.getProjectPathByFilePath(scenarioDocument.fileName);
			//診断中のプロジェクトフォルダと、診断対象のファイルのプロジェクトが一致しないならcontinue
			if (projectPath !== projectPathOfDiagFile) {
				continue;
			}

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
	private async detectionNotExistScenarioAndLabels(absoluteScenarioFilePathMap: Map<string, vscode.TextDocument>, diagnosticArray: any[], projectPath: string) {
		for (const [filePath, scenarioDocument] of absoluteScenarioFilePathMap) {
			const projectPathOfDiagFile = await this.infoWs.getProjectPathByFilePath(scenarioDocument.fileName);
			//診断中のプロジェクトフォルダと、診断対象のファイルのプロジェクトが一致しないならcontinue
			if (projectPath !== projectPathOfDiagFile) {
				continue;
			}

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

							if (!fs.existsSync(projectPath + this.infoWs.DATA_DIRECTORY + this.infoWs.DATA_SCENARIO + this.infoWs.pathDelimiter + array_s[data]["pm"]["storage"])) {
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
							let storageScenarioDocument: vscode.TextDocument | undefined =
								(array_s[data]["pm"]["storage"] === undefined) ?
									scenarioDocument :
									this.infoWs.scenarioFileMap.get(this.infoWs.convertToAbsolutePathFromRelativePath(projectPath + this.infoWs.DATA_DIRECTORY + this.infoWs.DATA_SCENARIO + this.infoWs.pathDelimiter + array_s[data]["pm"]["storage"]))

							if (storageScenarioDocument === undefined) {
								let diag = new vscode.Diagnostic(range, array_s[data]["pm"]["target"] + "ファイル解析中に下線の箇所でエラーが発生しました。開発者への報告をお願いします。", vscode.DiagnosticSeverity.Error);
								diagnostics.push(diag);
								continue;
							}
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