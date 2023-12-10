require('dotenv').config();
const hana = require('../utils/hana')
const functions = require('../utils/functions')
const prisma = require('../utils/prismaDB')
const sendEmail = require('../utils/email')

const MANAGER_EMAIL = process.env.MANAGER_EMAIL;

const loginPage = async (req,res) => {
    res.render('login')
}

const validate = async (req,res) => {
    const {username,password} = req.body;
    const user = await functions.getUser(username,password)
    if(user == undefined){
        res.send({msg: 'error'})
    }
    else if(user.length != 0){
        req.session.loggedin = true
        req.session.username = user[0].username
        req.session.supervisorName = user[0].supervisorName
        req.session.warehouses = user[0].warehouses
        req.session.email = user[0].email
        req.session.role = user[0].role
        res.send({msg : 'validate'})
    }else if (user.length == 0){
        res.send({msg : 'not validate'})
    }
}

const getWhs = async (req,res) => {
    if(req.session.loggedin)
    {
        const whs = await hana.getwarehouseList()
        if(whs != 'error'){
            res.send(whs)
        }else{
            res.send('error')
        }
    }else{
        res.redirect('/')
    }
}

const logOut = async (req,res) => {
    // req.session.loggedin = false
    // req.session.username = undefined
    // res.render('routing')
    req.session.destroy(function(err) {
        res.render('routing')
    })
}

const routing = (req,res) => {
    if(req.session.loggedin)
    {
        res.render('routing')
    }
}

const choosePage = async (req,res) => {
    if(req.session.loggedin)
    {
        res.render('choose')
    }else{
        res.redirect('/')
    }
}

const sync = async (req,res) => {
    if(req.session.loggedin && req.session.warehouses)
    {
        const { page } = req.params
        if(page == 'goTransfer'){
            const msg = await functions.getTransferAvailable(req.session.warehouses,req.session.username,req.session.role)
            res.send(msg)
        }else{
            res.send('error')
        }
    }else{
        res.redirect('/')
    }
}

const transferPage = async(req,res) => {
    if(req.session.loggedin)
    {
        const childData = await prisma.getAllChildData(req.session.username)
        res.render('transfer',{childData})
    }else{
        res.redirect('/')
    }
}

const genCodes = async(req,res) => {
    if(req.session.loggedin && req.session.username)
    {
        const codes = await prisma.getGenCodes(req.session.username)
        res.send(codes)
    }else{
        res.redirect('/')
    }
}

const getTransfer = async (req,res) => {
    const { value } = req.params
    if(req.session.loggedin)
    {   
        try{
            const results = await prisma.getTransferRequest(value)
            let itemFathers = []
            let usedItemFathers = []
            let childData = []
            let additionalParent = {}
            let parentData = results.filter(rec => {
                if(rec.FatherCode == 'None'){
                    return true
                }else{
                    if(!itemFathers.includes(rec.FatherCode)){
                        itemFathers.push(rec.FatherCode)
                        usedItemFathers.push(rec.FatherCode+rec.GenCode)
                        additionalParent[`${rec.FatherCode}`] = {
                            id:rec.ItemCode,
                            ItemCode:rec.ItemCode,
                            ItemName:rec.ItemName,
                            ListName:rec.ListName,
                            BuyUnitMsr:rec.BuyUnitMsr,
                            Order :0 ,
                            MinStock: 0,
                            MaxStock: 0,
                            OnHand: 0,
                            FatherCode:rec.FatherCode+rec.GenCode,
                        }
                    }
                    childData.push(rec)
                    additionalParent[`${rec.FatherCode}`].Order += parseFloat(rec.Order)
                    additionalParent[`${rec.FatherCode}`].MinStock += parseFloat(rec.MinStock)
                    additionalParent[`${rec.FatherCode}`].MaxStock += parseFloat(rec.MaxStock)
                    additionalParent[`${rec.FatherCode}`].OnHand += parseFloat(rec.OnHand)
                    return false
                }
            })
            additionalParent = Object.values(additionalParent)
            const newParentData = parentData.concat(additionalParent)
            res.render('partials/table',{info:{results:newParentData,fathers:usedItemFathers}})
        }catch(err){
            res.send('error')
        }
    }else{
        res.redirect('/Login')
    }
}

const submit = async (req,res) => { 
    const { reqStatus,value } = req.params
    if(req.session.loggedin)
    {
        try{
            let email = req.session.email
            let supervisorName = req.session.supervisorName
            let date = new Date();
            date = date.toISOString()
            let records = await prisma.getTransferRequest(value)
            let genCodeType = records[0].GenCode.split('-')[0]
            let typeOfSubmit = genCodeType == 'r'? 'receipt' : 'order'
            functions.changeTransferSapProcess(records,reqStatus,typeOfSubmit,supervisorName,date,req.session.role)
            .then(() => {
                res.send('done')
                const start = async (email) => {
                    const subject = 'تاكيد عمل موافقة/رفض لطلبية'
                    let text = `تم الانتهاء من تنفيذ الاجراء للطلبية التالية:`
                    text += '\n'
                    text += `رقم الطلب ${records[0].GenCode}`
                    text += '\n'
                    text += 'نوع الطلبية:'
                    text += '\n'
                    text += genCodeType == 'r'? 'ارجاع' : 'جديدة'
                    text += '\n'
                    text += 'نوع الاجراء:'
                    text += '\n'
                    text += reqStatus == 'approve'? 'موافقة' : 'رفض'
                    sendEmail(text,subject,email).then(()=>{}).catch(() => {})
                }
                if(req.session.role == "manager"){
                    start(email)
                }else{
                    start(email)
                    if(genCodeType != 'r'){
                        start(MANAGER_EMAIL)
                    }
                }
            })
            .catch(() => {
                res.send('error')
            })
        }catch(err){
            res.send('error')
        }
    }else{
        res.redirect('/Login')
    }
}

const saveOrderValue = async (req,res) => {
    if(req.session.loggedin)
    {
        try{
            const {id,value} = req.params
            prisma.update(id,value)
            .then(() => {
                res.send('done')
            }).catch(() => {
                res.send('error')
            })
        }catch(err){
            res.send('error')
        }
    }else{
        res.redirect('/Login')
    }
}

module.exports = {
    loginPage,
    validate,
    logOut,
    choosePage,
    routing,
    sync,
    transferPage,
    genCodes,
    getTransfer,
    submit,
    saveOrderValue,
    getWhs
}