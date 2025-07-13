const jwt = require('jsonwebtoken');
const { Member } = require('../models');

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      req.member = null;
      req.isAuthenticated = false;
      return next();
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get member from database
    const member = await Member.findByPk(decoded.id);
    if (!member) {
      // Invalid token, continue without authentication
      req.member = null;
      req.isAuthenticated = false;
      return next();
    }

    // Add member to request object
    req.member = member;
    req.isAuthenticated = true;
    next();
  } catch (error) {
    // Token verification failed, continue without authentication
    req.member = null;
    req.isAuthenticated = false;
    next();
  }
};

module.exports = optionalAuthMiddleware; 