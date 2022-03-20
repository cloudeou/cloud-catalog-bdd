export class bodyParser {
  static getItemIdByProductOffering(response, productOfferingId) {
    if (response == null || response == undefined) {
      return '';
    }
    let itemId = '';
    response.cartItem.forEach((item) => {
      if (item.productOffering.id == productOfferingId) {
        itemId = item.id;
      }
    });
    return itemId;
  }

  static getChildItemByProductOffering(response, productOfferingId) {
    if (response == null) {
      return null;
    }
    let itemResult = null;
    response.cartItem.forEach((item) => {
      if (item.productOffering.id == productOfferingId) {
        itemResult = item;
        return itemResult;
      }
      item.cartItem.forEach((childitem) => {
        if (childitem.productOffering.id == productOfferingId) {
          itemResult = childitem;
          return itemResult;
        }
      });
    });
    return itemResult;
  }

  static getChildItemIdByProductOffering(response, productOfferingId) {
    if (response == null) {
      return '';
    }
    let itemResultId = '';
    response.cartItem.forEach((item) => {
      if (item.productOffering.id == productOfferingId) {
        itemResultId = item.id;
        return itemResultId;
      }
      item.cartItem.forEach((childitem) => {
        if (childitem.productOffering.id == productOfferingId) {
          itemResultId = childitem.id;
          return itemResultId;
        }
      });
    });
    return itemResultId;
  }

  static getItemByProductOffering(response, productOfferingId) {
    if (response == null) {
      return '';
    }
    let itemResult = '';
    response.cartItem.forEach((item) => {
      if (item.productOffering.id == productOfferingId) {
        itemResult = item;
      }
    });
    return itemResult;
  }

  static getPriceForProductOffer(response, productOfferingId) {
    if (response == null) {
      return '';
    }
    let price = null;
    for (let i = 0; i < response.cartItem.length; i++) {
      if (response.cartItem[i].productOffering.id == productOfferingId) {
        price = response.cartItem[i].itemPrice.price.dutyFreeAmount.value;
        break;
      }
    }
    expect(price, 'No price for this item or item not found').not.toBeNull();
    return price;
  }
  // body.cartItem[2].itemPrice[1].priceAlteration[0].id
  static getDiscountIdForProductOffer(
    response,
    productOfferingId,
    promotionCode,
  ) {
    if (response == null) {
      return '';
    }
    let id = null,
      temp;
    for (let i = 0; i < response.cartItem.length; i++) {
      if (response.cartItem[i].productOffering.id == productOfferingId) {
        temp = response.cartItem[i].itemPrice[0].priceAlteration;
        for (let j = 0; j < temp.length; j++) {
          if (temp[j].catalogId === promotionCode) {
            id = temp[j].id;
            break;
          }
        }
        if (id !== null) break;
      }
    }
    expect(id, 'No price for this item or item not found').not.toBeNull();
    return id;
  }

  static getDiscountValueForProductOffer(
    response,
    productOfferingId,
    promotionCode,
    // promoType
  ) {
    if (response == null) {
      return '';
    }
    let price = null,
      temp;
    for (let i = 0; i < response.cartItem.length; i++) {
      if (response.cartItem[i].productOffering.id == productOfferingId) {
        for (let x = 0; x < response.cartItem[i].itemPrice.length; x++) {
          temp = response.cartItem[i].itemPrice[x].priceAlteration;
          for (let j = 0; j < temp.length; j++) {
            if (temp[j].catalogId === promotionCode) {
              price = temp[j].price.dutyFreeAmount.value;
              break;
            }
          }
        }
        if (price !== null) break;
      }
    }
    expect(price, 'No price for this item or item not found').not.toBeNull();
    return price;
  }

  static getDiscountValueById(response, productOfferingId, id) {
    if (response == null) {
      return '';
    }
    let price = null,
      temp;
    for (let i = 0; i < response.cartItem.length; i++) {
      if (response.cartItem[i].productOffering.id == productOfferingId) {
        temp = response.cartItem[i].itemPrice[1].priceAlteration;
        for (let j = 0; j < temp.length; j++) {
          if (temp[j].id === id) {
            price = temp[j].price.dutyFreeAmount.value;
            break;
          }
        }
        if (price !== null) break;
      }
    }
    expect(price, 'No price for this item or item not found').not.toBeNull();
    return price;
  }

  static getSCChars(resposnse) {
    return resposnse.characteristic;
  }

  static getCartItemObjects(response) {
    const { cartItem: items } = response;
    return items;
  }

  static getOfferingsFromCartItems(items) {
    let offerings = items.map((item) => item.productOffering);
    return offerings;
  }

  static getProductsFromCartItems(items) {
    let offerings = items.map((item) => item.product);
    return offerings;
  }

  static getProductOfferings(response) {
    var offers = [];
    if (response == null) {
      return '';
    }
    response.productOfferingQualificationItem.forEach((item) => {
      offers.push(item.productOffering.id);
    });
    return offers;
  }

  // UPD: get productOfferings as objects
  static getProductOfferingObjects(response) {
    var offers = [];
    if (response == null) {
      return '';
    }
    response.productOfferingQualificationItem.forEach((item) => {
      offers.push(item.productOffering);
    });
    return offers;
  }

  static getChildsByProductOffering(response, productOfferingId) {
    var childs = [];
    if (response == null) {
      return '';
    }
    response.productOfferingQualificationItem.forEach((item) => {
      if (item.productOffering.id == productOfferingId) {
        item.productOffering.bundledProductOffering.forEach((child) => {
          childs.push(child.productOffering.id);
        });
      }
    });
    return childs;
  }

  static getChildsByProductOfferingFromCart(response, productOfferingId) {
    var childs = [];
    if (response == null) {
      return '';
    }
    response.cartItem.forEach((item) => {
      if (item.productOffering.id == productOfferingId) {
        item.cartItem.forEach((child) => {
          childs.push(child.productOffering.id);
        });
      }
    });
    return childs;
  }

  static getItemIdCharValue(
    response,
    productOfferingId,
    charName,
    itemNumber = 0,
    shift = 0,
  ) {
    let matchesP = response.cartItem.filter(
      (item) => item.productOffering.id == productOfferingId,
    );
    let matchesC = [];
    response.cartItem.forEach((item) => {
      let newMatches = item.cartItem.filter(
        (itemc) => itemc.productOffering.id == productOfferingId,
      );
      matchesC = matchesC.concat(newMatches);
    });
    const matches = matchesP.concat(matchesC);
    if (itemNumber == 0) {
      const res = matches[itemNumber].product.characteristic.find(
        (char) => char.name == charName,
      ).value;
      return res;
    } else {
      const res = matches[itemNumber - 1 + shift].product.characteristic.find(
        (char) => char.name == charName,
      ).value;
      //console.log(res);
      return res;
    }
  }
}
