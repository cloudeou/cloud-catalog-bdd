import { Identificators } from "./Identificators";
import { ErrorStatus } from '../../src/utils/ErrorStatus';

export default class errorContext {
  public identificator = Identificators.errorContext;
  private _error: string = "";

  public get error(): string {
    return this._error;
  }
  public set error(error: string) {
    this._error = error;
  }
}
