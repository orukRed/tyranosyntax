export class InformationExtension {
  private static instance: InformationExtension = new InformationExtension();
  private constructor() {}
  public static getInstance(): InformationExtension {
    return this.instance;
  }

  public static path: string | undefined = undefined;
}

