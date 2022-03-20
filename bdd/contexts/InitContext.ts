
import { Identificators } from './Identificators';

export default class InitContext {
  public identificator = Identificators.initContext;
  private A = 0;
  private B = 0;
  private Result = 0;

  public getA() {
    return this.A;
  }

  public setA(value: number) {
    this.A = value;
  }

  public getB() {
    return this.B;
  }

  public setB(value: number) {
    this.B = value;
  }

  public getResult() {
    return this.Result;
  }

  public setResult(value: number) {
    this.Result = value;
  }
}
