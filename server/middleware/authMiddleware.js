const admin = require('../config/firebase');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    // Get user from MongoDB, create if missing
    let user = await User.findOne({ firebaseUID: decoded.uid });
    if (!user) {
      user = await User.create({
        firebaseUID: decoded.uid,
        email: decoded.email || 'no-email@trace.app',
        displayName: decoded.name || decoded.email || 'Trace User',
        photoURL: decoded.picture || '',
      });
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: user.role || 'user',
      mongoId: user._id,
    };
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
