//拡張機能のエントリポイント

const vscode = require('vscode');
const fs = require('fs');
const { match } = require('assert');
const { isRegExp } = require('util');

const TYRANO_MODE = { scheme: 'file', language: 'tyrano' };

let jsonTyranoSnipet = null;


class TagHoverProvider{
	
	constructor(){
		this.jsonTyranoSnipet = JSON.parse(fs.readFileSync(__dirname+"/snippet/tyrano.snippet.json","utf8"));
		this.regExp = /((\w+))\s*((\S*)=\"?(\w*)\"?)*()/;
	}

	createMarkdownText(textValue){
		if(!textValue) return null;
		let sentence = 
`
### ${textValue["prefix"]}

${textValue["description"].join('\n\n')}
`
		let markdownText = new vscode.MarkdownString(sentence);

		return markdownText;
	}

	async provideHover(document, position, token){

		let wordRange = document.getWordRangeAtPosition(position, this.regExp);
		
		if (!wordRange) {
			
			return Promise.reject("no word here"); //指定文字がなかった時。引数で与えられた理由でPromiseオブジェクトを返却
		}
		
		let matcher = document.getText(wordRange).match(this.regExp);
		let markdownText = this.createMarkdownText(this.jsonTyranoSnipet["["+matcher[1]+"]"]);
		if(!markdownText){
			return Promise.reject("unmatched."); //指定文字がなかった時。引数で与えられた理由でPromiseオブジェクトを返却
		}
		
		return new vscode.Hover(markdownText);//解決したPromiseオブジェクトを返却。この場合、現在の文字列を返却	

	}
}


function activate(context){
	//登録処理
	//サブスクリプションを登録することで、拡張機能がアンロードされたときにコマンドを解除してくれる
	context.subscriptions.push(vscode.languages.registerHoverProvider(TYRANO_MODE, new TagHoverProvider()));
}

function deactivate(){
	return undefined;
}

//モジュールを他のプログラムで使用できるようにする
module.exports = {activate, deactivate};