const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🔒 AUTH MIDDLEWARE: Processing request to', req.path);
    console.log('🔒 AUTH MIDDLEWARE: Token present?', token ? 'YES' : 'NO');

    if (!token) {
      console.log('🔒 AUTH MIDDLEWARE: No token provided');
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    console.log('🔒 AUTH MIDDLEWARE: Decoded token userId:', decoded.userId);
    
    const user = await User.findById(decoded.userId).select('-password');
    console.log('🔒 AUTH MIDDLEWARE: User found:', user ? `${user.username} (${user.role})` : 'NOT FOUND');
    
    if (!user) {
      console.log('🔒 AUTH MIDDLEWARE: User not found in database');
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      console.log('🔒 AUTH MIDDLEWARE: User account is deactivated');
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    if (user.isFrozen) {
      console.log('🔒 AUTH MIDDLEWARE: User account is frozen');
      return res.status(403).json({ error: 'Account is frozen' });
    }

    req.user = user;
    console.log('🔒 AUTH MIDDLEWARE: Authentication successful for', user.username, 'role:', user.role);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireUser = (req, res, next) => {
  console.log('🔒 REQUIRE USER: Checking user role for', req.user.username);
  console.log('🔒 REQUIRE USER: User role is:', req.user.role);
  
  if (req.user.role !== 'user') {
    console.log('🔒 REQUIRE USER: REJECTED - User role is not "user"');
    return res.status(403).json({ error: 'User access required' });
  }
  
  console.log('🔒 REQUIRE USER: APPROVED - User has correct role');
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireUser
};
