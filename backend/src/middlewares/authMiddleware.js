const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');

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

function verifyToken(req, res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({ message: 'Yetkilendirme tokeni bulunamadi.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role
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
