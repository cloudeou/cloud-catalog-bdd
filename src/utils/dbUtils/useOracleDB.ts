import * as oracle from 'oracledb';
import * as OracleDB from 'oracledb';
// import OracleDB = require('oracledb');
// OracleDB.autoCommit = true;
// oracle.autoCommit = true;
import {
  AddressCreationMeta,
  AddressUnit,
  AddressUnitBindVarsResponse,
  DbConfig,
  NcbData,
} from '../../globals/custom-types';
const retry = require('retry-as-promised');

import { StringUtils } from '../common/StringUtils';
import { RandomValueGenerator as utils } from '../common/RandomValueGenerator';

import { Logger } from '../../logger/Logger';
const logger = new Logger();

//oracle.fetchAsString = [oracle.DATE, oracle.NUMBER];

export class useOracleDB {
  static async getResourceId(dbcfg) {
    const query = 'select tv_id_sequence.nextval from dual';
    const resourceid = await this.select(dbcfg, query);
    return resourceid;
  }
  static async getHoldOrderTaskNumber(dbcfg: any, purchaseeOrderNumber: any) {
    const query = `     
          select to_char(task_id) from nc_po_Tasks where order_id = ${purchaseeOrderNumber} and name = 'Hold Order Completion'    
                  `;
    const taskObjId = await this.select(dbcfg, query);
    return taskObjId;
  }

  static async getTaskNumber(dbcfg: any, orderId: any, taskName: string) {
    const query = `     
          select to_char(task_id) from nc_po_Tasks where order_id = ${orderId} and name = '${taskName}'    
                  `;
    const taskObjId = await this.select(dbcfg, query);
    return taskObjId;
  }

  static async getManualTasksFromOrder(
    dbcfg: any,
    orderId: any,
    taskName: string,
  ) {
    const query = `     
      SELECT to_char(object_id) task_id
      FROM nc_objects
      WHERE parent_id = (SELECT reference
      FROM nc_references r,
      nc_objects o
      WHERE r.attr_id = 8090342058013828310
      AND r.object_id = o.object_id
      AND o.object_id = ${orderId})
      AND NAME = '${taskName}'  
                  `;
    const taskObjId = await this.select(dbcfg, query);
    return taskObjId;
  }

  static async getCustomersOnAddressLine(
    dbConfig: DbConfig,
    addressId: string,
  ) {
    const query = useOracleDbQueries.queryCustomersOnAddressLine(addressId);
    const res = await this.select(dbConfig, query);
    logger.info(res);
    return res;
  }

  static async customerCleanUp(dbConfig: DbConfig, customerId: any[]) {
    const query = useOracleDbQueries.queryCustomerCleanUp(customerId);
    console.log(query);
    logger.debug(query);
    const res = await this.select(dbConfig, query);
    logger.info(res);
    return res;
  }

  static async getConn(dbConfig: DbConfig) {
    return setConn(dbConfig);
  }

  static async getAllCustomersWithName(
    dbConfig: DbConfig,
    customerNameLike: string,
  ) {
    const query = useOracleDbQueries.queryAllCustomers(customerNameLike);
    const res = await this.select(dbConfig, query);
    return res;
  }

  static async createAddressUnitWOC(
    dbConfig: DbConfig,
    itfDbConfig: DbConfig,
    data: AddressCreationMeta,
  ) {
    if (!dbConfig || !itfDbConfig) {
      throw new Error(
        `
            Skipping due to DB configuration not being provided:\n
            Server DB configuration -
            ${JSON.stringify(dbConfig)}
            \n
            ITF DB configuration -
            ${JSON.stringify(itfDbConfig)}`,
      );
    }

    const node_name = 'BNBYBCTFOT31';

    const node_rack = '1';
    const node_shelf = '1';
    const ont_slot = '1';
    const ont_port = '1';

    let node_slot = utils.getRandomInt(1, 32);
    node_slot = node_slot.length == 2 ? node_slot : '0' + node_slot;

    let node_port = utils.getRandomInt(1, 32);
    node_port = node_port.length == 2 ? node_port : '0' + node_port;

    let ont_node = utils.getRandomInt(1, 32);
    ont_node = ont_node.length == 2 ? ont_node : '0' + ont_node;

    const status_v = 'Spare';
    const device_type = data.deviceType || 'ALU7342';
    const fmsAddress_v = '00' + utils.getRandomInt(1000000, 9999999 + 1);

    let access_port_profile: any = null;
    let slid: any = null;
    if (device_type === 'ALU7342') {
      slid = '600' + utils.getRandomInt(1000000, 9999999 + 1);
      access_port_profile = '9135739347013397079';
    }

    const customer_id = 9135931647013436434n;

    const fms_address_id = data.fmsAddressId || 1571849511n;
    const street_number_id = data.streetNumberId || 9139808288013893778n;
    const gis_support_id = data.gisSupportId || 9137857652713673469n;
    const tech_type_id = data.techTypeId || 9135739551713397186n;

    const addressUnitData: AddressUnit = {
      streetNumberId: street_number_id,
      fmsAddressId: fms_address_id,
      fmsAddressV: fmsAddress_v,
      gisSupportId: gis_support_id,
      techTypeId: tech_type_id,
      techType: data.techType,
      customerId: customer_id,
      nodeName: node_name,
      nodePort: node_port,
      nodeRack: node_rack,
      nodeShelf: node_shelf,
      nodeSlot: node_slot,
      ontNode: ont_node,
      ontPort: ont_port,
      ontSlot: ont_slot,
      slid: slid,
      deviceType: device_type,
      accessPortProfile: access_port_profile,
    };

    const dbConn = await useOracleDB.getConn(dbConfig);
    let auResp = null;
    try {
      auResp = await dbConn.execute(
        useOracleDbQueries.createAddressUnitAndFreePortRFS(addressUnitData),
        {
          formatedAddress: {
            dir: oracle.BIND_OUT,
            type: oracle.STRING,
            maxSize: 150,
          },
          freePort: { dir: oracle.BIND_OUT, type: oracle.STRING, maxSize: 40 },
          AU: { dir: oracle.BIND_OUT, type: oracle.STRING, maxSize: 40 },
        },
        { autoCommit: true },
      );
    } catch (error) {
      console.log(error);
    }

    logger.debug(`AddressUnit: ${JSON.stringify(auResp)}`);

    /**
     *  9153011077513811410 - Abbotsford;
     *  9153011191813811552 - Drayton Valley;
     *  9153011191813811533 - Meritt;
     *  9153011191813811497 - Drumheller;
     *  9153011191813811563 - Vernon;
     *  9145979841813697494 - Edmonton.
     */
    let externalLocationId = null;

    let addressUnitID = auResp.outBinds.AU;
    if (
      !!process.env.JEST_DATASET &&
      process.env.JEST_DATASET.includes('itn')
    ) {
      let substr = addressUnitID.substring(10);
      let substr2 = addressUnitID.substring(0, 10);
      let num = parseInt(substr) + 1100;
      let numStr = num + '';
      while (numStr.length < 9) {
        numStr = '0' + numStr;
      }
      externalLocationId = substr2 + numStr;
    } else {
      // externalLocationId = auResp.outBinds.EAU;
      externalLocationId = auResp.outBinds.AU;
    }

    const itfDbConn = await useOracleDB.getConn(itfDbConfig);
    try {
      await itfDbConn.execute(
        useOracleDbQueries.insertNCBdata(addressUnitData, {
          pathId: BigInt(addressUnitID + '123456'),
          addressId: BigInt(addressUnitID),
          status: status_v,
          eqtStatus: 'Constructed',
        }),
        {},
        { autoCommit: true },
      );
    } catch (error) {
      console.log(error);
    }

    logger.debug(
      'Create Address Unit WOC is successfully done\n' +
        'External Address Unit ID = ' +
        externalLocationId +
        '\nObject Address Unit ID = ' +
        addressUnitID,
    );
    return [
      {
        addressObjectID: addressUnitID,
        externalLocationId: externalLocationId,
      },
    ];
  }

  static async createAddressUnitNoWOC(
    dbConfig: DbConfig,
    itfDbConfig: DbConfig,
    data: AddressCreationMeta,
  ) {
    if (!dbConfig || !itfDbConfig) {
      throw new Error(
        `
            Skipping due to DB configuration not being provided:\n
            Server DB configuration -
            ${JSON.stringify(dbConfig)}
            \n
            ITF DB configuration -
            ${JSON.stringify(itfDbConfig)}`,
      );
    }

    const node_name = 'BNBYBCTFOT31';

    const node_rack = '1';
    const node_shelf = '1';
    const ont_slot = '1';
    const ont_port = '1';

    let node_slot = utils.getRandomInt(1, 32);
    node_slot = node_slot.length == 2 ? node_slot : '0' + node_slot;

    let node_port = utils.getRandomInt(1, 32);
    node_port = node_port.length == 2 ? node_port : '0' + node_port;

    let ont_node = utils.getRandomInt(1, 32);
    ont_node = ont_node.length == 2 ? ont_node : '0' + ont_node;

    const status_v = 'Spare';
    const device_type = data.deviceType || 'ALU7342';
    const fmsAddress_v = '00' + utils.getRandomInt(1000000, 9999999 + 1);

    let access_port_profile = null;
    let slid = null;
    if (device_type === 'ALU7342') {
      slid = '600' + utils.getRandomInt(1000000, 9999999 + 1);
      access_port_profile = '9135739347013397079';
    }

    const customer_id = 9135931647013436434n;

    const fms_address_id = data.fmsAddressId || 1571849511n;
    const street_number_id = data.streetNumberId || 9139808288013893778n;
    const gis_support_id = data.gisSupportId || 9137857652713673469n;
    const tech_type_id = data.techTypeId || 9135739551713397186n;

    const addressUnitData: AddressUnit = {
      streetNumberId: street_number_id,
      fmsAddressId: fms_address_id,
      fmsAddressV: fmsAddress_v,
      gisSupportId: gis_support_id,
      techTypeId: tech_type_id,
      techType: data.techType,
      customerId: customer_id,
      nodeName: node_name,
      nodePort: node_port,
      nodeRack: node_rack,
      nodeShelf: node_shelf,
      nodeSlot: node_slot,
      ontNode: ont_node,
      ontPort: ont_port,
      ontSlot: ont_slot,
      slid: slid,
      deviceType: device_type,
      accessPortProfile: access_port_profile,
    };

    const dbConn = await useOracleDB.getConn(dbConfig);
    let auResp = null;
    try {
      auResp = await dbConn.execute(
        useOracleDbQueries.createAddressUnitNoFreePortRFS(addressUnitData),
        {
          formatedAddress: {
            dir: oracle.BIND_OUT,
            type: oracle.STRING,
            maxSize: 150,
          },
          AU: { dir: oracle.BIND_OUT, type: oracle.STRING, maxSize: 40 },
        },
        { autoCommit: true },
      );
    } catch (error) {
      console.log(error);
    }

    logger.debug(`AddressUnit: ${JSON.stringify(auResp)}`);

    /**
     *  9153011077513811410 - Abbotsford;
     *  9153011191813811552 - Drayton Valley;
     *  9153011191813811533 - Meritt;
     *  9153011191813811497 - Drumheller;
     *  9153011191813811563 - Vernon;
     *  9145979841813697494 - Edmonton.
     */
    let externalLocationId = null;

    let addressUnitID = auResp.outBinds.AU;
    if (
      !!process.env.JEST_DATASET &&
      process.env.JEST_DATASET.includes('itn')
    ) {
      let substr = addressUnitID.substring(10);
      let substr2 = addressUnitID.substring(0, 10);
      let num = parseInt(substr) + 1100;
      let numStr = num + '';
      while (numStr.length < 9) {
        numStr = '0' + numStr;
      }
      externalLocationId = substr2 + numStr;
    } else {
      // externalLocationId = auResp.outBinds.EAU;
      externalLocationId = auResp.outBinds.AU;
    }

    const itfDbConn = await useOracleDB.getConn(itfDbConfig);
    try {
      await itfDbConn.execute(
        useOracleDbQueries.insertNCBdata(addressUnitData, {
          pathId: BigInt(addressUnitID + '123456'),
          addressId: BigInt(addressUnitID),
          status: status_v,
          eqtStatus: 'Constructed',
        }),
        {},
        { autoCommit: true },
      );
    } catch (error) {
      console.log(error);
    }

    logger.debug(
      'Create Address Unit WOC is successfully done\n' +
        'External Address Unit ID = ' +
        externalLocationId +
        '\nObject Address Unit ID = ' +
        addressUnitID,
    );
    return [
      {
        addressObjectID: addressUnitID,
        externalLocationId: externalLocationId,
      },
    ];
  }

  /**
   * @description Executes select query and return results in 2-d array
   */
  static async select(dbConfig: DbConfig, query: string): Promise<any> {
    logger.debug(
      `Executing query: ${query} on db-configuration ${JSON.stringify(
        dbConfig,
      )}`,
    );
    return new Promise(async function (resolve, reject) {
      let connection;
      try {
        connection = await setConn(dbConfig);
        const result = await connection.execute(
          query,
          {},
          { autoCommit: true },
        );
        resolve(result.rows);
      } catch (err) {
        logger.error(err);
        // Catches errors in getConnection and the query
        reject(err);
      } finally {
        // the connection assignment worked, must release
        releaseConn(connection);
      }
    });
  }

  /**
   * @description Executes select query and return results in 2-d array
   */
  static async update(dbConfig: DbConfig, query: string) {
    logger.debug(
      `Executing query: ${query} on db-configuration ${JSON.stringify(
        dbConfig,
      )}`,
    );
    return new Promise(async function (resolve, reject) {
      let connection: any;
      try {
        connection = await setConn(dbConfig);
        await connection.execute(query);
        resolve(true);
      } catch (err) {
        logger.error(err);
        // Catches errors in getConnection and the query
        reject(err);
      } finally {
        // the connection assignment worked, must release
        releaseConn(connection);
      }
    });
  }

  /**
   * @description Executes any query and return true or false
   * @param {DbConfig} dbConfig
   * @param {String} query Specifies query to be executed
   */
  static async executeQuery(dbConfig: DbConfig, query: string) {
    logger.debug(
      `Executing query: ${query} on db-configuration ${JSON.stringify(
        dbConfig,
      )}`,
    );
    return new Promise(async function (resolve, reject) {
      let connection;
      try {
        connection = await setConn(dbConfig);
        await connection.execute(query, {}, { autoCommit: true });
        resolve(true);
      } catch (err) {
        logger.error(err);
        // Catches errors in getConnection and the query
        reject(err);
      } finally {
        // the connection assignment worked, must release
        releaseConn(connection);
      }
    });
  }

  /**
   * @description Executes select query and return single value
   */
  static async getValue(dbConfig: DbConfig, query: string) {
    let rs = await this.select(dbConfig, query);
    if (StringUtils.isEmptyObject(rs) || rs.length == 0) {
      return null;
    }
    return rs[0][0];
  }

  /**
   * @description Executes select query and return single value
   * @param {DbConfig} dbConfig
   * @param {String} query Specifies query to be executed
   */
  static async setUpdateValue(dbConfig: DbConfig, query: string) {
    let rs = await this.update(dbConfig, query);
    return rs;
  }

  /**
   * @description Provides work order number based on given work order internal
   * @param {DbConfig} dbConfig
   * @param {String} customerInternalId Specifies customer internal nc-object-id
   */
  static async getWorkOrderNumbersNotCompleted(
    dbConfig: DbConfig,
    customerInternalId: string,
  ) {
    let query = useOracleDbQueries.queryWorkOrderNumberFromCustomerInternalId(
      dbConfig,
      customerInternalId,
    );
    return await this.select(dbConfig, query);
  }

  /**
   * @description Provides work order number based on given work order internal
   * @param {DbConfig} dbConfig
   * @param {String} shipmentObjectId Specifies shipment order internal nc-object-id
   */
  static async getShipmentOrderNumberAndPurchaseOrderNumber(
    dbConfig: DbConfig,
    shipmentObjectId: string,
  ) {
    let query =
      useOracleDbQueries.queryShipmentOrderNumberAndPurchaseOrderNumberFromShipmentOrderInternalObjectId(
        dbConfig,
        shipmentObjectId,
      );
    let res = await this.select(dbConfig, query);
    return { shipmentOrderNumber: res[0][0], purchaseeOrderNumber: res[0][1] };
  }

  static async getErrorsOccuredForCustomer(
    dbConfig: DbConfig,
    customerId: string,
  ) {
    let query = useOracleDbQueries.queryErrorsForGivenCustomer(
      dbConfig,
      customerId,
    );
    return await this.select(dbConfig, query);
  }

  /**
   * @description Provides manual credit task id
   */
  static async getManualCreditTaskId(
    dbConfig: DbConfig,
    customerInternalNcObjectId: string,
  ) {
    let query = useOracleDbQueries.queryManualCreditTaskId(
      dbConfig,
      customerInternalNcObjectId,
    );
    return await this.select(dbConfig, query);
  }

  /**
   * @description Provides all billing actions object-id(s) and their status
   * @param {DbConfig} dbConfig
   * @param {String} customerId Specifies customer internal nc-object-id
   */
  static async getBillingActionStatus(
    dbConfig: DbConfig,
    customerInternalNcObjectId: string,
  ) {
    let query = useOracleDbQueries.queryGetAllBillingActionStatus(
      dbConfig,
      customerInternalNcObjectId,
    );
    return await this.select(dbConfig, query);
  }

  static async getECIDfromCustomerObjID(
    dbConfig: DbConfig,
    customerObjID: string,
  ) {
    let query = useOracleDbQueries.querygetECIDfromCustomerObjID(customerObjID);
    return await this.select(dbConfig, query);
  }

  static async getCompleteHomeSecurityTaskId(
    dbConfig: DbConfig,
    customerObjID: string,
  ) {
    let query =
      useOracleDbQueries.getCompleteHomeSecurityTaskIdQuery(customerObjID);
    return await this.select(dbConfig, query);
  }

  /**
   * @description Provides all billing actions object-id(s) and their status
   */
  static async getBillingFailedActionStatus(
    dbConfig: DbConfig,
    customerInternalNcObjectId: string,
  ) {
    let query = useOracleDbQueries.queryGetAllBillingFailedActionStatus(
      dbConfig,
      customerInternalNcObjectId,
    );
    return await this.select(dbConfig, query);
  }

  static async getPromotionType(promotionId, dbConfig) {
    let query = useOracleDbQueries.queryPromotionType(promotionId);
    const promoType = await this.select(dbConfig, query);
    if (String(promoType).toLowerCase().includes('recurrent')) {
      return 'Recurrent';
    } else {
      return 'One_Time';
    }
  }

  static async getPathIdForAddress(addressId, dbConfig) {
    const query = useOracleDbQueries.queryPathIdForAddress(addressId);
    const res = await this.select(dbConfig, query);
    console.log(query);
    console.log(res);
    return res;
  }
}

export class useOracleDbQueries {
  static queryCustomerCleanUp(customerId: any[]) {
    const query = `  
    declare
   vn_objects NCMBE.ARRAYOFNUMBERS := NCMBE.ARRAYOFNUMBERS(${customerId});
   begin
    pkg_customer.cleanup(vn_objects, 2, 9147312061113412543);
    end;    
         `;
    logger.debug(`queryCustomerCleanUp: ${query}`);
    return query;
  }

  static queryCustomersOnAddressLine(addressId: string) {
    const query = `  
        select distinct to_char(om.parent_id) customer_object_id, case
        when '&disconnected'  = all (select bpi_status.ix_key from nc_objects bpi, nc_params_ix bpi_status
                                                where bpi.parent_id = loc.parent_id
                                                and bpi.object_type_id =9126083628313449001 /* Business Product Instance */
                                                /*and bpi.name not like 'TELUS Connectivity #%'*/
                                                and bpi_status.object_id = bpi.object_id
                                                and bpi_status.attr_id = 9126143611313472389 /* Product Instance Status */)
        then 'true'
        else 'false'
        end as clean_flag from
        nc_objects om, nc_references cbs, nc_objects loc,nc_references addr_ref, nc_params_ix addr
        where addr.attr_id = 9136008721213360476 /* Address ID */
        and addr.ix_key = '${addressId}'
        and addr_ref.attr_id = 9132251685613889259 /* Address */
        and addr_ref.reference = addr.object_id
        and loc.object_id = addr_ref.object_id
        and cbs.reference = loc.parent_id
        and cbs.attr_id = 4072141203013823765 /* CBS Name */
        and om.object_id = cbs.object_id
        and om.object_type_id = 4070674633013011019 /* Order Management Project */
`;
    logger.debug(`queryCustomersOnAddressLine: ${query}`);
    return query;
  }

  static queryPathIdForAddress(addressId: string) {
    const query = `
    select p.value path_id
    from nc_params p, nc_attributes a
    where a.attr_id = p.attr_id
    and a.attr_id = 9140829284313799893
    and p.object_id in (
      select p.object_id
      from nc_attributes a, nc_params p
      where a.attr_id = p.attr_id
      and a.attr_id = 9135231156613435551
      and p.value = '${addressId}'
    )
    group by p.value
    `;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   * @param {String} customerId E.g. 9140698645013660301
   */
  static queryGetAllBillingActionStatus(
    dbConfig: DbConfig,
    customerId: string,
  ) {
    let query = `
                  SELECT
                  to_char(ba.object_id) AS ba_id,
                      substr(stv.value, 10) AS status
                  FROM
                      ${dbConfig.tables.nc_params_ix}     ba
                      LEFT JOIN ${dbConfig.tables.nc_params}        s ON s.object_id = ba.object_id
                                              AND s.attr_id = 9141614096913188381
                      LEFT JOIN ${dbConfig.tables.nc_list_values}   stv ON stv.list_value_id = s.list_value_id
                  WHERE
                      ba.value = to_char(${customerId}) /* Customer Id*/
                      AND ba.ix_key = pkgutils.params_ix(to_char(${customerId})) /* Customer Id*/
                      AND ba.attr_id = 9141251166913825730`;
    logger.debug(`queryGetAllBillingActionStatus: ${query}`);
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   */
  static getSalesOrderStatus(dbConfig: DbConfig, salesOrderId: string) {
    let query = this.queryNcCustomerOrdersStatus(dbConfig, salesOrderId);
    query = `
            select 
      (case when p.value is null
            and p.DATE_VALUE is null
            then lv.value
            when lv.value is null
            and p.DATE_VALUE is null
            then p.value
            when lv.value is null
            and p.VALUE is null
            then to_char(p.DATE_VALUE)
            else null
            end
        )value
        from ${dbConfig.tables.nc_attributes} a
        left join ${dbConfig.tables.nc_params} p
        on (p.ATTR_ID = a.ATTR_ID)
        left join nc_list_values lv
        on (p.list_value_id = lv.list_value_id)
        where p.object_id =  ${salesOrderId}
        and a.attr_id = '9126090157513456523' /* Sales Order Status */`;
    logger.debug(`getSalesOrderStatus: ${query}`);
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   * @param {String} customerId E.g. 9140698645013660301
   */
  static queryGetAllBillingFailedActionStatus(
    dbConfig: DbConfig,
    customerId: string,
  ) {
    let query = `select * from (${this.queryGetAllBillingActionStatus(
      dbConfig,
      customerId,
    )}) where lower(status) = 'failed'`;
    logger.debug(`queryGetAllBillingFailedActionStatus: ${query}`);
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   * @param {String} customerId E.g. 9140698645013660301
   */
  static queryManualCreditTaskId(dbConfig: DbConfig, customerId: string) {
    let query = `
                  select
                  to_char(object_id) task_id
                  from
                      ${dbConfig.tables.nc_params}
                  where
                      object_id = (
                          select
                              object_id
                          from
                              ${dbConfig.tables.nc_objects}
                          where
                              object_id in (
                                  select
                                      p.object_id
                                  from
                                      ${dbConfig.tables.nc_params_ix} p
                                  where
                                      p.attr_id = 90100082 /* Target Object */
                                      and p.ix_key = ${customerId}
                              )
                              and (name like '%Credit%' or name like '%Home security%')
                      )
                      and attr_id = 9137996003413538340 /* Task ID */
                `;
    logger.debug(`queryManualCreditTaskId: ${query}`);
    return query;
  }

  /**
   * @param {String} addObjId E.g. 9140698645013660301
   */
  static queryGetAddress(data: AddressCreationMeta) {
    let query = `select max(address_id) from ADDRESS_DATA where env = '${data.env}' and access_type = '${data.addressType}' and technology_access_port = '${data.techType}' and spare != 'N'`;
    logger.debug(`queryGetAddress: ${query}`);
    return query;
  }

  static setAddressOccupied(addressId: string) {
    let query = `update ADDRESS_DATA set spare = 'N' where address_id = '${addressId}'`;
    logger.debug(`setAddressOccupied: ${query}`);
    return query;
  }

  static setAddressFree(addressId: string) {
    let query = `update ADDRESS_DATA set spare = 'Y' where address_id = '${addressId}'`;
    logger.debug(`setAddressFree: ${query}`);
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   * @param {String} addObjId E.g. 9140698645013660301
   */
  static queryCompleteAddress(dbConfig: DbConfig, addObjId: string) {
    let query = `select listagg(name, ' ') within group (order by object_id desc) complete_address from ${dbConfig.tables.nc_objects} 
                 where CONNECT_BY_ISLEAF = 0 start with object_id = '${addObjId}'
                 connect by prior parent_id = object_id`;
    logger.debug(`queryCompleteAddress: ${query}`);
    return query;
  }

  /**
   * @param {String} ncObjId E.g. 9149844833813831138
   */
  static queryNcObjectNameOnId(dbConfig: DbConfig, ncObjId: string) {
    let query = `select name from ${dbConfig.tables.nc_objects} where object_id = '${ncObjId}'`;
    logger.debug(`queryNcObjectNameOnId: ${query}`);
    return query;
  }

  static queryNcSaleOrderObjectTypeId(dbConfig: DbConfig) {
    let query = `select object_type_id from ${dbConfig.tables.nc_object_types} where name = 'Sales Order'`;
    logger.debug(`queryNcSaleOrderObjectTypeId: ${query}`);
    return query;
  }

  static queryNcSaleOrderInternalId(
    dbConfig: DbConfig,
    orderNumberAsSuffix: string,
  ) {
    let query = `
                  SELECT
                  to_char(OBJECT_ID) AS SalesOrderInternalId
                  FROM
                      ${dbConfig.tables.nc_objects}        nco,
                      ${dbConfig.tables.nc_object_types}   ncot
                  WHERE
                      nco.object_type_id = ncot.object_type_id
                      AND ncot.name = 'Sales Order'
                      AND nco.name LIKE '%${orderNumberAsSuffix}'`;
    logger.debug(`queryNcSaleOrderInternalId: ${query}`);
    return query;
  }

  static queryNcCustomerIdFromSaleOrderNumber(
    dbConfig: DbConfig,
    orderNumberAsSuffix: string,
  ) {
    let query = `
                  SELECT
                  to_char(parent_id)
                  FROM
                      ${dbConfig.tables.nc_objects}
                  WHERE
                      object_id = (
                          SELECT
                              nco.parent_id
                          FROM
                              ${dbConfig.tables.nc_objects}        nco,
                              ${dbConfig.tables.nc_object_types}   ncot
                          WHERE
                              nco.object_type_id = ncot.object_type_id
                              AND ncot.name = 'Sales Order'
                              AND nco.name LIKE '%${orderNumberAsSuffix}'
                      )
                `;
    logger.debug(`queryNcCustomerIdFromSaleOrderNumber: ${query}`);
    return query;
  }

  static queryNcCustomerOrdersStatus(dbConfig: DbConfig, customerId: string) {
    let query = `
                  SELECT
                      orders.name   orders,
                      to_char(orders.object_id),
                      status_id.list_value_id,
                      lv.value      status
                  FROM
                      ${dbConfig.tables.nc_objects}       orders,
                      ${dbConfig.tables.nc_params}        status_id,
                      ${dbConfig.tables.nc_list_values}   lv
                  WHERE
                      orders.object_id = status_id.object_id
                      AND status_id.attr_id = 4063055154013004350 /* Status */
                      AND orders.object_type_id NOT IN (
                          9134179704813622905 /* BOE Composite Order */
                      )
                      AND status_id.object_id IN (
                          SELECT DISTINCT
                              to_char(object_id)
                          FROM
                              ${dbConfig.tables.nc_references}
                          WHERE
                              attr_id = 4122753063013175631 /* Customer Account */
                              AND reference = ${customerId}
                      )
                      AND lv.list_value_id = status_id.list_value_id
                  UNION
                  SELECT
                      orders.name   orders,
                      to_char(orders.object_id),
                      status_id.list_value_id,
                      lv.value      status
                  FROM
                      ${dbConfig.tables.nc_objects}       orders,
                      ${dbConfig.tables.nc_params}        status_id,
                      ${dbConfig.tables.nc_list_values}   lv
                  WHERE
                      orders.object_id = status_id.object_id
                      AND status_id.attr_id = 9124623752913888363 /* Status */
                      AND orders.object_type_id IN (
                          9134179704813622905 /* BOE Composite Order */
                      )
                      AND status_id.object_id IN (
                          SELECT DISTINCT
                              to_char(object_id)
                          FROM
                              ${dbConfig.tables.nc_references}
                          WHERE
                              attr_id = 4122753063013175631 /* Customer Account */
                              AND reference = ${customerId}
                      )
                      AND lv.list_value_id = status_id.list_value_id
                  UNION
                  SELECT
                      orders.name   orders,
                      to_char(orders.object_id),
                      status_id.list_value_id,
                      lv.value      status
                  FROM
                      ${dbConfig.tables.nc_objects}       orders,
                      ${dbConfig.tables.nc_params}        status_id,
                      ${dbConfig.tables.nc_list_values}   lv
                  WHERE
                      orders.object_id = status_id.object_id
                      AND status_id.attr_id = 9126090157513456523 /* Sales Order Status */
                      AND status_id.object_id IN (
                          SELECT
                              to_char(object_id)
                          FROM
                              ${dbConfig.tables.nc_objects}
                          WHERE
                              parent_id IN (
                                  SELECT
                                      to_char(object_id)
                                  FROM
                                      ${dbConfig.tables.nc_objects}
                                  WHERE
                                      parent_id = ${customerId}
                                      AND object_type_id = 4070674633013011019 /* Order Management Project */
                              )
                      )
                      AND lv.list_value_id = status_id.list_value_id
    `;
    logger.debug(`queryNcCustomerOrdersStatus: ${query}`);
    return query;
  }

  static queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
    dbConfig: DbConfig,
    customerId: string,
  ) {
    let query = this.queryNcCustomerOrdersStatus(dbConfig, customerId);
    query = `
            select * from (${query}) order_status_table
            WHERE
              upper(status) NOT LIKE '%COMPLETED%'
              AND upper(status) NOT LIKE '%PROCESSED%'
              AND upper(status) NOT LIKE '%SUPERSEDED%'`;
    logger.debug(
      `queryNcCustomerOrdersStatusNeitherCompletedNorProcessed: ${query}`,
    );
    return query;
  }

  static queryNcSalesOrdersStatusForGivenCustomer(
    dbConfig: DbConfig,
    customerId: string,
  ) {
    let query = `
                  SELECT
                      orders.name   orders,
                      orders.object_id,
                      status_id.list_value_id,
                      lv.value      status
                  FROM
                      ${dbConfig.tables.nc_objects}       orders,
                      ${dbConfig.tables.nc_params}        status_id,
                      ${dbConfig.tables.nc_list_values}   lv
                  WHERE
                      orders.object_id = status_id.object_id
                      AND status_id.attr_id = 9126090157513456523 /* Sales Order Status */
                      AND status_id.object_id IN (
                          SELECT
                              object_id
                          FROM
                              ${dbConfig.tables.nc_objects}
                          WHERE
                              parent_id IN (
                                  SELECT
                                      object_id
                                  FROM
                                      ${dbConfig.tables.nc_objects}
                                  WHERE
                                      parent_id = ${customerId}
                                      AND object_type_id = 4070674633013011019 /* Order Management Project */
                              )
                      )
                      AND lv.list_value_id = status_id.list_value_id`;
    logger.debug(`queryNcSalesOrdersStatusForGivenCustomer: ${query}`);
    return query;
  }

  static queryNcSalesOrdersStatus(
    dbConfig: DbConfig,
    orderNumberAsSuffix: string,
  ) {
    let query = `
                  SELECT
                      orders.name   orders,
                      orders.object_id,
                      status_id.list_value_id,
                      lv.value      status
                  FROM
                      ${dbConfig.tables.nc_objects}       orders,
                      ${dbConfig.tables.nc_params}        status_id,
                      ${dbConfig.tables.nc_list_values}   lv
                  WHERE
                      orders.object_id = status_id.object_id
                      AND status_id.attr_id = 9126090157513456523 /* Sales Order Status */
                      AND status_id.object_id IN (
                          ${this.queryNcSaleOrderInternalId(
                            dbConfig,
                            orderNumberAsSuffix,
                          )}
                      )
                      AND lv.list_value_id = status_id.list_value_id`;
    logger.debug(`queryNcSalesOrdersStatus: ${query}`);
    return query;
  }

  static queryErrorsForGivenCustomer(dbConfig: DbConfig, customerId: string) {
    let query = `
                  SELECT
                      object_id,
                      name
                  FROM
                      ${dbConfig.tables.nc_objects}
                  WHERE
                      parent_id IN (
                          SELECT
                              container_id AS object_id
                          FROM
                              ${dbConfig.tables.nc_po_tasks},
                              ${dbConfig.tables.nc_objects} o
                          WHERE
                              order_id = object_id
                              AND o.parent_id = ${customerId} /* Customer ID */
                      )
                      AND object_type_id IN (
                          SELECT
                              object_type_id
                          FROM
                              ${dbConfig.tables.nc_object_types}
                          START WITH
                              object_type_id = 9081958832013375989 /* Base Error Record */
                          CONNECT BY
                              PRIOR object_type_id = parent_id
                      )
    `;
    logger.debug(`queryErrorsForGivenCustomer: ${query}`);
    return query;
  }

  static queryWorkOrderNumberFromCustomerInternalId(
    dbConfig: DbConfig,
    customerInternalId: string,
  ) {
    let query = `
                  SELECT
                      p.value       AS work_order_number,
                      to_char(o.object_id)   AS object_id,
                      o.name as orderName
                  FROM
                      ${dbConfig.tables.nc_objects}   o,
                      ${dbConfig.tables.nc_params}    p,
                      ${dbConfig.tables.nc_params}    pp
                  WHERE
                      o.parent_id = ${customerInternalId}
                      and o.object_type_id = 9138418725413841757 /* New/Modify Work Order */
                      and p.attr_id = 9138427811113852870 /* Work Order ID */
                      and o.object_id = p.object_id
                      and o.object_id = pp.object_id
                      and pp.attr_id = 4063055154013004350 /* Status */
                      AND pp.list_value_id NOT IN (
                          4121046730013113091 /* Completed */
                      )
                `;
    logger.debug(`queryWorkOrderNumberFromCustomerInternalId: ${query}`);
    return query;
  }

  static queryShipmentOrderNumberAndPurchaseOrderNumberFromShipmentOrderInternalObjectId(
    dbConfig: DbConfig,
    shipmentObjectId: string,
  ) {
    let query = `
                SELECT
                to_char(value) AS shipmentordernumber,
                    to_char(${shipmentObjectId}) as purchaseOrderNumber
                FROM
                    ${dbConfig.tables.nc_params}
                WHERE
                    object_id = ${shipmentObjectId}
                    AND attr_id = (
                        SELECT
                            attr_id
                        FROM
                        ${dbConfig.tables.nc_attributes}
                        WHERE
                            name = 'Shipment Order Number'
                    )
                `;
    logger.debug(
      `queryShipmentOrderNumberAndPurchaseOrderNumberFromShipmentOrderInternalObjectId: ${query}`,
    );
    return query;
  }

  static connectNCB() {
    let query = `declare 
  rfs_id number(20);
  au_id string(20);
  formatedAddress_v STRING(150);
      begin
          au_id := pkg_create_unit.create_9070674633013011019( '1571849511', '1571849511' , :streetNumberId , :fmsAddress , 9137857652713673469 , 9135739551713397186);
          pkg_create_unit.update_9070674633013011019(au_id, au_id);
  rfs_id := pkg_create_inventory.create_free_rfs_port(:customer_id,:node_name_value,:node_port_value,:node_rack_value,
  :node_shelf_value,:node_slot_value,:ont_node_value,:ont_port_value,:ont_slot_value,:slid_value,:device_type_value,:access_port_profile_value,9135739551713397186);
          INSERT INTO nc_params VALUES (9150313910213156892,au_id, 0, NULL, NULL, 9150313760013156766, 1, NULL, 1);
          INSERT INTO nc_params VALUES (9150313760013156759,au_id, 0, NULL, NULL, 9150313760013156766, 1, NULL, 1);
          SELECT
    pkgam.build_address(au_id,pkgam.get_format_id(au_id, 9131975650313000303),null) INTO formatedAddress_v
  from dual;
          :formatedAddress :=  formatedAddress_v;
  :freePort := rfs_id;
  :AU := au_id;
  commit;
      end;
  `;
    logger.debug(`connectNCB: ${query}`);
    return query;
  }

  static querygetECIDfromCustomerObjID(customerObjID) {
    const query = `select value as ecid from nc_params_ix where attr_id = 9138719996013282785 and object_id = ${customerObjID}`;
    logger.debug(query);
    return query;
  }

  static getCompleteHomeSecurityTaskIdQuery(customerObjID: string) {
    const query = `select to_char(object_id) from nc_params_ix where attr_id = 9137996003413538340 and ix_key = (select task_id from nc_po_tasks where name = 'Home security Product Manual Task'
    and order_id in (select object_id from nc_objects where parent_id = ${customerObjID} and object_type_id = '9150381725313165002')
    and status = 9130031781613016721)`;
    logger.debug(query);
    return query;
  }

  static deleteMigrationFlagOnCustomer(ECID: string) {
    const query = `DELETE FROM NC_PARAMS np
    WHERE np.ATTR_ID = 9144723841513165963
    AND np.OBJECT_ID IN (
        SELECT OBJECT_ID from RDB_CUSTOMER_ACCOUNTS
        WHERE ENTERPRISE_CUSTOMER_ID IN (
            '${ECID}'
        ))`;
    console.log(query);
    return query;
  }

  static insertNCBdata(data: AddressUnit, ncb: NcbData) {
    let query = `INSERT INTO GIS(PATH_ID, OLT_NAME, OLT_SHELF, OLT_SLOT, OLT_PORT, ONT_NODE, DEVICE_TYPE, ADDRESS, TECHNOLOGY_TYPE, 
      STATUS, ONT_SHAREABLE, ONT_SLOT, ONT_PORT, ACCESS_TECHNOLOGY_TYPE)
VALUES (${ncb.pathId}, '${data.nodeName}', '${data.nodeShelf}', '${data.nodeSlot}', '${data.nodePort}', '${data.ontNode}', '${data.deviceType}',
${ncb.addressId}, '${data.techType}', '${ncb.status}', 'False' , '${data.ontSlot}','${data.ontPort}', '${data.techType}')
`;
    logger.debug(`insertNCBdata: ${query}`);
    return query;
  }

  /* CODE when address is FIBER/GPON or FIBER/XGSPON */
  static createAddressUnitAndFreePortRFS = (data: AddressUnit) => {
    data.streetNumberId = !!data.streetNumberId ? data.streetNumberId : null;
    data.fmsAddressId = !!data.fmsAddressId ? data.fmsAddressId : null;
    data.gisSupportId = !!data.gisSupportId
      ? data.gisSupportId
      : 9137857652713673469n;
    data.techTypeId = !!data.techTypeId
      ? data.techTypeId
      : 9135739551713397186n;

    const nodeName = !!data.nodeName ? `'${data.nodeName}'` : null;
    const nodePort = !!data.nodePort ? `'${data.nodePort}'` : null;
    const nodeRack = !!data.nodeRack ? `'${data.nodeRack}'` : null;
    const nodeShelf = !!data.nodeShelf ? `'${data.nodeShelf}'` : null;
    const nodeSlot = !!data.nodeSlot ? `'${data.nodeSlot}'` : null;
    const ontNode = !!data.ontNode ? `'${data.ontNode}'` : null;
    const ontPort = !!data.ontPort ? `'${data.ontPort}'` : null;
    const ontSlot = !!data.ontSlot ? `'${data.ontSlot}'` : null;
    const deviceType = !!data.deviceType ? `'${data.deviceType}'` : null;
    const accessPortProfile = !!data.accessPortProfile
      ? `'${data.accessPortProfile}'`
      : null;
    const techTypeId = !!data.techTypeId ? `'${data.techTypeId}'` : null;
    const slid = !!data.slid ? `'${data.slid}'` : null;

    let proc = `
    declare
      rfs_id number(20);
      au_id string(20);
      formatedAddress_v STRING(150);
    begin    
        /*
        au_id := pkg_create_unit.create_9070674633013011019( '1571849511', '1571849511' , :streetNumberId , :fmsAddress , 9137857652713673469 , 9135739551713397186);
        */
        au_id := pkg_create_unit.create_9070674633013011019(
            '1571849511',
          '${data.fmsAddressId}',
          ${data.streetNumberId},
          ${data.fmsAddressId},
          ${data.gisSupportId},
          ${data.techTypeId}
          );
        
        -- pkg_create_unit.update_9070674633013011019(au_id, au_id);
        pkg_create_unit.update_9070674633013011019(
          au_id,
          au_id);

        /*
        rfs_id := pkg_create_inventory.create_free_rfs_port(:customer_id,:node_name_value,:node_port_value,:node_rack_value, :node_shelf_value,:node_slot_value,:ont_node_value,:ont_port_value,:ont_slot_value,:slid_value,:device_type_value,:access_port_profile_value,9135739551713397186);
        */
        rfs_id := pkg_create_inventory.create_free_rfs_port(
                        ${data.customerId},
                        ${nodeName},
                        ${nodePort},
                        ${nodeRack},
                        ${nodeShelf},
                        ${nodeSlot},
                        ${ontNode},
                        ${ontPort},
                        ${ontSlot},
                        ${slid},
                        ${deviceType},
                        ${accessPortProfile},
                        ${techTypeId}
                    );
        
        INSERT INTO nc_params VALUES (9150313910213156892, au_id, 0, NULL, NULL, 9150313760013156766, 1, NULL, 1);
        INSERT INTO nc_params VALUES (9150313760013156759, au_id, 0, NULL, NULL, 9150313760013156766, 1, NULL, 1);
        SELECT
            pkgam.build_address(au_id,pkgam.get_format_id(au_id, 9131975650313000303),null) INTO formatedAddress_v
        from dual;
        
        :formatedAddress :=  formatedAddress_v;
        :freePort := rfs_id;
        :AU := au_id;
      commit;
    end;
    `;

    logger.debug(`createAddressUnitAndFreePortRFS: ${proc}`);
    return proc;
  };

  /* CODE when address is LTE/GPON or LTE/XGSPON */
  static createAddressUnitNoFreePortRFS = (data: AddressUnit) => {
    logger.debug(`----LTE----------`);
    data.streetNumberId = !!data.streetNumberId ? data.streetNumberId : null;
    data.fmsAddressId = !!data.fmsAddressId ? data.fmsAddressId : null;
    data.gisSupportId = !!data.gisSupportId
      ? data.gisSupportId
      : 9137857652713673469n;
    data.techTypeId = !!data.techTypeId
      ? data.techTypeId
      : 9135739551713397186n;

    const nodeName = !!data.nodeName ? `'${data.nodeName}'` : null;
    const nodePort = !!data.nodePort ? `'${data.nodePort}'` : null;
    const nodeRack = !!data.nodeRack ? `'${data.nodeRack}'` : null;
    const nodeShelf = !!data.nodeShelf ? `'${data.nodeShelf}'` : null;
    const nodeSlot = !!data.nodeSlot ? `'${data.nodeSlot}'` : null;
    const ontNode = !!data.ontNode ? `'${data.ontNode}'` : null;
    const ontPort = !!data.ontPort ? `'${data.ontPort}'` : null;
    const ontSlot = !!data.ontSlot ? `'${data.ontSlot}'` : null;
    const deviceType = !!data.deviceType ? `'${data.deviceType}'` : null;
    const accessPortProfile = !!data.accessPortProfile
      ? `'${data.accessPortProfile}'`
      : null;
    const techTypeId = !!data.techTypeId ? `'${data.techTypeId}'` : null;
    const slid = !!data.slid ? `'${data.slid}'` : null;

    let proc = `
    declare
      rfs_id number(20);
      au_id string(20);
      formatedAddress_v STRING(150);
    begin    
        /*
        au_id := pkg_create_unit.create_9070674633013011019( '1571849511', '1571849511' , :streetNumberId , :fmsAddress , 9137857652713673469 , 9135739551713397186);
        */
        au_id := pkg_create_unit.create_9070674633013011019(
            '1571849511',
          '${data.fmsAddressId}',
          ${data.streetNumberId},
          ${data.fmsAddressId},
          ${data.gisSupportId},
          ${data.techTypeId}
          );
        
        -- pkg_create_unit.update_9070674633013011019(au_id, au_id);
        pkg_create_unit.update_9070674633013011019(
          au_id,
          au_id);
        
        INSERT INTO nc_params VALUES (9150313910213156892, au_id, 0, NULL, NULL, 9150313760013156766, 1, NULL, 1);
        INSERT INTO nc_params VALUES (9150313760013156759, au_id, 0, NULL, NULL, 9150313760013156766, 1, NULL, 1);
        SELECT
            pkgam.build_address(au_id,pkgam.get_format_id(au_id, 9131975650313000303),null) INTO formatedAddress_v
        from dual;
        
        :formatedAddress :=  formatedAddress_v;
        :AU := au_id;
      commit;
    end;
    `;

    logger.debug(`createAddressUnitNoFreePortRFS: ${proc}`);
    return proc;
  };

  static insertParametersIntoGIS = (techType: string) => {
    // techType can be any of 'GPON', 'LTE' etc
    `INSERT INTO GIS(PATH_ID, OLT_NAME, OLT_SHELF, OLT_SLOT, OLT_PORT, ONT_NODE, DEVICE_TYPE, ADDRESS, TECHNOLOGY_TYPE,
        STATUS, ONT_SHAREABLE, ONT_SLOT, ONT_PORT) 
        VALUES ((:path_id_value), (:node_name_value), (:node_shelf_value), (:node_slot_value), (:node_port_value), (:ont_node_value), (:device_type_value),
            (:externalAddressID), '${techType}', (:status_value), \'False\' , (:ont_slot_value), (:ont_port_value))
    `;
  };

  /* CODE when address is LTE */
  static createAddressUnit = `declare 
        bca_id number(20);
    begin
        :AU := pkg_create_unit.create_9070674633013011019('1571849511', '1571849511', :streetNumberId , '009182123' , 9137857652713673469 , 9135739551713397186);
    end;`;

  static queryAllCustomers(customerName: string) {
    const query = `      
            select ecid.value ecid, addr.value address_id, custom.object_id from nc_params contact, nc_objects custom, nc_params ecid,
            nc_objects om, nc_references cbs, nc_objects loc, nc_references addr_ref, nc_params addr
            where contact.attr_id = 9134256876313157625 and contact.value like '${customerName}%'
            and custom.object_id = contact.object_id
            and ecid.object_id = custom.parent_id
            and ecid.attr_id = 9138719996013282785
            and om.parent_id = ecid.object_id
            and om.object_type_id = 4070674633013011019
            and cbs.object_id = om.object_id
            and cbs.attr_id = 4072141203013823765
            and loc.parent_id = cbs.reference
            and addr_ref.object_id = loc.object_id
            and addr_ref.attr_id = 9132251685613889259
            and addr.object_id = addr_ref.reference
            and addr.attr_id = 9136008721213360476`;
    logger.debug(`queryAllCustomers: ${query}`);
    return query;
  }

  static queryPromotionType(promotionId) {
    const query = `
    select
name
from
nc_object_types
where
object_type_id = (
select
object_type_id
from
nc_objects
where
object_id = (
select
reference
from
nc_references
where
attr_id = 9132193091613893416 /* Price Component Specification */
and object_id = (
select
object_id
from
nc_objects
where
parent_id = ${promotionId}
/* $1 off ongoing */
)/* $100 off for 1 month Price Component */
))
    `;
    return query;
  }
}

/**
 * @description Sets connection with oracle database as per given configuration in db-config.js
 * @returns Promise<oracledb.Connection>
 */
async function setConn(dbConfig: DbConfig): Promise<OracleDB.Connection> {
  let conn = null;

  // Setting externalAuth is optional.  It defaults to false.  See:
  // https://oracle.github.io/node-oracledb/doc/api.html#extauth
  // externalAuth  : process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false
  try {
    let connObj = {
      user: dbConfig.user || process.env.NODE_ORACLEDB_USER,
      // Get the password from the environment variable
      // NODE_ORACLEDB_PASSWORD.  The password could also be a hard coded
      // string (not recommended), or it could be prompted for.
      // Alternatively use External Authentication so that no password is
      // needed.
      password: dbConfig.password || process.env.NODE_ORACLEDB_PASSWORD,
      // For information on connection strings see:
      // https://oracle.github.io/node-oracledb/doc/api.html#connectionstrings
      connectString:
        dbConfig.connectString || process.env.NODE_ORACLEDB_CONNECTIONSTRING,
    };
    conn = await oracle.getConnection(connObj);
    logger.info(`Connection with ${JSON.stringify(connObj)} was successful!`);
  } catch (err) {
    logger.error(err);
    throw err;
  }
  return conn;
}

/**
 * @description Releases specified oracle db connection object
 * @param {oracle.Connection} conn
 */
function releaseConn(conn: any) {
  if (conn != null) {
    conn.release(function (err: any) {
      if (err) {
        logger.error(err);
        return;
      }
    });
  }
}
