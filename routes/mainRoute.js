const express = require('express');
const router = express.Router();
const controller = require('../controller/mainController')

// routes
router.get('/',controller.loginPage);
router.get('/choose',controller.choosePage);
router.get('/routing',controller.routing);
router.get('/transfer',controller.transferPage);
router.get('/gencodes',controller.genCodes);
router.post('/validate',controller.validate);
router.post('/sync/:page',controller.sync);
router.post('/table/:value',controller.getTransfer);
router.post('/logout',controller.logOut);

module.exports = router