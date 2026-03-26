const admin = require('../config/firebase');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.substring(7).trim(); // Safely extract after "Bearer "
    if (!token) {
      return res.status(401).json({ message: 'Malformed token' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    
    // Get user from MongoDB but DO NOT create if missing.
    // Creation and merging is exclusively syncUser's responsibility.
    const user = await User.findOne({ firebaseUID: decoded.uid });

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: user ? user.role : 'user',
      mongoId: user ? user._id : null,
    };
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
