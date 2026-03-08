import { Connection } from "vscode-languageserver/node";

export class ErrorLevel {
  public static readonly DEBUG = "DEBUG";
  public static readonly INFO = "INFO";
  public static readonly WARN = "WARN";
  public static readonly ERROR = "ERROR";
  public static readonly FATAL = "FATAL";
}

/**
 * LSPサーバー用ログ出力クラス。
 * connection.console を使ってクライアントの出力パネルにログを送信する。
 */
export class TyranoLogger {
  private static connection: Connection | null = null;
  private static enabled = true;

  private constructor() {}

  public static initialize(connection: Connection) {
    TyranoLogger.connection = connection;
  }

  public static setEnabled(enabled: boolean) {
    TyranoLogger.enabled = enabled;
  }

  public static print(
    text: string,
    errorLevel: ErrorLevel | string = ErrorLevel.DEBUG,
  ) {
    if (!TyranoLogger.enabled || !TyranoLogger.connection) {
      return;
    }

    const currentTime = new Date();
    const message = `[${currentTime.toLocaleString()}:${currentTime.getMilliseconds()}] [${errorLevel}]  ${text}`;

    switch (errorLevel) {
      case ErrorLevel.ERROR:
      case ErrorLevel.FATAL:
        TyranoLogger.connection.console.error(message);
        break;
      case ErrorLevel.WARN:
        TyranoLogger.connection.console.warn(message);
        break;
      default:
        TyranoLogger.connection.console.log(message);
        break;
    }
  }

  public static printStackTrace(e: Error | unknown) {
    if (!TyranoLogger.enabled || !TyranoLogger.connection) {
      return;
    }

    if (e instanceof Error) {
      const currentTime = new Date();
      TyranoLogger.connection.console.error(
        `[${currentTime.toLocaleString()}:${currentTime.getMilliseconds()}] ${e.stack}`,
      );
    }
  }
}
