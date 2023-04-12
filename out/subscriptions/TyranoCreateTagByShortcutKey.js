"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoCreateTagByShortcutKey = void 0;
const vscode = __importStar(require("vscode"));
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