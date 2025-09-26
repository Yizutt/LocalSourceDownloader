const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

module.exports = function (req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ success: false, message: '缺失令牌' });

  try {
    const token = h.split(' ')[1];
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: '令牌无效' });
  }
};
