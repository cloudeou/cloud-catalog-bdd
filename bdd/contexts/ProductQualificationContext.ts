import { Identificators } from './Identificators';
// import { btapi } from '../../../src/bt-api/btapi.js';

export default class ProductQualificationContext {
  public identificator = Identificators.productQualificationContext;
  private categoryList: any = [];
  private productOfferingId: any = '';
  private charList: any = [];
  private commitmentId: any;

  public getCategoryList() {
    return this.categoryList;
  }

  public setCommitmentId(commitmentId: any) {
    this.commitmentId = commitmentId;
  }

  public getCommitmentId() {
    return this.commitmentId;
  }

  public setCategoryList(categoryList: Array<string>) {
    this.categoryList = categoryList;
  }

  public getproductOfferingId() {
    return this.productOfferingId;
  }

  public setproductOfferingId(productOfferingId: string) {
    this.productOfferingId = productOfferingId;
  }

  public getCharList() {
    return this.charList;
  }

  public setCharList(charList: Array<string>) {
    this.charList = charList;
  }

  public reset() {
    this.categoryList = null;
    this.productOfferingId = null;
    this.charList = null;
  }
}
