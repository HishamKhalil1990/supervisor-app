require('dotenv').config();
const prisma = require('./prismaDB')
const sql = require('./sql')
const sendEmail = require('./email')
const hana = require('./hana')

// enviroment variables
const USERS_TABLE = process.env.USERS_TABLE
const REQUSET_TRANSFER_TABLE = process.env.REQUSET_TRANSFER_TABLE
const SQL_INVENTORY_TRANSACTIONS_HISTORY_REPORT = process.env.SQL_INVENTORY_TRANSACTIONS_HISTORY_REPORT

const getUser = async (username,password) => {
    try{
        const pool = await sql.getConnectionPool()
        await pool.connect()
        const user = await pool.query(`select * from ${USERS_TABLE} where username = '${username}' and password = '${password}'`)
        .then(result => {
            return result.recordset;
        })
        return user
    }catch(err){
        return
    }
}

const getTransferAvailable = async(warehouses,username,role) => {
    return await syncTransferRequest(warehouses,username,role)
                .then(() => {
                    return 'done'
                })
                .catch(() => {
                    return 'error'
                })
}

const syncTransferRequest = async(warehouses,username,role) => {
    return new Promise((resolve,reject) => {
        try{
            let sapProcces = role == 'manager'? 7 : 4
            const start = async() => {
                const pool = await sql.getConnectionPool()
                await pool.connect()
                if(pool){
                    await pool.query(`select * from ${REQUSET_TRANSFER_TABLE} where SAP_Procces = ${sapProcces}`)
                    .then(result => {
                        if(result.recordset.length > 0){
                            const start = async() => {
                                if(role != 'manager'){
                                    const records = []
                                    const whs = warehouses.split('-')
                                    result.recordset.forEach(rec => {
                                        if(rec.GenCode[0] != 'r'){
                                            if(whs.includes(rec.WhsCode)){
                                                records.push(rec)
                                            }
                                        }else if(rec.GenCode[0] == 'r'){
                                            if(whs.includes(rec.warehousefrom)){
                                                records.push(rec)
                                            }
                                        }
                                    })
                                    const msg = await saveTransferRequest(records,username)
                                    if(msg != 'error'){
                                        resolve()
                                    }else{
                                        reject()
                                    }
                                }else{
                                    const promises = []
                                    result.recordset.forEach(rec => {
                                        if(rec.GenCode[0] != 'r'){
                                            promises.push(hana.getHanaItemInfo(rec.WhsCode,rec.ItemCode))
                                        }else if(rec.GenCode[0] == 'r'){
                                            promises.push(hana.getHanaItemInfo(rec.warehousefrom,rec.ItemCode))
                                        }
                                    })
                                    const promisesResult = await Promise.all(promises)
                                    const mappedResults = result.recordset.map((rec,index) => {
                                        if(promisesResult[index].length > 0){
                                            rec.receiptQnty = promisesResult[index][0].length > 0? parseFloat(promisesResult[index][0][0]['SUM(Quantity)']) : 0
                                            rec.totalSales = promisesResult[index][1].length > 0? parseFloat(promisesResult[index][1][0]["Quantity"]) : 0
                                        }else{
                                            rec.receiptQnty = 0
                                            rec.totalSales = 0
                                        }
                                        return rec
                                    })
                                    const msg = await saveTransferRequest(mappedResults,username)
                                    if(msg != 'error'){
                                        resolve()
                                    }else{
                                        reject()
                                    }
                                }
                            }
                            start()
                        }else{
                            resolve()
                        }
                    })
                }else{
                    reject()
                }
            }
            start()
        }catch(err){
            reject()
        }
    })
}

const saveTransferRequest = async(result,username) => {
    const mappedData = result.map((rec) => {
        return {
            id:rec.ID,
            ItemCode:rec.ItemCode,
            ItemName:rec.ItemName,
            ListNum:rec.ListNum,
            ListName:rec.ListName,
            AvgDaily:rec.AvgDaily? rec.AvgDaily : 0,
            SuggQty:rec.SuggQty,
            OnHand:rec.OnHand,
            MinStock:rec.MinStock,
            MaxStock:rec.MaxStock,
            Price:rec.Price,
            BuyUnitMsr:rec.BuyUnitMsr,
            WhsCode:rec.WhsCode,
            WhsName:rec.WhsName,
            CodeBars:rec.CodeBars,
            ConvFactor:rec.ConvFactor,
            Warehousefrom:rec.warehousefrom,
            Warehouses:rec.Warehouses,
            Order:rec.QtyOrders,
            GenCode:rec.GenCode,
            UserName:rec.UserName,
            Note:rec.Note,
            Supervisor:username,
            receiptQnty:rec.receiptQnty? rec.receiptQnty : 0,
            totalSales:rec.totalSales? rec.totalSales : 0,
            FatherCode:rec.fatherCode != null? rec.fatherCode : undefined,
            ChildName:rec.childName != null? rec.childName : undefined,
            Remark:rec.remark != null? rec.remark : undefined,
        }
    })
    return prisma.createAllTransferReq(mappedData,username)
}

function convertUTCDateToLocalDate(d) {
    let date = new Date(d)
    let newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000);
    let offset = date.getTimezoneOffset() / 60;
    let hours = date.getHours();

    newDate.setHours(hours - offset);

    return newDate;   
}

const sendUpdatedRequestBatch = async(pool,batchArr,index) => {
    return new Promise((resolve,reject) => {
        const mappedData = batchArr.join('')
        const time = index*1000
        setTimeout(() => {
            try{
                pool.batch(mappedData, (err, result) => {
                    if (err){ 
                        resolve('error')
                    }else{
                        resolve('done')
                    }
                })
            }catch(err){
                resolve('error')
            }
        },time)
    })
}

const sendBulkToSql = async(pool,records,reqStatus,supervisorName,date,role,typeOfSubmit) => {
    const ids = []
    let localDate = convertUTCDateToLocalDate(date)
    localDate = localDate.toISOString()
    let sapProcces = role == 'manager'? 5 : (typeOfSubmit == 'order'? 7 : 5)
    const existingRecords = await pool.query(`select ItemCode from ${REQUSET_TRANSFER_TABLE} where GenCode = '${records[0].GenCode}' and SAP_Procces = ${sapProcces}`)
    .then(result => {
        return result.recordset.map(rec => Object.values(rec)[0])
    }).catch(err => {
        return []
    })
    let mappedeRecords = records
    .filter(rec =>{
        ids.push(rec.id)
        return !existingRecords.includes(rec.ItemCode)
    })
    .map(rec => {
        let saveStatus = reqStatus
        let statements = role == 'manager'? 
        {
            approve:`update ${REQUSET_TRANSFER_TABLE} set SAP_Procces = ${sapProcces}, receiptQnty = ${rec.receiptQnty}, totalSales = ${rec.totalSales}, QtyOrders = ${rec.Order}, managerName = N'${supervisorName}', managerApproveTime = '${localDate}', managerQnty = ${rec.Order}  where ID = ${rec.id};`,
            decline:`update ${REQUSET_TRANSFER_TABLE} set SAP_Procces = ${sapProcces}, receiptQnty = ${rec.receiptQnty}, totalSales = ${rec.totalSales}, QtyOrders = 0, managerName = N'${supervisorName}', managerApproveTime = '${localDate}', managerQnty = 0 where ID = ${rec.id};`
        }
        :
        {
            approve:`update ${REQUSET_TRANSFER_TABLE} set SAP_Procces = ${sapProcces}, QtyOrders = ${rec.Order}, supervisorName = N'${supervisorName}', approveTime = '${localDate}', supervisorQnty = ${rec.Order} where ID = ${rec.id};`,
            decline:`update ${REQUSET_TRANSFER_TABLE} set SAP_Procces = 5, QtyOrders = 0, supervisorName = N'${supervisorName}', approveTime = '${localDate}', supervisorQnty = 0 where ID = ${rec.id};`
        }
        return statements[`${saveStatus}`]
    })
    const promises = []
    let batchArr = []
    let index = 0
    mappedeRecords.forEach(rec => {
        if(batchArr.length == 100){
            promises.push(sendUpdatedRequestBatch(pool,batchArr,index))
            batchArr = []
            index += 1
        }
        batchArr.push(rec)
    })
    if(batchArr.length > 0){
        promises.push(sendUpdatedRequestBatch(pool,batchArr,index))
    }
    const promisesResults = await Promise.all(promises)
    return new Promise((resolve,reject) => {
        try{
            let status = 'done'
            for(let i = 0; i < promisesResults.length; i++){
                if(promisesResults[i] == 'error'){
                    status = 'error'
                    break
                }
            }
            if(status != 'error'){
                prisma.deleteReqStatus(ids)
                resolve()
            }else{
                reject()
            }
        }catch(err){
            reject()
        }
    })
}

const changeTransferSapProcess = async(records,reqStatus,typeOfSubmit,supervisorName,date,role) => {
    return new Promise((resolve,reject) => {
        const start = async() => {
            const pool = await sql.getConnectionPool()
            await pool.connect()
            if(pool){    
                sendBulkToSql(pool,records,reqStatus,supervisorName,date,role,typeOfSubmit)
                .then(() => {
                    resolve()
                })
                .catch(() => {
                    reject()
                })
            }else{
                reject()
            }
        }
        start()
    })
}

const getInvTranHistReportData = async (whs) =>{ 
    return new Promise((resolve,reject) => {
        let response = {
            msg:'error'
        }
        try{
            const getSql = async() => {
                const conn = await sql.getReportSQL()
                if(conn){
                    conn.connect()
                        .then(function (pool) {
                            const start = async() => {
                                const transaction = await sql.getTransaction(pool);
                                return transaction.begin((err) => {
                                    if(err){
                                        console.log(err)
                                        conn.close()
                                        return resolve(response)
                                    }
                                    pool.request()
                                    .input("WhsCode",whs)
                                    .execute(SQL_INVENTORY_TRANSACTIONS_HISTORY_REPORT,(err,result) => {
                                        if(err){
                                            console.log('excute',err)
                                            conn.close()
                                            return resolve(response)
                                        }
                                        transaction.commit((err) => {
                                            conn.close()
                                            if(err){
                                                console.log('transaction error : ',err)
                                                return resolve(response)
                                            }else{
                                                console.log("Transaction committed.");
                                                response.msg = 'done'
                                                response.data = result != undefined? result.recordset : result
                                                return resolve(response)
                                            }
                                        });
                                    })
                                })
                            }
                            start()
                    })
                }else{
                    resolve(response)
                }
            }
            getSql()
        }catch(err){
            console.log(err)
            resolve(response)
        }
    })

}

module.exports = {
    getUser,
    getTransferAvailable,
    changeTransferSapProcess,
    getInvTranHistReportData
}