const admin = require('../config/firebase');
const User = require('../models/User');

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    
    const token = authHeader.substring(7).trim(); // Safely extract after "Bearer "
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const user = await User.findOne({ firebaseUID: decoded.uid });

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: user ? user.role : 'user',
      mongoId: user ? user._id : null,
    };
    next();
  } catch (err) {
    console.error('Optional Auth warn:', err.message);
    req.user = null;
    next();
  }
};

module.exports = optionalAuthMiddleware;
