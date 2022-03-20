const xlsx = require('node-xlsx');
const fs = require('fs');
const orcaleDriver = require('../dist/src/db/oracleDriver');
const { oracleClientVersion } = require('oracledb');
const { default: oracleDriver } = require('../dist/src/db/oracleDriver');

const FILE_PATH = '../BCX_20210927.xlsx';

const opusDataBuffer = fs.readFileSync(FILE_PATH);
const parsedOPUSData = xlsx.parse(opusDataBuffer)[0].data.slice(1,-1).filter((row) => row.length > 0);

console.log(parsedOPUSData);

const constructQuery = (row) => `INSERT INTO MIGRATION_EMAILADDRESS_DETAILS (ENTERPRISE_CUSTOMER_ID, LOCATION_ID, EMAIL_ADDRESS, RESOURCE_ID) SELECT ${row[3]}, ${row[4]}, '${row[2]}', tv_id_sequence.nextval from dual`;

(async () => {
  await orcaleDriver.default.connect();
  for (const row of parsedOPUSData) {
    const query = constructQuery(row);
    console.log(query);
    const result = await oracleDriver.executeQuery(query);
    console.log(result);
  }
})();