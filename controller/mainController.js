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
        let message = {
            msg : 'validate'
        }
        req.session.loggedin = true
        req.session.username = user[0].Username
        await functions.getTransferAvailable(message)
        res.send({message })
    }else if (user.length == 0){
        res.send({msg : 'not validate'})
    }
}

const logOut = (req,res) => {
    req.session.loggedin = false
    req.session.username = undefined
    res.redirect('/')
}

module.exports = {
    loginPage,
    validate,
    logOut,
}