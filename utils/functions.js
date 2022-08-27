require('dotenv').config();
const prisma = require('./prismaDB')
const hana = require('./hana')
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

const getTransferAvailable = async(message) => {
    return await syncTransferRequest()
                .then(() => {
                    return true
                })
                .catch(() => {
                    message.msg = 'error'
                    return false
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
                                    // const names = await prisma.getCountNames()
                                    resolve(names.length)
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
            CountingName:rec.CountingName,
            CountingDate:rec.CountingDate,
            ItemCode:rec.ItemCode,
            ItemName:rec.ItemName,
            BuyUnitMsr:rec.UnitMsr,
            WhsCode:rec.WhsCode,
            CodeBars:rec.CodeBars,
            Note:rec.Note,
        }
    })
    return prisma.createAllcountReq(mappedData)
}


const updateWhsInfo = async (type,id,value) => {
    const statements = {
        open:`update ${USERS_WHS_TABLE} set Allowed = 1 where Username = '${id}'`,
        close:`update ${USERS_WHS_TABLE} set Allowed = 0 where Username = '${id}'`,
        closeAll:`update ${USERS_WHS_TABLE} set Allowed = 0 where Allowed = 1`,
        count:`update ${USERS_WHS_TABLE} set CountingAvailable = ${value} where Username = '${id}'`,
    }
    try{
        const pool = await sql.getSQL();
        const whsCode = await pool.request().query(statements[`${type}`])
        .then(result => {
            pool.close();
            if(result.rowsAffected.length > 0){
                if(type == 'open'){
                    const start = async () => {
                        const text = 'لقد تم الموافقة على طلبك لعمل طلبية بضاعة في غير وقتها المحدد'
                        const subject = 'رد السماح بعمل طلبية'
                        const toEmail = value
                        await sendEmail(text,subject,toEmail)
                    }
                    start()
                }else if(type == 'close'){
                    const start = async () => {
                        const text = 'لقد تم الغاء الموافقة المسبقة لعمل طلبية بضاعة في غير وقتها'
                        const subject = 'رد السماح بعمل طلبية'
                        const toEmail = value
                        await sendEmail(text,subject,toEmail)
                    }
                    start()
                }
                return 'done'
            }else{
                return 'error';
            }
        })
        return whsCode
    }catch(err){
        return 'error'
    }
}

const getItems = async (id) => {
    await prisma.deleteAll()
    const records = await hana.getItems(id)
    if(records != 'error'){
        const status = await prisma.createRecords(records)
        if(status != "error"){
            return prisma.findAll()
        }else{
            return "error"
        }
    }else{
        return 'noData'
    }
}

module.exports = {
    getUser,
    getTransferAvailable,
    getItems,
    updateWhsInfo,
}