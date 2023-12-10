const functions = require('../utils/functions')

const reportPage = async(req,res) => {
    if(req.session.loggedin)
    {
        res.render('partials/chooseReport')
    }else{
        res.redirect('/Login')
    }
}

const chooseWhs = async (req,res) => {
    if(req.session.loggedin)
    {
        res.render('whs')
    }else{
        res.redirect('/')
    }
}

const invTranHistReportPage= async (req,res) => {
    if(req.session.loggedin)
    {
        res.render('invTranHistReport')
    }else{
        res.redirect('/Login')
    }
}

const invTranHistReportData = async (req,res) => {
    if(req.session.loggedin)
    {
        const {whs} = req.params
        functions.getInvTranHistReportData(whs)
        .then(response => {
            if(response.data != undefined){
				if(response.msg == 'done'){
					res.render('partials/invTranHistReportTable',{results:response.data})
				}else{
					res.send('error')
				}
			}else{
				res.render('partials/invTranHistReportTable',{results:[]})
			}
        })
    }else{
        res.redirect('/Login')
    }
}

module.exports = {
    reportPage,
    invTranHistReportPage,
    invTranHistReportData,
    chooseWhs
}