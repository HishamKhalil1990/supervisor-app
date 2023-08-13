require("dotenv").config();
const hana = require("@sap/hana-client");

// enviroment variables
const HANA_HOST = process.env.HANA_HOST;
const HANA_USER = process.env.HANA_USER;
const HANA_PASSWORD = process.env.HANA_PASSWORD;
const HANA_DATABASE = process.env.HANA_DATABASE;
const HANA_ITEMS_QNTY = process.env.HANA_ITEMS_QNTY;

const hanaConfig = {
  serverNode: `${HANA_HOST}:30015`,
  uid: HANA_USER,
  pwd: HANA_PASSWORD,
  sslValidateCertificate: "false",
};

// const getItems = async (whs) => {
//   const procedureStatment = `CALL "${HANA_DATABASE}"."${HANA_STOCK_REQUEST_PROCEDURE}" ('${whs}')`;
//   return execute(procedureStatment);
// };

const getReceiptQntys = async (whs,itemcode) => {
  const connection = hana.createConnection();
  const results = await new Promise((resolve,reject) => {
    try{
      connection.connect(hanaConfig,(err) => {
        if (err){
          console.log(err)
          resolve()
        };
        connection.exec(`Select * from "${HANA_DATABASE}"."${HANA_ITEMS_QNTY}" where "WhsCode" = '${whs}' and "ItemCode" = '${itemcode}'`, (err, result) => {
            resolve(result)
            connection.disconnect();
        });
      });
    }catch(err){
      resolve()
    }
  })
  return results
};


const execute = async (procdure) => { 
  return new Promise((resolve, reject) => {
    try {
      const connection = hana.createConnection();
      connection.connect(hanaConfig, (err) => {
        if (err) {
          console.log(err);
          reject();
        } else {
          const statment = connection.prepare(procdure);
          statment.execute(function (err, results) {
            if (err) {
              console.log(err);
              reject();
            }
            connection.disconnect();
            resolve(results);
          });
        }
      });
    } catch (err) {
      reject();
    }
  });
};

module.exports = {
  getReceiptQntys
};
