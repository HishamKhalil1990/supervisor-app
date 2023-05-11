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
        req.session.supervisorName = user[0].supervisorName
        req.session.warehouses = user[0].warehouses
        req.session.email = user[0].email
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
            let email = req.session.email
            let supervisorName = req.session.supervisorName
            let date = new Date();
            date = date.toISOString()
            let records = await prisma.getTransferRequest(value)
            let genCodeType = records[0].GenCode.split('-')[0]
            let typeOfSubmit = genCodeType == 'r'? 'receipt' : 'order'
            functions.changeTransferSapProcess(records,reqStatus,typeOfSubmit,supervisorName,date)
            .then(() => {
                res.send('done')
                const start = async () => {
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
                start()
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