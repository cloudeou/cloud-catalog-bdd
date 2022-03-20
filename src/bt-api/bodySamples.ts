import { identity } from 'lodash';
import { of } from 'rxjs';
import { Common } from '../utils/commonBDD/Common';
import { bodyParser } from './bodyParser';
import { btapi } from './btapi';

// module.exports = {
export class bodySamples {
  mainBody(
    customerAccountECID,
    customerCategory,
    distributionChannel,
    externalLocationId,
    cartItems?,
    charItems?,
  ) {
    const isDistChanExtId = !Object.values(
      btapi.data.distributionChannel,
    ).includes(distributionChannel);

    return {
      relatedParty: [
        {
          id: customerAccountECID != null ? customerAccountECID : '',
          role: 'customer',
          characteristic: [
            {
              name: 'category',
              value: customerCategory,
            },
          ],
        },
      ],
      channel: {
        id: distributionChannel,
        '@referenceType': isDistChanExtId ? 'External_ID' : undefined,
      },
      place: [
        {
          id: `${externalLocationId}`,
        },
      ],
      characteristic: charItems != null ? charItems : '',
      cartItem: cartItems != null ? cartItems : '',
    };
  }

  topOfferItem(offer, charItems, itemId, action) {
    return {
      action: action != null && action != 'undefined' ? action : 'Add',
      id: itemId,
      productOffering: {
        id: offer,
      },
      product: {
        characteristic: charItems != null ? charItems : [],
      },
    };
  }

  removeTopOfferItem(itemId) {
    return {
      action: 'Delete',
      id: itemId,
    };
  }

  childOfferItem(
    childOffer,
    parentItem,
    charItems,
    parentProductOffering?,
    itemId?,
    action?,
  ) {
    return {
      action:
        action != null && action != 'undefined'
          ? action
          : action == ''
          ? ''
          : 'Add',
      id: itemId,
      productOffering: {
        id: childOffer,
      },
      product: {
        characteristic: charItems != null ? charItems : [],
      },
      cartItemRelationship:
        action == ''
          ? ''
          : [
              {
                id: parentItem,
                productOffering: {
                  id: parentProductOffering,
                },
                type: 'parent',
              },
            ],
    };
  }

  static charupdate(childOffer, charItems) {
    return {
      productOffering: {
        id: childOffer,
      },
      product: {
        characteristic: charItems != null ? charItems : [],
      },
    };
  }

  // removechildOfferItem: function (itemId, parentItem) {
  //     return cartItem = {
  //         'action': 'Delete',
  //         'id': itemId,
  //         'cartItemRelationship': [{
  //             'id': parentItem,
  //             'type': 'parent'
  //         }]
  //     }
  // },

  updateTopOfferItem(itemId, charItems) {
    return {
      action: 'Add',
      id: itemId,
      product: {
        characteristic: charItems,
      },
    };
  }

  updateChildOfferItem(childItemId, parentItemId, charItems) {
    return {
      action: 'Add',
      id: childItemId,
      product: {
        characteristic: charItems,
      },
      cartItemRelationship: [
        {
          id: parentItemId,
          type: 'parent',
        },
      ],
    };
  }

  charItem(charContainter) {
    return {
      name: charContainter.name,
      value: charContainter.value,
    };
  }

  static validateOrSubmitBody(customerCategory, distributionChannel) {
    const isDistChanExtId = !Object.values(
      btapi.data.distributionChannel,
    ).includes(distributionChannel);

    return {
      relatedParty: [
        {
          role: 'customer',
          characteristic: [
            {
              name: 'category',
              value: customerCategory,
            },
          ],
        },
      ],
      channel: {
        id: distributionChannel,
        '@referenceType': isDistChanExtId ? 'External_ID' : undefined,
      },
    };
  }

  createCustomerBody(customerEmail, addressId) {
    return {
      firstName: 'Merlin',
      lastName: 'Automation' + Math.random(),
      businessCustomer: '',
      email: customerEmail,
      addressId: addressId,
      postalZipCode: 'E3E3E3',
      personal: {
        provinceOfResidence: 'BC',
        birthDate: '1988-12-25',
        driverLicense: {
          number: '2456269',
          provinceCd: 'BC',
        },
      },
    };
  }

  getAvailableProductOfferings(context, category) {
    return {
      relatedParty: [
        {
          role: 'customer',
          characteristic: [
            {
              name: 'category',
              value: context.customerCategory,
            },
          ],
        },
      ],
      channel: {
        id: context.distributionChannel,
        name: 'CSR',
      },
      place: [
        {
          id: context.locationId,
          role: 'service address',
        },
      ],
      productOfferingQualificationItem: [
        {
          id: '!',
          productOffering: {
            category: [
              {
                id: category,
              },
            ],
          },
        },
      ],
    };
  }

  getServiceQualification(externalLocationId) {
    return {
      serviceQualificationItem: [
        {
          id: externalLocationId,
        },
      ],
    };
  }

  getProductQualification(
    customerCategory,
    distributionChannel,
    externalLocationId,
    productOfferingId?,
    categoryList?,
    charItems?,
    commitmentId?,
    shoppingCartId?,
  ) {
    const isDistChanExtId = !Object.values(
      btapi.data.distributionChannel,
    ).includes(distributionChannel);
    const id = shoppingCartId ? {id: shoppingCartId} : undefined;
    return {
      relatedParty: [
        {
          role: 'customer',
          characteristic: [
            {
              name: 'category',
              value: customerCategory,
            },
          ],
        },
      ],
      channel: {
        id: distributionChannel,
        '@referenceType': isDistChanExtId ? 'External_ID' : undefined,
      },
      place: {
        id: externalLocationId,
        role: 'service address',
      },
      productOfferingQualificationItem: this.getProductQual(
        productOfferingId,
        commitmentId,
        categoryList,
        charItems,
      ),
      shoppingCart : id
    };
  }

  // UPD: ATTENTION: temporary solution
  static getOffering(productOfferingId, categoryList?, prodSpecCharValueUse?) {
    let offering;
    if (productOfferingId) {
      offering = {
        id: productOfferingId,
      };
    } else if (categoryList) {
      offering = {
        category: categoryList,
        prodSpecCharValueUse: prodSpecCharValueUse
          ? prodSpecCharValueUse
          : undefined,
      };
    }
    return offering;
  }

  getProductQual(
    productOfferingId,
    commitmentId,
    categoryList?,
    prodSpecCharValueUse?,
  ) {
    let qual = [];
    if (
      categoryList !== undefined &&
      categoryList !== 'undefined' &&
      categoryList !== null
    ) {
      qual.push({
        id: '1',
        productOffering: bodySamples.getOffering(
          null,
          categoryList,
          prodSpecCharValueUse,
        ),
      });
    }
    if (
      productOfferingId !== undefined &&
      productOfferingId !== 'undefined' &&
      productOfferingId !== null
    ) {
      qual.push({
        id: qual.length == 1 ? '2' : '1',
        productOffering: bodySamples.getOffering(productOfferingId, null, null),
        qualificationItemRelationship: [
          {
            type: 'bundledProductOffering',
          },
        ],
      });
    }
    if (
      commitmentId !== undefined &&
      commitmentId !== 'undefined' &&
      commitmentId !== null
    ) {
      qual.push({
        id: qual.length == 2 ? '3' : '2',
        productOffering: bodySamples.getOffering(commitmentId, null, null),
        qualificationItemRelationship: [
          {
            type: 'withItem',
            id: '1',
          },
        ],
      });
    }
    return qual;
  }

  getCategoryItem(categoryId) {
    return {
      id: categoryId,
    };
  }

  getAppPromotion(locationId, channel, customerCategory, cartItems) {
    return {
      place: [
        {
          id: locationId,
          role: 'service address',
        },
      ],
      channel: {
        id: channel,
      },
      relatedParty: [
        {
          _comment: "add 'id' attribute in case ECID is known",
          role: 'customer',
          characteristic: [
            {
              name: 'category',
              value: customerCategory,
            },
          ],
        },
      ],
      cartItem: cartItems,
    };
  }

  appPromotionCarts(discountDetail, cartItemId, action, offerId?, response?) {
    return {
      action: action,
      id: cartItemId,
      itemPrice: [
        {
          priceType: 'Recurrent',
          price: {
            dutyFreeAmount: {
              value: null,
            },
          },
          priceAlteration: this.getPriceAlterations(
            response,
            offerId,
            discountDetail,
            action,
          ),
        },
      ],
    };
  }

  getPriceAlterations(scResponse, offerId, discountDetail, action) {
    let priceAlteration = [];
    discountDetail.forEach((discount) => {
      priceAlteration.push({
        id: bodyParser.getDiscountIdForProductOffer(
          scResponse,
          offerId,
          discount.discountId,
        ),
        catalogId: discount.discountId,
        reasonCodeId: discount.reasonCd,
        action: !!action ? action : 'Add',
      });
    });
    return priceAlteration;
  }
}
