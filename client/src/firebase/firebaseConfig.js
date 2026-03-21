import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getMessaging, isSupported, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Messaging helpers (only in supported browsers)
export async function getMessagingToken(vapidKey) {
  const supported = await isSupported();
  if (!supported) return null;
  const m = getMessaging(app);
  try {
    // Register the service worker
    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    
    // Wait until the browser confirms a service worker is fully active
    const swRegistration = await navigator.serviceWorker.ready;
    console.log('[FCM] Service Worker ready:', swRegistration.active?.state);

    const currentToken = await getToken(m, { vapidKey, serviceWorkerRegistration: swRegistration });
    if (currentToken) {
      console.log('[FCM] Token obtained:', currentToken.substring(0, 20) + '...');
      return currentToken;
    } else {
      console.warn('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }
}

// Listen for foreground FCM messages (when the tab is active/focused)
export async function onForegroundMessage(callback) {
  const supported = await isSupported();
  if (!supported) return () => {};
  const m = getMessaging(app);
  return onMessage(m, (payload) => {
    callback(payload);
  });
}

export default app;
