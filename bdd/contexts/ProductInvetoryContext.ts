import { Identificators } from './Identificators';
// import { btapi } from './../../src/bt-api/btapi.js';

export default class ProductInventoryContext {
  public identificator = Identificators.productInventoryContext;
  private relatedParty: string = '';
  private limit: number = 0;
  private fields: string = '';
  private addingCharMap = false;

  public getLimit() {
    return this.limit;
  }

  public setLimit(limit: number) {
    this.limit = limit;
  }

  public getFields() {
    return this.fields;
  }

  public setFields(fields: string) {
    this.fields = fields;
  }

  checkIfAddingCharMap() {
    return this.addingCharMap;
  }

  public setAddingCharMap() {
    this.addingCharMap = true;
  }

  public clearAddingCharMap() {
    this.addingCharMap = false;
  }
}
