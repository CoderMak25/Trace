const admin = require('../config/firebase');
const User = require('../models/User');
const Notification = require('../models/Notification');

// POST /api/notifications/send — admin send push to all
exports.sendToAll = async (req, res) => {
  try {
    const { title, body } = req.body;
    const users = await User.find({ fcmToken: { $exists: true, $ne: '' } });
    const tokens = users.map((u) => u.fcmToken).filter(Boolean);

    if (tokens.length === 0) {
      return res.json({ message: 'No tokens found', sent: 0 });
    }

    const message = {
      notification: { title, body },
      tokens,
    };

    const result = await admin.messaging().sendEachForMulticast(message);
    res.json({ sent: result.successCount, failed: result.failureCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/notifications/deadline-check — cron job endpoint
exports.deadlineCheck = async (req, res) => {
  try {
    const Event = require('../models/Event');
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const startOfDay = new Date(threeDays.setHours(0, 0, 0, 0));
    const endOfDay = new Date(threeDays.setHours(23, 59, 59, 999));

    // Find events with deadline in exactly 3 days
    const events = await Event.find({
      registrationDeadline: { $gte: startOfDay, $lte: endOfDay },
      verified: true,
    });

    if (events.length === 0) {
      return res.json({ message: 'No deadlines in 3 days', notified: 0 });
    }

    const eventIds = events.map((e) => e._id);
    const users = await User.find({
      savedEvents: { $in: eventIds },
      fcmToken: { $exists: true, $ne: '' },
    });

    let totalSent = 0;
    for (const event of events) {
      const relevantUsers = users.filter((u) =>
        u.savedEvents.some((id) => id.toString() === event._id.toString())
      );
      const tokens = relevantUsers.map((u) => u.fcmToken).filter(Boolean);
      if (tokens.length === 0) continue;

      const message = {
        notification: {
          title: `⏰ Deadline Alert: ${event.name}`,
          body: `Registration closes in 3 days! Don't miss out.`,
        },
        tokens,
      };
      const result = await admin.messaging().sendEachForMulticast(message);
      totalSent += result.successCount;
    }

    res.json({ message: 'Deadline check complete', notified: totalSent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/notifications/my-notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Fetch last 30 notifications for user
    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(30);
      
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/notifications/my-notifications/read
exports.markAsRead = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    await Notification.updateMany(
      { userId: user._id, read: false },
      { $set: { read: true } }
    );
    
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
