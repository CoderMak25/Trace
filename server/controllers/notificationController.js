const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// POST /api/notifications/send — admin send push to all
exports.sendToAll = async (req, res) => {
  try {
    const { title, body } = req.body;
    
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ message: 'Notification title is required' });
    }
    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return res.status(400).json({ message: 'Notification body is required' });
    }

    const users = await User.find({ fcmTokens: { $exists: true, $not: { $size: 0 } } });
    const tokens = users.flatMap((u) => u.fcmTokens).filter(Boolean);

    if (tokens.length === 0) {
      return res.json({ message: 'No tokens found', sent: 0 });
    }

    const message = {
      data: { title: title.trim(), body: body.trim() },
      tokens,
    };

    const result = await admin.messaging().sendEachForMulticast(message);

    // Auto-clean stale tokens
    const tokensToRemove = [];
    result.responses.forEach((resp, idx) => {
      if (!resp.success && ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered', 'messaging/unregistered'].includes(resp.error?.code)) {
        tokensToRemove.push(tokens[idx]);
      }
    });
    if (tokensToRemove.length > 0) {
      await User.updateMany(
        { fcmTokens: { $in: tokensToRemove } },
        { $pull: { fcmTokens: { $in: tokensToRemove } } }
      );
    }

    res.json({ sent: result.successCount, failed: result.failureCount });
  } catch (err) {
    console.error('sendToAll error:', err.message);
    res.status(500).json({ message: 'Failed to send notifications' });
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
      fcmTokens: { $exists: true, $not: { $size: 0 } },
    });

    let totalSent = 0;
    for (const event of events) {
      const relevantUsers = users.filter((u) =>
        u.savedEvents.some((id) => id.toString() === event._id.toString())
      );
      const tokens = relevantUsers.flatMap((u) => u.fcmTokens).filter(Boolean);
      if (tokens.length === 0) continue;

      const message = {
        data: {
          title: `⏰ Deadline Alert: ${event.name}`,
          body: `Registration closes in 3 days! Don't miss out.`,
        },
        tokens,
      };
      const result = await admin.messaging().sendEachForMulticast(message);

      // Auto-clean stale tokens
      const tokensToRemove = [];
      result.responses.forEach((resp, idx) => {
        if (!resp.success && ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered', 'messaging/unregistered'].includes(resp.error?.code)) {
          tokensToRemove.push(tokens[idx]);
        }
      });
      if (tokensToRemove.length > 0) {
        await User.updateMany(
          { fcmTokens: { $in: tokensToRemove } },
          { $pull: { fcmTokens: { $in: tokensToRemove } } }
        );
      }

      totalSent += result.successCount;
    }

    res.json({ message: 'Deadline check complete', notified: totalSent });
  } catch (err) {
    console.error('deadlineCheck error:', err.message);
    res.status(500).json({ message: 'Failed to check deadlines' });
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
    console.error('getUserNotifications error:', err.message);
    res.status(500).json({ message: 'Failed to fetch notifications' });
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
    console.error('markAsRead error:', err.message);
    res.status(500).json({ message: 'Failed to mark notifications' });
  }
};
