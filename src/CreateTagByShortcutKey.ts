import * as vscode from 'vscode';

/**
 * 将来的に、ユーザーが任意のタグをShortcutで出力できるように
 */
export class CreateTagByShortcutKey{

	/**
	 * shift + Enterで実行されるコマンド
	 */
	KeyPushShiftEnter(): void{
		const editor = vscode.window.activeTextEditor;
		if(editor != undefined){
			let cursorPos = editor.selection.active;
			editor.edit((editbuilder)=>{
				editbuilder.insert(cursorPos, "[l][r]");
			});	
		}
	}

	/**
	 * ctrl + Enterで実行されるコマンド
	 */
	 KeyPushCtrlEnter(): void{
		const editor = vscode.window.activeTextEditor;
		if(editor != undefined){
			let cursorPos = editor.selection.active;
			editor.edit((editbuilder)=>{
				editbuilder.insert(cursorPos, "[p]");
			});			
		}
	}

	/**
	 * alt + Enterで実行されるコマンド
	 */
	 KeyPushAltEnter(): void{
		const editor = vscode.window.activeTextEditor;
		if(editor != undefined){
			let cursorPos = editor.selection.active;
			editor.edit((editbuilder)=>{
				editbuilder.insert(cursorPos, "#");
			});
		}
	}
}