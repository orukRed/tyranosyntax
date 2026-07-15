import * as vscode from "vscode";
import { TyranoCompletionItemProvider } from "./TyranoCompletionItemProvider";
import {
  AUTO_COMPLETION_SETTING,
  getCompletionTriggerCharacters,
} from "./TyranoCompletionTrigger";

const TYRANO_MODE: vscode.DocumentSelector = {
  scheme: "file",
  language: "tyrano",
};

/**
 * 補完プロバイダーを登録し、自動補完設定の変更時にトリガー文字を更新する。
 */
export function registerTyranoCompletionItemProvider(): vscode.Disposable {
  let providerRegistration: vscode.Disposable | undefined;

  const registerProvider = () => {
    providerRegistration?.dispose();

    const autoTriggerEnabled = vscode.workspace
      .getConfiguration()
      .get<boolean>(AUTO_COMPLETION_SETTING, true);
    providerRegistration = vscode.languages.registerCompletionItemProvider(
      TYRANO_MODE,
      new TyranoCompletionItemProvider(),
      ...getCompletionTriggerCharacters(autoTriggerEnabled),
    );
  };

  registerProvider();
  const configurationRegistration = vscode.workspace.onDidChangeConfiguration(
    (event) => {
      if (event.affectsConfiguration(AUTO_COMPLETION_SETTING)) {
        registerProvider();
      }
    },
  );

  return {
    dispose: () => {
      configurationRegistration.dispose();
      providerRegistration?.dispose();
    },
  };
}
