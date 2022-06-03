import * as vscode from 'vscode';
import * as fs from 'fs';
import { InformationWorkSpace as workspace } from './InformationWorkSpace';
import { TextDecoder } from 'util';
import { InformationProjectData as project } from './InformationProjectData';


/**
 * staticクラス。
 * ログ出力用のクラス。
 */
export class TyranoLogger {

	public static print = vscode.window.createOutputChannel("TyranoScript syntax").appendLine;

	private constructor() {
	}

}

