"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTagByShortcutKey = void 0;
const vscode = require("vscode");
/**
 * 将来的に、ユーザーが任意のタグをShortcutで出力できるように
 */
class CreateTagByShortcutKey {
    /**
     * shift + Enterで実行されるコマンド
     */
    KeyPushShiftEnter() {
        const editor = vscode.window.activeTextEditor;
        if (editor != undefined) {
            let cursorPos = editor.selection.active;
            editor.edit((editbuilder) => {
                editbuilder.insert(cursorPos, "[l][r]");
            });
        }
    }
    /**
     * ctrl + Enterで実行されるコマンド
     */
    KeyPushCtrlEnter() {
        const editor = vscode.window.activeTextEditor;
        if (editor != undefined) {
            let cursorPos = editor.selection.active;
            editor.edit((editbuilder) => {
                editbuilder.insert(cursorPos, "[p]");
            });
        }
    }
    /**
     * alt + Enterで実行されるコマンド
     */
    KeyPushAltEnter() {
        const editor = vscode.window.activeTextEditor;
        if (editor != undefined) {
            let cursorPos = editor.selection.active;
            editor.edit((editbuilder) => {
                editbuilder.insert(cursorPos, "#");
            });
        }
    }
}
exports.CreateTagByShortcutKey = CreateTagByShortcutKey;
//# sourceMappingURL=CreateTagByShortcutKey.js.map