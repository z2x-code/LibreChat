const { logger } = require('~/config');
const { User, Key } = require('~/models');
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
      const userId = existingUser._id;
      const name = req.body.name;
      const day = req.body.day;
      const keyValue = await Key.findOne({ userId, name }).lean();
      let expiresAt;
      if (!keyValue) {
        expiresAt = new Date(new Date().getTime() + day * 24 * 3600 * 1000);
      } else {
        expiresAt = new Date(keyValue.expiresAt.getTime() + day * 24 * 3600 * 1000);
      }
      await updateUserKey({
        userId: userId,
        name: name,
        value: req.body.value,
        expiresAt: expiresAt,
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
