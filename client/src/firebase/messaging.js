import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import app from './firebaseConfig';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

export async function requestNotificationPermission() {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    const messaging = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

      // Wait for the service worker to become active
      if (swRegistration.installing) {
        await new Promise((resolve) => {
          swRegistration.installing.addEventListener('statechange', (e) => {
            if (e.target.state === 'activated') resolve();
          });
        });
      } else if (swRegistration.waiting) {
        await new Promise((resolve) => {
          swRegistration.waiting.addEventListener('statechange', (e) => {
            if (e.target.state === 'activated') resolve();
          });
        });
      }

      const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swRegistration });
      return token;
    }
    return null;
  } catch (err) {
    console.error('Failed to get FCM token:', err);
    return null;
  }
}

export async function onForegroundMessage(callback) {
  const supported = await isSupported();
  if (!supported) return () => {};
  const messaging = getMessaging(app);
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}
