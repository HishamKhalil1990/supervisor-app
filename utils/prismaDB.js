const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const createAllTransferReq = async(results) => {
    await deleteAllTransfer()
    return await prisma.requestItems.createMany({
        data:results,
        skipDuplicates:true
    })
    .catch((e) => {
        console.log(e)
        return 'error'
    })
    .finally(async () => {
        await prisma.$disconnect()
        return 'done'
    })
}

const deleteAllTransfer = async () => {
    return await prisma.requestItems.deleteMany()
    .catch((e) => {
        console.log(e)
        return
    })
    .finally(async () => {
        await prisma.$disconnect()
        return
    })
}

const getGenCodes = async() => {
    return await prisma.requestItems.groupBy({
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
        await prisma.$disconnect()
    })
}

module.exports = {
    createAllTransferReq,
    getGenCodes
}