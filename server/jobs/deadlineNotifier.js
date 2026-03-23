const cron = require('node-cron');
const Event = require('../models/Event');
const User = require('../models/User');
const { syncAllUnstopEvents, updateEventStatuses } = require('./unstopSync');
const { syncAllDevfolioEvents, updateDevfolioStatuses } = require('./devfolioSync');
const { sendPush } = require('../utils/sendPush');
let isFullSyncRunning = false;
let isStatusSyncRunning = false;
let isNotifierRunning = false;

const ALERTS = [
  {
    key: '72h',
    hours: 72,
    title: (name) => `📅 3 days left — ${name}`,
    body: 'Registration closes in 3 days. Start preparing your team!',
  },
  {
    key: '24h',
    hours: 24,
    title: (name) => `⚠️ Last day — ${name}`,
    body: "Registration closes in 24 hours. Don't wait!",
  },
  {
    key: '6h',
    hours: 6,
    title: (name) => `🔥 6 hours left — ${name}`,
    body: 'Final push — registration closes very soon!',
  },
  {
    key: '1h',
    hours: 1,
    title: (name) => `🚨 Last chance — ${name}`,
    body: '1 hour left to register. Drop everything and sign up now!',
  },
];

async function runProgressiveDeadlineNotifications() {
  const now = new Date();

  for (const alert of ALERTS) {
    const target = new Date(now.getTime() + alert.hours * 60 * 60 * 1000);
    const from = new Date(target.getTime() - 30 * 60 * 1000);
    const to = new Date(target.getTime() + 30 * 60 * 1000);

    const events = await Event.find({
      registrationDeadline: { $gte: from, $lte: to },
      notificationsSent: { $ne: alert.key },
    }).select('_id name registrationDeadline notificationsSent').lean();

    for (const event of events) {
      const users = await User.find({
        savedEvents: event._id,
        registeredEvents: { $ne: event._id }, // Skip users who already registered
        calendarEnabled: { $ne: true }, // Skip FCM if they have Google Calendar enabled
        $or: [
          { fcmToken: { $exists: true, $nin: [null, ''] } },
          { fcmTokens: { $exists: true, $ne: [] } },
        ],
      }).select('fcmToken fcmTokens').lean();

      for (const user of users) {
        const tokens = [
          ...(user.fcmToken ? [user.fcmToken] : []),
          ...(Array.isArray(user.fcmTokens) ? user.fcmTokens : []),
        ].filter(Boolean);

        for (const token of tokens) {
          await sendPush(token, alert.title(event.name), alert.body);
        }
      }

      await Event.updateOne(
        { _id: event._id, notificationsSent: { $ne: alert.key } },
        { $push: { notificationsSent: alert.key } }
      );
    }
  }
}

function startDeadlineNotifier() {
  cron.schedule('0 */3 * * *', async () => {
    if (isFullSyncRunning) return;
    isFullSyncRunning = true;
    try {
      await syncAllUnstopEvents();
      await syncAllDevfolioEvents();
    } catch (err) {
      console.error('[CRON] Full sync failed:', err.message);
    } finally {
      isFullSyncRunning = false;
    }
  });

  cron.schedule('*/30 * * * *', async () => {
    if (isStatusSyncRunning) return;
    isStatusSyncRunning = true;
    try {
      await updateEventStatuses();
      await updateDevfolioStatuses();
    } catch (err) {
      console.error('[CRON] Lightweight status sync failed:', err.message);
    } finally {
      isStatusSyncRunning = false;
    }
  });

  cron.schedule('0 * * * *', async () => {
    if (isNotifierRunning) return;
    isNotifierRunning = true;
    try {
      await runProgressiveDeadlineNotifications();
    } catch (err) {
      console.error('[CRON] Progressive deadline notifier failed:', err.message);
    } finally {
      isNotifierRunning = false;
    }
  });

  console.log('[CRON] Unstop sync and progressive deadline jobs started');
}

module.exports = startDeadlineNotifier;
