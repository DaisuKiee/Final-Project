const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // Attach userId to request object
    
    // Check if user is suspended
    const user = await User.findById(decoded.userId);
    if (user && user.suspended) {
      return res.status(403).json({ 
        error: 'Account suspended', 
        suspended: true,
        reason: user.suspendedReason 
      });
    }
    
    req.user = user; // Attach user to request
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error.message);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

module.exports = { authenticate, isAdmin };