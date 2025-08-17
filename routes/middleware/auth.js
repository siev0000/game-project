// routes/middleware/auth.js (CommonJS)
const jwt = require('jsonwebtoken');

module.exports = function authenticateUser(req, res, next) {
  try {
    // Authorization: Bearer <token>
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
    // 以降のハンドラで使えるように
    req.user = { _id: String(payload._id), username: payload.username };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
