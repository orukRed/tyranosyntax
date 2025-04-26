import * as vscode from "vscode";

/**
 * [r][p]タグを追加するコマンドクラス
 */
export class TyranoAddRAndPCommand {
  /**
   * 選択範囲またはファイル全体に[r][p]を挿入するコマンド
   * @returns true:正常終了 false:異常終了
   */
  public static execute(): void {
    try {
      // アクティブなエディタを取得
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("エディタが開かれていません");
        return;
      }

      // 選択範囲を取得
      const selection = editor.selection;
      const document = editor.document;
      let targetText: string;
      let targetRange: vscode.Range;

      // 選択範囲がない場合はファイル全体を対象にする
      if (selection.isEmpty) {
        targetText = document.getText();
        targetRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(targetText.length),
        );
      } else {
        targetText = document.getText(selection);
        targetRange = selection;
      }

      // 確認アラートを表示
      const target = selection.isEmpty ? "ファイル全体" : "選択範囲";
      vscode.window
        .showInformationMessage(
          `${target}に[r][p]タグを追加しますか？`,
          { modal: true }, // モーダルダイアログに変更
          "はい",
          "いいえ",
        )
        .then((answer) => {
          if (answer !== "はい") {
            return; // いいえが選択された場合は処理を中断
          }

          // ここから処理開始
          // テキストを行に分割
          const lines = targetText.split("\n");
          const processedLines = [];

          // 各行を処理
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let processedLine = line.trim(); // 行の前後の空白を削除

            // 行が空でなく、@、[、;、#,*で始まらない行のみ処理
            if (processedLine !== "" && !processedLine.match(/^([@\[;#*])/)) {
              // 1. 「次の行が空行ではない」なら文末に[r]をつける
              if (i < lines.length - 1 && lines[i + 1].trim() !== "") {
                processedLine += "[r]";
              }
              // 2. 「次の行が空行」なら文末に[p]をつける
              else if (i < lines.length - 1 && lines[i + 1].trim() === "") {
                processedLine += "[p]";
              }
              // 3. 最後の行の場合は[p]をつける
              else if (i === lines.length - 1) {
                processedLine += "[p]";
              }
            }

            processedLines.push(processedLine);
          }

          // 処理後のテキスト
          const result = processedLines.join("\n");

          // 編集を実行（選択範囲または全体を置換）
          editor
            .edit((editBuilder) => {
              editBuilder.replace(targetRange, result);
            })
            .then((success) => {
              if (success) {
                vscode.window.showInformationMessage(
                  `${target}に[r][p]タグを追加しました`,
                );
              } else {
                vscode.window.showErrorMessage("タグの追加に失敗しました");
              }
            });
        });
    } catch (error) {
      console.error("TyranoAddRAndPCommand.execute error:", error);
      vscode.window.showErrorMessage(`エラーが発生しました: ${error}`);
    }
  }
}
