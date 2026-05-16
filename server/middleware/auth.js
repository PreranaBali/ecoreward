/**
 * JWT Authentication Middleware – EcoReward
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect – Verifies JWT in Authorization header.
 * Attaches req.user (full document minus password).
 */
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ success: false, message: msg });
  }
};

/**
 * requireAdmin – Must come after protect().
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

/**
 * optionalAuth – Attaches user if token present, but does not block.
 */
const optionalAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const token   = header.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user      = await User.findById(decoded.id).select('-password');
    }
  } catch (_) { /* ignore */ }
  next();
};

module.exports = { protect, requireAdmin, optionalAuth };
