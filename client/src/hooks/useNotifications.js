import { useState, useEffect } from 'react';
import { requestNotificationPermission, onForegroundMessage } from '../firebase/messaging';
import axios from 'axios';

export function useNotifications(currentUser) {
  const [fcmToken, setFcmToken] = useState(null);
  const [notification, setNotification] = useState(null);

  async function enableNotifications() {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        // Save to backend if logged in
        if (currentUser && !currentUser.isDemo) {
          const idToken = await currentUser.getIdToken();
          await axios.put(
            '/api/users/fcm-token',
            { fcmToken: token },
            { headers: { Authorization: `Bearer ${idToken}` } }
          );
        }
      }
    } catch (err) {
      console.error('Notification setup failed:', err);
    }
  }

  useEffect(() => {
    const unsub = onForegroundMessage((payload) => {
      setNotification({
        title: payload.notification?.title,
        body: payload.notification?.body,
        timestamp: Date.now(),
      });
      // Auto-clear after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    });
    return unsub;
  }, []);

  return { fcmToken, notification, enableNotifications };
}
