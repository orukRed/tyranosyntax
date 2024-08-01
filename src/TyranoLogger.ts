import * as vscode from "vscode";

export class ErrorLevel {
  public static readonly DEBUG = "DEBUG";
  public static readonly INFO = "INFO";
  public static readonly WARN = "WARN";
  public static readonly ERROR = "ERROR";
  public static readonly FATAL = "FATAL";
}

/**
 * staticクラス。
 * ログ出力用のクラス。
 * ログは出力ウィンドウのウィンドウで出力されるため、try-catchでこれを出力するのはNG
 */
export class TyranoLogger {
  private static channel = vscode.window.createOutputChannel(
    "TyranoScript syntax",
  );

  private constructor() {}
  /**
   *  ログ出力
   * @param text  出力する文字列
   * @param errorLevel  出力するエラーレベル ErrorLevelを使用
   */
  public static print(text: string, errorLevel: ErrorLevel = ErrorLevel.DEBUG) {
    const currentTime = new Date();
    TyranoLogger.channel.appendLine(
      `[${currentTime.toLocaleString()}:${currentTime.getMilliseconds()}] [${errorLevel}]  ${text}`,
    );
  }

  /**
   * Exceptionで受け取った値を入れます。引数で与えられた型がError型の場合、スタックトレースを出力します。
   * @param e Exceptionで受け取った値
   */
  public static printStackTrace(e: Error | unknown) {
    if (e instanceof Error) {
      const currentTime = new Date();
      TyranoLogger.channel.appendLine(
        `[${currentTime.toLocaleString()}:${currentTime.getMilliseconds()}] ${e.stack}`,
      );
    }
  }
}
