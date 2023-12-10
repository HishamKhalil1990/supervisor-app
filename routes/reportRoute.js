const express = require('express');
const router = express.Router();
const controller = require('../controller/reportController')

router.get('/',controller.reportPage);
router.get('/whs',controller.chooseWhs);
router.get('/invTranHistReport',controller.invTranHistReportPage);
router.get('/invTranHistData/:whs',controller.invTranHistReportData);

module.exports = router