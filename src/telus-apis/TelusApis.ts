require('../../src/globals/MyTypeDefs');
import * as request from 'superagent';
import { FileSystem } from '../../src/utils/common/FileSystem';
import { StringUtils } from '../utils/common/StringUtils';
import { DateUtils } from '../../src/utils/common/DateUtils';
let path = require('path');
const req = require('request');
const retry = require('retry-as-promised');

require('superagent-proxy')(request);

import { brconfig } from '../../br-config';
import { Logger } from '../../src/logger/Logger';
import { add, head } from 'lodash';
import retryAsPromised = require('retry-as-promised');
const envcfg = brconfig.getConfigForGivenEnv();
const dbcfg = brconfig.getDbConfig(envcfg);
import {
  useOracleDB as du,
  useOracleDbQueries as dq,
} from '../../src/utils/dbUtils/useOracleDB';
const logger = new Logger();

export class TelusApiUtils {
  async processHoldOrderTask(cfg, taskObjectId) {
    logger.enterMethod(
      `Using netcracker api to complete holorder task ${taskObjectId}`,
    );
    // Disable TLS/SSL unauthorized verification; i.e. ignore ssl certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    let api =
      cfg.holdOrderTaskCompletion.base + cfg.holdOrderTaskCompletion.endpoint;
    let contentType = null;
    if (!StringUtils.isEmpty(cfg.holdOrderTaskCompletion.contentType)) {
      contentType = {
        'Content-Type': cfg.holdOrderTaskCompletion.contentType,
      };
    }
    logger.debug(`api-url: ${api}
       headers: ${JSON.stringify(contentType)}`);
    const keywordToReplace = '#TASK_OBJECT_ID#';
    logger.debug(`Replacing ${keywordToReplace} in api with ${taskObjectId}`);
    api = StringUtils.replaceString(api, keywordToReplace, taskObjectId);
    logger.debug(`api after replacing keywords: ${api}`);
    logger.debug(`Hitting as below details:
      api: ${api}
      contentType: ${JSON.stringify(contentType)}`);
    const response = await request('get', api)
      .auth('fifaomsupportapi', 'omSupport2020*', { type: 'basic' })
      .set(contentType)
      .send();
    logger.debug(response.status);
    return response;
  }
  /**
   *
   * @param {TelusApis} cfg
   * @param {String} workOrderNumber
   */ async processWorkOrder(cfg, workOrderNumber) {
    logger.enterMethod(
      `Using netcracker api to complete work order ${workOrderNumber}`,
    );
    // Disable TLS/SSL unauthorized verification; i.e. ignore ssl certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const api = cfg.workOrderCompletion.base + cfg.workOrderCompletion.endpoint;
    const contentType = {
      'Content-Type': cfg.workOrderCompletion.contentType,
    };
    logger.debug(`api-url: ${api}
        headers: ${JSON.stringify(contentType)}`);

    const keywordToReplace = cfg.workOrderCompletion.keywordsToReplace[0];
    logger.debug(
      `keywords to replace in body: ${JSON.stringify(keywordToReplace)}`,
    );

    let rawBody = FileSystem.readFileSync(
      cfg.workOrderCompletion.fileForBody,
    ).toString();
    rawBody = StringUtils.replaceString(
      rawBody,
      keywordToReplace,
      workOrderNumber,
    );
    rawBody = rawBody.replace(/\r?\n|\r/g, ' ');
    logger.trace(`raw body after replacing keywords: ${rawBody}`);

    // const response = await request("post", api).set(contentType).send(rawBody);
    const response = await this.postNgetResponse(api, contentType, rawBody);

    logger.trace(`response received: ${response}`);
    logger.exitMethod(`response status: ${response.status}`);
    return response;
  }

  /**
   *
   * @param {TelusApis} cfg
   * @param {String} workOrderNumber
   */
  async processReleaseActivation(cfg, workOrderNumber) {
    logger.enterMethod(
      `Using netcracker api to send release activation event for work order ${workOrderNumber}`,
    );
    // Disable TLS/SSL unauthorized verification; i.e. ignore ssl certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const api = cfg.releaseActivation.base + cfg.releaseActivation.endpoint;
    const contentType = {
      'Content-Type': cfg.releaseActivation.contentType,
    };
    logger.debug(`api-url: ${api}
        headers: ${JSON.stringify(contentType)}`);

    const keywordToReplace = cfg.releaseActivation.keywordsToReplace[0];
    logger.debug(
      `keywords to replace in body: ${JSON.stringify(keywordToReplace)}`,
    );
    let rawBody = FileSystem.readFileSync(
      cfg.releaseActivation.fileForBody,
    ).toString();
    rawBody = StringUtils.replaceString(
      rawBody,
      keywordToReplace,
      workOrderNumber,
    );
    rawBody = rawBody.replace(/\r?\n|\r/g, ' ');
    logger.trace(`Raw body after replacing keywords: ${rawBody}`);

    // const response = await request("post", api).set(contentType).send(rawBody);
    const response = await this.postNgetResponse(api, contentType, rawBody);

    logger.trace(`response received: ${response}`);
    logger.exitMethod(`response status: ${response.status}`);
    return response;
  }

  /**
   *
   * @param {TelusApis} cfg
   * @param {String} locationId
   */

  async processSearchAvailableAppointment(cfg, locationId) {
    // Disable TLS/SSL unauthorized verification; i.e. ignore ssl certificates
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let now = new Date();
    let startDate = DateUtils.formatDate(DateUtils.currentDateTime(), '-');
    let endDate = DateUtils.formatDate(now.setDate(now.getDate() + 14), '-');
    logger.enterMethod(
      `Using WFM api to get available appointment slots from ${startDate} till ${endDate} for location - ${locationId}`,
    );
    let api =
      cfg.searchAvailableAppointments.base +
      cfg.searchAvailableAppointments.endpoint;
    let contentType = {
      'Content-Type': cfg.searchAvailableAppointments.contentType,
    };
    logger.debug(`api-url: ${api}
       headers: ${JSON.stringify(contentType)}`);

    let rawBody = FileSystem.readFileSync(
      cfg.searchAvailableAppointments.fileForBody,
    ).toString();

    let keywordToReplace = '#startDate#';
    logger.debug(`Replacing ${keywordToReplace} in body with ${startDate}`);
    rawBody = StringUtils.replaceString(rawBody, keywordToReplace, startDate);

    keywordToReplace = '#endDate#';
    logger.debug(`Replacing ${keywordToReplace} in body with ${endDate}`);
    rawBody = StringUtils.replaceString(rawBody, keywordToReplace, endDate);
    keywordToReplace = '#locationId#';
    logger.debug(`Replacing ${keywordToReplace} in body with ${locationId}`);
    rawBody = StringUtils.replaceString(rawBody, keywordToReplace, locationId);

    rawBody = rawBody.replace(/\r?\n|\r/g, ' ');
    logger.debug(`Hitting as below details:
    api: ${api}
    contentType: ${JSON.stringify(contentType)}
    rawBody: ${rawBody}`);

    let response = await request('post', api)
      .auth('NETCRACKER', 'soaorgid')
      .set(contentType)
      .send(rawBody);
    logger.debug(`response received: ${JSON.stringify(response)}`);
    logger.exitMethod(`response status: ${response.status}`);
    return response;
  }

  /**
   *
   * @param {TelusApis} cfg
   * @param {String} orderNumber
   * @param {String} purchaseOrderNumber
   */
  async processShipmentOrder(cfg, orderNumber, purchaseOrderNumber) {
    logger.enterMethod(
      `Using netcracker api to complete shipment order for order ${orderNumber},  purchase-order-number ${purchaseOrderNumber}`,
    );
    // Disable TLS/SSL unauthorized verification; i.e. ignore ssl certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const trackingNumber = '539459352A';
    const shipper = 'CANADA POST';
    const expectedDeliveryDate = DateUtils.dateMMDDYYYY(
      DateUtils.tomorrowDate(),
      '/',
    );

    const api =
      cfg.shipmentOrderCompletion.base + cfg.shipmentOrderCompletion.endpoint;
    const contentType = {
      'Content-Type': cfg.shipmentOrderCompletion.contentType,
    };
    logger.debug(`api-url: ${api}
       headers: ${JSON.stringify(contentType)}`);

    let rawBody = FileSystem.readFileSync(
      cfg.shipmentOrderCompletion.fileForBody,
    ).toString();

    let keywordToReplace = '#orderNumber#';
    logger.debug(`Replacing ${keywordToReplace} in body with ${orderNumber}`);
    rawBody = StringUtils.replaceString(rawBody, keywordToReplace, orderNumber);

    keywordToReplace = '#trackingNumber#';
    logger.debug(
      `Replacing ${keywordToReplace} in body with ${trackingNumber}`,
    );
    rawBody = StringUtils.replaceString(
      rawBody,
      keywordToReplace,
      trackingNumber,
    );
    keywordToReplace = '#expectedDeliveryDate#';
    logger.debug(
      `Replacing ${keywordToReplace} in body with ${expectedDeliveryDate}`,
    );
    rawBody = StringUtils.replaceString(
      rawBody,
      keywordToReplace,
      expectedDeliveryDate,
    );
    keywordToReplace = '#purchaseOrderNumber#';
    logger.debug(
      `Replacing ${keywordToReplace} in body with ${purchaseOrderNumber}`,
    );
    rawBody = StringUtils.replaceString(
      rawBody,
      keywordToReplace,
      purchaseOrderNumber,
    );
    keywordToReplace = '#shipper#';
    logger.debug(`Replacing ${keywordToReplace} in body with ${shipper}`);
    rawBody = StringUtils.replaceString(rawBody, keywordToReplace, shipper);
    logger.debug(`raw body after replacing keywords: ${rawBody}`);

    rawBody = rawBody.replace(/\r?\n|\r/g, ' ');
    logger.debug(`Hitting as below details:
    api: ${api}
    contentType: ${JSON.stringify(contentType)}
    rawBody: ${rawBody}`);

    // const response = await request("post", api).set(contentType).send(rawBody);
    const response = await this.postNgetResponse(api, contentType, rawBody);
    logger.debug(`response received: ${JSON.stringify(response)}`);
    logger.exitMethod(`response status: ${response.status}`);
    return response;
  }

  /**
   *
   * @param {TelusApis} cfg
   * @param {String} taskObjectId
   */
  async processManualTask(cfg, taskObjectId) {
    logger.enterMethod(
      `Using netcracker api to complete manual task ${taskObjectId}`,
    );
    // Disable TLS/SSL unauthorized verification; i.e. ignore ssl certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    let api = cfg.manualTaskCompletion.base + cfg.manualTaskCompletion.endpoint;
    let contentType = null;
    if (!StringUtils.isEmpty(cfg.manualTaskCompletion.contentType)) {
      contentType = {
        'Content-Type': cfg.manualTaskCompletion.contentType,
      };
    }
    logger.debug(`api-url: ${api}
       headers: ${JSON.stringify(contentType)}`);

    const keywordToReplace = '#TASK_OBJECT_ID#';
    logger.debug(`Replacing ${keywordToReplace} in api with ${taskObjectId}`);
    api = StringUtils.replaceString(api, keywordToReplace, taskObjectId);
    logger.debug(`api after replacing keywords: ${api}`);
    console.log(`manual-task-api-url: ${api}`);

    let response = null;
    if (!StringUtils.isEmpty(contentType)) {
      //  // logger.debug(`Hitting as below details:
      //   api: ${api}
      //   contentType: ${JSON.stringify(contentType)}`);
      response = await request('post', api).set(contentType).send();
    } else {
      // logger.debug(`Hitting api: ${api}`);
      try {
        response = await request('post', api).send();
      } catch (err) {
        logger.error(err);
      }
    }
    //logger.debug(`response received: ${JSON.stringify(response)}`);
    //logger.exitMethod(`response status: ${response.status}`);
    logger.debug(response);
    return response;
  }

  async postNgetResponse(api, contentType, rawBody) {
    let response: any;
    await retry(
      function (options) {
        return request('post', api)
          .set(contentType)
          .send(rawBody)
          .then((resp) => {
            try {
              if (resp.status === 200) {
                response = resp;
              } else {
                throw new Error('Response not received');
              }
            } catch (error) {
              throw (
                'Api: ' +
                api +
                '\nContentType: ' +
                contentType +
                '\nrawBody: ' +
                rawBody +
                '\nERROR: ' +
                error
              );
            }
          });
      },
      {
        max: 5, // maximum amount of tries
        timeout: 20000, // throw if no response or error within millisecond timeout, default: undefined,
        backoffBase: 3000, // Initial backoff duration in ms. Default: 100,
      },
    );
    return response;
  }

  async recoverResource(cfg, addressId, pathId) {
    logger.enterMethod(`Using netcracker api to recover address: ${addressId}`);
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    let api = cfg.telusapis.resourceRecovery.baseUrl;
    let headers = {};
    if (!StringUtils.isEmpty(cfg.telusapis.resourceRecovery.contentType)) {
      headers = {
        'Content-Type': cfg.telusapis.resourceRecovery.contentType,
      };
    }
    const auth = new Buffer(
      cfg.telusapis.resourceRecovery.userName +
        ':' +
        cfg.telusapis.resourceRecovery.password,
    ).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
    logger.debug(`api-url: ${api}
       headers: ${JSON.stringify(headers)}`);

    let rawBody = FileSystem.readFileSync(
      path.resolve(__dirname, cfg.telusapis.resourceRecovery.fileForBody),
    ).toString();
    rawBody = StringUtils.replaceString(
      rawBody,
      cfg.telusapis.resourceRecovery.keywordsToReplace[0],
      addressId,
    );
    rawBody = StringUtils.replaceString(
      rawBody,
      cfg.telusapis.resourceRecovery.keywordsToReplace[1],
      pathId,
    );
    rawBody = rawBody.replace(/\r?\n|\r/g, ' ');
    logger.trace(`Raw body after replacing keywords: ${rawBody}`);
    let response;
    const options = {
      method: 'POST',
      url: api,
      headers,
      agentOptions: {
        rejectUnauthorized: false,
      },
      body: rawBody,
    };
    req(options, (error, response) => {
      try {
        logger.debug(`response received: ${JSON.stringify(response)}`);
        logger.exitMethod(
          `response status: ${response.statusCode}, \n body: ${response.body}`,
        );
        if (response.statusCode == 200) {
          return 200;
        } else {
          return response.statusCode;
        }
      } catch (err) {
        console.log(error);
        return false;
      }
    });
  }

  async completeAppleTVNewTelusEquipmentOrder(
    cfg,
    customerId,
    orderNumber,
    purchaseNumber,
  ) {
    logger.enterMethod(
      `Using netcracker api to complete Apple TV order for customer ${customerId}`,
    );
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const api = cfg.telusapis.completeAppleTVNewTelusEqiupment.baseUrl;
    let headers = {};
    if (
      !StringUtils.isEmpty(
        cfg.telusapis.completeAppleTVNewTelusEqiupment.contentType,
      )
    ) {
      headers = {
        'Content-Type':
          cfg.telusapis.completeAppleTVNewTelusEqiupment.contentType,
      };
    }
    let rawBody = FileSystem.readFileSync(
      path.resolve(
        __dirname,
        cfg.telusapis.completeAppleTVNewTelusEqiupment.fileForBody,
      ),
    ).toString();
    logger.debug(`api-url: ${api}
       headers: ${JSON.stringify(headers)}`);
    rawBody = StringUtils.replaceString(
      rawBody,
      cfg.telusapis.completeAppleTVNewTelusEqiupment.keywordsToReplace[0],
      orderNumber,
    );
    rawBody = StringUtils.replaceString(
      rawBody,
      cfg.telusapis.completeAppleTVNewTelusEqiupment.keywordsToReplace[1],
      new Date().toISOString().split('T')[0].split('-').reverse().join('/'),
    );
    rawBody = StringUtils.replaceString(
      rawBody,
      cfg.telusapis.completeAppleTVNewTelusEqiupment.keywordsToReplace[2],
      purchaseNumber,
    );
    rawBody = StringUtils.replaceString(
      rawBody,
      cfg.telusapis.completeAppleTVNewTelusEqiupment.keywordsToReplace[3],
      customerId,
    );
    rawBody = rawBody.replace(/\r?\n|\r/g, ' ');
    logger.trace(`Raw body after replacing keywords: ${rawBody}`);
    let response;
    const options = {
      method: 'POST',
      url: api,
      headers,
      agentOptions: {
        rejectUnauthorized: false,
      },
      body: rawBody,
    };
    req(options, (error, response) => {
      try {
        logger.debug(`response received: ${JSON.stringify(response)}`);
        logger.exitMethod(
          `response status: ${response.statusCode}, \n body: ${response.body}`,
        );
        if (response.statusCode == 200) {
          return 200;
        } else {
          return response.statusCode;
        }
      } catch (err) {
        console.log(error);
        return false;
      }
    });
  }
  /**
   *
   * @param {TelusApis} cfg
   * @param {String} customerId
   */
  async setMigrationFlag(cfg, customerId) {
    logger.enterMethod(
      `Using netcracker api to set migrated flag for customer: ${customerId}`,
    );
    // Disable TLS/SSL unauthorized verification; i.e. ignore ssl certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    let api = cfg.setMigrationFlag.base + cfg.setMigrationFlag.endpoint;
    let contentType = null;
    if (!StringUtils.isEmpty(cfg.setMigrationFlag.contentType)) {
      contentType = {
        'Content-Type': cfg.setMigrationFlag.contentType,
      };
    }
    logger.debug(`api-url: ${api}
       headers: ${JSON.stringify(contentType)}`);

    const keywordToReplace = '#CUSTOMER_ID#';
    logger.debug(`Replacing ${keywordToReplace} in api with ${customerId}`);
    api = StringUtils.replaceString(api, keywordToReplace, customerId);
    console.log(api);
    logger.debug(`api after replacing keywords: ${api}`);

    let response = null;
    if (!StringUtils.isEmpty(contentType)) {
      logger.debug(`Hitting as below details:
      api: ${api}
      contentType: ${JSON.stringify(contentType)}`);
      response = await request('put', api).set(contentType).send();
    } else {
      logger.debug(`Hitting api: ${api}`);
      response = await request('put', api).send();
    }
    logger.debug(`response received: ${JSON.stringify(response)}`);
    logger.exitMethod(`response status: ${response.status}`);
    return response;
  }
}
