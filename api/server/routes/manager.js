const express = require('express');

const {
  updateUserKeyController,
  updateUserPluginsController,
  updateUserBalanceController,
} = require('../controllers/ManagerController');

const router = express.Router();

router.put('/updateUserKey', updateUserKeyController);
router.put('/updateUserPlugin', updateUserPluginsController);
router.put('/updateUserBalance', updateUserBalanceController);

module.exports = router;
