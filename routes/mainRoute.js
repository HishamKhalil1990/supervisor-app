const express = require('express');
const router = express.Router();
const controller = require('../controller/mainController')

// routes
router.get('/',controller.loginPage);
router.post('/validate',controller.validate);
router.get('/logout',controller.logOut);

module.exports = router