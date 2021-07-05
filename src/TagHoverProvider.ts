import * as vscode from 'vscode';
import * as fs from 'fs';

export class TagHoverProvider{
	private jsonTyranoSnippet:string
	private regExp:RegExp

	constructor(){
		this.jsonTyranoSnippet = JSON.parse(fs.readFileSync(__dirname+"./../snippet/tyrano.snippet.json","utf8"));
		
		//FIXME:ダブルクォーテーションで囲まないと正しくツールチップが表示されない。
		this.regExp = /(\w+)(\s*((\w*)=\"(\S*)\")*)*/;//取得した行に対しての正規表現
	}

	private createMarkdownText(textValue:string) : vscode.MarkdownString | null{
		if(!textValue) return null;
		let textCopy = textValue['description'].slice();//非同期通信では引数で受け取った配列を変更してはいけない
		let backQuoteStartIndex = textCopy.indexOf("[パラメータ]");
		textCopy.splice(backQuoteStartIndex, 0, "```tyrano");//マークダウンの作成
		textCopy.push("```");

//マークダウン崩れるのでここはインデント変えたらだめ
		let sentence = 
`
### ${textValue["prefix"]}

${textCopy.join('  \n')}
`
		let markdownText = new vscode.MarkdownString(sentence);

		return markdownText;
	}

	public async provideHover(document:vscode.TextDocument, position:vscode.Position, token:vscode.CancellationToken) : Promise<vscode.Hover> {

		let wordRange = document.getWordRangeAtPosition(position, this.regExp);
		if (!wordRange) {
			console.log("error");
			return Promise.reject("no word here"); //指定文字がなかった時。引数で与えられた理由でPromiseオブジェクトを返却
		}
		console.log(document.getText(wordRange));
		let matcher:RegExpMatchArray | null = document.getText(wordRange).match(this.regExp);
		let markdownText = null;
		if(matcher != null){
			markdownText = this.createMarkdownText(this.jsonTyranoSnippet["["+matcher[1]+"]"]);
		}
		if(!markdownText){
			return Promise.reject("unmatched."); //指定文字がなかった時。引数で与えられた理由でPromiseオブジェクトを返却
		}
		return new vscode.Hover(markdownText);//解決したPromiseオブジェクトを返却。この場合、現在の文字列を返却	
	}
}