const express = require('express');

const { updateUserKeyController } = require('../controllers/ManagerController');

const router = express.Router();

router.put('/updateUserKey', updateUserKeyController);

module.exports = router;
