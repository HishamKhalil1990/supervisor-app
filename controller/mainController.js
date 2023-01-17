const functions = require('../utils/functions')
const prisma = require('../utils/prismaDB')
const sendEmail = require('../utils/email')

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
        req.session.warehouses = user[0].warehouses
        res.send({msg : 'validate'})
    }else if (user.length == 0){
        res.send({msg : 'not validate'})
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
            const msg = await functions.getTransferAvailable(req.session.warehouses,req.session.username)
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
        res.render('transfer')
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
            res.render('partials/table',{results})
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
            let records = await prisma.getTransferRequest(value)
            functions.changeTransferSapProcess(records,reqStatus)
            .then(() => {
                res.send('done')
                // const start = async () => {
                //     const username = records[0].UserName
                //     const warehousefrom = records[0].Warehousefrom
                //     const whsCode = records[0].WhsCode
                //     const genCode = records[0].GenCode
                //     const dataFrom = await functions.getWhs(username,null)
                //     const dataTo = await functions.getWhs(null,warehousefrom)
                //     let toEmails = {
                //         SupervisorEmail:dataFrom[0].SupervisorEmail,
                //         WhsEmail:dataFrom[0].WhsEmail
                //     }
                //     let fromEmails = {
                //         SupervisorEmail:dataTo[0].SupervisorEmail,
                //     }
                //     const subject = 'تحويل بين مستودعات'
                //     if(reqStatus == 'approve'){
                //         const text1 = `لقد تم الموافقة على طلبك لعمل صاحب رقم التحويل ${genCode}`
                //         await sendEmail(text1,subject,toEmails.WhsEmail)
                //         let text2 = `سيتم عمل تحويل بضاعة الى مستودع ${whsCode}`
                //         text2 += '\n'
                //         text2 += `رقم التحويل ${genCode}`
                //         await sendEmail(text2,subject,toEmails.SupervisorEmail)
                //         let text3 = `سيتم عمل تحويل بضاعة من مستودع ${warehousefrom}`
                //         text3 += '\n'
                //         text3 += `رقم التحويل ${genCode}`
                //         await sendEmail(text3,subject,fromEmails.SupervisorEmail)
                //     }else if(reqStatus == 'decline'){
                //         const text1 = `لقد رفض طلبك لعمل صاحب رقم التحويل ${genCode}`
                //         await sendEmail(text1,subject,toEmails.WhsEmail)
                //     }
                // }
                // start()
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
    saveOrderValue
}