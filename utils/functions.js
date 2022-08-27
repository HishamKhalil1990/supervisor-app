require('dotenv').config();
const prisma = require('./prismaDB')
const hana = require('./hana')
const sql = require('./sql')
const sendEmail = require('./email')

// enviroment variables
const USERS_TABLE = process.env.USERS_TABLE
const USERS_WHS_TABLE = process.env.USERS_WHS_TABLE
const COUNTING_REQUEST_PROCDURE = process.env.COUNTING_REQUEST_PROCDURE

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

const getWhsInfo = async () => {
    try{
        const pool = await sql.getSQL();
        const whsCode = await pool.request().query(`select * from ${USERS_WHS_TABLE}`)
        .then(result => {
            pool.close();
            return result.recordset;
        })
        return whsCode
    }catch(err){
        return
    }
}

const getUseres = async (whs) => {
    try{
        const pool = await sql.getSQL();
        const whsCode = await pool.request().query(`select * from ${USERS_WHS_TABLE} where WhsCode = '${whs}'`)
        .then(result => {
            pool.close();
            return result.recordset;
        })
        return whsCode
    }catch(err){
        return 'error'
    }
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

const sendToSql = async (name,time,data,note,user) => {
    return new Promise((resolve,reject) => {
        const start = async () => {
            try{
                const pool = await sql.getSQL()
                let quit = false
                if(!pool){
                    quit = true
                }
                const length = data.length
                const arr = []
                if(!quit){
                    for(let i = 0; i < data.length; i++){
                        const rec = data[i]
                        startTransaction(pool,rec,length,arr,name,time,note,user)
                        .then(() => {
                            resolve()
                        })
                        .catch((err) => {
                            quit = true
                        })
                        if(quit){
                            break;
                        }
                    }
                }
                if(quit){
                    reject()
                }
            }catch(err){
                reject()
            }
        }
        start()
    })
}

const startTransaction = async (pool,rec,length,arr,name,time,note,user) => {
    const transaction = await sql.getTransaction(pool);
    return new Promise((resolve,reject) => {
        try{
            transaction.begin((err) => {
                if(err){
                    console.log("pool",err)
                    reject()
                }
                pool.request()
                .input("CountingName",name)
                .input("CountingDate",time)
                .input("ItemCode",rec.ItemCode)
                .input("ItemName",rec.ItemName)
                .input("UnitMsr",rec.BuyUnitMsr)
                .input("WhsCode",rec.WhsCode)
                .input("CodeBars",rec.CodeBars)
                .input("Note",note)
                .input("UserName",user)
                .execute(COUNTING_REQUEST_PROCDURE,(err,result) => {
                    if(err){
                        console.log('excute',err)
                        reject()
                    }
                    transaction.commit((err) => {
                        if(err){
                            console.log('transaction error : ',err)
                            reject()
                        }
                        console.log("Transaction committed.");
                        prisma.updateSelectBulk(rec.id,false,0,arr)
                        .then(() => {
                            if(arr.length == length){
                                pool.close();
                                resolve();
                            }
                        })
                        .catch(err => {
                            reject()
                        })
                    });
                })
            })
        }catch(err){
            reject()
        }
    })
}

module.exports = {
    getItems,
    sendToSql,
    getUser,
    getWhsInfo,
    updateWhsInfo,
    getUseres
}