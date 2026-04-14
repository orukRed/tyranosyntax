import * as vscode from "vscode";
import { InformationWorkSpace } from "../InformationWorkSpace";

/**
 * TyranoScript デバッガーの設定プロバイダー。
 * launch.json が無い場合にデフォルト設定を提供する。
 */
export class TyranoDebugConfigProvider
  implements vscode.DebugConfigurationProvider
{
  /**
   * launch.json が無い場合に初期設定を提供
   */
  resolveDebugConfiguration(
    folder: vscode.WorkspaceFolder | undefined,
    config: vscode.DebugConfiguration,
    _token?: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.DebugConfiguration> {
    // launch.json が無い or type が未設定の場合
    if (!config.type && !config.request && !config.name) {
      config.type = "tyranoDebug";
      config.request = "launch";
      config.name = "TyranoScript Debug";
    }

    if (!config.projectRoot) {
      // TyranoScript プロジェクトのルートを自動検出
      const infoWs = InformationWorkSpace.getInstance();
      const projectPaths = infoWs.getTyranoScriptProjectRootPaths();
      if (projectPaths.length > 0) {
        config.projectRoot = projectPaths[0];
      } else if (folder) {
        config.projectRoot = folder.uri.fsPath;
      }
    }

    if (!config.scenario) {
      config.scenario = "first.ks";
    }

    return config;
  }
}
