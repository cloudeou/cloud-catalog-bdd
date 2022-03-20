import { bodySamples } from './bodySamples';
import { bodyParser } from './bodyParser';
import { brconfig } from '../../br-config';
import { Common } from '../utils/commonBDD/Common';
const bodySample = new bodySamples();
export class bodyGenerator {
  selectedOffers: any[];
  deleteOffers: any[];
  childOfferMap: any;
  deleteChlidOfferMap: any;
  addPromotionMap: any;
  deletePromotionMap: any;
  charMap: any;
  customerAccountECID: any;
  customerCategory: any;
  externalLocationId: any;
  distributionChannel: any;
  type: any;
  scResponse: any;
  action: any;
  productOfferingId: any;
  charList: any;
  categoryList: any;
  envcfg: any;
  btapicfg: any;
  promoEnv: any;
  commitmentId: any;
  shoppingCartId: any;
  constructor(
    customerAccountECID,
    customerCategory?,
    distributionChannel?,
    externalLocationId?,
    scResponse?,
    selectedOffers?,
    childOfferMap?,
    charMap?,
    type?,
    promotionMap?,
    action?,
  ) {
    this.selectedOffers = [];
    this.deleteOffers = [];
    if (selectedOffers !== null && selectedOffers != undefined) {
      for (let [key, value] of selectedOffers) {
        if (String(value) === 'Add') {
          this.selectedOffers.push(String(key));
        } else if (String(value) === 'Delete') {
          this.deleteOffers.push(String(key));
        }
      }
    } else {
      this.selectedOffers = null;
      this.deleteOffers = null;
    }
    this.childOfferMap = null;
    this.deleteChlidOfferMap = null;
    if (childOfferMap !== null && childOfferMap != undefined) {
      for (let [key, value] of childOfferMap) {
        if (String(value) === 'Add') {
          this.childOfferMap = key;
        } else if (String(value) === 'Delete') {
          this.deleteChlidOfferMap = key;
        }
      }
    }

    this.addPromotionMap = null;
    this.deletePromotionMap = null;
    if (promotionMap !== null && promotionMap != undefined) {
      for (let [key, value] of promotionMap) {
        if (String(value) === 'Add') {
          this.addPromotionMap = key;
        } else if (String(value) === 'Remove') {
          this.deletePromotionMap = key;
        }
      }
    }

    this.charMap = charMap;
    this.customerAccountECID = customerAccountECID;
    this.customerCategory = customerCategory;
    this.distributionChannel = distributionChannel;
    this.externalLocationId = externalLocationId;
    this.scResponse = scResponse;
    this.type = type;
    this.action = action;

    this.envcfg = brconfig.getConfigForGivenEnv();
    this.promoEnv = brconfig.getPromotionEnv(this.envcfg);
  }

  constructProductQualification(
    customerCategory,
    distributionChannel,
    externalLocationId,
    categoryList,
    type,
    productOfferingId?,
    charList?,
    commitmentId?,
    shoppingCartId?,
  ) {
    this.productOfferingId = productOfferingId;
    this.charList = charList;
    this.categoryList = categoryList;
    this.customerCategory = customerCategory;
    this.distributionChannel = distributionChannel;
    this.externalLocationId = externalLocationId;
    this.commitmentId = commitmentId;
    this.type = type;
    this.shoppingCartId = shoppingCartId;
  }

  generateBody() {
    let body;
    switch (this.type) {
      case 'Product_Qualification':
        let charItems = this.generateCharsItem(this.charList);
        body = bodySample.getProductQualification(
          this.customerCategory,
          this.distributionChannel,
          this.externalLocationId,
          this.productOfferingId,
          this.generateCategoryItemList(this.categoryList),
          charItems,
          this.commitmentId,
          this.shoppingCartId
        );
        return body;
      default:
        let cartItems = [];
        let selectedOfferBody = this.generateSelectedOffersBody();
        let deleteOfferBody = this.generateDeleteOffersBody();
        let childOfferBody = this.generateChildOffersBody();
        let deleteChildOfferBody = this.generateChildOffersDeleteBody();
        let addPromotionBody = this.generateAddPromotionBody();
        let deletePromotionBody = this.generateDeletePromotionBody();

        let offerBody = this.generateOffersBody();
        if (selectedOfferBody != null) {
          cartItems = cartItems.concat(selectedOfferBody);
        }
        if (deleteOfferBody != null) {
          cartItems = cartItems.concat(deleteOfferBody);
        }
        if (childOfferBody !== null && childOfferBody != undefined) {
          cartItems = cartItems.concat(childOfferBody);
        }
        if (
          deleteChildOfferBody !== null &&
          deleteChildOfferBody != undefined
        ) {
          cartItems = cartItems.concat(deleteChildOfferBody);
        }
        if (
          offerBody !== null &&
          offerBody != undefined &&
          offerBody[0] != undefined &&
          offerBody.length !== 0
        ) {
          cartItems = cartItems.concat(offerBody);
        }
        if (
          (addPromotionBody !== null && addPromotionBody != undefined) ||
          (deletePromotionBody !== null && deletePromotionBody != undefined)
        ) {
          if (addPromotionBody !== null && addPromotionBody != undefined) {
            body = bodySample.getAppPromotion(
              this.externalLocationId,
              this.distributionChannel,
              this.customerCategory,
              addPromotionBody,
            );
          }
          if (
            deletePromotionBody !== null &&
            deletePromotionBody != undefined
          ) {
            if (body !== undefined && body !== 'undefined' && body !== null) {
              body.cartItem = body.cartItem.concat(deletePromotionBody);
            } else {
              body = bodySample.getAppPromotion(
                this.externalLocationId,
                this.distributionChannel,
                this.customerCategory,
                deletePromotionBody,
              );
            }
          }
        } else {
          body = bodySample.mainBody(
            this.customerAccountECID,
            this.customerCategory,
            this.distributionChannel,
            this.externalLocationId,
            cartItems,
            this.charMap != null && this.charMap != undefined
              ? this.generateCharsItem(this.charMap.get('SalesOrder'))
              : null,
          );
        }
        return body;
        break;
    }
  }

  generateOffersBody() {
    let cartItems = [];
    if (this.charMap == null) {
      return null;
    }
    let allParentOffers = [];
    let allChildOffers = [];
    let allSelectedChildOffers = [];
    if (this.scResponse === null || this.scResponse.cartItem === null) {
      return null;
    }
    //Store all parent offers and
    //Store all child offers from response
    this.scResponse.cartItem.forEach((item) => {
      allParentOffers.push(item.productOffering.id);
      item.cartItem.forEach((childItem) => {
        allChildOffers.push(childItem.productOffering.id);
      });
    });

    //Collect all child offers being added in the scenario
    if (this.childOfferMap !== null) {
      for (let item of Array.from(this.childOfferMap.keys())) {
        this.childOfferMap.get(item).forEach((val) => {
          allSelectedChildOffers.push(val);
        });
      }
    }

    let cartMap = new Map();
    let cartChilds = [];
    this.scResponse.cartItem.forEach((item) => {
      item.cartItem.forEach((childItem) => {
        cartChilds.push(childItem.productOffering.id);
      });
      if (cartChilds.length == 0) {
        cartChilds = undefined;
      }
      cartMap.set(item.productOffering.id, cartChilds);
      cartChilds = [];
    });

    let cartItem;
    for (let offer of Array.from(this.charMap.keys())) {
      //If current scenario don't add any offer or childOffer
      //add characterstics to the offer/childOffer added in last scenarios
      if (
        (this.selectedOffers === null ||
          this.selectedOffers.includes(offer) === false) &&
        (allSelectedChildOffers.length == 0 ||
          allSelectedChildOffers.includes(offer) === false)
      ) {
        //console.log('Offer:' + offer, allParentOffers, allChildOffers)
        if (allParentOffers.includes(offer)) {
          //If the offer is top offer do it as top offer
          cartItem = bodySample.topOfferItem(
            offer,
            this.generateCharsItem(this.charMap.get(offer)),
            bodyParser.getItemIdByProductOffering(this.scResponse, offer),
            this.action,
          );
        } else if (allChildOffers.includes(offer)) {
          let productOfferingId;
          for (let parent of Array.from(cartMap.keys())) {
            if (cartMap.get(parent) !== null) {
              if (cartMap.get(parent).includes(offer)) {
                productOfferingId = parent;
              }
            }
          }
          //If the offer is child offer do it as child offer
          if (
            this.action == null ||
            this.action == undefined ||
            this.action.to_lower() == 'add' ||
            this.action == ''
          ) {
            cartItem = bodySample.childOfferItem(
              offer,
              bodyParser.getItemIdByProductOffering(
                this.scResponse,
                productOfferingId,
              ),
              this.generateCharsItem(this.charMap.get(offer)),
              productOfferingId,
              bodyParser.getChildItemIdByProductOffering(
                this.scResponse,
                offer,
              ),
              this.childOfferMap === null && this.selectedOffers === null
                ? ''
                : this.action,
            );
          } else if (
            this.action !== null &&
            this.action !== undefined &&
            this.action.to_lower() == 'delete'
          ) {
            cartItem = bodySample.childOfferItem(
              offer,
              bodyParser.getItemIdByProductOffering(
                this.scResponse,
                productOfferingId,
              ),
              this.generateCharsItem(this.charMap.get(offer)),
              productOfferingId,
              bodyParser.getItemIdByProductOffering(this.scResponse, offer),
            );
          } else {
            throw new Error(
              "You can pass action as 'Add' or 'Delete' only, default considered is 'Add' if not passed",
            );
          }
        } else if (offer == 'SalesOrder') {
          return;
        } else {
          throw new Error(
            'Offer ' + offer + " don't belong to Top or child offers",
          );
        }
        cartItems.push(cartItem);
      }
    }
    return cartItems;
  }

  generateAddPromotionBody() {
    if (this.addPromotionMap === null) {
      return null;
    }
    let cartItem = [];
    for (let [offerId, discountDetail] of this.addPromotionMap) {
      let cartItemId = bodyParser.getItemIdByProductOffering(
        this.scResponse,
        offerId,
      );
      cartItem.push(
        bodySample.appPromotionCarts(
          discountDetail,
          // discountDetail[0].discountId,
          // discountDetail[0].reasonCd,
          cartItemId,
          'Add',
        ),
      );
    }

    return cartItem.length === 0 ? null : cartItem;
  }

  generateDeletePromotionBody() {
    if (this.deletePromotionMap === null) {
      return null;
    }
    // bodyParser.getDiscountIdForProductOffer(
    //   this.scResponse,
    //   offerId,
    //   discountDetail[0].discountId,
    // ),
    // bodyParser.getDiscountValueForProductOffer(
    //   this.scResponse,
    //   offerId,
    //   discountDetail[0].discountId,
    // ),
    let cartItem = [];
    for (let [offerId, discountDetail] of this.deletePromotionMap) {
      let cartItemId = bodyParser.getItemIdByProductOffering(
        this.scResponse,
        offerId,
      );
      cartItem.push(
        bodySample.appPromotionCarts(
          discountDetail,
          cartItemId,
          'Delete',
          offerId,
          this.scResponse,
          // bodyParser.getDiscountIdForProductOffer(
          //   this.scResponse,
          //   offerId,
          //   discountDetail[0].discountId,
          // ),
          // bodyParser.getDiscountValueForProductOffer(
          //   this.scResponse,
          //   offerId,
          //   discountDetail[0].discountId,
          // ),
        ),
      );
    }
    return cartItem.length === 0 ? null : cartItem;
  }

  generateSelectedOffersBody() {
    let cartItems = [];
    let cartItem;
    if (this.selectedOffers == null || this.selectedOffers == undefined) {
      return null;
    }
    this.selectedOffers.forEach((offer) => {
      let charMap = null;
      if (this.charMap !== null && this.charMap !== undefined) {
        charMap = this.generateCharsItem(this.charMap.get(offer));
      }
      cartItem = bodySample.topOfferItem(
        offer,
        charMap,
        bodyParser.getItemIdByProductOffering(this.scResponse, offer),
        'Add',
      );
      cartItems.push(cartItem);
    });
    return cartItems;
  }

  generateDeleteOffersBody() {
    let cartItems = [];
    let cartItem;
    if (this.deleteOffers == null || this.deleteOffers == undefined) {
      return null;
    }
    this.deleteOffers.forEach((offer) => {
      let charMap = null;
      if (this.charMap !== null && this.charMap !== undefined) {
        charMap = this.generateCharsItem(this.charMap.get(offer));
      }
      cartItem = bodySample.topOfferItem(
        offer,
        charMap,
        bodyParser.getItemIdByProductOffering(this.scResponse, offer),
        'Delete',
      );
      cartItems.push(cartItem);
    });
    return cartItems;
  }

  generateChildOffersBody() {
    let cartItems = [];
    if (this.childOfferMap == null || this.childOfferMap == undefined) {
      return null;
    }
    for (let [productOfferingId, childOfferList] of this.childOfferMap) {
      for (let i = 0; i < childOfferList.length; i++) {
        let childOffer = childOfferList[i];
        let cartItem;
        let charItemsT = null;
        if (this.charMap !== null && this.charMap !== undefined) {
          charItemsT = this.charMap.get(childOffer);
        }
        console.log('Chars for one child item:' + charItemsT);
        let charItems = [];
        for (let j = 0; !!charItemsT && j < charItemsT.length; j++) {
          let c = charItemsT[j];
          if (i === Number(c.itemNumber) - 1) {
            charItems.push({ name: c.name, value: c.value });
          }
          if (String(c.itemNumber).toLowerCase() == 'none') {
            charItems.push({ name: c.name, value: c.value });
          }
        }
        cartItem = bodySample.childOfferItem(
          childOffer,
          bodyParser.getItemIdByProductOffering(
            this.scResponse,
            productOfferingId,
          ),
          charItems,
          productOfferingId,
          this.childOfferMap !== null &&
            this.childOfferMap !== undefined &&
            this.childOfferMap !== 'undefined'
            ? ''
            : bodyParser.getChildItemIdByProductOffering(
                this.scResponse,
                childOffer,
              ),
        );
        cartItems.push(cartItem);
      }
    }
    return cartItems;
  }

  generateChildOffersDeleteBody() {
    let cartItems = [];
    if (
      this.deleteChlidOfferMap == null ||
      this.deleteChlidOfferMap == undefined
    ) {
      return null;
    }
    for (let [productOfferingId, childOfferList] of this.deleteChlidOfferMap) {
      childOfferList.forEach((childOffer) => {
        let cartItem;
        let charItems = null;

        let childItemInCart: any;
        childItemInCart = bodyParser.getChildItemByProductOffering(
          this.scResponse,
          childOffer,
        );
        if (this.charMap !== null && this.charMap !== undefined) {
          charItems = this.generateCharsItem(this.charMap.get(childOffer));
        }
        cartItem = bodySample.childOfferItem(
          childOffer,
          bodyParser.getItemIdByProductOffering(
            this.scResponse,
            productOfferingId,
          ),
          charItems,
          productOfferingId,
          childItemInCart.id,
          'Delete',
        );
        cartItems.push(cartItem);
      });
    }
    return cartItems;
  }

  generateCharsItem(charList) {
    let charItems = [];
    if (charList == null || charList == undefined) {
      return null;
    }
    charList.forEach((charContainer) => {
      let charItem = bodySample.charItem(charContainer);
      charItems.push(charItem);
    });
    return charItems;
  }

  generateCharItemUpdate(charList) {
    let charItems = [];
    if (charList == null || charList == undefined) {
      return null;
    }
    charList.forEach((charContainter) => {
      let charItem = bodySample.charItem(charContainter);
      charItems.push(charItem);
    });
    return charItems;
  }

  generateCategoryItemList(categoryList) {
    let categoryItemList = [];
    if (categoryList == null || categoryList == undefined) {
      return null;
    }
    categoryList.forEach((categoryId) => {
      let categoryItem = bodySample.getCategoryItem(categoryId);
      categoryItemList.push(categoryItem);
    });
    return categoryItemList;
  }
}
