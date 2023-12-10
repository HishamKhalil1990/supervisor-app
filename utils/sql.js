require('dotenv').config();
const mssql = require('mssql');

// enviroment variables database
const MSSQL_LOCAL_ADDRESS = process.env.MSSQL_LOCAL_ADDRESS
const MSSQL_USER = process.env.MSSQL_USER
const MSSQL_PASS_WORD = process.env.MSSQL_PASS_WORD
const MSSQL_DATABASE = process.env.MSSQL_DATABASE
const MSSQL_LOCAL_ADDRESS_REPORT = process.env.MSSQL_LOCAL_ADDRESS_REPORT
const MSSQL_USER_REPORT = process.env.MSSQL_USER_REPORT
const MSSQL_PASS_WORD_REPORT = process.env.MSSQL_PASS_WORD_REPORT
const MSSQL_DATABASE_REPORT = process.env.MSSQL_DATABASE_REPORT

const mssqlConfig = {
    user: MSSQL_USER,
    password: MSSQL_PASS_WORD,
    database: MSSQL_DATABASE,
    server: MSSQL_LOCAL_ADDRESS,
    port: 1433,
    pool: {
        max: 200,
        min: 0,
        idleTimeoutMillis: 30000,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 30000,
        reapIntervalMillis: 30000,
        createRetryIntervalMillis: 30000,
    },
    options: {
          enableArithAbort: true,
          encrypt: false
    }
};

const mssqlConfigForReport = {
    user: MSSQL_USER_REPORT,
    password: MSSQL_PASS_WORD_REPORT,
    database: MSSQL_DATABASE_REPORT,
    server: MSSQL_LOCAL_ADDRESS_REPORT,
    port: 1433,
    connectionTimeout: 300000,
    requestTimeout: 300000,
    pool: {
          max: 200,
          min: 0,
          idleTimeoutMillis: 300000,
          acquireTimeoutMillis: 300000,
          createTimeoutMillis: 300000,
          destroyTimeoutMillis: 300000,
          reapIntervalMillis: 300000,
          createRetryIntervalMillis: 300000,
    },
    options: {
          enableArithAbort: true,
          encrypt: false
    }
};

const connectionPool = new mssql.ConnectionPool(mssqlConfig)
const reportConnectionPool = new mssql.ConnectionPool(mssqlConfigForReport)

// create pool connection
const getConnectionPool = async () => {
    try{
        return connectionPool;
    }catch(err){
        return
    } 
}

// create SQL connection
const getSQL = async () => {
    try{
        const pool = await mssql.connect(mssqlConfig)
        .then(pool => {
            return pool
        })
        return pool
    }catch(err){
        return
    } 
}

// create SQL connection
const getTransaction = async (pool) => {
    try{
        const transaction = new mssql.Transaction(pool)
        return transaction
    }catch(err){
        return
    } 
}

// create SQL connection
const getReportSQL = async () => {
    try{
        const pool = await mssql.connect(mssqlConfigForReport)
        .then(pool => {
            return pool
        })
        return pool
    }catch(err){
        return
    } 
}

module.exports = {
    getSQL,
    getTransaction,
    getConnectionPool,
    getReportSQL,
};