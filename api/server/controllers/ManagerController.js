const { logger } = require('~/config');
const User = require('~/models/User');
const { updateUserKey } = require('../services/UserService');
const updateUserKeyController = async (req, res) => {
  const secret = req.body.secret;
  if (secret === process.env.MANAGER_SECRET) {
    const email = req.body.email;
    const existingUser = await User.findOne({ email }).lean();
    if (!existingUser) {
      logger.info('用户不存在');
      res.status(404).json({ message: '用户不存在, 请确认该邮箱是否存在' });
    } else {
      await updateUserKey({
        userId: existingUser._id,
        name: req.body.name,
        value: req.body.value,
        expiresAt: req.body.expiresAt,
      });
      res.status(200).json({ message: '更新用户Key成功' });
    }
  } else {
    res.status(403).send();
  }
};

module.exports = {
  updateUserKeyController,
};
