import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from './firebaseConfig';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

export async function requestNotificationPermission() {
  try {
    if (!messaging) return null;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      return token;
    }
    return null;
  } catch (err) {
    console.error('Failed to get FCM token:', err);
    return null;
  }
}

export function onForegroundMessage(callback) {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}
