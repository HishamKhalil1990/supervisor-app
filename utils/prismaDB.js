const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()


const createTransferRecord = async(data) => {
    return await prisma.requestItems.upsert({
        where:{
            id:data.id
        },
        update:{},
        create:data
    })
    .catch((e) => {
        console.log(e)
        return 'error'
    })
    .finally(async () => {
        // await prisma.$disconnect()
        return 'done'
    })
}

const createAllTransferReq = async(results,username) => {
    const promises = []
    results.forEach(rec => {
        promises.push(createTransferRecord(rec))
    })
    await Promise.all(promises)
    return 'done'
    // await deleteAllTransfer({
    //     where:{
    //         Supervisor:username
    //     }
    // })
    // return await prisma.requestItems.createMany({
    //     data:results,
    //     skipDuplicates:true
    // })
    // .catch((e) => {
    //     console.log(e)
    //     return 'error'
    // })
    // .finally(async () => {
    //     // await prisma.$disconnect()
    //     return 'done'
    // })
}

const deleteAllTransfer = async () => {
    return await prisma.requestItems.deleteMany()
    .catch((e) => {
        console.log(e)
        return
    })
    .finally(async () => {
        // await prisma.$disconnect()
        return
    })
}

const getGenCodes = async(username) => {
    return await prisma.requestItems.groupBy({
        where:{
            Supervisor:username
        },
        by: ['GenCode'],
        orderBy:[
            {
              GenCode: 'desc',
            }
        ],
    })
    .catch((e) => {
        console.log(e)
    })
    .finally(async () => {
        // await prisma.$disconnect()
    })
}

const getTransferRequest = async(value) => {
    return await prisma.requestItems.findMany({
        where:{
            GenCode:value
        }
    })
    .catch((e) => {
        console.log(e)
    })
    .finally(async () => {
        // await prisma.$disconnect()
    })
}

const deleteReqStatus = async (id,arr) => {
    return new Promise((resolve,reject) => {
        deleteRequestRecordStatus(id)
        .catch((e) => {
            console.log(e)
            reject()
        })
        .finally(async () => {
            // await prisma.$disconnect()
            arr.push('added')
            resolve()
        })
    })
}

const deleteRequestRecordStatus = async (recordID) => {
    await prisma.requestItems.deleteMany({
        where:{
            id : parseInt(recordID)
        },
    })
}

const update = async (id,value) => {
    return new Promise((resolve,reject) => {
        updateExistRecord(id,value)
        .catch((e) => {
            console.log(e)
            reject()
        })
        .finally(async () => {
            // await prisma.$disconnect()
            resolve()
        })
    })
}

const updateExistRecord = async (recordID,value) => {
    await prisma.requestItems.update({
        where:{
            id : parseInt(recordID)
        },
        data : {
            Order: value != null? parseFloat(value) : 0,
        }
    })
}

module.exports = {
    createAllTransferReq,
    getGenCodes,
    getTransferRequest,
    deleteReqStatus,
    update
}