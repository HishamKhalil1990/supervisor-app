const functions = require('../utils/functions')
const prisma = require('../utils/prismaDB')

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
        req.session.username = user[0].Username
        res.send({msg : 'validate'})
    }else if (user.length == 0){
        res.send({msg : 'not validate'})
    }
}

const logOut = async (req,res) => {
    req.session.loggedin = false
    req.session.username = undefined
    res.render('routing')
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
    const { page } = req.params
    if(page == 'goTransfer'){
        const msg = await functions.getTransferAvailable()
        res.send(msg)
    }else{
        res.send('error')
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
    const codes = await prisma.getGenCodes()
    console.log(codes)
    res.send(codes)
}

module.exports = {
    loginPage,
    validate,
    logOut,
    choosePage,
    routing,
    sync,
    transferPage,
    genCodes
}