/**
 * サーバー側で使用する拡張機能情報。
 * クライアントから initializationOptions 経由で受け取る。
 */
export class InformationExtension {
  private static instance: InformationExtension = new InformationExtension();
  private constructor() {}
  public static getInstance(): InformationExtension {
    return this.instance;
  }

  public static path: string | undefined = undefined;
  public static language: string = "ja";

  public static initialize(extensionPath: string, language: string) {
    InformationExtension.path = extensionPath;
    InformationExtension.language = language;
  }
}
