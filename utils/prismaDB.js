const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const createRecords = async (records) => {
    const mappedRecs = records.map((rec,index) => {
        return {
            id:index,
            ItemCode:rec.ItemCode,
            ItemName:rec.ItemName,
            CodeBars:rec.CodeBars != null? rec.CodeBars : undefined,
            WhsCode:rec.WhsCode,
            BuyUnitMsr:rec.BuyUnitMsr != null? rec.BuyUnitMsr : undefined
        }
    })
    return await create(mappedRecs)
    .catch((e) => {
        console.log(e)
        return 'error'
      })
      .finally(async () => {
        await prisma.$disconnect()
        return 'created'
      })
}

const deleteAll = async () => {
    return await prisma.countRequest.deleteMany()
            .catch((e) => {
                console.log(e)
                return 'error'
            })
            .finally(async () => {
                await prisma.$disconnect()
                return 'deleted'
            })
}

const findAll = async () => {
    return await prisma.countRequest.findMany()
            .catch((e) => {
                console.log(e)
                return 'error'
            })
            .finally(async () => {
                await prisma.$disconnect()
                return 'deleted'
            })
}

const create = async (records) => {
    return await prisma.countRequest.createMany({
        data: records,
        skipDuplicates: true,
    })
}

const updateSelect = async (id,status,counter) => {
    return await update(id,status,counter)
                .catch((e) => {
                    console.log(e)
                    return 'error'
                })
                .finally(async () => {
                    await prisma.$disconnect()
                    return 'done'
                })
}

const updateAllSelect = async (status) => {
    return await updateAll(status)
                .catch((e) => {
                    console.log(e)
                    return 'error'
                })
                .finally(async () => {
                    await prisma.$disconnect()
                    return 'done'
                })
}

const updateSelectBulk = async (id,status,counter,arr) => {
    return await update(id,status,counter)
                .finally(async () => {
                    await prisma.$disconnect()
                    arr.push('added')
                })
}

const update = async (id,status,counter) => {
    return await prisma.countRequest.update({
        where:{
            id:parseInt(id)
        },
        data:{
            Selected:status,
            counter:parseInt(counter)
        }
    })
}

const updateAll = async (status) => {
    return await prisma.countRequest.updateMany({
        where:{
            Selected:!status
        },
        data:{
            Selected:status,
        }
    })
}

const findReport = async() =>{
    return await prisma.countRequest.findMany({
                orderBy:{
                    counter : 'desc'
                },
                where : {
                    Selected : true
                }
            })
            .catch((e) => {
                console.log(e)
                return 'error'
            })
            .finally(async () => {
                await prisma.$disconnect()
                return 'deleted'
            })
}

module.exports = {
    createRecords,
    deleteAll,
    findAll,
    updateSelect,
    findReport,
    updateSelectBulk,
    updateAllSelect
}