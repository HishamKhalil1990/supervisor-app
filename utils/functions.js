require('dotenv').config();
const prisma = require('./prismaDB')
const sql = require('./sql')
const sendEmail = require('./email')

// enviroment variables
const USERS_TABLE = process.env.USERS_TABLE
const USERS_WHS_TABLE = process.env.USERS_WHS_TABLE
const REQUSET_TRANSFER_TABLE = process.env.REQUSET_TRANSFER_TABLE

const getUser = async (username,password) => {
    try{
        const pool = await sql.getSQL();
        const user = await pool.request().query(`select * from ${USERS_TABLE} where Username = '${username}' and Password = '${password}'`)
        .then(result => {
            pool.close();
            return result.recordset;
        })
        return user
    }catch(err){
        return
    }
}

const getTransferAvailable = async() => {
    return await syncTransferRequest()
                .then(() => {
                    return 'done'
                })
                .catch(() => {
                    return 'error'
                })
}

const syncTransferRequest = async() => {
    return new Promise((resolve,reject) => {
        try{
            const start = async() => {
                const pool = await sql.getSQL()
                if(pool){
                    await pool.request().query(`select * from ${REQUSET_TRANSFER_TABLE} where SAP_Procces = 3`)
                    .then(result => {
                        pool.close();
                        if(result.recordset.length > 0){
                            const start = async() => {
                                const msg = await saveTransferRequest(result.recordset)
                                if(msg != 'error'){
                                    resolve()
                                }else{
                                    reject()
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

const saveTransferRequest = async(result) => {
    const mappedData = result.map((rec) => {
        return {
            id:rec.ID,
            ItemCode:rec.ItemCode,
            ItemName:rec.ItemName,
            ListNum:rec.ListNum,
            ListName:rec.ListName,
            AvgDaily:rec.AvgDaily,
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
            Note:rec.Note
        }
    })
    return prisma.createAllTransferReq(mappedData)
}

const changeTransferSapProcess = async(records,reqStatus) => {
    return new Promise((resolve,reject) => {
        const start = async() => {
            const pool = await sql.getSQL()
            if(pool){
                const length = records.length
                const arr = []
                records.forEach(rec => {
                    if(rec.Status == 'pending'){
                        changeRecSap(rec,arr,pool,reqStatus)
                        .then(() => {
                            if(arr.length == length){
                                pool.close();
                                resolve();
                            }
                        })
                        .catch(() => {
                            reject()
                        })
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

const changeRecSap = async(rec,arr,pool,reqStatus) => {
    return new Promise((resolve,reject) => {
        const statements = {
            approve:`update ${REQUSET_TRANSFER_TABLE} set SAP_Procces = 2 where ID = ${rec.id}`,
            decline:`delete from ${REQUSET_TRANSFER_TABLE} where ID = ${rec.id}`,
        }
        try{
            pool.request().query(statements[`${reqStatus}`])
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
            })
        }catch(err){
            reject()
        }
    })

}

const getWhs = async (username,whs) => {
    const method = username? 'username' : 'whs'
    const statements = {
        username:`select * from ${USERS_WHS_TABLE} where Username = '${username}'`,
        whs:`select * from ${USERS_WHS_TABLE} where WhsCode = '${whs}'`,
    }
    try{
        const pool = await sql.getSQL();
        if(pool){
            const whsCode = await pool.request().query(statements[`${method}`])
            .then(result => {
                pool.close();
                return result.recordset;
            })
            return whsCode
        }else{
            return
        }
    }catch(err){
        return
    }
}

module.exports = {
    getUser,
    getTransferAvailable,
    changeTransferSapProcess,
    getWhs
}