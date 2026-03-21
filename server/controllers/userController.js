const User = require('../models/User');
const mongoose = require('mongoose');

// Helper: validate ObjectId format
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// POST /api/users/sync — create or update user on login
exports.syncUser = async (req, res) => {
  try {
    const { firebaseUID, email, displayName, photoURL, fcmToken } = req.body;

    if (!firebaseUID || !email) {
      return res.status(400).json({ message: 'firebaseUID and email are required' });
    }

    let user = await User.findOne({ firebaseUID });
    if (user) {
      user.email = email;
      user.displayName = displayName || user.displayName;
      user.photoURL = photoURL || user.photoURL;
      if (fcmToken && typeof fcmToken === 'string' && fcmToken.length > 20) {
        // Remove this token if it already exists, then add to front
        user.fcmTokens = user.fcmTokens.filter(t => t !== fcmToken);
        user.fcmTokens.unshift(fcmToken);
        // Keep only the latest 3 tokens (multi-device support)
        if (user.fcmTokens.length > 3) {
          user.fcmTokens = user.fcmTokens.slice(0, 3);
        }
      }
      await user.save();
    } else {
      user = await User.create({
        firebaseUID, email,
        displayName: displayName || email,
        photoURL: photoURL || '',
        fcmTokens: (fcmToken && typeof fcmToken === 'string' && fcmToken.length > 20) ? [fcmToken] : [],
      });
    }
    res.json(user);
  } catch (err) {
    console.error('syncUser error:', err.message);
    res.status(500).json({ message: 'Failed to sync user' });
  }
};

// GET /api/users/me — current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid }).populate({
      path: 'savedEvents',
      populate: { path: 'team', select: 'name' }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('getMe error:', err.message);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};

// PUT /api/users/save/:eventId — toggle bookmark
exports.toggleSaveEvent = async (req, res) => {
  try {
    if (!isValidId(req.params.eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const eventId = req.params.eventId;
    const idx = user.savedEvents.findIndex(id => id.toString() === eventId);
    if (idx > -1) {
      user.savedEvents.splice(idx, 1);
    } else {
      user.savedEvents.push(eventId);
    }
    await user.save();
    res.json({ savedEvents: user.savedEvents });
  } catch (err) {
    console.error('toggleSaveEvent error:', err.message);
    res.status(500).json({ message: 'Failed to toggle save' });
  }
};

// PUT /api/users/fcm-token — save FCM token (multi-device)
exports.saveFcmToken = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { fcmToken } = req.body;
    if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.length < 20) {
      return res.status(400).json({ message: 'Valid FCM token is required' });
    }

    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      if (user.fcmTokens.length > 10) {
        user.fcmTokens = user.fcmTokens.slice(-10);
      }
      await user.save();
    }
    res.json({ message: 'Token saved' });
  } catch (err) {
    console.error('saveFcmToken error:', err.message);
    res.status(500).json({ message: 'Failed to save token' });
  }
};
