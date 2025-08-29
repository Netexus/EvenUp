const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Verifies Authorization: Bearer <token>
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Missing token' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, ... }
    next();
  } catch (e) {
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
}

/**
 * Ensures a specific role
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
