"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoCreateTagByShortcutKey = void 0;
const vscode = require("vscode");
class TyranoCreateTagByShortcutKey {
    /**
     * shift + Enterで実行されるコマンド
     * @returns true:正常終了 else:異常終了
     */
    KeyPushShiftEnter() {
        const text = vscode.workspace.getConfiguration().get('TyranoScript syntax.keyboard.shift + enter');
        const editor = vscode.window.activeTextEditor;
        if (editor != undefined) {
            let cursorPos = editor.selection.active;
            if (text != undefined) {
                editor.edit((editbuilder) => {
                    editbuilder.insert(cursorPos, text);
                });
                return true;
            }
            else {
                vscode.window.showInformationMessage("CreateTagByShortcutKey KeyPushShiftEnter ERROR1!!");
            }
        }
        else {
            vscode.window.showInformationMessage("CreateTagByShortcutKey KeyPushShiftEnter ERROR2!!");
        }
        return false;
    }
    /**
     * ctrl + Enter(cmd + enter)で実行されるコマンド
     * @returns true:正常終了 else:異常終了
     */
    KeyPushCtrlEnter() {
        const text = vscode.workspace.getConfiguration().get('TyranoScript syntax.keyboard.ctrl + enter(cmd + enter)');
        const editor = vscode.window.activeTextEditor;
        if (editor != undefined) {
            let cursorPos = editor.selection.active;
            if (text != undefined) {
                editor.edit((editbuilder) => {
                    editbuilder.insert(cursorPos, text);
                });
                return true;
            }
            else {
                vscode.window.showInformationMessage("CreateTagByShortcutKey KeyPushCtrlEnter ERROR1!!");
            }
        }
        else {
            vscode.window.showInformationMessage("CreateTagByShortcutKey KeyPushCtrlEnter ERROR2!!");
        }
        return false;
    }
    /**
     * alt + Enter(option + enter)で実行されるコマンド
     * @returns true:正常終了 else:異常終了
     */
    KeyPushAltEnter() {
        const text = vscode.workspace.getConfiguration().get('TyranoScript syntax.keyboard.alt + enter(option + enter)');
        const editor = vscode.window.activeTextEditor;
        if (editor != undefined) {
            let cursorPos = editor.selection.active;
            if (text != undefined) {
                editor.edit((editbuilder) => {
                    editbuilder.insert(cursorPos, text);
                });
                return true;
            }
            else {
                vscode.window.showInformationMessage("CreateTagByShortcutKey KeyPushAltEnter ERROR1!!");
            }
        }
        else {
            vscode.window.showInformationMessage("CreateTagByShortcutKey KeyPushAltEnter ERROR2!!");
        }
        return false;
    }
}
exports.TyranoCreateTagByShortcutKey = TyranoCreateTagByShortcutKey;
//# sourceMappingURL=TyranoCreateTagByShortcutKey.js.map