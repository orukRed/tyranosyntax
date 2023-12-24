import { InformationWorkSpace } from './InformationWorkSpace';


export class InformationExtension {
  private static instance: InformationExtension = new InformationExtension();
  private constructor() { }
  public static getInstance(): InformationExtension {
    return this.instance;
  }

  private _path: string | undefined = undefined;
  public get path(): string | undefined {
    return this._path;
  }
  public set path(value: string | undefined) {
    this._path = value;
  }

}