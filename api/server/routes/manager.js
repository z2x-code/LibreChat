const express = require('express');

const {
  updateUserKeyController,
  updateUserPluginsController,
} = require('../controllers/ManagerController');

const router = express.Router();

router.put('/updateUserKey', updateUserKeyController);
router.put('/updateUserPlugin', updateUserPluginsController);

module.exports = router;
