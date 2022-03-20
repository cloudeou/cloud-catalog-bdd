import { Identificators } from './Identificators';

export default class ResponseContext {
  public identificator = Identificators.responseContext;
  private sqResponse: any;
  private ProductOfferingResponse: any;
  private shoppingCartResponse: any;
  private shopppingCartResonseText: any;
  private createCustomerResponse: any;
  private productQualificationResponse: any;
  private productCatalogReponse: any;
  private productInventoryResponse: any;

  public getSqResponse() {
    return this.sqResponse;
  }
  public setSqResponse(value: JSON) {
    this.sqResponse = value;
  }

  public getProductOfferingResponse() {
    return this.ProductOfferingResponse;
  }
  public setProductOfferingResponse(value: JSON) {
    this.ProductOfferingResponse = value;
  }

  public getShoppingCartResponse() {
    return this.shoppingCartResponse;
  }
  public setShoppingCartResponse(value: JSON) {
    this.shoppingCartResponse = value;
  }

  public getCreateCustomerResponse() {
    return this.createCustomerResponse;
  }
  public setCreateCustomerResponse(value: JSON) {
    this.createCustomerResponse = value;
  }

  public getshoppingCartResponseText() {
    return this.shopppingCartResonseText;
  }
  public setshopppingCartResonseText(value: string) {
    this.shopppingCartResonseText = value;
  }

  public getProductQualifcationResponse() {
    return this.productQualificationResponse;
  }
  public setProductQualificationResponse(value: JSON) {
    this.productQualificationResponse = value;
  }

  public getProductCatalogResponse() {
    return this.productCatalogReponse;
  }

  public setProductCatalogReponse(value: JSON) {
    this.productCatalogReponse = value;
  }

  public getProductInventoryResponse() {
    return this.productInventoryResponse;
  }
  public setProductInventoryResponse(value: JSON) {
    this.productInventoryResponse = value;
  }
}
