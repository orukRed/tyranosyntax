import * as vscode from "vscode";

export class TyranoCreateTagByShortcutKey {
  /**
   * 設定キーに対応するテキストをカーソル位置に挿入する共通処理
   * @param configKey 設定キー名
   * @param methodName メソッド名（エラーメッセージ用）
   * @returns true:正常終了 else:異常終了
   */
  private static insertTextFromConfig(
    configKey: string,
    methodName: string,
  ): boolean {
    const text: string | undefined = vscode.workspace
      .getConfiguration()
      .get(configKey);
    const editor = vscode.window.activeTextEditor;
    if (editor == undefined) {
      vscode.window.showInformationMessage(
        `CreateTagByShortcutKey ${methodName} ERROR2!!`,
      );
      return false;
    }
    const cursorPos = editor.selection.active;
    if (text == undefined) {
      vscode.window.showInformationMessage(
        `CreateTagByShortcutKey ${methodName} ERROR1!!`,
      );
      return false;
    }
    editor.edit((editbuilder) => {
      editbuilder.insert(cursorPos, text);
    });
    return true;
  }

  /**
   * shift + Enterで実行されるコマンド
   * @returns true:正常終了 else:異常終了
   */
  public static KeyPushShiftEnter(): boolean {
    return TyranoCreateTagByShortcutKey.insertTextFromConfig(
      "TyranoScript syntax.keyboard.shift + enter",
      "KeyPushShiftEnter",
    );
  }

  /**
   * ctrl + Enter(cmd + enter)で実行されるコマンド
   * @returns true:正常終了 else:異常終了
   */
  public static KeyPushCtrlEnter(): boolean {
    return TyranoCreateTagByShortcutKey.insertTextFromConfig(
      "TyranoScript syntax.keyboard.ctrl + enter(cmd + enter)",
      "KeyPushCtrlEnter",
    );
  }

  /**
   * alt + Enter(option + enter)で実行されるコマンド
   * @returns true:正常終了 else:異常終了
   */
  public static KeyPushAltEnter(): boolean {
    return TyranoCreateTagByShortcutKey.insertTextFromConfig(
      "TyranoScript syntax.keyboard.alt + enter(option + enter)",
      "KeyPushAltEnter",
    );
  }
}
