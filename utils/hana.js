require("dotenv").config();
const hana = require("@sap/hana-client");

// enviroment variables
const HANA_HOST = process.env.HANA_HOST;
const HANA_USER = process.env.HANA_USER;
const HANA_PASSWORD = process.env.HANA_PASSWORD;
const HANA_DATABASE = process.env.HANA_DATABASE;
const HANA_ITEMS_QNTY = process.env.HANA_ITEMS_QNTY;
const HANA_TOTAL_SALES = process.env.HANA_TOTAL_SALES;
const HANA_WAHREHOUSES = process.env.HANA_WAHREHOUSES;

const hanaConfig = {
  serverNode: `${HANA_HOST}:30015`,
  uid: HANA_USER,
  pwd: HANA_PASSWORD,
  sslValidateCertificate: "false",
};

const getReceiptQntys = async (whs,itemcode,connection) => {
  const promise = new Promise((resolve,reject) => {
    try{
      connection.exec(`Select * from "${HANA_DATABASE}"."${HANA_ITEMS_QNTY}" where "WhsCode" = '${whs}' and "ItemCode" = '${itemcode}'`, (err, result) => {
        if(err){
          resolve()
        }else{
          resolve(result)
        }
      });
    }catch(err){
      resolve()
    }
  })
  return promise
};

const getTotalSales = async (whs,itemcode,connection) => {
  const promise = new Promise((resolve,reject) => {
    try{
      connection.exec(`Select * from "${HANA_DATABASE}"."${HANA_TOTAL_SALES}" where "WhsCode" = '${whs}' and "ItemCode" = '${itemcode}'`, (err, result) => {
        if(err){
          resolve()
        }else{
          resolve(result)
        }
      });
    }catch(err){
      resolve()
    }
  })
  return promise
};

const getHanaItemInfo = async (whs,itemcode) => {
  const promises = []
  const connection = hana.createConnection();
  try{
    return new Promise((resolve,reject) => {
      connection.connect(hanaConfig,async(err) => {
        if (err){
          console.log(err)
          resolve(promises)
        };
        promises.push(getReceiptQntys(whs,itemcode,connection))
        promises.push(getTotalSales(whs,itemcode,connection))
        const results = await Promise.all(promises)
        connection.disconnect();
        resolve(results)
      });
    })
  }catch(err){
    return promises
  }
}

const getwarehouseList = async () => {
  const procedureStatment = `CALL "${HANA_DATABASE}"."${HANA_WAHREHOUSES}"`;
  return execute(procedureStatment).catch(() => {return 'error'});
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
  getHanaItemInfo,
  getwarehouseList
};
