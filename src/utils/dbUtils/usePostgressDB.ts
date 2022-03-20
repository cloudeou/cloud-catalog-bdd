import { AddressCreationMeta, PgDbConfig } from '../../globals/custom-types';
import { Client } from 'pg';
import { Common } from '../commonBDD/Common';

import { Pool } from 'pg';
import { brconfig } from '../../../br-config';
// import { btapi } from '../../bt-api/btapi';
// const addresslist = require('../../../resources/address-data.json');

export class usePostgressDB {
  private address = '';
  private result = null;
  private record1 = `(
  '${brconfig.getEnv()}' /* env */,
  594464 /* address_id */,
  'FIBER' /* access_type */,
  'XGSPON' /* technology_access_port */,
  'Y' /* spare */,
  null,
  null
  )
`;

  private record2 = `(
  '${brconfig.getEnv()}' /* env */,
  4738639 /* address_id */,
  'FIBER' /* access_type */,
  'GPON' /* technology_access_port */,
  'Y' /* spare */,
  null,
  null
)`;

  private record3 = `(
    '${brconfig.getEnv()}' /* env */,
    594489 /* address_id */,
    'LTE' /* access_type */,
    null /* technology_access_port */,
    'Y' /* spare */,
    null,
    null
)`;

  private getRecordsToAdd(): Array<string> {
    let records = new Array();
    records.push(this.record1, this.record2, this.record3);
    return records;
  }

  queryInitializeDB = `
            CREATE TABLE ADDRESS_DATA(
                ENV                     VARCHAR (50)    NOT NULL,
                ADDRESS_ID              BIGINT          NOT NULL,
                ACCESS_TYPE             VARCHAR (50)    NOT NULL,
                TECHNOLOGY_ACCESS_PORT  VARCHAR (50),
                SPARE                   VARCHAR (50),
                ODB                     VARCHAR (50),
                DPU                     VARCHAR (50),  
                PRIMARY                 KEY (ADDRESS_ID)
               
            )
        `;

  async runQuery(query: string, dbConfig: PgDbConfig) {
    try {
      // clients will also use environment variables
      // for connection information
      const client = new Client({
        host: dbConfig.host,
        database: dbConfig.database,
        user: dbConfig.user,
        password: dbConfig.password,
        port: dbConfig.port,
      });
      await client.connect();
      console.log('EXECUTING QUERY ==> \n' + query);
      this.result = await client.query(query);
      await client.end();
      console.log('Execution of query done: \n' + query);
      //console.log('RETURNED: ' + JSON.stringify(this.result));
      return this.result;
    } catch (err) {
      console.log('error - ' + err);
    }
  }

  private queryDropPurgeDB = `DROP TABLE IF EXISTS ADDRESS_DATA`;
  private queryInsertData = `INSERT INTO ADDRESS_DATA(ENV,ADDRESS_ID,ACCESS_TYPE,TECHNOLOGY_ACCESS_PORT,SPARE,ODB,DPU) VALUES`;
  private queryGetAllData = `SELECT * FROM ADDRESS_DATA`;
  private querySetAddressSpareN_Query(addressId) {
    return `update ADDRESS_DATA set spare = 'N' where lower(env) = lower('${brconfig.getEnv()}') and address_id = '${addressId}'`;
  }

  private querySetAddressSpareY_Query(addressId) {
    return `update ADDRESS_DATA set spare = 'Y' where lower(env) = lower('${brconfig.getEnv()}') and address_id = '${addressId}'`;
  }

  private queryGetAddressSpareVAlue(addressId) {
    return `select SPARE from ADDRESS_DATA WHERE lower(env) = lower('${brconfig.getEnv()}') and ADDRESS_ID='${addressId}'`;
  }

  private querygetOccupiedAddress() {
    let env = brconfig.getEnv().toUpperCase();
    let tags = Common.getTagsSql();
    return `select address_id from ADDRESS_DATA WHERE SPARE = 'N' 
            ${env !== null ? "AND ENV = '" + env + "'" : ''}
            ${tags !== null ? 'AND owner IN(' + tags + ')' : ''}`;
  }

  public async createTableInPostgress(dbConfig: PgDbConfig) {
    await this.runQuery(this.queryInitializeDB, dbConfig);
  }

  // async insertDataInPostgress(dbConfig: PgDbConfig) {
  //   let address = addresslist.Address;
  //   console.log(`addresses : ${JSON.stringify(address)}`);
  //   let addresses = [];
  //   for (let i = 0; i < address.length; i++) {
  //     console.log(address[i]);
  //     let env = address[i].ENV;
  //     let address_id = address[i].address_id;
  //     let access_type = address[i].access_type;
  //     let technology_access_port = address[i].technology_access_port;
  //     let spare = address[i].SPARE;
  //     let odb = address[i].odb;
  //     let dpu = address[i].dpu;

  //     let query = `('${env}',
  //                 ${address_id},
  //                 '${access_type}',
  //                 '${technology_access_port}',
  //                 '${spare}',
  //                 ${odb},
  //                 ${dpu})`;
  //     console.log(this.queryInsertData + query);
  //     await btapi.wait(2000);
  //     await this.runQuery(this.queryInsertData + query, dbConfig);
  //   }
  // }

  async getASpareAddress(dbConfig: PgDbConfig, addressType, techType) {
    let query = `select max(address_id) from ADDRESS_DATA where env = '${brconfig.getEnv()}' and access_type = '${addressType}' and technology_access_port ${
      techType === undefined ? 'is null' : "= '" + techType + "'"
    } and spare != 'N'`;
    let address;
    return await this.runQuery(query, dbConfig).then(
      async (result) => {
        return result.rows[0].max;
      },
      (error) => {
        expect(true, 'Error while adding address\n' + error).toBe(false);
      },
    );
  }

  async markAddressOccupied(addressId, dbConfig: PgDbConfig) {
    await this.runQuery(this.querySetAddressSpareN_Query(addressId), dbConfig);
  }

  async markAddressSpare(addressId, dbConfig: PgDbConfig) {
    await this.runQuery(this.querySetAddressSpareY_Query(addressId), dbConfig);
  }

  async dropTable(dbConfig: PgDbConfig) {
    await this.runQuery(this.queryDropPurgeDB, dbConfig).then(() => {
      console.log(`Table dropped`);
    });
  }

  async getOccupiedAddress(dbConfig: PgDbConfig) {
    let result = await this.runQuery(this.querygetOccupiedAddress(), dbConfig);
    console.log(`Occupied addresses are: ${JSON.stringify(result)}`);
    return result;
    //   (result) => {

    //     return result;
    //   },
    //   (error) => {
    //     // expect(true, 'Error while adding address\n' + error).toBe(false);
    //     throw new Error('Error: ' + error);
    //   },
    // );
  }

  private queryGetAddressNmarkOccupied(data) {
    let tags = Common.getTagsSql();
    return `UPDATE ADDRESS_DATA SET spare='N'
    WHERE address_id IN (
      SELECT MAX(address_id) as id
      FROM ADDRESS_DATA
      WHERE env='${brconfig.getEnv().toUpperCase()}'
      ${
        data.techType === undefined
          ? ''
          : "AND technology_access_port = '" + data.techType + "'"
      } 
      ${
        data.market === undefined
          ? ''
          : `AND market = '${data.market.toUpperCase()}'`
      }
      ${data.odb === undefined ? '' : "and odb = '" + data.odb + "'"} 
      ${data.dpu === undefined ? '' : "and dpu = '" + data.dpu + "'"}
      ${tags !== null ? 'AND owner IN(' + tags + ')' : ''}      
      AND spare = 'Y'
      ) 
      RETURNING *`;
  }

  async getAddress(dbConfig: PgDbConfig, data: AddressCreationMeta) {
    let address: { [key: string]: string };
    let query = this.queryGetAddressNmarkOccupied(data);
    const result = await this.runQuery(query, dbConfig);
    // console.log('RESULT IS', JSON.stringify(result));
    address = result.rows[0];
    // .then(async (result) => {
    //   address = result.rows[0].max;
    //   console.log('RESUlTS' + result.rows[0].max);
    //   console.log(`Marking address occupied.....`);
    //   await this.runQuery(
    //     this.querySetAddressSpareN_Query(address),
    //     dbConfig,
    //   ).then(async () => {
    //     console.log(`Address marked occupied`);
    //     await this.runQuery(
    //       this.queryGetAddressSpareVAlue(address),
    //       dbConfig,
    //     ).then(async () => {
    //       await this.runQuery(this.queryGetAllData, dbConfig).then(
    //         async (result) => {
    //           // console.log(
    //           //   'Getting all data with spare N: \n' + JSON.stringify(result),
    //           // );
    //           // await this.runQuery(
    //           //   this.queryDropPurgeDB,
    //           //   dbConfig,
    //           // ).then(() => {
    //           //   console.log(`Table dropped`);
    //           // });
    //         },
    //       );
    //     });
    //   });
    // });
    return address;
  }
}
