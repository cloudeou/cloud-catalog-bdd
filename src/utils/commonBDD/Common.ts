import { Identificators } from './../../../bdd/contexts/Identificators';
import PreconditionContext from './../../../bdd/contexts/PreconditionContext';
import * as _ from 'lodash';
import { bodyParser } from '../../bt-api/bodyParser';
import { usePostgressDB } from '../dbUtils/usePostgressDB';
import { btapi } from '../../../src/bt-api/btapi';
import { TelusApiUtils } from '../telus-apis/TelusApis';

import {
  useOracleDB as du,
  useOracleDbQueries as dq,
} from '../dbUtils/useOracleDB';

import { AddressCreationMeta } from '../../globals/custom-types.js';

import { brconfig } from '../../../br-config';
import { bodySamples } from '../../bt-api/bodySamples';

let envcfg = brconfig.getConfigForGivenEnv();
let dbcfg = brconfig.getDbConfig(envcfg);
let itfdbcfg = brconfig.getItfDbConfig(envcfg);
let pgcfg = brconfig.getPostgressConfig(envcfg);
let envType = brconfig.getEnvType(envcfg);

const tlsApi = new TelusApiUtils();
let pu = new usePostgressDB();

import { Logger } from '../../logger/Logger';
import { RandomValueGenerator } from '../common/RandomValueGenerator';
import { featureContext } from '@telus-bdd/telus-bdd';
const logger = new Logger();
let preconditionContext = (): PreconditionContext =>
  featureContext().getContextById(Identificators.preConditionContext);

export class Common {
  private static distributionChannel = btapi.data.distributionChannel.CSR;
  private static customerCategory = btapi.data.customerCategory.CONSUMER;
  private static cartItemIdList: any[];
  private static shoppingCartId: any;

  static getTags() {
    let tags = [],
      params = ['suiteName', 'testType', 'testName'];
    let temp: any,
      myTags = '';
    params.forEach((param) => {
      temp = brconfig.getCmdParam(param);
      if (
        temp !== 'undefined' &&
        temp !== undefined &&
        temp !== null &&
        String(temp) !== ''
      ) {
        tags.push(temp);
      }
    });
    if (tags.length > 0 && tags[0] != 'undefined') {
      for (let index = 0; index < tags.length; index++) {
        let t = [];
        let m = '';
        // let merge = "(";
        t = String(tags[index]).split(',');
        if (t.length > 0) {
          for (let index = 0; index < t.length; index++) {
            m = m + '@' + t[index];
            if (index < t.length - 1) {
              m = m + ' or ';
            }
          }
          if (t.length > 1) {
            m = '(' + m + ')';
          }
        }
        myTags = myTags + m; //'@' + tags[index];
        if (index < tags.length - 1) {
          myTags = myTags + ' and ';
        }
      }
    } else {
      throw new Error(
        'Please provide you selection with below parameters: \n--suiteName=merlin --testType=sanity --testName=keyword',
      );
    }
    return myTags;
  }

  static getTagsSql() {
    let tags = this.getTags();
    tags = tags.replace(/@/g, "'");
    tags = tags.replace(/ or /g, "',");
    tags = tags.replace(')', '');
    tags = tags.replace('(', '');
    tags = tags + "'";
    return tags;
  }

  static async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async getPromoType(promoType) {
    return await du.getPromotionType(promoType, dbcfg);
  }

  async getResourceId() {
    return await du.getResourceId(dbcfg);
  }

  static resolveAddressId(EAID, addressId) {
    return EAID && EAID != 'None' ? EAID : addressId;
  }

  static async getAddress(data: AddressCreationMeta) {
    data.env = envType || 'development';

    let addressId: string = '';
    let myConfig = envType === 'integrated' ? pgcfg : dbcfg;
    //IF envType not mentioned consider, throw the error
    if (envType === 'integrated') {
      await pu.getAddress(myConfig, data).then((address) => {
        addressId = address.address_id;
        console.log(`Got address with id: ${addressId}`);
      });
    } else {
      logger.debug('In DEV ENV');
      if (data.addressType !== 'LTE') {
        await du.createAddressUnitWOC(dbcfg, itfdbcfg, data);
      } else {
        // logger.debug('Tech is LTE-----------------------------------');
        // await du.createAddressUnitNoWOC(dbcfg, itfdbcfg, data);
        // await du.executeQuery(dbcfg, dq.createAddressUnit);
      }
      // await du
      //   .setUpdateValue(dbcfg, dq.insertNCBdata(data.techType))
      //   .then(() => {
      //     du.getValue(myConfig, dq.queryGetAddress(data)).then(
      //       (address: string) => {
      //         addressId = address;
      //       },
      //     );
      //   });
    }
    return addressId;
  }

  async markAddressOccupied(config, addressID: string) {
    if (envType !== 'development') {
      await du
        .setUpdateValue(config, dq.setAddressOccupied(addressID))
        .then((updated) => {
          expect(updated).toBeTruthy();
        });
    }
  }

  async markAddressFree(config, addressID: string) {
    if (envType !== 'development') {
      await du
        .setUpdateValue(config, dq.setAddressFree(addressID))
        .then((updated) => {
          expect(updated).toBeTruthy();
          logger.debug(`Address Id: ${addressID} freed...`);
        });
    }
  }

  static async setCustomerMigrationFlag(customerId) {
    let response = await tlsApi.setMigrationFlag(envcfg.telusapis, customerId);
    return response;
  }

  static getChildOfferMapFromTable(table: any, topOffer?) {
    let offerMap = new Map<string, Array<string>>();
    table.forEach((row: any) => {
      let offerList = [];
      offerList = offerMap.get(row.Parent);
      let offer = {
        OfferId:
          String(row.OfferId) === 'any'
            ? topOffer
            : row.OfferId[0] === '@'
            ? JSON.parse(process.env.bootstrapData)[0][row.OfferId]
            : row.OfferId,
        Parent:
          row.Parent[0] === '@'
            ? JSON.parse(process.env.bootstrapData)[0][row.Parent]
            : row.Parent,
      };
      if (offerList !== undefined && offerList !== null) {
        offerList.push(offer.OfferId);
        offerMap.set(offer.Parent, offerList);
      } else {
        offerList = [];
        offerList.push(offer.OfferId);
        offerMap.set(offer.Parent, offerList);
      }
    });
    return offerMap;
  }

  static getCategoriesFromTable(table: any) {
    let categoryList = [];
    table.forEach((row: any) => {
      const category = Common.getBootstrapIfExists(row.CategoryId);
      categoryList.push(category);
    });
    return categoryList;
  }

  static getRequestedItemListFromTable(table: any) {
    let RequestedItemList = [];
    table.forEach((row: any) => {
      let RequestedItem = row.OfferId;
      RequestedItemList.push(RequestedItem);
    });
    return RequestedItemList;
  }

  static getAttrsListFromTable(table: any) {
    let attrssList = [];
    table.forEach((row: any) => {
      let attr = row.AttributeName;
      attrssList.push(attr);
    });
    return attrssList;
  }

  static getCharListFromTable(table: any) {
    let charList = [];
    table.forEach((row: any) => {
      let char = {
        name: row.Name,
        value: row.Value,
      };
      charList.push(char);
    });
    return charList;
  }

  static getCommitmentPeriodChars(commitment: string, periodType: string) {
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today.setMonth(today.getMonth() + 3));
    let dateChars = [
      { Name: '9149604606813116277', Value: startDate, Item: commitment }, // start date char
      { Name: '9149604821113116295', Value: endDate, Item: commitment }, // end date char
    ];
    switch (periodType) {
      case 'trial':
        dateChars.pop();
        return dateChars;
      case 'regular':
        return dateChars;
      case 'earlyRenewal':
        dateChars[0].Value = new Date(
          startDate.setMonth(startDate.getMonth() - 3),
        );
        dateChars[1].Value = new Date(today.setMonth(today.getMonth() + 1));
        return dateChars;
    }
  }

  static mergeMaps(map1: Map<any, any>, map2: Map<any, any>): Map<any, any> {
    for (const [key, value] of Object.entries(map2)) {
      map1.set(key, value);
    }
    return map1;
  }

  // UPD: parse parameters table
  static getParamsListFromTable(table: any) {
    let paramsList = [];
    table.forEach((row: any) => {
      let param = Common.getBootstrapIfExists(row.ParameterName);
      paramsList.push(param);
    });
    return paramsList;
  }

  static generateRandomEmail() {
    let randEmail = RandomValueGenerator.generateRandomAlphaNumeric(15);
    randEmail = randEmail + new Date().getMilliseconds() + '@telus.net';
    return randEmail;
  }

  getProductList(table: any) {
    let charList = [];
    table.forEach((row: any) => {
      let char = {
        name: row.Name,
        value: row.Value,
      };
      charList.push(char);
    });
    return charList;
  }

  static checkIfCategoryContainAllProps(offer) {
    let isCatContain: boolean;
    offer.category.forEach((c) => {
      c['id'] && c['href'] && c['name'] && c['@referredType']
        ? (isCatContain = true)
        : (isCatContain = false);
    });
    return isCatContain;
  }

  static validateAcutalOffersContainOffers(
    actualOffers: any[],
    productOfferingList: any[],
  ) {
    productOfferingList.forEach((offer) => {
      expect(
        actualOffers.includes(offer),
        `expected ${offer}, but was not found. Actual offers are - ${JSON.stringify(
          actualOffers,
        )}`,
      ).toBe(true);
    });
  }

  static checkIfHasShippmentOrder(response) {
    let flag = false;
    for (let i = 0; i < response.cartItem.length; i++) {
      if (
        String(response.cartItem[i].product.name).toLowerCase() === 'shipment'
      ) {
        flag = true;
        break;
      }
    }
    return flag;
  }

  static checkValidResponse(success, statusCode?) {
    //logger.info('RESPONSE: ' + JSON.stringify(success.response.body));
    expect(success, 'Response should not be empty\n').not.toBeNull();
    // console.log('success', success)
    expect(
      success.response,
      'Response field should be present\n' +
        JSON.stringify(success, null, '\t'),
    ).not.toBeNull();
    expect(
      success.response.body,
      'Response should contain body\n' + JSON.stringify(success, null, '\t'),
    ).not.toBeNull();
    expect(
      success.response.body,
      'Response should contain body\n' + JSON.stringify(success, null, '\t'),
    ).toBeDefined();
    if (statusCode !== undefined) {
      expect(
        success.response.statusCode,
        'statusCode should be ' +
          statusCode +
          JSON.stringify(success, null, '\t'),
      ).toBe(statusCode);
    }
    return true;
  }

  static validateCartItemChars(cartItems, charMap) {
    for (let cartItemId of charMap.keys()) {
      let cartItemToCheck = cartItems.find(
        (item) => item.productOffering.id == cartItemId,
      );
      expect(
        cartItemToCheck,
        `Error response is received due to cart item ${cartItemId}, expected shopping cart to contain the item, but does not.`,
      ).toBeDefined();
      if (cartItemToCheck) {
        const { name, value } = { ...charMap.get(cartItemId) }['0'];
        let isCharUpdated = false;
        let actualValue;
        cartItemToCheck.product.characteristic.forEach((char) => {
          if (char.name == name) {
            actualValue = char.value;
            isCharUpdated = char.value == value;
          }
        });
        expect(
          isCharUpdated,
          `Error response is received due to char ${name}, expected item ${cartItemId} to contain it with value ${value}, got value ${actualValue} instead.`,
        ).toBeTruthy();
      }
    }
  }

  static getOffersFromTable(table: any, shoppingCartContext: any) {
    var productOfferingList = [];
    table.forEach(function (row) {
      let offerId = Common.getBootstrapIfExists(row.OfferId);
      if (offerId === 'any') {
        productOfferingList.push(shoppingCartContext().getAvailableOffers()[0]);
      } else {
        productOfferingList.push(offerId);
      }
    });
    return productOfferingList;
  }

  static getCharListFromValidationTable(table: any) {
    let charList = [];
    table.forEach((row: any) => {
      let char = row.Name;
      charList.push(char);
    });
    return charList;
  }

  static getMapFromPromotionTable(table: any) {
    const promotionMap = new Map<string, any[]>();
    table.forEach((row: any) => {
      const tempRow = promotionMap.get(row.Parent);
      const char = {
        discountId: row.DiscountId,
        reasonCd: row.ReasonCd,
      };
      if (tempRow) {
        promotionMap.set(row.Parent, [...tempRow, char]);
      } else {
        promotionMap.set(row.Parent, [char]);
      }
    });
    return promotionMap;
  }

  static createExistingChildOffersMap(response: any) {
    let existingChildOffersMap = new Map();
    response.cartItem.forEach((tloItem) => {
      const tloId = tloItem.productOffering.id;
      existingChildOffersMap.set(tloId, new Map());
      const uniqueSloIds = tloItem.cartItem
        .map((sloItem) => sloItem.productOffering.id)
        .filter((sloId, index, self) => self.indexOf(sloId) == index);
      uniqueSloIds.forEach((sloId) => {
        const sloIdCount = tloItem.cartItem.filter(
          (item) => item.productOffering.id == sloId,
        ).length;
        existingChildOffersMap.get(tloId).set(sloId, sloIdCount);
      });
    });

    return existingChildOffersMap;
  }

  static createCharMapFromTable(table: any) {
    let charMap = new Map<string, any[]>();
    table.forEach(async (row: any) => {
      let email = RandomValueGenerator.generateRandomAlphaNumeric(15);
      let randomText = RandomValueGenerator.generateRandomAlphabetic(10);

      let charList: any = [];
      charList = charMap.get(row.Item);

      let rowVal = String(row.Value).toLowerCase();
      let val: any = '';
      switch (rowVal) {
        case 'randomemail':
          val = email + '@telus.net';
          break;
        case 'username':
          val = email;
          break;
        case 'resourceid':
          val = `resourceid${randomText}`;
          break;
        default:
          val = row.Value;
          break;
      }

      let char = {
        name: row.Name,
        value: val,
        itemNumber:
          row.ItemNumber === undefined ||
          row.ItemNumber === 'undefined' ||
          String(row.ItemNumber) === ''
            ? 'none'
            : row.ItemNumber,
      };
      if (charList !== undefined && charList !== null) {
        charList.push(char);
        charMap.set(row.Item, charList);
      } else {
        charList = [];
        charList.push(char);
        charMap.set(row.Item, charList);
      }
    });

    return charMap;
  }

  static validateWorkOrdersCorrectness(response: any) {
    let workOrderCount = 0;
    let expectedWorkOrderCount = 0;
    let counter = new Map();
    let addForTV = 0;
    let addForPhone = 0;
    let addFortelusConnectivity = 0;
    // potentially add HSIA and HS

    logger.debug(
      'Expected WorkOrder: ' +
        workOrderCount +
        ' Got Workorder: ' +
        expectedWorkOrderCount,
    );
    if (workOrderCount === expectedWorkOrderCount) {
      return true;
    }
    return false;
  }

  static getWorkOrdersCount(response: any) {
    let expectedWorkOrderCount = { count: 0, action: '' };

    response.cartItem.forEach((cartItem) => {
      if (cartItem.product.name === 'Work Offer') {
        // console.log('WORK OFFER WAS FOUND');
        //console.log(JSON.stringify(cartItem));
        expectedWorkOrderCount.count = cartItem.cartItem.length;
        expectedWorkOrderCount.action = cartItem.action;
      }
    });

    return expectedWorkOrderCount;
  }

  static validateAllOffersPresentInResponse(response: any, offers: any) {
    var flag = true;
    let errorMessage = '';
    if (offers !== null && offers !== undefined && offers.length > 0) {
      offers.forEach((offer) => {
        if (bodyParser.getItemIdByProductOffering(response, offer) === null) {
          flag = false;
          errorMessage = errorMessage + offer + ' not present\n';
        }
      });
    }
    expect(flag, errorMessage).toBeTruthy();
  }

  static validateAllOffersNotPresentInResponse(response: any, offers: any) {
    var flag = true;
    let n: any;
    let errorMessage = '';
    if (offers !== null && offers !== undefined && offers.length > 0) {
      offers.forEach((offer) => {
        if (bodyParser.getItemIdByProductOffering(response, offer) !== null) {
          n = bodyParser.getItemByProductOffering(response, offer);
          if (
            String(n.action).toLowerCase() !== 'cancel' &&
            String(n.action).toLowerCase() !== 'delete'
          ) {
            flag = false;
            errorMessage = errorMessage + offer + ' present\n';
          }
        }
      });
    }
    expect(flag, errorMessage).toBeTruthy();
  }

  validateTheCharMapInResponse(response: any, charMap: any) {
    var flag = true;
    let errorMessage = '';
    if (charMap !== null) {
      for (let item of charMap.keys()) {
        charMap.get(item).forEach((char: any) => {
          let value = bodyParser
            .getItemIdCharValue(response, item, char.name)
            .toString();
          if (value !== char.value) {
            flag = false;
            errorMessage =
              errorMessage +
              item +
              ' -> ' +
              char.name +
              ': ' +
              value +
              ' instead of ' +
              char.value;
          }
        });
      }
    }
    expect(flag, errorMessage).toBeTruthy();
  }

  static getActualOffers(response: any, topOffer: any) {
    let actualOffers: any;
    if (topOffer !== null && topOffer !== '' && topOffer !== undefined) {
      actualOffers = bodyParser.getChildsByProductOffering(response, topOffer);
    } else {
      actualOffers = bodyParser.getProductOfferings(response);
    }
    return actualOffers;
  }

  static validateOfferMapInResponse(childOfferMap, response, errorContext) {
    var flag = true;
    let errorMessage = '';
    if (childOfferMap !== null && childOfferMap !== undefined) {
      // childOfferMapList.forEach(childOfferMap => {
      for (let offer of childOfferMap.keys()) {
        if (bodyParser.getItemIdByProductOffering(response, offer) === null) {
          flag = false;
          errorMessage = errorMessage + offer + ' not present\n';
        }
        let childs = bodyParser.getChildsByProductOfferingFromCart(
          response,
          offer,
        );

        for (let childOffer of childOfferMap.get(offer)) {
          if (
            bodyParser.getItemIdByProductOffering(response, childOffer) === null
          ) {
            flag = false;
            errorMessage = errorMessage + childOffer + ' not present\n';
          }
          if (!childs.includes(childOffer)) {
            flag = false;
            errorMessage =
              errorMessage +
              childOffer +
              ' not child of offer in the Response\n';
          }
        }
      }
      // });
    }
    if (!flag) {
      errorContext().setError(errorMessage);
    }
    expect(flag, errorMessage).toBeTruthy();
  }

  static validateOfferMapNotInResponse(childOfferMap, response) {
    var flag = true;
    let n: any;
    let errorMessage = '';
    if (childOfferMap !== null && childOfferMap !== undefined) {
      for (let offer of childOfferMap.keys()) {
        if (
          bodyParser.getChildItemByProductOffering(response, offer) === null
        ) {
          flag = false;
          errorMessage = errorMessage + offer + ' not present\n';
        }
        let childs = bodyParser.getChildsByProductOfferingFromCart(
          response,
          offer,
        );
        for (let childOffer of childOfferMap.get(offer)) {
          if (
            bodyParser.getChildItemByProductOffering(response, childOffer) !==
            null
          ) {
            n = bodyParser.getChildItemByProductOffering(response, childOffer);
            if (
              String(n.action).toLowerCase() !== 'cancel' &&
              String(n.action).toLowerCase() !== 'delete'
            ) {
              flag = false;
              errorMessage = errorMessage + childOffer + ' present\n';
            }
          }
        }
      }
    }
    expect(flag, errorMessage).toBeTruthy();
  }

  static validateCharMapInResponse(
    childOfferMap,
    charMap,
    response,
    existingChildOffersMap,
  ) {
    //console.log(charMap);
    var flag = true;
    let errorMessage = '';
    if (charMap !== null) {
      for (let item of charMap.keys()) {
        charMap.get(item).forEach((char: any) => {
          if (item == 'SalesOrder') return;
          const itemNumber =
            char.itemNumber != 'none' ? Number(char.itemNumber) : 0;
          let responseTemp = response;
          let itemNumberShift = 0;
          if (childOfferMap !== null) {
            for (let [productOfferingId, childOfferList] of childOfferMap) {
              // console.log(childOfferList);
              // console.log(item);
              if (childOfferList.includes(item)) {
                responseTemp = bodyParser.getItemByProductOffering(
                  response,
                  productOfferingId,
                );
                itemNumberShift = existingChildOffersMap
                  .get(productOfferingId)
                  .get(item);
              }
            }
          }
          itemNumberShift = itemNumberShift ? itemNumberShift : 0;
          let value = bodyParser
            .getItemIdCharValue(
              responseTemp,
              item,
              char.name,
              itemNumber,
              itemNumberShift,
            )
            .toString();
          if (value !== char.value) {
            flag = false;
            errorMessage =
              errorMessage +
              item +
              ' -> ' +
              char.name +
              ': ' +
              value +
              ' instead of ' +
              char.value +
              '\n';
          }
        });
      }
    }
    expect(flag, errorMessage).toBeTruthy();
  }

  static validatePromotionsInResponse(promotions, response) {
    let flag = false;
    let errorMessage = '';
    if (promotions !== null && promotions !== undefined) {
      // childOfferMapList.forEach(childOfferMap => {
      for (let offer of promotions.keys()) {
        let cart: any;
        cart = bodyParser.getItemByProductOffering(response, offer);
        if (cart === null) {
          errorMessage = errorMessage + offer + ' not present\n';
          break;
        }
        let cartOffers = [];
        let promotionOffers = [];

        for (let itemPrice of cart.itemPrice) {
          for (let alteration of itemPrice.priceAlteration) {
            cartOffers.push({
              discountId: alteration.catalogId,
              reasonCd: alteration.reasonCodeId,
            });
          }
        }
        for (let discount of promotions.get(offer)) {
          promotionOffers.push({
            discountId: discount.discountId,
            reasonCd: discount.reasonCd,
          });
        }
        for (let i = 0; i < promotionOffers.length; i++) {
          if (
            !JSON.stringify(cartOffers).includes(
              JSON.stringify(promotionOffers[i]),
            )
          ) {
            errorMessage =
              errorMessage +
              'Promotion: ' +
              JSON.stringify(promotionOffers[i]) +
              ' not found for product: ' +
              String(offer) +
              '\n';
          }
        }
      }
    } else {
      errorMessage = errorMessage + 'No promotion passed or promotion is null';
    }
    expect(errorMessage === '', errorMessage).toBeTruthy();
  }

  static validatePromotionsNotInResponse(promotions, response) {
    var flag = true;
    let errorMessage = '';
    if (promotions !== null && promotions !== undefined) {
      // childOfferMapList.forEach(childOfferMap => {
      for (let offer of promotions.keys()) {
        let cart: any;
        cart = bodyParser.getItemByProductOffering(response, offer);
        if (cart === null) {
          errorMessage = errorMessage + offer + ' not present\n';
          break;
        }
        for (let discount of promotions.get(offer)) {
          for (let itemPrice of cart.itemPrice) {
            for (let alteration of itemPrice.priceAlteration) {
              if (
                alteration.catalogId === discount.discountId &&
                alteration.reasonCodeId === discount.reasonCd
              ) {
                flag = flag ? false : flag;
                errorMessage =
                  errorMessage +
                  'Discount: ' +
                  JSON.stringify(discount) +
                  ' not removed\n';
                break;
              }
            }
          }
        }
      }
    }
    expect(flag, errorMessage).toBeTruthy();
  }

  static async cleanScript() {
    // reinventing wheel, sorry (Temporary workaround for ts project)
    envcfg = brconfig.getConfigForGivenEnvForCleanup();
    dbcfg = brconfig.getDbConfig(envcfg);
    itfdbcfg = brconfig.getItfDbConfig(envcfg);
    pgcfg = brconfig.getPostgressConfig(envcfg);
    envType = brconfig.getEnvType(envcfg);

    let customerstoclean = [];
    let finalresult = true;
    let errors = [];
    try {
      let add = await pu.getOccupiedAddress(pgcfg);
      //let add = { rows: [{ address_id: '437349' }] };
      logger.debug('======= OCCUPIED ADDRESS: ' + JSON.stringify(add));
      // logger.debug(JSON.stringify(add.rows[0].address_id));
      if (!add || !add.rows || add.rows.length === 0) {
        return console.error('Nothing to cleanup!!!');
      }
      logger.debug(`rowlength:${add.rows.length}`);

      for (let index = 0; index < add.rows.length; index++) {
        const customersOnLocation = await du.getCustomersOnAddressLine(
          dbcfg,
          add.rows[index].address_id,
        );
        logger.debug('customers on add:' + customersOnLocation);
        logger.debug(`customersreturned: ${customersOnLocation.length}`);

        for (
          let customers = 0;
          customers < customersOnLocation.length;
          customers++
        ) {
          var customerId = customersOnLocation[customers][0];
          var clean = customersOnLocation[customers][1];

          const customerEcid = await du.getECIDfromCustomerObjID(
            dbcfg,
            customerId,
          );

          logger.debug(`ECID: ${customerEcid}`);

          try {
            if (clean === 'false') {
              customerstoclean.push(customerId);
              await Common.InitiateChangeOrder(
                String(customerEcid),
                add.rows[index].address_id,
              );
              logger.debug(`Removing top offers`);
              await Common.removeTopofferstocease(add.rows[index].address_id);

              logger.debug(`validate submit cart`);
              await Common.step6ValidateSc(Common.shoppingCartId);

              logger.debug(`submitcart`);
              await Common.stepSubmit(Common.shoppingCartId);
            }
          } catch (err) {
            finalresult = false;
            errors.push(err);
          }
        }
        await Common.delay(15000);
        const pathIds = await du.getPathIdForAddress(
          add.rows[index].address_id,
          dbcfg,
        );
        for (const row of pathIds) {
          console.log(row[0]);
          await tlsApi.recoverResource(
            envcfg,
            add.rows[index].address_id,
            row[0],
          );
        }
        if (customerstoclean.length) {
          // try {
          await du.customerCleanUp(dbcfg, customerstoclean);
          // } catch (error) {
          // console.log(error);
          // }
        }
        await pu.markAddressSpare(add.rows[index].address_id, pgcfg);
      }

      if (!finalresult) {
        return Promise.reject(errors);
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async removeTopofferstocease(locationID) {
    const result = {};
    expect(
      Common.shoppingCartId,
      'SC id should not be null, please look at the previous test\n',
    ).not.toBeNull();
    let body: any;
    body = await btapi.generateShoppingCartBody.removeTopOffers(
      null,
      Common.customerCategory,
      Common.distributionChannel,
      locationID,
      Common.cartItemIdList,
    );

    return await btapi
      .$requestShoppingCart(
        btapi.TYPES.updateShoppingCart(Common.shoppingCartId),
        body,
      )
      .toPromise()
      .then(
        (success) => {
          logger.debug(JSON.stringify(success));
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              '\t',
            )}`,
          ).toBeDefined();
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              '\t',
            )}`,
          ).not.toBeNull();
          expect(
            success.response.body,
            `Response field should contain body\n${JSON.stringify(
              success,
              null,
              '\t',
            )}`,
          ).toBeDefined();
          expect(
            success.response.body,
            `Response field should contain body\n${JSON.stringify(
              success,
              null,
              '\t',
            )}`,
          ).not.toBeNull();
          body = success.response.body;
          expect(
            body.status,
            `SC should have OPEN status\n${JSON.stringify(
              success,
              null,
              '\t',
            )}`,
          ).toBe('OPEN');
          expect(
            body.cartItem,
            'Response should contain cartItem\n',
          ).toBeDefined();
          expect(body.cartItem, 'cartItem should not be null\n').not.toBeNull();
        },
        (error) => {
          logger.debug(JSON.stringify(error));
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, '\t')}`,
          ).toBe(false);
        },
      );
  }

  static async step6ValidateSc(shoppingCartId) {
    expect(
      shoppingCartId,
      'SC id should not be null, please look at the previous test\n',
    ).not.toBeNull();

    const body = bodySamples.validateOrSubmitBody(
      Common.customerCategory,
      Common.distributionChannel,
    );
    return await btapi
      .$requestShoppingCart(
        btapi.TYPES.validateShoppingCart(shoppingCartId),
        body,
      )
      .toPromise()
      .then(
        (success) => {
          logger.debug(JSON.stringify(success));
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              '\t',
            )}`,
          ).toBeDefined();
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              '\t',
            )}`,
          ).not.toBeNull();
          expect(
            success.response.body,
            `Response should contain body\n${JSON.stringify(
              success,
              null,
              '\t',
            )}`,
          ).toBeDefined();
          expect(
            success.response.body,
            `Response should contain body\n${JSON.stringify(
              success,
              null,
              '\t',
            )}`,
          ).not.toBeNull();
          const body = success.response.body;
          const responseText = JSON.stringify(success, null, '\t');
          expect(
            body,
            `Response should contain body\n${responseText}`,
          ).toBeDefined();
          expect(
            body.status,
            `SC should have OPEN status\n${responseText}`,
          ).toBe('OPEN');
          expect(
            body.cartItem,
            `Response should contain cartItem\n${responseText}`,
          ).toBeDefined();
          expect(
            body.cartItem.length,
            `cartItem should not be empty - HS, LW and WO\n${JSON.stringify(
              body.cartItem.map((elem) => {
                return {
                  id: `${elem.productOffering.id}   ${elem.productOffering.displayName}`,
                };
              }),
            )}`,
          ).toBeGreaterThan(0);

          expect(
            body.version,
            `Cart version should be defined \n${JSON.stringify(
              body,
              function (key, value) {
                return key && value && typeof value !== 'number'
                  ? Array.isArray(value)
                    ? '[object Array]'
                    : `${value}`
                  : value;
              },
              '\t',
            )}`,
          ).toBeDefined();
          expect(
            parseFloat(body.version),
            'Cart version should be greater than 0 as we are on \n',
          ).toBeGreaterThan(0);
        },
        (error) => {
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, '\t')}`,
          ).toBe(false);
        },
      );
  }

  static async stepSubmit(shoppingCartId) {
    expect(
      shoppingCartId,
      'SC id should not be null, please look at the previous test\n',
    ).not.toBeNull();

    const body = bodySamples.validateOrSubmitBody(
      Common.customerCategory,
      Common.distributionChannel,
    );

    return await btapi
      .$requestShoppingCart(
        btapi.TYPES.submitShoppingCart(shoppingCartId),
        body,
      )
      .toPromise()
      .then(
        (success) => {
          logger.debug(JSON.stringify(success));
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              '\t',
            )}`,
          ).toBeDefined();
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              '\t',
            )}`,
          ).not.toBeNull();
          expect(
            success.response.body,
            `Response should contain body\n${JSON.stringify(
              success,
              null,
              '\t',
            )}`,
          ).toBeDefined();
          expect(
            success.response.body,
            `Response should contain body\n${JSON.stringify(
              success,
              null,
              '\t',
            )}`,
          ).not.toBeNull();
          const body = success.response.body;
          const responseText = JSON.stringify(success, null, '\t');
          expect(
            body.id,
            `SalesOrderId should be defined\n${responseText}`,
          ).toBeDefined();
          expect(
            body.id,
            `SalesOrderId should not be null\n${responseText}`,
          ).not.toBe(null);
        },
        (error) => {
          logger.debug(error);
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, '\t')}`,
          ).toBe(false);
        },
      );
  }

  static async InitiateChangeOrder(customerId1, locationID) {
    const customerAccEcId = customerId1;
    const externalLocationId = locationID;
    const body = await btapi.generateShoppingCartBody.generateEmptyCart(
      customerAccEcId,
      Common.customerCategory,
      Common.distributionChannel,
      externalLocationId,
    );
    logger.debug(`Generating empty cart body:${JSON.stringify(body)}`);
    return await btapi
      .$requestShoppingCart(btapi.TYPES.createShoppingCart(), body)
      .toPromise()
      .then(
        (success) => {
          logger.debug(
            `Generating empty cart response:${JSON.stringify(
              success.response.body,
            )}`,
          );
          expect(success, 'Response should not be empty\n').not.toBeNull();
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              '\t',
            )}`,
          ).toBeDefined();
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              '\t',
            )}`,
          ).not.toBeNull();
          expect(
            success.response.body,
            `Response should contain body\n${JSON.stringify(
              success,
              null,
              '\t',
            )}`,
          ).toBeDefined();
          expect(
            success.response.body,
            `Response should contain body\n${JSON.stringify(
              success,
              null,
              '\t',
            )}`,
          ).not.toBeNull();
          const body = success.response.body;
          const responseText = JSON.stringify(success, null, '\t');
          Common.cartItemIdList = body.cartItem
            .map((item) => {
              const itemId =
                item.productOffering.id === '9138044575813494882' ||
                item.productOffering.id === '9143976374713722152'
                  ? 'n'
                  : item.id;
              return itemId;
            })
            .filter((id) => id !== 'n'); // add ignore telus connectivity 9143976374713722152, 9138044575813494882
          expect(
            success.response.statusCode,
            `statusCode should be 201${JSON.stringify(success, null, '\t')}`,
          ).toBe(201);
          expect(
            body.status,
            `SC should have OPEN status\n${responseText}`,
          ).toBe('OPEN');
          expect(
            body.cartItem,
            `Response should contain cartItem\n${responseText}`,
          ).toBeDefined();
          expect(
            body.cartItem,
            `cartItem should not be null\n${responseText}`,
          ).not.toBeNull();
          const scText = JSON.stringify(
            body.cartItem.map((elem) => {
              return {
                id: `${elem.productOffering.id}   ${elem.productOffering.displayName}`,
              };
            }),
            null,
            '\t',
          );
          expect(
            body.cartItem.length,
            `Expecting some offers to be returned \n${scText}`,
          ).toBeGreaterThan(0);
          Common.shoppingCartId = body.id;
        },
        (error) => {
          logger.debug('ERROR: ' + error);
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, '\t')}`,
          ).toBe(false);
        },
      );
  }

  static IsItemQualified(qItem, body) {
    let flag = false;
    body.serviceQualificationItem.forEach((item) => {
      if (
        item.serviceSpecification.name.toLowerCase() === qItem.toLowerCase()
      ) {
        expect(item.qualificationResult, 'Item is not qualified').toEqual(
          'qualified',
        );
        flag = true;
      }
    });
    return flag;
  }

  static getBootstrapIfExists(defaultValue: any) {
    return defaultValue[0] === '@'
      ? preconditionContext().getBootstrapData(defaultValue.slice(1))
      : defaultValue;
  }
}
