/**
 * クライアントとサーバー間で共有するカスタムリクエスト/通知の定義
 */

// カスタムリクエストメソッド名
export const TyranoRequests = {
  /** ジャンプ先のファイルとラベルを解決する */
  ResolveJumpTarget: "tyrano/resolveJumpTarget",
  /** トランジションデータを取得する */
  GetTransitionData: "tyrano/getTransitionData",
  /** シナリオファイルリストを取得する */
  GetScenarioList: "tyrano/getScenarioList",
} as const;

// カスタム通知メソッド名
export const TyranoNotifications = {
  /** ファイルが作成/変更/削除された時の通知 */
  FileChanged: "tyrano/fileChanged",
  /** サーバー側の初期化が完了した時の通知 */
  InitializationComplete: "tyrano/initializationComplete",
} as const;

// カスタムリクエスト/通知のパラメータ型

export interface ResolveJumpTargetParams {
  uri: string;
  line: number;
  character: number;
}

export interface ResolveJumpTargetResult {
  targetUri: string;
  targetLine: number;
  targetCharacter: number;
}

export interface GetTransitionDataParams {
  scenarioFilePath: string;
}

export interface GetScenarioListResult {
  [projectName: string]: { fullPath: string; scenarioName: string }[];
}

export interface FileChangedParams {
  uri: string;
  type: "created" | "changed" | "deleted";
  fileType: "scenario" | "script" | "resource";
}

export interface InitializationCompleteParams {
  projectNames: string[];
}

/**
 * initializationOptions の型定義
 */
export interface TyranoInitializationOptions {
  extensionPath: string;
  language: string;
  workspaceRoot: string;
  isParsePluginFolder: boolean;
  resourceExtensions: object;
  pluginTags: object;
  tagParameter: { [tag: string]: { [param: string]: { type: string | string[]; path?: string; values?: string[] } } };
  outlineTags: string[];
  outlineComment: string[];
  outlineBlockComment: boolean;
  completionTagInputType: string;
  autoDiagnosticEnabled: boolean;
  executeDiagnostic: { [key: string]: boolean };
  loggerEnabled: boolean;
  tyranoBuilderEnabled: boolean;
  tyranoBuilderSkipTags: string[];
  tyranoBuilderSkipParameters: { [tag: string]: string[] };
}

/**
 * サーバーからクライアントへの設定要求
 */
export const TyranoConfigurationSections = [
  "TyranoScript syntax.tag.parameter",
  "TyranoScript syntax.outline.tag",
  "TyranoScript syntax.outline.comment",
  "TyranoScript syntax.outline.blockComment",
  "TyranoScript syntax.completionTag.inputType",
  "TyranoScript syntax.autoDiagnostic.isEnabled",
  "TyranoScript syntax.execute.diagnostic",
  "TyranoScript syntax.logger.enabled",
  "TyranoScript syntax.tyranoBuilder.enabled",
  "TyranoScript syntax.tyranoBuilder.skipTags",
  "TyranoScript syntax.tyranoBuilder.skipParameters",
  "TyranoScript syntax.resource.extension",
  "TyranoScript syntax.parser.read_plugin",
  "TyranoScript syntax.plugin.parameter",
] as const;
