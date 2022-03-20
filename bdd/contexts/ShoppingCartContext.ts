// import { btapi } from '../../../src/bt-api/btapi';
import { Identificators } from './Identificators';

export default class ShoppingCartContext {
  public identificator = Identificators.shoppingCartContext;
  private shoppingCartId: string;
  private selectedOffers: Array<string>;
  private childOfferMap = new Map();
  private promotionMap = new Map();
  private charMap: Map<string, Array<[]>>;
  private topOffer: string;
  private allOrdersStatus: Array<string>;
  private allPendingOrders: Array<string>;
  private offerList;
  private offersToAdd = new Map();
  private salesOrderId;
  private addingOffer = false;
  private addingChildOffer = false;
  private addingCharMap = false;
  private addingPromotion = false;
  private originalSalesOrderRecurrentPrice: number;
  private originalSalesOrderOneTimePrice: number;
  private SORecurrentPriceAlterationList: Array<string>;
  private SOOneTimePriceAlterationList: Array<string>;
  private existingChildOffers: Map<string, Map<string, any>>;

  public setExistingChildOffers(childOffers: Map<string, Map<string, any>>) {
    this.existingChildOffers = childOffers;
  }

  public getExistingChildOffers() {
    return this.existingChildOffers;
  }

  public getExistingChildOfferById(tloId: string, sloId: string) {
    return this.existingChildOffers.get(tloId).get(sloId);
  }

  public setSalesOrderId(salesOrderId: string) {
    this.salesOrderId = salesOrderId;
  }

  public getSalesOrderId() {
    return this.salesOrderId;
  }

  public setAddingPromotion() {
    this.addingPromotion = true;
  }

  public clearAddingPromotion() {
    this.addingPromotion = false;
  }

  public checkIfAddingPromotion() {
    return this.addingPromotion;
  }

  public setAddingOffer() {
    this.addingOffer = true;
  }

  public clearAddingOffer() {
    this.addingOffer = false;
  }

  public checkIfAddingOffer() {
    return this.addingOffer;
  }

  checkIfAddingChild() {
    return this.addingChildOffer;
  }

  public setAddingChild() {
    this.addingChildOffer = true;
  }

  public clearAddingChild() {
    this.addingChildOffer = false;
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

  public setOffersToAdd(offerList: Array<[]>, action) {
    // this.offersToAdd = offerList;
    offerList.forEach((offer) => {
      this.offersToAdd.set(String(offer), action);
    });
  }

  public resetOffersToAdd() {
    this.offersToAdd.clear();
  }

  public getOffersToAdd() {
    return this.offersToAdd;
  }

  public setAvailableOffers(offerList: Array<[]>) {
    this.offerList = offerList;
  }

  public getAvailableOffers() {
    return this.offerList;
  }

  public getShoppingCartId() {
    return this.shoppingCartId;
  }
  public setShoppingCartId(value: string) {
    this.shoppingCartId = value;
  }

  public getAllPendingOrders() {
    return this.allPendingOrders;
  }
  public setAllPendingOrders(value: Array<string>) {
    this.allPendingOrders = value;
  }

  public getAllOrdersStatus() {
    return this.allOrdersStatus;
  }
  public setAllOrdersStatus(value: Array<string>) {
    this.allOrdersStatus = value;
  }

  public getSelectedOffers() {
    return this.selectedOffers;
  }
  public setSelectedOffers(value: Array<string>) {
    this.selectedOffers = value;
  }

  public getChildOfferMap() {
    return this.childOfferMap;
  }
  public setChildOfferMap(value: Map<string, Array<string>>, action: string) {
    // this.childOfferMap = value;
    this.childOfferMap.set(value, action);
  }

  public resetChildOffers() {
    if (this.childOfferMap !== undefined || this.childOfferMap !== null) {
      this.childOfferMap.clear();
    }
  }

  public getPromotions() {
    return this.promotionMap;
  }
  public setPromotions(value: Map<string, any[]>, action: string) {
    this.promotionMap.set(value, action);
  }

  public resetPromotions() {
    if (this.promotionMap !== undefined || this.promotionMap !== null) {
      this.promotionMap.clear();
    }
  }

  public getCharMap() {
    return this.charMap;
  }

  public setCharMap(value: Map<string, any[]>) {
    this.charMap = value;
  }

  public getTopOffer() {
    return this.topOffer;
  }

  public setTopOffer(offer: string) {
    this.topOffer = offer;
  }

  public getOriginalSalesOrderRecurrentPrice() {
    return this.originalSalesOrderRecurrentPrice;
  }

  public setOriginalSalesOrderRecurrentPrice(price: number) {
    this.originalSalesOrderRecurrentPrice = price;
  }

  public getOriginalSalesOrderOneTimePrice() {
    return this.originalSalesOrderOneTimePrice;
  }

  public setOriginalSalesOrderOneTimePrice(price: number) {
    this.originalSalesOrderOneTimePrice = price;
  }

  public getSORecurrentPriceAlterationList() {
    return this.SORecurrentPriceAlterationList;
  }

  public setSORecurrentPriceAlterationList(
    SORecurrentPriceAlterationList: Array<string>,
  ) {
    this.SORecurrentPriceAlterationList = SORecurrentPriceAlterationList;
  }

  public getSOOneTimePriceAlterationList() {
    return this.SOOneTimePriceAlterationList;
  }

  public setSOOneTimePriceAlterationList(
    SOOneTimePriceAlterationList: Array<string>,
  ) {
    this.SOOneTimePriceAlterationList = SOOneTimePriceAlterationList;
  }
}
