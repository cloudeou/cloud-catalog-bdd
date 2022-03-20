import { Identificators } from './../contexts/Identificators';
import PreconditionContext from './../contexts/PreconditionContext';
import ResponseContext from './../contexts/ResponseContext';
import ShoppingCartContext from './../contexts/ShoppingCartContext';
import { StepDefinitions, loadFeatures } from 'jest-cucumber';
import { featureContext } from '@telus-bdd/telus-bdd';
import { btapi } from '../../src/bt-api/btapi';
import { TelusApiUtils } from '../../src/telus-apis/TelusApis';
import * as retry from 'retry-as-promised';
import { Logger } from '../../src/logger/Logger';
import { Common } from '../../src/utils/commonBDD/Common';

// import { Backend } from '../helper/Backend';

// const { brconfig } = require('../../br-config');
import { brconfig } from '../../br-config';
const envcfg = brconfig.getConfigForGivenEnv();
const apicfg = brconfig.getTelusApisConfig(envcfg);
const dbcfg = brconfig.getDbConfig(envcfg);
import {
  useOracleDB as du,
  useOracleDbQueries as dq,
} from '../../src/utils/dbUtils/useOracleDB';
import ErrorContext  from '../contexts/ErrorContext';

const logger = new Logger();
export const backendSteps: StepDefinitions = ({ given, and, when, then }) => {
  let preconditionContext = (): PreconditionContext =>
    featureContext().getContextById(Identificators.preConditionContext);
  let responseContext = (): ResponseContext =>
    featureContext().getContextById(Identificators.responseContext);
  let shoppingCartContext = (): ShoppingCartContext =>
    featureContext().getContextById(Identificators.shoppingCartContext);

  let tapis = new TelusApiUtils();

  when('try to complete sales order on BE', async () => {
    let customExternalId = preconditionContext().getExternalCustomerId;
    let addressId = preconditionContext().getAddressId();
    let salesOrderId = shoppingCartContext().getSalesOrderId();
    logger.debug('Sales Order ID' + salesOrderId);
    expect(customExternalId).toBeDefined();
    expect(customExternalId, 'Customer external Id is null').not.toBeNull();
    expect(salesOrderId).toBeDefined();
    expect(salesOrderId, 'Sales order Id is null').not.toBeNull();
    let response = responseContext().getShoppingCartResponse();
    expect(response, 'Response is null').not.toBeNull();
    const customerId = preconditionContext().getCustomerObjectId();
    const ECID = preconditionContext().getExternalCustomerId();
    logger.debug('customer id' + customerId);
    let order: any;
    order = { customerId };
    order.customerId = customerId;
    logger.debug(`Customer's internal id: ${order.customerId}`);
    logger.debug('Storing Manual Task Id');

    const incompleteorders = await du.select(
      dbcfg,
      dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
        dbcfg,
        customerId,
      ),
    );

    if (!!incompleteorders && incompleteorders.length > 0) {
      const manualCreditTaskId = await du.getManualCreditTaskId(
        dbcfg,
        customerId,
      );
      if (manualCreditTaskId !== null) {
        await tapis.processManualTask(apicfg, manualCreditTaskId);
        await Common.delay(5000);
      }
      let pendingWorkOrders;
      logger.debug('Getting pending work orders');
      await retry(
        async function (options) {
          // options.current, times callback has been called including this call
          return await du
            .getWorkOrderNumbersNotCompleted(dbcfg, customerId)
            .then((response) => {
              if (response.length === undefined) {
                throw 'Got pending work orders as undefined' + response;
              }
              pendingWorkOrders = response;
            });
        },
        {
          max: 5, // maximum amount of tries
          timeout: 20000, // throw if no response or error within millisecond timeout, default: undefined,
          backoffBase: 3000, // Initial backoff duration in ms. Default: 100,
        },
      );

      if (
        pendingWorkOrders !== null &&
        pendingWorkOrders !== undefined &&
        pendingWorkOrders.length > 0
      ) {
        for (let orIndex = 0; orIndex < pendingWorkOrders.length; orIndex++) {
          let workOrderNumber = pendingWorkOrders[orIndex][0];
          const workOrderName = pendingWorkOrders[orIndex][2];
          if (workOrderName.toLowerCase().includes('work order')) {
            logger.debug(
              'Processing release activation for workOrderNumber ' +
                workOrderNumber,
            );
            await retry(
              async function (options) {
                // options.current, times callback has been called including this call

                let ordersnotprocessed = await du.select(
                  dbcfg,
                  dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
                    dbcfg,
                    customerId,
                  ),
                );

                for (
                  let orIndex = 0;
                  orIndex < ordersnotprocessed.length;
                  orIndex++
                ) {
                  const orderInternalId = ordersnotprocessed[orIndex][1];
                  const orderName = ordersnotprocessed[orIndex][0];
                  if (orderName.toLowerCase().includes('work order')) {
                    let query = `select to_char(status) from nc_po_Tasks where order_id = ${orderInternalId} and name = 'Wait for Release Activation notification'`;
                    return await du.select(dbcfg, query).then((response) => {
                      if (response.length === undefined) {
                        throw (
                          'Got task release activation as undefined' + response
                        );
                      }
                      const status = response;
                      if (status != '9130031781613016721') {
                        throw new Error(
                          'Wait for release activation is not in waiting state',
                        );
                      }
                    });
                  }
                }
              },
              {
                max: 5, // maximum amount of tries
                timeout: 20000, // throw if no response or error within millisecond timeout, default: undefined,
                backoffBase: 3000, // Initial backoff duration in ms. Default: 100,
              },
            );

            await Common.delay(10000);
            await tapis.processReleaseActivation(apicfg, workOrderNumber);
            await Common.delay(10000);
            logger.debug('Processing the work order no.: ' + workOrderNumber);
            await tapis.processWorkOrder(apicfg, workOrderNumber);
          }
        }
      }

      // await retry(
      //   async function (options) {
      //     // options.current, times callback has been called including this call
      //     return await du
      //       .getWorkOrderNumbersNotCompleted(dbcfg, customerId)
      //       .then((response) => {
      //         if (
      //             response.length > 0
      //         ) {
      //           console.warn('Sales Order status is not Processing' + response;);
      //         }
      //       }
      //   }),
      //   {
      //     max: 5, // maximum amount of tries
      //     timeout: 20000, // throw if no response or error within millisecond timeout, default: undefined,
      //     backoffBase: 3000, // Initial backoff duration in ms. Default: 100,
      //   },
      // );

      let allPendingOrders;
      logger.debug('Getting pending orders');
      await Common.delay(10000);
      await retry(
        async function (options) {
          // options.current, times callback has been called including this call
          return await du
            .select(
              dbcfg,
              dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
                dbcfg,
                customerId,
              ),
            )
            .then((response) => {
              if (response.length === undefined) {
                throw 'Got pending orders as undefined' + response;
              }
              allPendingOrders = response;
            });
        },
        {
          max: 5, // maximum amount of tries
          timeout: 20000, // throw if no response or error within millisecond timeout, default: undefined,
          backoffBase: 3000, // Initial backoff duration in ms. Default: 100,
        },
      );

      if (
        allPendingOrders != null &&
        allPendingOrders !== undefined &&
        allPendingOrders.length > 0
      ) {
        for (let orIndex = 0; orIndex < allPendingOrders.length; orIndex++) {
          const orderInternalId = allPendingOrders[orIndex][1];
          const orderName = allPendingOrders[orIndex][0];
          console.log(orderName, orderInternalId);
          if (orderName.toLowerCase().includes('shipment')) {
            logger.debug(
              'Processing release activation for orderInternalId: ' +
                orderInternalId,
            );
            await tapis.processReleaseActivation(apicfg, orderInternalId);
            // logger.debug('Getting shipment order and purchase no.');
            const res = await du.getShipmentOrderNumberAndPurchaseOrderNumber(
              dbcfg,
              orderInternalId,
            );

            await Common.delay(10000);
            await tapis.processShipmentOrder(
              apicfg,
              res.shipmentOrderNumber,
              res.purchaseeOrderNumber,
            );

            // Complete waiting register equipment delivery
            console.log('APPLE');
            await tapis.completeAppleTVNewTelusEquipmentOrder(
              envcfg,
              ECID,
              res.shipmentOrderNumber,
              res.purchaseeOrderNumber,
            );

            // Hit shipment order completion
            logger.debug('Getting HoldOrderTaskNumber');
            await Common.delay(10000);
            const holdordertask = await du.getHoldOrderTaskNumber(
              dbcfg,
              res.purchaseeOrderNumber,
            );
            logger.debug(holdordertask);
            try {
              logger.debug('Processing Hold order task: ' + holdordertask);
              await tapis.processHoldOrderTask(apicfg, holdordertask);
            } catch (err) {
              logger.debug(JSON.stringify(err));
            }
            logger.debug(
              'Processing shipment order no. ' + res.shipmentOrderNumber,
            );

            // Wait for 10 seconds to get completedawait
            await btapi.wait(10000);
          }
        }
      }

      await retry(
        async function (options) {
          // options.current, times callback has been called including this call
          return await du
            .select(
              dbcfg,
              dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
                dbcfg,
                customerId,
              ),
            )
            .then((response) => {
              if (response.length === undefined) {
                throw 'Got pending orders as undefined' + response;
              }
              allPendingOrders = response;
            });
        },
        {
          max: 5, // maximum amount of tries
          timeout: 20000, // throw if no response or error within millisecond timeout, default: undefined,
          backoffBase: 3000, // Initial backoff duration in ms. Default: 100,
        },
      );
      if (
        allPendingOrders != null &&
        allPendingOrders !== undefined &&
        allPendingOrders.length > 0
      ) {
        for (let orIndex = 0; orIndex < allPendingOrders.length; orIndex++) {
          const orderInternalId = allPendingOrders[orIndex][1];
          const orderName = allPendingOrders[orIndex][0];
          if (orderName.toLowerCase().includes('mailbox cfs')) {
            logger.debug(
              'Processing Wait for Email Reservation for orderInternalId: ' +
                orderInternalId,
            );
            logger.debug('Getting Wait for Email Reservation task');
            const res = await du.getTaskNumber(
              dbcfg,
              orderInternalId,
              'Wait for Email Reservation',
            );
            for (let index = 0; index < res.length; index++) {
              await tapis.processHoldOrderTask(apicfg, res[index]);
            }
          }
          if (orderName.toLowerCase().includes('home phone')) {
            const res = await du.getManualTasksFromOrder(
              dbcfg,
              orderInternalId,
              'Validate Service',
            );
            logger.info('processing Validate Service for Home Phone product');
            for (let index = 0; index < res.length; index++) {
              await tapis.processManualTask(apicfg, res[index]);
            }
          }
          if (orderName.toLowerCase().includes('home security')) {
            const res = await du.getManualTasksFromOrder(
              dbcfg,
              orderInternalId,
              'Home security Product Manual Task',
            );
            logger.info('processing Home security Product Manual Task');
            for (let index = 0; index < res.length; index++) {
              await tapis.processManualTask(apicfg, res[index]);
            }
          }
          if (orderName.toLowerCase().includes('tn porting')) {
            let task = await du.getTaskNumber(
              dbcfg,
              orderInternalId,
              'Wait for Final Status Notification Task',
            );
            logger.info('processing Wait for Final Status Notification Task');
            for (let index = 0; index < task.length; index++) {
              await tapis.processHoldOrderTask(apicfg, task[index]);
            }
          }
          if (orderName.toLowerCase().includes('reverse logistics')) {
            let task = await du.getTaskNumber(
              dbcfg,
              orderInternalId,
              'Wait for SAP Order closure',
            );
            logger.info('processing Wait for SAP Order closure');
            for (let index = 0; index < task.length; index++) {
              await tapis.processHoldOrderTask(apicfg, task[index]);
            }
          }
        }
      }

      await retry(
        async function (options) {
          // options.current, times callback has been called including this call
          return await du
            .select(
              dbcfg,
              dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
                dbcfg,
                customerId,
              ),
            )
            .then((response) => {
              if (!response || response.length === undefined) {
                throw 'Got pending orders as undefined' + response;
              }
              if (response.length > 0) {
                throw new Error(
                  `Retrying now as we are getting still pending orders: ${JSON.stringify(
                    response,
                  )}`,
                );
              }
              logger.debug(
                `all pending orders after completing order on ncbe${JSON.stringify(
                  response,
                )}`,
              );
              shoppingCartContext().setAllPendingOrders(response);
            });
        },
        {
          max: 5, // maximum amount of tries
          timeout: 20000, // throw if no response or error within millisecond timeout, default: undefined,
          backoffBase: 3000, // Initial backoff duration in ms. Default: 100,
        },
      );
    } else {
      shoppingCartContext().setAllPendingOrders([]);
      logger.debug('all orders are processed');
    }
  });

  when('try to cancel sales order on BE', async () => {
    let customExternalId = preconditionContext().getExternalCustomerId;
    let addressId = preconditionContext().getAddressId();
    let salesOrderId = shoppingCartContext().getSalesOrderId();
    logger.debug('Sales Order ID' + salesOrderId);
    expect(customExternalId).toBeDefined();
    expect(customExternalId, 'Customer external Id is null').not.toBeNull();
    expect(salesOrderId).toBeDefined();
    expect(salesOrderId, 'Sales order Id is null').not.toBeNull();
    let response = responseContext().getShoppingCartResponse();
    expect(response, 'Response is null').not.toBeNull();
    const customerId = preconditionContext().getCustomerObjectId();
    logger.debug('customer id' + customerId);
    let order: any;
    order = { customerId };
    order.customerId = customerId;
    logger.debug(`Customer's internal id: ${order.customerId}`);
    logger.debug('Storing Manual Task Id');

    const incompleteorders = await du.select(
      dbcfg,
      dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
        dbcfg,
        customerId,
      ),
    );

    if (!!incompleteorders && incompleteorders.length > 0) {
      const manualCreditTaskId = await du.getManualCreditTaskId(
        dbcfg,
        customerId,
      );
      if (manualCreditTaskId !== null) {
        await tapis.processManualTask(apicfg, manualCreditTaskId);
        await Common.delay(5000);
      }
      let pendingWorkOrders;
      logger.debug('Getting pending work orders');
      await retry(
        async function (options) {
          // options.current, times callback has been called including this call
          return await du
            .getWorkOrderNumbersNotCompleted(dbcfg, customerId)
            .then((response) => {
              if (response.length === undefined) {
                throw 'Got pending work orders as undefined' + response;
              }
              pendingWorkOrders = response;
            });
        },
        {
          max: 5, // maximum amount of tries
          timeout: 20000, // throw if no response or error within millisecond timeout, default: undefined,
          backoffBase: 3000, // Initial backoff duration in ms. Default: 100,
        },
      );

      if (
        pendingWorkOrders !== null &&
        pendingWorkOrders !== undefined &&
        pendingWorkOrders.length > 0
      ) {
        for (let orIndex = 0; orIndex < pendingWorkOrders.length; orIndex++) {
          let workOrderNumber = pendingWorkOrders[orIndex][0];
          const workOrderName = pendingWorkOrders[orIndex][2];
          if (workOrderName.toLowerCase().includes('work order')) {
            logger.debug(
              'Processing release activation for workOrderNumber ' +
                workOrderNumber,
            );
            await retry(
              async function (options) {
                // options.current, times callback has been called including this call

                let ordersnotprocessed = await du.select(
                  dbcfg,
                  dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
                    dbcfg,
                    customerId,
                  ),
                );

                for (
                  let orIndex = 0;
                  orIndex < ordersnotprocessed.length;
                  orIndex++
                ) {
                  const orderInternalId = ordersnotprocessed[orIndex][1];
                  const orderName = ordersnotprocessed[orIndex][0];
                  if (orderName.toLowerCase().includes('work order')) {
                    let query = `select to_char(status) from nc_po_Tasks where order_id = ${orderInternalId} and name = 'Wait for Release Activation notification'`;
                    return await du.select(dbcfg, query).then((response) => {
                      if (response.length === undefined) {
                        throw (
                          'Got task release activation as undefined' + response
                        );
                      }
                      const status = response;
                      if (status != '9130031781613016721') {
                        throw new Error(
                          'Wait for release activation is not in waiting state',
                        );
                      }
                    });
                  }
                }
              },
              {
                max: 5, // maximum amount of tries
                timeout: 20000, // throw if no response or error within millisecond timeout, default: undefined,
                backoffBase: 3000, // Initial backoff duration in ms. Default: 100,
              },
            );

            await Common.delay(10000);
            await tapis.processReleaseActivation(apicfg, workOrderNumber);
            await Common.delay(10000);
            logger.debug('Processing the work order no.: ' + workOrderNumber);
            await tapis.processWorkOrder(apicfg, workOrderNumber);
          }
        }
      }

      // await retry(
      //   async function (options) {
      //     // options.current, times callback has been called including this call
      //     return await du
      //       .getWorkOrderNumbersNotCompleted(dbcfg, customerId)
      //       .then((response) => {
      //         if (
      //             response.length > 0
      //         ) {
      //           console.warn('Sales Order status is not Processing' + response;);
      //         }
      //       }
      //   }),
      //   {
      //     max: 5, // maximum amount of tries
      //     timeout: 20000, // throw if no response or error within millisecond timeout, default: undefined,
      //     backoffBase: 3000, // Initial backoff duration in ms. Default: 100,
      //   },
      // );

      let allPendingOrders;
      logger.debug('Getting pending orders');
      await Common.delay(10000);
      await retry(
        async function (options) {
          // options.current, times callback has been called including this call
          return await du
            .select(
              dbcfg,
              dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
                dbcfg,
                customerId,
              ),
            )
            .then((response) => {
              if (response.length === undefined) {
                throw 'Got pending orders as undefined' + response;
              }
              allPendingOrders = response;
            });
        },
        {
          max: 5, // maximum amount of tries
          timeout: 20000, // throw if no response or error within millisecond timeout, default: undefined,
          backoffBase: 3000, // Initial backoff duration in ms. Default: 100,
        },
      );

      if (
        allPendingOrders != null &&
        allPendingOrders !== undefined &&
        allPendingOrders.length > 0
      ) {
        for (let orIndex = 0; orIndex < allPendingOrders.length; orIndex++) {
          const orderInternalId = allPendingOrders[orIndex][1];
          const orderName = allPendingOrders[orIndex][0];
          if (orderName.toLowerCase().includes('shipment')) {
            logger.debug(
              'Processing release activation for orderInternalId: ' +
                orderInternalId,
            );
            await tapis.processReleaseActivation(apicfg, orderInternalId);
            // logger.debug('Getting shipment order and purchase no.');
            const res = await du.getShipmentOrderNumberAndPurchaseOrderNumber(
              dbcfg,
              orderInternalId,
            );

            await Common.delay(10000);
            await tapis.processShipmentOrder(
              apicfg,
              res.shipmentOrderNumber,
              res.purchaseeOrderNumber,
            );

            // Hit shipment order completion
            logger.debug('Getting HoldOrderTaskNumber');
            await Common.delay(10000);
            const holdordertask = await du.getHoldOrderTaskNumber(
              dbcfg,
              res.purchaseeOrderNumber,
            );
            logger.debug(holdordertask);
            try {
              logger.debug('Processing Hold order task: ' + holdordertask);
              await tapis.processHoldOrderTask(apicfg, holdordertask);
            } catch (err) {
              logger.debug(JSON.stringify(err));
            }
            logger.debug(
              'Processing shipment order no. ' + res.shipmentOrderNumber,
            );

            // Wait for 10 seconds to get completedawait
            await btapi.wait(10000);
          }
        }
      }

      await retry(
        async function (options) {
          // options.current, times callback has been called including this call
          return await du
            .select(
              dbcfg,
              dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
                dbcfg,
                customerId,
              ),
            )
            .then((response) => {
              if (response.length === undefined) {
                throw 'Got pending orders as undefined' + response;
              }
              allPendingOrders = response;
            });
        },
        {
          max: 5, // maximum amount of tries
          timeout: 20000, // throw if no response or error within millisecond timeout, default: undefined,
          backoffBase: 3000, // Initial backoff duration in ms. Default: 100,
        },
      );
      if (
        allPendingOrders != null &&
        allPendingOrders !== undefined &&
        allPendingOrders.length > 0
      ) {
        for (let orIndex = 0; orIndex < allPendingOrders.length; orIndex++) {
          const orderInternalId = allPendingOrders[orIndex][1];
          const orderName = allPendingOrders[orIndex][0];
          if (orderName.toLowerCase().includes('mailbox cfs')) {
            logger.debug(
              'Processing Wait for Email Reservation for orderInternalId: ' +
                orderInternalId,
            );
            logger.debug('Getting Wait for Email Reservation task');
            const res = await du.getTaskNumber(
              dbcfg,
              orderInternalId,
              'Wait for Email Reservation',
            );
            for (let index = 0; index < res.length; index++) {
              await tapis.processHoldOrderTask(apicfg, res[index]);
            }
          }
          if (orderName.toLowerCase().includes('home phone')) {
            const res = await du.getManualTasksFromOrder(
              dbcfg,
              orderInternalId,
              'Validate Service',
            );
            logger.info('processing Validate Service for Home Phone product');
            for (let index = 0; index < res.length; index++) {
              await tapis.processManualTask(apicfg, res[index]);
            }
          }
          if (orderName.toLowerCase().includes('home security')) {
            const res = await du.getManualTasksFromOrder(
              dbcfg,
              orderInternalId,
              'Home security Product Manual Task',
            );
            logger.info('processing Home security Product Manual Task');
            for (let index = 0; index < res.length; index++) {
              await tapis.processManualTask(apicfg, res[index]);
            }
          }
          if (orderName.toLowerCase().includes('tn porting')) {
            let task = await du.getTaskNumber(
              dbcfg,
              orderInternalId,
              'Wait for Final Status Notification Task',
            );
            logger.info('processing Wait for Final Status Notification Task');
            for (let index = 0; index < task.length; index++) {
              await tapis.processHoldOrderTask(apicfg, task[index]);
            }
          }
        }
      }

      await retry(
        async function (options) {
          // options.current, times callback has been called including this call
          return await du
            .select(
              dbcfg,
              dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
                dbcfg,
                customerId,
              ),
            )
            .then((response) => {
              if (!response || response.length === undefined) {
                throw 'Got pending orders as undefined' + response;
              }
              if (response.length > 0) {
                throw new Error(
                  `Retrying now as we are getting still pending orders: ${JSON.stringify(
                    response,
                  )}`,
                );
              }
              logger.debug(
                `all pending orders after completing order on ncbe${JSON.stringify(
                  response,
                )}`,
              );
              shoppingCartContext().setAllPendingOrders(response);
            });
        },
        {
          max: 5, // maximum amount of tries
          timeout: 20000, // throw if no response or error within millisecond timeout, default: undefined,
          backoffBase: 3000, // Initial backoff duration in ms. Default: 100,
        },
      );
    } else {
      shoppingCartContext().setAllPendingOrders([]);
      logger.debug('all orders are processed');
    }
  });

  then('validate that no errors created on BE', async () => {
    const customerId = preconditionContext().getCustomerObjectId();
    const customerErrors = await du.getErrorsOccuredForCustomer(
      dbcfg,
      customerId,
    );
    logger.debug('Errors' + JSON.stringify(customerErrors));
    expect(customerErrors).not.toBeNull();
    expect(customerErrors).not.toBeUndefined();
    expect(customerErrors.length).toBeLessThan(1);
  });

  and('validate that all orders are completed successfully', () => {
    let allPendingOrders = shoppingCartContext().getAllPendingOrders();
    expect(allPendingOrders.length).toBe(0);
  });
  and('validate that all orders are canceled successfully', () => {
    let allPendingOrders = shoppingCartContext().getAllPendingOrders();
    expect(allPendingOrders.length).toBe(0);
  });
  and('validate that all billing actions completed successfully', async () => {
    const customerId = preconditionContext().getCustomerObjectId();
    const billingActionStatus = await du.getBillingFailedActionStatus(
      dbcfg,
      customerId,
    );
    expect(
      billingActionStatus,
      `Billing action status for ${customerId} is NULL`,
    ).not.toBeNull();
    expect(
      billingActionStatus,
      `Billing action status for ${customerId} is not defined`,
    ).not.toBeUndefined();
    expect(
      billingActionStatus.length,
      `Status for customer: ${customerId} is ${billingActionStatus}`,
    ).toBeLessThan(1);
  });
};
