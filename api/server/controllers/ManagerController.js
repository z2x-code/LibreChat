const { logger } = require('~/config');
const { User, Key } = require('~/models');
const { updateUserKey } = require('../services/UserService');
const { updateUserPluginsService } = require('~/server/services/UserService');
const { updateUserPluginAuth, deleteUserPluginAuth } = require('~/server/services/PluginService');
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

const updateUserPluginsController = async (req, res) => {
  const { secret, email, pluginKey, action, auth, isAssistantTool } = req.body;
  if (secret === process.env.MANAGER_SECRET) {
    const existingUser = await User.findOne({ email }).lean();
    if (!existingUser) {
      logger.info('用户不存在');
      res.status(404).json({ message: '用户不存在, 请确认该邮箱是否存在' });
    } else {
      let authService;
      try {
        if (!isAssistantTool) {
          const userPluginsService = await updateUserPluginsService(
            existingUser,
            pluginKey,
            action,
          );

          if (userPluginsService instanceof Error) {
            logger.error('[userPluginsService]', userPluginsService);
            const { status, message } = userPluginsService;
            res.status(status).send({ message });
          }
        }

        if (auth) {
          const keys = Object.keys(auth);
          const values = Object.values(auth);
          if (action === 'install' && keys.length > 0) {
            for (let i = 0; i < keys.length; i++) {
              authService = await updateUserPluginAuth(
                existingUser._id,
                keys[i],
                pluginKey,
                values[i],
              );
              if (authService instanceof Error) {
                logger.error('[authService]', authService);
                const { status, message } = authService;
                res.status(status).send({ message });
              }
            }
          }
          if (action === 'uninstall' && keys.length > 0) {
            for (let i = 0; i < keys.length; i++) {
              authService = await deleteUserPluginAuth(existingUser._id, keys[i]);
              if (authService instanceof Error) {
                logger.error('[authService]', authService);
                const { status, message } = authService;
                res.status(status).send({ message });
              }
            }
          }
        }

        res.status(200).json({ message: '更新用户插件成功' });
      } catch (err) {
        logger.error('[updateUserPluginsController]', err);
        res.status(500).json({ message: err.message });
      }
    }
  } else {
    res.status(403).send();
  }
};

module.exports = {
  updateUserKeyController,
  updateUserPluginsController,
};
