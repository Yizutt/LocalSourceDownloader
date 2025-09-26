const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const License = require('../models/License');
const auth = require('../middleware/auth');
const { JWT_SECRET, JWT_EXPIRE, ADMIN_USERNAME, ADMIN_PASSWORD } = require('../config');

const router = express.Router();

// 1. 管理员登录
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN_USERNAME || !bcrypt.compareSync(password, ADMIN_PASSWORD)) {
    return res.status(401).json({ success: false, message: '账号或密码错误' });
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
  res.json({ success: true, token });
});

// 2. 生成激活码（管理员）
router.post('/license/generate', auth, async (req, res) => {
  const { machineCode, validityDays } = req.body;
  if (!machineCode || !validityDays || validityDays < 1) {
    return res.status(400).json({ success: false, message: '参数错误' });
  }
  // 防刷：同一机器码 24h 内 ≤3 次
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await License.countDocuments({ machineCode, generateTime: { $gte: dayAgo } });
  if (count >= 3) return res.status(429).json({ success: false, message: '生成过于频繁' });

  const licenseKey = nanoid(8).toUpperCase() + '-' + nanoid(8).toUpperCase();
  const expiryDate = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
  await License.create({ licenseKey, machineCode, validityDays, expiryDate });
  res.json({ success: true, licenseKey, expiryDate });
});

// 3. 客户端验证激活
router.post('/license/validate', async (req, res) => {
  const { licenseKey, machineCode } = req.body;
  const lic = await License.findOne({ licenseKey });
  if (!lic) return res.json({ success: false, message: '激活码不存在' });
  if (lic.isActivated) {
    return lic.machineCode === machineCode
      ? res.json({ success: true, expiryDate: lic.expiryDate })
      : res.json({ success: false, message: '激活码已绑定其他设备' });
  }
  if (Date.now() > lic.expiryDate) return res.json({ success: false, message: '激活码已过期' });
  // 首次绑定
  lic.isActivated = true;
  lic.activateTime = new Date();
  lic.lastHeartbeat = new Date();
  await lic.save();
  res.json({ success: true, expiryDate: lic.expiryDate });
});

// 4. 心跳续期（可选）
router.post('/license/heartbeat', async (req, res) => {
  const { licenseKey, machineCode } = req.body;
  const lic = await License.findOne({ licenseKey, machineCode, isActivated: true });
  if (!lic) return res.status(404).json({ success: false, message: '记录不存在' });
  lic.lastHeartbeat = new Date();
  await lic.save();
  res.json({ success: true });
});

// 5. 解绑（管理员）
router.post('/license/unbind', auth, async (req, res) => {
  const { licenseKey } = req.body;
  const lic = await License.findOne({ licenseKey });
  if (!lic) return res.status(404).json({ success: false, message: '激活码不存在' });
  if (!lic.isActivated) return res.json({ success: false, message: '尚未激活' });
  // 允许解绑 2 次
  if (lic.unbindCount >= 2) return res.json({ success: false, message: '解绑次数已用完' });
  lic.isActivated = false;
  lic.unbindCount += 1;
  lic.activateTime = null;
  lic.machineCode = ''; // 清空绑定
  await lic.save();
  res.json({ success: true, message: '解绑成功' });
});

// 6. 查询状态
router.post('/license/status', async (req, res) => {
  const { licenseKey } = req.body;
  const lic = await License.findOne({ licenseKey });
  if (!lic) return res.json({ exists: false });
  res.json({
    exists: true,
    activated: lic.isActivated,
    machineCode: lic.machineCode,
    generateTime: lic.generateTime,
    activateTime: lic.activateTime,
    expiryDate: lic.expiryDate,
    lastHeartbeat: lic.lastHeartbeat,
    statusMessage: lic.isActivated ? (Date.now() > lic.expiryDate ? '已过期' : '正常') : '未激活',
  });
});

module.exports = router;
