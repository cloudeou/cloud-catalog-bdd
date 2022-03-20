import * as request from 'request';
import { brconfig } from '../../br-config';
const envcfg = brconfig.getConfigForGivenEnv();
let btapicfg = brconfig.getBTApisConfig(envcfg);
const environment = btapicfg?.JEST_BTAPI_ENDPOINT;
const environmentSC = btapicfg?.JEST_BTAPI_ENDPOINT_SHOPPING_CART;
const envSQ = btapicfg?.SERVICE_QUALIFICATION_ENDPOINT;
const environmentCreateCustomer = btapicfg?.JEST_CREATECUSTOMER_ENDPOINT;
const environmentPromotion = btapicfg?.PROMOTION;
const btapiUserName = btapicfg?.BTAPI_USERNAME;
const btapiPass = btapicfg?.BTAPI_PASS;

const offeringCfg = brconfig?.getOfferingApiConfig(envcfg);
const offeringUrl = offeringCfg?.url;
const offeringUserName = offeringCfg?.user;
const offeringPass = offeringCfg?.password;

import { bodySamples } from './bodySamples';
const bodySample = new bodySamples();
import { configurationLoader } from './loader';
import { OauthToken } from '../utils/common/OauthToken';
// const configurationLoader = require('./loader');
const stringify = configurationLoader.enhanceStringify;

const { Observable } = require('rxjs');
const { first, timeout } = require('rxjs/operators');

const xmlParser = require('xml2js');

import { Logger } from '../logger/Logger';
const logger = new Logger();

export class btapi {
  static SCOPE = new (class {
    scopeForSc = '241';
    scopeForProdInv = '195';
    scopeForProdQual = '28';
    scopeForProdCat = '363';
  })();

  static HEADERS = new (class {
    getHeader(token, envP) {
      return {
        'Content-Type': 'application/json',
        Accept: '*',
        authorization: `Bearer ${token}`,
        env: envP,
      };
    }
  })();
  static TOKEN = new (class {
    async getToken(scope) {
      let auth = new OauthToken();
      return await auth.getToken(scope);
    }
  })();
  static REQUEST_TYPES = new (class {
    getShoppingCartOffering() {
      return {
        url: offeringUrl,
        method: 'POST',
      };
    }
    getProductOffering() {
      return {
        uri:
          '/marketsales/fifaproductofferingqualification/v2/productOfferingQualification',
        method: 'POST',
      };
    }
    getProductInventory(params: {
      ecid: number;
      externalLocationId: string;
      limit?: number;
      fields?: string;
    }) {
      let url =
        '/product/fifaProductInventoryManagement/v1/product' +
        '?relatedParty.id=' +
        params.ecid +
        '&relatedParty.role=customer&place.id=' +
        params.externalLocationId +
        '&place.role=service%20address';
      url += !!params.fields ? '&fields=' + params.fields : '';
      url += !!params.limit ? '&limit=' + params.limit : '';
      return {
        uri: url,
        method: 'GET',
      };
    }
    getServiceQualification() {
      return {
        uri:
          '/v2/cmo/ordermgmt/servicequalificationmanagement/serviceQualification',
        method: 'POST',
      };
    }
    getProductOfferingFiltration(params) {
      if (params === undefined || params === null || params === {}) return;
      return {
        uri:
          '/cmo/ordermgmt/tmf-api/productofferingqualificationmanagement/v1/productOfferingQualification?' +
          params,
        method: 'POST',
      };
    }

    createShoppingCart() {
      // /marketsales/fifaShoppingCart/v2/shoppingCart
      return {
        uri: '/marketsales/fifaShoppingCart/v2/shoppingCart',
        method: 'POST',
      };
    }
    updateShoppingCart(id) {
      // "/marketsales/fifaShoppingCart/v2/shoppingCart/" + id
      return {
        uri: '/marketsales/fifaShoppingCart/v2/shoppingCart/' + id,
        method: 'PUT',
      };
    }
    validateShoppingCart(shoppingCartId) {
      // "/marketsales/fifaShoppingCart/v2/shoppingCart/" + shoppingCartId + "/validate",
      return {
        uri:
          '/marketsales/fifaShoppingCart/v2/shoppingCart/' +
          shoppingCartId +
          '/validate',
        method: 'POST',
      };
    }
    submitShoppingCart(shoppingCartId) {
      // "/marketsales/fifaShoppingCart/v2/shoppingCart/" + shoppingCartId + "/checkout",
      return {
        uri:
          '/marketsales/fifaShoppingCart/v2/shoppingCart/' +
          shoppingCartId +
          '/checkout',
        method: 'POST',
      };
    }
    retrieveShoppingCart(shoppingCartId) {
      shoppingCartId = shoppingCartId == null ? '' : '/' + shoppingCartId;
      return {
        uri: '/marketsales/fifaShoppingCart/v2/shoppingCart' + shoppingCartId,
        method: 'GET',
      };
    }
    deleteShoppingCart(shoppingCartId) {
      return {
        uri: '/marketsales/fifaShoppingCart/v2/shoppingCart/' + shoppingCartId,
        method: 'DELETE',
      };
    }
    revertShoppingСartTo(shoppingCartId, version) {
      return {
        uri:
          '/marketsales/fifaShoppingCart/v2/shoppingCart/' +
          shoppingCartId +
          '/revertto/' +
          version,
        method: 'POST',
      };
    }
    getProductInstances = {
      uri: '/tmf-api/productinventorymanagement/v1/product',
      method: 'GET',
    };

    // NC API
    createCustomer() {
      return {
        uri:
          '/telus/gem/rest/api/fifacustomeraccountapi/v1/createCustomerAccount',
        method: 'POST',
      };
    }

    assignToCustomer(shoppingCartId) {
      return {
        uri: `/marketsales/fifaShoppingCart/v2/shoppingCart/` + shoppingCartId,
        method: 'PUT',
      };
    }

    applyPromotion(shoppingCartId) {
      return {
        uri: `/marketsales/fifaShoppingCart/v2/shoppingcart/` + shoppingCartId,
        method: 'PUT',
      };
    }
  })();

  static buildCorrelationId() {
    try {
      return btapi.getTestName();
    } catch (e) {
      logger.error(
        `Error Calculating Correlation-Id based on test name, error will be ignored ${JSON.stringify(
          e,
        )}`,
      );
      return 'ERROR';
    }
  }

  static getTestName() {
    if (
      global[Symbol.for('$$jest-matchers-object')].state.currentTestName != null
    ) {
      return global[Symbol.for('$$jest-matchers-object')].state.currentTestName
        .replace(/ /g, '-')
        .replace(/\[/g, '')
        .replace(/\]/g, '')
        .replace(/\(/g, '')
        .replace(/\)/g, '')
        .replace(/\,/g, '-')
        .replace(/-(-)+/g, '-');
    } else {
      return 'TEST_NAME_UNDEFINED';
    }
  }

  static buildOptionsShoppingCart(type, body, header) {
    let options: any;
    options = {
      method: type.method,
      url: type.url,
      headers: {
        'Content-Type': 'application/json',
        ...header,
      },

      body: body == null ? {} : body,
      timeout: configurationLoader.timeout - 4000,
      strictSSL: false,
      json: true,
      gzip: true,
    };
    if (btapiPass !== 'None' && btapiUserName !== 'None') {
      options.auth = {
        user: offeringUserName,
        pass: offeringPass,
        sendImmediately: false,
      };
    }
    return options;
  }

  static buildOptions(env, type?, body?, queryParams?, headers?) {
    let options: any;
    options = {
      method: type.method,
      url: queryParams == null ? env + type.uri : env + type.uri + queryParams,
      headers: {
        'Content-Type': 'application/json',
        'Correlation-Id': btapi.buildCorrelationId(),
        ...headers,
      },
      body: body == null ? {} : body,
      timeout: configurationLoader.timeout - 4000,
      strictSSL: false,
      json: true,
      gzip: true,
    };
    if (btapiPass !== 'None' && btapiUserName !== 'None') {
      options.auth = {
        user: btapiUserName,
        pass: btapiPass,
        sendImmediately: false,
      };
    }
    return options;
  }

  static buildCreateCustomerOptions(
    type,
    queryParameters,
    distributionChannelID,
    customerCategoryID,
    body,
  ) {
    let options = {
      method: type.method,
      url: environmentCreateCustomer + type.uri,
      qs: queryParameters,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body == null ? {} : body,
      timeout: configurationLoader.timeout + 50000,
      json: true,
      strictSSL: false,
      gzip: true,
    };
    return options;
  }
  static buildCreateCustomerOptionsTBAPI(
    type,
    body,
    queryParameters,
    distributionChannelID,
    customerCategoryID,
    marketId,
  ) {
    marketId = marketId === undefined ? 1 : marketId;

    let options = {
      method: type.method,
      url: environmentCreateCustomer + type.uri,
      qs: queryParameters,
      headers: {
        'Content-Type': 'application/json',
        EligibilityParams: `distributionChannelId="${distributionChannelID}",marketId="${marketId}",customerCategoryId="${customerCategoryID}"`,
        Range: '1-10000',
        Tag: process.env.BUILD_NUMBER,
        'Correlation-Id': btapi.buildCorrelationId(),
        'Accept-Language': 'en_CA',
      },
      body: body == null ? {} : body,
      timeout: configurationLoader.timeout - 4000,
      strictSSL: false,
      gzip: true,
      json: true,
    };
    logger.info(btapi.buildCorrelationId());
    logger.info(options.url);
    return options;
  }

  // module.exports = {
  static paramsRequestProductInventory(type, queryParameters) {
    return new Observable((observer) => {
      let reqOption: any;
      reqOption = btapi.buildOptionsProductInventory(type, queryParameters);
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify(body, type, {
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  }
  static buildOptionsProductInventory(type: any, queryParameters: any) {
    throw new Error('Method not implemented.');
  }
  static paramsRequest(type, queryParameters, body, offerLimits) {
    return new Observable((observer) => {
      let reqOption: any;
      reqOption = btapi.buildOptionsVariables(
        type,
        queryParameters,
        body,
        offerLimits,
      );
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify(body, type, {
            query: reqOption.qs,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  }
  static buildOptionsVariables(
    type: any,
    queryParameters: any,
    body: any,
    offerLimits: any,
  ) {
    throw new Error('Method not implemented.');
  }
  static $request(type, queryParameters?) {
    return new Observable((observer) => {
      let reqOption = btapi.buildOptions(type);
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next('' + error + '  BODY:' + body);
        } else {
          observer.next(body);
          stringify(body, type, {
            query: reqOption.qs,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    });
  }

  static requestOfferingApi(type, body) {
    return new Observable(async (observer) => {
      // console.log(`${Buffer.from("APP_CIIAUTHSDF", 'base64').toString()}:${Buffer.from("soaorgid", 'base64').toString())}`)
      const header = {
        'Content-Type': 'application/json',
        Accept: '*',
        authorization: `Basic ${Buffer.from('APP_CIIAUTHSDF:soaorgid').toString(
          'base64',
        )}`,
        env: brconfig.getPromotionEnv(envcfg),
      };
      let reqOption = btapi.buildOptionsShoppingCart(type, body, header);

      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify({
            query: reqOption.url,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout + 8000), first());
  }

  static $requestFull(type, body) {
    return new Observable(async (observer) => {
      const header = {
        'Content-Type': 'application/json',
        Accept: '*',
        authorization: `Bearer ${await this.TOKEN.getToken(
          this.SCOPE.scopeForProdQual,
        )}`,
        env: brconfig.getPromotionEnv(envcfg),
      };
      let reqOption = btapi.buildOptions(
        //environment
        environmentPromotion,
        type,
        body,
        null,
        header,
      );
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify({
            query: reqOption.url,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout + 8000), first());
  }
  static $getShoppingCartTMFAPI(requestUrl) {
    const env = brconfig.getPromotionEnv(envcfg);
    const envType = brconfig.getEnvType(envcfg);
    return new Observable(async (observer) => {
      const header = {
        'Content-Type': 'application/json',
        Accept: '*',
        authorization: `Bearer ${await this.TOKEN.getToken(
          this.SCOPE.scopeForSc,
        )}`,
        env: envType === 'development' ? 'dv01' : env,
        subEnv: envType === 'development' ? env : undefined,
      };
      request(
        {
          url: requestUrl,
          headers: header,
          method: 'GET',
          rejectUnauthorized: false,
        },
        function (error, response, body) {
          if (error) {
            observer.next({ error: error, response: response, body: body });
          } else {
            observer.next({ error: error, response: response, body: body });
            stringify(body, {
              query: requestUrl,
              headers: header,
              body: body,
            });
          }
        },
      );
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  }
  static $requestShoppingCartBTAPI(
    distributionChannelID,
    customerCategoryID,
    externalCustomerId,
    locationId,
  ) {
    return new Observable(async (observer) => {
      const header = {
        eligibilityparams: `distributionChannelId="${distributionChannelID}",marketId="22222",customerCategoryId="${customerCategoryID}"`,
        'Content-Type': 'application/json',
        Cookie: 'JSESSIONID=C26157BDDB7EBCE040194EF6C2ABDB86',
      };
      const url = `https://flcncapp-pr-tbapi.tsl.telus.com/api/v1/shoppingCart?externalCustomerId=${externalCustomerId}&locationId=${locationId}`;
      request(
        {
          url: url,
          headers: header,
          method: 'POST',
          rejectUnauthorized: false,
        },
        function (error, response, body) {
          if (error) {
            observer.next({ error: error, response: response, body: body });
          } else {
            observer.next({ error: error, response: response, body: body });
            stringify(body, {
              query: url,
              headers: header,
              body: body,
            });
          }
        },
      );
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  }

  static $requestShoppingCart(type, body, queryParams?) {
    const env = brconfig.getPromotionEnv(envcfg);
    const envType = brconfig.getEnvType(envcfg);
    return new Observable(async (observer) => {
      const header = {
        'Content-Type': 'application/json',
        Accept: '*',
        authorization: `Bearer ${await this.TOKEN.getToken(
          this.SCOPE.scopeForSc,
        )}`,
        env: envType === 'development' ? 'dv01' : env,
        subEnv: envType === 'development' ? env : undefined,
      };
      let reqOption = btapi.buildOptions(
        environmentSC,
        type,
        body,
        queryParams,
        header,
      );
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify(body, type, {
            query: reqOption.url,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  }

  static $requestPromotion(type, body, queryParams) {
    return new Observable(async (observer) => {
      const header = {
        'Content-Type': 'application/json',
        Accept: '*',
        authorization: `Bearer ${await this.TOKEN.getToken(
          this.SCOPE.scopeForSc,
        )}`,
        env: brconfig.getPromotionEnv(envcfg),
      };
      let reqOption = btapi.buildOptions(
        environmentPromotion,
        type,
        body,
        queryParams,
        header,
      );
      logger.debug(`reqOption = ${JSON.stringify(reqOption)}`);
      logger.debug(`myurl=${reqOption.url}`);
      logger.debug(`queryParam=${JSON.stringify(queryParams)}`);
      logger.debug(`headers=${JSON.stringify(header)}`);
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify(body, type, {
            query: reqOption.url,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  }

  static $requestProductCatalog(offers: Array<String>) {
    return new Observable(async (observer) => {
      const headers = {
        Accept: '*',
        Authorization: `Bearer ${await this.TOKEN.getToken(
          this.SCOPE.scopeForProdCat,
        )}`,
        env: brconfig.getPromotionEnv(envcfg),
      };

      const queryParams: String = `id=${offers.join(',')}`;

      const reqOptions = {
        url: `${environment}marketsales/fifaproductcatalogmanagement/v1/productOffering?${queryParams}`,
        method: 'GET',
        agentOptions: {
          rejectUnauthorized: false,
        },
        headers,
      };

      request(reqOptions, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: null, response: response, body: body });
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  }

  static $requestProductInventory(type?, body?, queryParams?) {
    const env = brconfig.getPromotionEnv(envcfg);
    const envType = brconfig.getEnvType(envcfg);
    type = type || null;
    body = body || null;
    queryParams = queryParams || null;

    return new Observable(async (observer) => {
      const headers = {
        'Content-Type': 'application/json',
        Accept: '*',
        authorization: `Bearer ${await this.TOKEN.getToken(
          this.SCOPE.scopeForProdInv,
        )}`,
        env: envType === 'development' ? 'dv01' : env,
        subEnv: envType === 'development' ? env : undefined,
      };
      let reqOption = btapi.buildOptions(
        environmentPromotion,
        type,
        body,
        queryParams,
        headers,
      );
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify(body, type, {
            query: reqOption.url,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  }

  static $requestServiceQualification(type, body, queryParams?) {
    return new Observable((observer) => {
      let reqOption = btapi.buildOptions(envSQ, type, body, queryParams);
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify(body, type, {
            query: reqOption.url,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  }
  static $requestShoppingCartOpenShift(type, body, queryParams) {
    return new Observable((observer) => {
      let newURL =
        'https://shoppingcarttmfmicroservice-itn' +
        environmentSC.substring(22, 24) +
        '-foma.paas-app-west-np.tsl.telus.com';
      let newType = {
        uri: String(type.uri).replace('/cmo/ordermgmt', ''),
        method: type.method,
      };
      let reqOption = btapi.buildOptions(newURL, newType, body, queryParams);
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify(body, type, {
            query: reqOption.url,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  }
  static $requestProductOfferingQualificationOpenShift(
    type,
    body,
    queryParams,
  ) {
    return new Observable((observer) => {
      let newURL =
        'https://productofferingqualification-itn' +
        environmentSC.substring(22, 24) +
        '-foma.paas-app-west-np.tsl.telus.com';
      let newType = {
        uri: String(type.uri).replace('/cmo/ordermgmt', ''),
        method: type.method,
      };
      let reqOption = btapi.buildOptions(newURL, newType, body, queryParams);
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify(body, type, {
            query: reqOption.url,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  }
  static $requestCreateCustomer(
    type,
    queryParameters,
    body,
    distributionChannelID,
    customerCategoryID,
  ) {
    return new Observable((observer) => {
      let reqOption = btapi.buildCreateCustomerOptions(
        type,
        queryParameters,
        distributionChannelID,
        customerCategoryID,
        body,
      );
      request(reqOption, function (error, response, body) {
        console.log(response);
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify(body, type, {
            query: reqOption.qs,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  }
  static $requestCreateCustomerTBAPI(
    type,
    queryParameters,
    body,
    distributionChannelID,
    customerCategoryID,
  ) {
    logger.debug('BODY' + JSON.stringify(body));
    return new Observable((observer) => {
      let reqOption = btapi.buildCreateCustomerOptions(
        type,
        body,
        queryParameters,
        distributionChannelID,
        customerCategoryID,
      );
      request(reqOption, function (error, response, body) {
        if (error) {
          logger.info('false');
          observer.next({ error: error, response: response, body: body });
        } else {
          logger.info('true');
          observer.next({ error: error, response: response, body: body });
          logger.info(response);
          logger.info(body);
          stringify(body, type, {
            query: reqOption.qs,
            headers: reqOption.headers,
            body: reqOption.body,
          });
          logger.info(
            stringify(body, type, {
              query: reqOption.qs,
              headers: reqOption.headers,
              body: reqOption.body,
            }),
          );
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  }
  static TYPES = btapi.REQUEST_TYPES;
  static data = require('../../test-data/test.data').data;
  static timeout = configurationLoader.timeout;
  static stringify = configurationLoader.enhanceStringify;
  static getBy(fieldName, fieldValue, array) {
    let result = [];
    array.forEach((element) => {
      if (element[fieldName] == fieldValue) {
        result.push(element);
      }
    });
    if (result.length == 1) {
      return result[0];
    }
    return null;
  }
  static getArrayBy(fieldName, fieldValue, array) {
    let result = [];
    expect(
      Array.isArray(array),
      'getArrayBy method requires Array to find the element. Possible Issue within the test. Received ' +
        typeof array,
    ).toBe(true);
    array.forEach((element) => {
      if (element[fieldName] == fieldValue) {
        result.push(element);
      }
    });
    if (result.length > 0) {
      return result;
    }
    return null;
  }
  static getByParent(fieldName, fieldValue, array, parent) {
    /**
     * array = item
     * parent = product
     * fieldName = 'id'
     * fieldValue = '123'
     * item{
     *     product{
     *         id: "123"
     *         name: "someName"
     *     }
     *     productOffering{
     *         id: "123"
     *         name: "someName"
     *     }
     * }
     * @type {Array}
     */
    let result = [];
    array.forEach((element) => {
      parent = parent == null ? 'productOffering' : parent;
      let subElement = element[parent]; // Product , productOffering
      if (subElement[fieldName] == fieldValue) {
        result.push(element[parent]);
      }
    });
    if (result.length == 1) {
      return result[0];
    }
    return null;
  }

  static getRandomInt(min, max) {
    // min is included and max is excluded
    return Math.floor(Math.random() * (max - min)) + min;
  }
  static wait(ms) {
    let startPoint: any;
    let endPoint = null;
    startPoint = new Date();
    do {
      endPoint = new Date();
    } while (endPoint - startPoint < ms);
  }

  static async verifyCreateCustomerAccountTBAPI(
    queryBody,
    distributionChannel?,
    customerCategory?,
  ) {
    distributionChannel =
      distributionChannel === undefined || distributionChannel === null
        ? btapi.data.distributionChannel.SSP
        : distributionChannel;
    customerCategory =
      customerCategory === undefined || customerCategory === null
        ? btapi.data.customerCategory.CONSUMER
        : customerCategory;
    let isBCA = queryBody.isBusiness ? true : false;
    return await btapi
      .$requestCreateCustomer(
        btapi.TYPES.createCustomer(),
        {},
        queryBody,
        distributionChannel,
        customerCategory,
      )
      .toPromise()
      .then(
        (success) => {
          expect(
            success.response,
            'Response should be received' + JSON.stringify(success, null, '\t'),
          ).not.toBeNull();
          expect(
            success.body,
            'Response should contain body' +
              JSON.stringify(success, null, '\t'),
          ).not.toBeNull();
          let customerAccount = success.body;
          let successText = JSON.stringify(success, null, '\t');
          let customerAccountText = JSON.stringify(customerAccount, null, '\t');
          expect(
            customerAccount,
            'Customer account should have been created successfully\n' +
              successText,
          ).not.toBeNull();
          if (!isBCA) {
            logger.debug('TESTIK' + JSON.stringify(customerAccount));
            expect(
              customerAccount.ecid,
              'Customer external ID should be defined and not empty\n' +
                customerAccountText,
            ).not.toBeNull();
            expect(
              customerAccount.ecid.length,
              'Customer external ID should have more than one character\n' +
                customerAccountText,
            ).toBeGreaterThan(1);
          }
          expect(
            customerAccount.customerAccountObjectId,
            'Customer account ID should be defined and not empty\n' +
              customerAccountText,
          ).not.toBeNull();
          expect(
            customerAccount.customerAccountObjectId.length,
            'Customer account ID should have more than one character\n' +
              customerAccountText,
          ).toBeGreaterThan(1);
          logger.debug(
            `Customer Id: ${customerAccount.customerAccountObjectId}\nECID: ${customerAccount.ecid}`,
          );
          logger.info(customerAccount.ecid);
          return {
            ecid: customerAccount.ecid,
            customerId: customerAccount.customerAccountObjectId,
            ban: customerAccount.billingAccountNum,
            creditCheckPerformed: customerAccount.creditCheckPerformed,
          };
        },
        (error) => {
          expect(
            true,
            'Error in creating Customer Account' +
              JSON.stringify(error, null, '\t'),
          ).toBe(false);
        },
      )
      .catch((err) => {
        logger.debug(
          'Error: ' +
            err.message.replace('\n', '\n') +
            '\nTimestamp: ' +
            new Date(new Date().getTime()),
        );
        if (err.matcherResult != null) {
          throw err;
        }
      });
  }
  static parseXmlResponse(xml) {
    var parser = new xmlParser.Parser({ explicitArray: false });
    var parseString = parser.parseString;

    var prefixMatch = new RegExp(/<(\/?)([^:>\s]*:)?([^>]+)>/g);
    xml = xml.replace(prefixMatch, '<$1$3>');

    return new Promise((resolve, reject) => {
      parseString(xml, (err, result) => {
        if (err) {
          reject(err);
        } else {
          logger.info(
            'RESULT' +
              JSON.stringify(
                result.Envelope.Body.searchAvailableAppointmentListResponse
                  .availableAppointmentList,
              ),
          );
          resolve(result);
        }
      });
    });
  }

  static generateShoppingCartBody = new (class {
    // addTopOffers(
    //   customerAccountECID,
    //   customerCategory,
    //   distributionChannel,
    //   externalLocationId,
    //   offerList,
    // ) {
    //   let cartItems = [];
    //   offerList.forEach((offer) => {
    //     let cartItem = bodySample.addTopOfferItem(offer);
    //     cartItems.push(cartItem);
    //   });

    //   let body = bodySample.mainBody(
    //     customerAccountECID,
    //     customerCategory,
    //     distributionChannel,
    //     externalLocationId,
    //     cartItems,
    //   );

    //   return body;
    // }

    // addChildOffers(
    //   customerAccountECID,
    //   customerCategory,
    //   distributionChannel,
    //   externalLocationId,
    //   childofferList,
    //   parentItemId,
    // ) {
    //   let cartItems = [];
    //   childofferList.forEach((childOffer) => {
    //     let cartItem = bodySample.addchildOfferItem(childOffer, parentItemId);
    //     cartItems.push(cartItem);
    //   });

    //   let body = bodySample.mainBody(
    //     null,
    //     customerCategory,
    //     distributionChannel,
    //     externalLocationId,
    //     cartItems,
    //   );

    //   return body;
    // }

    // removeChildOffers(
    //   customerAccountECID,
    //   customerCategory,
    //   distributionChannel,
    //   externalLocationId,
    //   childofferList,
    //   parentItemId,
    // ) {
    //   let cartItems = [];
    //   childofferList.forEach((childOffer) => {
    //     let cartItem = bodySample.removechildOfferItem(
    //       childOffer,
    //       parentItemId,
    //     );
    //     cartItems.push(cartItem);
    //   });

    //   let body = bodySample.mainBody(
    //     null,
    //     customerCategory,
    //     distributionChannel,
    //     externalLocationId,
    //     cartItems,
    //   );

    //   return body;
    // }

    updateCharsTopItem(
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId,
      charList,
      item,
      charSalesItems,
    ) {
      let charItems = [];
      charList.forEach((charContainter) => {
        let charItem = bodySample.charItem(charContainter);
        charItems.push(charItem);
      });

      let cartItems = [];

      cartItems.push(bodySample.updateTopOfferItem(item, charItems));

      let body = bodySample.mainBody(
        null,
        customerCategory,
        distributionChannel,
        externalLocationId,
        cartItems,
        charSalesItems,
      );

      return body;
    }

    updateCharsChildItem(
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId,
      charList,
      childItemId,
      parentItemId,
      charSalesItems,
    ) {
      let charItems = [];
      charList.forEach((charContainter) => {
        let charItem = bodySample.charItem(charContainter);
        charItems.push(charItem);
      });

      let cartItems = [];

      cartItems.push(
        bodySample.updateChildOfferItem(childItemId, parentItemId, charItems),
      );

      let body = bodySample.mainBody(
        null,
        customerCategory,
        distributionChannel,
        externalLocationId,
        cartItems,
        charSalesItems,
      );

      return body;
    }

    generateEmptyCart(
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId,
    ) {
      return bodySample.mainBody(
        customerAccountECID,
        customerCategory,
        distributionChannel,
        externalLocationId,
      );
    }

    removeTopOffers(
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId,
      offerItemList,
    ) {
      let cartItems = [];
      offerItemList.forEach((item) => {
        let cartItem = bodySample.removeTopOfferItem(item);
        cartItems.push(cartItem);
      });

      let body = bodySample.mainBody(
        customerAccountECID,
        customerCategory,
        distributionChannel,
        externalLocationId,
        cartItems,
      );

      return body;
    }
  })();

  static validateMessage(errorList, ruleId, message) {
    let flag = false;

    errorList.forEach((error) => {
      if (error.ruleReferenceId == ruleId) {
        error.customRuleParameters.forEach((generatedMessage) => {
          if ((generatedMessage.name = 'GENERATED_MESSAGE')) {
            flag = generatedMessage.value == message;
          }
        });
        if (flag == false) {
          flag = error.message == message;
        }
        return flag;
      }
    });
  }

  static validateAllMessagePresense(errorList, ruleIdList) {
    let absentErrors = [];

    errorList.forEach((error) => {
      if (!ruleIdList.includes(error.ruleReferenceId)) {
        absentErrors.push(error.ruleReferenceId);
      }
    });
    return absentErrors;
  }
}
