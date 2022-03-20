const fs = require('fs');
const xlsx = require('node-xlsx');
const { Pool } = require('pg');

const FILE_PATH = '../Automation prevalidation list.xlsx';

const opusDataBuffer = fs.readFileSync(FILE_PATH);
const parsedOPUSData = xlsx.parse(opusDataBuffer, {});

// console.log(parsedOPUSData[0]);

const pool = () => new Pool({
  user: "tauser",
  host: "localhost",
  database: "merlin-testautomation-db",
  password: "tapass",
  port: 5434,
});

async function postgreQueryExecutor (query, params = []) {
  const client = await pool().connect();
  try { 
    const result = client.query(query, params)
    return result;
  } catch (error) {
    return {error: error.message};
  } finally {
    client.release();
  }
}

function constructCustomersLocationsQuery(rows, mode='locations') {
  let initialQuery = `INSERT INTO opus_customers_${mode}(ecid, location_id, rcid, ban, legal_name, offering_id) VALUES `;
  const customersLocationsData = rows.filter((el, index, self) => index === self.findIndex((uel) => uel[3] === el[3]));
  console.log(customersLocationsData)
  customersLocationsData.forEach((row) => {
    return initialQuery += `(${row[3]}, ${row[4]}, ${row[6]}, ${row[5]}, '${row[8].replace(/'/g, "`")}', '${row[9]}'),`
  }); 
  return initialQuery.substring(0, initialQuery.length - 1);
}
// filter not only by unique ECID but by unique pair ECID + location_id


function constructMailboxesQuery(rows) {
  let initialQuery = 'INSERT INTO opus_mailboxes(ecid, location_id, old_mailbox, target_mailbox) VALUES ';
  rows.forEach((row) => {
    return initialQuery += `(${row[3]}, ${row[4]}, '${row[1]}','${row[2]}'),`}
    );
  
  return initialQuery.substring(0, initialQuery.length - 1);
}

(async () => {  
  const data = parsedOPUSData[0].data.filter((el)=> el.length  && parsedOPUSData[0].data.indexOf(el) !== 0);
  const customersLocationsQuery = constructCustomersLocationsQuery(data);
  const mailboxesQuery = constructMailboxesQuery(data);
  console.log(customersLocationsQuery)
  console.log(mailboxesQuery)
  await postgreQueryExecutor(customersLocationsQuery);
  await postgreQueryExecutor(mailboxesQuery)
})();

