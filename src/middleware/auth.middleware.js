const jwt = require('jsonwebtoken');
const { Member } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    console.log('Auth middleware - Request received');
    console.log('Auth header:', req.headers.authorization ? 'Present' : 'Missing');
    
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token provided or invalid format');
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token extracted:', token.substring(0, 10) + '...');

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded);

    // Get member from database
    const member = await Member.findByPk(decoded.id);
    if (!member) {
      console.log('Member not found for ID:', decoded.id);
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log('Member found:', member.id, member.email);

    // Add member to request object
    req.member = member;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware; 