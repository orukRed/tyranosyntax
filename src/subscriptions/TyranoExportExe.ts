import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { InformationWorkSpace } from "../InformationWorkSpace";
import { InformationExtension } from "../InformationExtension";
import { ExportExePackager } from "./exportExe/ExportExePackager";
import { TyranoLogger } from "../TyranoLogger";

/**
 * TyranoScript プロジェクトを「暗号化済み data + Electron ラッパー」の
 * Windows 用 exe として書き出すコマンド。
 *
 * 1. exe をダブルクリックするだけでゲームが起動する。
 * 2. data/ フォルダは AES 暗号化され、実行時にのみ復号される。
 */
export class TyranoExportExe {
  public static async execute(): Promise<void> {
    try {
      const infoWs = InformationWorkSpace.getInstance();
      const projectPaths = infoWs.getTyranoScriptProjectRootPaths();
      if (projectPaths.length === 0) {
        vscode.window.showErrorMessage(
          "TyranoScriptプロジェクト（index.htmlのあるフォルダ）が見つかりません。",
        );
        return;
      }

      // 1. 対象プロジェクトの選択
      let projectRoot = projectPaths[0];
      if (projectPaths.length > 1) {
        const picked = await vscode.window.showQuickPick(projectPaths, {
          placeHolder: "exe書き出しを行うプロジェクトを選択してください",
        });
        if (!picked) {
          return;
        }
        projectRoot = picked;
      }

      // 2. 書き出し形式の選択
      const targetPick = await vscode.window.showQuickPick(
        [
          {
            label: "インストーラー (NSIS)",
            description: "セットアップ形式のexe",
            value: "nsis",
          },
          {
            label: "ポータブル (単一exe)",
            description: "インストール不要の単一exe",
            value: "portable",
          },
        ],
        { placeHolder: "Windows向けの書き出し形式を選択してください" },
      );
      if (!targetPick) {
        return;
      }

      const extensionPath = InformationExtension.path;
      if (!extensionPath) {
        vscode.window.showErrorMessage(
          "拡張機能のパスを取得できませんでした。",
        );
        return;
      }

      const productName = path.basename(projectRoot) || "TyranoGame";

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "TyranoScript exe書き出し",
          cancellable: true,
        },
        async (progress, token) => {
          const packager = new ExportExePackager();
          try {
            // 前提チェック（npm の存在）
            progress.report({ message: "環境を確認中..." });
            const ok = await packager.checkPrerequisites();
            if (!ok) {
              vscode.window.showErrorMessage(
                "npm が見つかりません。Node.js / npm のインストールとネットワーク接続が必要です。",
              );
              return;
            }
            if (token.isCancellationRequested) {
              return;
            }

            // コピー + 暗号化 + テンプレート生成
            progress.report({ message: "プロジェクトをコピー・暗号化中..." });
            const { buildDir, encryptedCount } =
              await packager.prepareBuildDir({
                projectRoot,
                extensionPath,
                productName,
                winTarget: targetPick.value,
              });
            TyranoLogger.print(
              `exe書き出し: ${encryptedCount} 件を暗号化、ビルド先 ${buildDir}`,
            );
            if (token.isCancellationRequested) {
              return;
            }

            // ビルド（npm install + electron-builder）
            const exePath = await packager.build(buildDir, progress, token);
            if (token.isCancellationRequested) {
              return;
            }
            if (!exePath) {
              vscode.window.showErrorMessage(
                "exe の生成に失敗しました。出力チャンネル「TyranoScript exe書き出し」のログを確認してください。",
              );
              return;
            }

            // 3. 保存先の選択とコピー
            const saveUri = await vscode.window.showSaveDialog({
              defaultUri: vscode.Uri.file(
                path.join(
                  path.dirname(projectRoot),
                  path.basename(exePath),
                ),
              ),
              filters: { 実行ファイル: ["exe"] },
            });
            let finalPath = exePath;
            if (saveUri) {
              fs.copyFileSync(exePath, saveUri.fsPath);
              finalPath = saveUri.fsPath;
            }

            const openAction = "フォルダを開く";
            const selection = await vscode.window.showInformationMessage(
              `exe の書き出しが完了しました: ${finalPath}`,
              openAction,
            );
            if (selection === openAction) {
              vscode.commands.executeCommand(
                "revealFileInOS",
                vscode.Uri.file(finalPath),
              );
            }
          } catch (error) {
            TyranoLogger.printStackTrace(error);
            vscode.window.showErrorMessage(
              `exe 書き出し中にエラーが発生しました: ${error}`,
            );
          }
        },
      );
    } catch (error) {
      TyranoLogger.printStackTrace(error);
      vscode.window.showErrorMessage(`エラーが発生しました: ${error}`);
    }
  }
}
