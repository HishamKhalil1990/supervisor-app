require('dotenv').config();
const prisma = require('./prismaDB')
const sql = require('./sql')
const sendEmail = require('./email')
const hana = require('./hana')

// enviroment variables
const USERS_TABLE = process.env.USERS_TABLE
const REQUSET_TRANSFER_TABLE = process.env.REQUSET_TRANSFER_TABLE

const getUser = async (username,password) => {
    try{
        const pool = await sql.getSQL();
        const user = await pool.request().query(`select * from ${USERS_TABLE} where username = '${username}' and password = '${password}'`)
        .then(result => {
            pool.close();
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
                const pool = await sql.getSQL()
                if(pool){
                    await pool.request().query(`select * from ${REQUSET_TRANSFER_TABLE} where SAP_Procces = ${sapProcces}`)
                    .then(result => {
                        pool.close();
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
                                            promises.push(hana.getReceiptQntys(rec.WhsCode,rec.ItemCode))
                                        }else if(rec.GenCode[0] == 'r'){
                                            promises.push(hana.getReceiptQntys(rec.warehousefrom,rec.ItemCode))
                                        }
                                    })
                                    const promisesResult = await Promise.all(promises)
                                    const mappedResults = result.recordset.map((rec,index) => {
                                        if(promisesResult[index].length > 0){
                                            rec.receiptQnty = parseFloat(promisesResult[index][0]['SUM(Quantity)'])
                                        }else{
                                            rec.receiptQnty = 0
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

const changeTransferSapProcess = async(records,reqStatus,typeOfSubmit,supervisorName,date,role) => {
    return new Promise((resolve,reject) => {
        const start = async() => {
            const pool = await sql.getSQL()
            if(pool){
                const length = records.length
                const arr = []
                let localDate = convertUTCDateToLocalDate(date)
                localDate = localDate.toISOString()
                records.forEach((rec,index) => {
                    if(rec.Status == 'pending'){
                        setTimeout(async() => {
                            return changeRecSap(rec,arr,pool,reqStatus,5,typeOfSubmit,supervisorName,localDate,role)
                            .then(() => {
                                if(arr.length == length){
                                    pool.close();
                                    resolve();
                                }
                            })
                            .catch(() => {
                                reject()
                            })
                        },30*index)
                    }else{
                        arr.push('added')
                        if(arr.length == length){
                            resolve()
                        }
                    }
                })
            }else{
                reject()
            }
        }
        start()
    })
}

const changeRecSap = async(rec,arr,pool,reqStatus,retryCount,typeOfSubmit,supervisorName,date,role) => {
    let sapProcces = role == 'manager'? 5 : 7
    let saveStatus = reqStatus
    if(rec.Order == 0 && reqStatus == 'approve'){
        saveStatus = 'decline'
    }
    return new Promise((resolve,reject) => {
        let statements = role == 'manager'? 
        {
            approve:`update ${REQUSET_TRANSFER_TABLE} set SAP_Procces = ${sapProcces}, QtyOrders = ${rec.Order} where ID = ${rec.id}`,
            // decline:`delete from ${REQUSET_TRANSFER_TABLE} where ID = ${rec.id}`,
            decline:`update ${REQUSET_TRANSFER_TABLE} set SAP_Procces = ${typeOfSubmit == 'receipt'? 6 : 5}, QtyOrders = 0 where ID = ${rec.id}`
        }
        :
        {
            approve:`update ${REQUSET_TRANSFER_TABLE} set SAP_Procces = ${sapProcces}, QtyOrders = ${rec.Order}, supervisorName = '${supervisorName}', approveTime = '${date}' where ID = ${rec.id}`,
            // decline:`delete from ${REQUSET_TRANSFER_TABLE} where ID = ${rec.id}`,
            decline:`update ${REQUSET_TRANSFER_TABLE} set SAP_Procces = ${sapProcces}, QtyOrders = 0, supervisorName = '${supervisorName}', approveTime = '${date}' where ID = ${rec.id}`
        }
        try{
            pool.request().query(statements[`${saveStatus}`])
            .then(result => {
                if(result.rowsAffected.length > 0){
                    console.log('table record updated')
                    prisma.deleteReqStatus(rec.id,arr)
                    .then(() => {
                        resolve()
                    })
                    .catch(() => {
                        reject()
                    })
                }else{
                    reject()
                }
            }).catch(err => {
                if(retryCount > 0){
                    const timeout = 1000
                    retryCount -= 1
                    setTimeout(() => {
                        const start = async() => {
                            return changeRecSap(rec,arr,pool,reqStatus,retryCount,typeOfSubmit,supervisorName,date)
                            .then(() => {
                                resolve()
                            }).catch(() => {
                                reject()
                            })
                        }
                        return start()
                    },timeout)
                }else{
                    reject()
                }
            })
        }catch(err){
            reject()
        }
    })

}

// const getWhs = async (username,whs) => {
//     const method = username? 'username' : 'whs'
//     const statements = {
//         username:`select * from ${USERS_WHS_TABLE} where Username = '${username}'`,
//         whs:`select * from ${USERS_WHS_TABLE} where WhsCode = '${whs}'`,
//     }
//     try{
//         const pool = await sql.getSQL();
//         if(pool){
//             const whsCode = await pool.request().query(statements[`${method}`])
//             .then(result => {
//                 pool.close();
//                 return result.recordset;
//             })
//             return whsCode
//         }else{
//             return
//         }
//     }catch(err){
//         return
//     }
// }

module.exports = {
    getUser,
    getTransferAvailable,
    changeTransferSapProcess,
    // getWhs
}