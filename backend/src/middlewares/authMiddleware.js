const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');
const { pool } = require('../config/db');

function extractBearerToken(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const match = authHeader.trim().match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return null;
  }

  
  return match[1].trim().replace(/^"|"$/g, '');
}

async function verifyToken(req, res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({ message: 'Yetkilendirme tokeni bulunamadi.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user with member_id from database
    const query = 'SELECT id, email, role, member_id FROM users WHERE id = $1';
    const result = await pool.query(query, [decoded.sub]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Kullanici bulunamadi.' });
    }

    const user = result.rows[0];

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      member_id: user.member_id
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Gecersiz veya suresi dolmus token.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bu islem icin admin yetkisi gereklidir.' });
  }

  return next();
}

function requireSelfOrAdmin(req, res, next) {
  const targetUserId = Number(req.params.id);

  if (!Number.isInteger(targetUserId)) {
    return res.status(400).json({ message: 'Gecerli bir kullanici id degeri gonderiniz.' });
  }

  if (!req.user) {
    return res.status(401).json({ message: 'Yetkilendirme bilgisi bulunamadi.' });
  }

  if (req.user.role === 'admin' || req.user.id === targetUserId) {
    return next();
  }

  return res.status(403).json({ message: 'Bu kayit icin yetkiniz bulunmuyor.' });
}

module.exports = {
  verifyToken,
  requireAdmin,
  requireSelfOrAdmin
};
