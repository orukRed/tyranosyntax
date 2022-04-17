"use strict";
//拡張機能のエントリポイント
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const CreateTagByShortcutKey_1 = require("./CreateTagByShortcutKey");
const TagHoverProvider_1 = require("./TagHoverProvider");
const OutlineProvider_1 = require("./OutlineProvider");
const TyranoCompletionItemProvider_1 = require("./TyranoCompletionItemProvider");
const kstg = require("kstg"); //kstgのインストール https://github.com/komsomolskinari/kstg
const TYRANO_MODE = { scheme: 'file', language: 'tyrano' };
function activate(context) {
    //登録処理
    //サブスクリプションを登録することで、拡張機能がアンロードされたときにコマンドを解除してくれる
    context.subscriptions.push(vscode.languages.registerHoverProvider(TYRANO_MODE, new TagHoverProvider_1.TagHoverProvider()));
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(TYRANO_MODE, new OutlineProvider_1.OutlineProvider()));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(TYRANO_MODE, new TyranoCompletionItemProvider_1.TyranoCompletionItemProvider()));
    //ショートカットコマンドの登録
    let ctbs = new CreateTagByShortcutKey_1.CreateTagByShortcutKey();
    context.subscriptions.push(vscode.commands.registerCommand('tyrano.shiftEnter', ctbs.KeyPushShiftEnter));
    context.subscriptions.push(vscode.commands.registerCommand('tyrano.ctrlEnter', ctbs.KeyPushCtrlEnter));
    context.subscriptions.push(vscode.commands.registerCommand('tyrano.altEnter', ctbs.KeyPushAltEnter));
    //パス機能呼び出しテスト
    // 	let hoge = kstg.parse(`
    // *start
    // [cm  ]
    // [hoge param="val1"]
    // [clearfix]
    // [start_keyconfig]
    // [bg storage="room.jpg" time="100" cond=f.a=1 ]
    // `);
    // console.log(hoge);
    // //診断機能の登録
    // const tyranoDiagnostic = new TyranoDiagnostic();
    // //ファイルに変更を加えたタイミング、もしくはテキストエディタに変更を加えたタイミングでイベント呼び出すようにする
    // context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e =>tyranoDiagnostic.createDiagnostics(e.document, tyranoDiagnostic.collection)));
    // context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(e=>{
    // 	if(vscode.window.activeTextEditor&&e){
    // 		tyranoDiagnostic.createDiagnostics(vscode.window.activeTextEditor.document, tyranoDiagnostic.collection);
    // 	}
    // }));
    //ワークスペースに変更がかかった時。CompletionItemの実装に使えそう。
    //context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(TYRANO_MODE, new Hoge()));
}
exports.activate = activate;
function deactivate() {
    return undefined;
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map