const User = require('../models/User');

// POST /api/users/sync — create or update user on login
exports.syncUser = async (req, res) => {
  try {
    const { firebaseUID, email, displayName, photoURL } = req.body;
    let user = await User.findOne({ firebaseUID });
    if (user) {
      user.email = email;
      user.displayName = displayName;
      user.photoURL = photoURL;
      await user.save();
    } else {
      user = await User.create({ firebaseUID, email, displayName, photoURL });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/save/:eventId — toggle bookmark
exports.toggleSaveEvent = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const eventId = req.params.eventId;
    const idx = user.savedEvents.indexOf(eventId);
    if (idx > -1) {
      user.savedEvents.splice(idx, 1);
    } else {
      user.savedEvents.push(eventId);
    }
    await user.save();
    res.json({ savedEvents: user.savedEvents });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/fcm-token — save FCM token
exports.saveFcmToken = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.fcmToken = req.body.fcmToken;
    await user.save();
    res.json({ message: 'Token saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
