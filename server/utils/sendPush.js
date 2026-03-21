const admin = require('../config/firebase');

async function sendPush(fcmToken, title, body) {
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });
  } catch (err) {
    console.error('FCM send failed:', err.message);
  }
}

module.exports = { sendPush };
