import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth, googleProvider, getMessagingToken } from '../firebase/firebaseConfig';
import { requestNotificationPermission, onForegroundMessage } from '../firebase/messaging';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const navigate = useNavigate();

  // Store refresh token temporarily between google-auth exchange and syncUser
  let pendingRefreshToken = null;

  // Sync user with backend
  async function syncUser(user) {
    try {
      let fcmToken = null;
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
            if (vapidKey) {
              const reg = await navigator.serviceWorker.getRegistration();
              if (reg) await reg.update(); 
              fcmToken = await getMessagingToken(vapidKey);
            }
          } catch (e) {
            console.error('[Sync] FCM token error:', e);
          }
        } else if (Notification.permission !== 'granted') {
          setShowNotificationPrompt(true);
        }
      }

      const token = await user.getIdToken();
      const payload = {
        firebaseUID: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        fcmToken: fcmToken,
      };

      // Pass the pending refresh token if we just did a Google login
      if (pendingRefreshToken) {
        payload.googleRefreshToken = pendingRefreshToken;
        console.log('[Sync] Passing Google refresh token to syncUser');
        pendingRefreshToken = null; // Clear it after use
      }

      const res = await axios.post(
        '/api/users/sync',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserProfile(res.data);
    } catch (err) {
      console.error('User sync failed:', err);
    }
  }

  const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Track user activity
  useEffect(() => {
    function touchActivity() {
      localStorage.setItem('trace_last_active', Date.now().toString());
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') touchActivity();
    });
    window.addEventListener('focus', touchActivity);
    touchActivity();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const lastActive = parseInt(localStorage.getItem('trace_last_active') || '0', 10);
        if (lastActive > 0 && Date.now() - lastActive > SESSION_MAX_AGE_MS) {
          console.log('[Session] Expired after 7 days of inactivity. Logging out.');
          localStorage.removeItem('trace_last_active');
          await signOut(auth);
          setCurrentUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }
        setCurrentUser(user);
        await syncUser(user);
        localStorage.setItem('trace_last_active', Date.now().toString());
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Single foreground push listener
  useEffect(() => {
    if (!currentUser) return;

    let unsubscribe;
    onForegroundMessage((payload) => {
      const title = payload.data?.title || payload.notification?.title || 'Trace';
      const body = payload.data?.body || payload.notification?.body || '';
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, { body, icon: '/vite.svg', tag: 'trace-fg-notif' });
      });
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser]);

  // Auth methods
  const googleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setLoading(true);
      try {
        const { code } = codeResponse;
        
        // Step 1: Exchange auth code for tokens (backend does NOT touch User collection)
        const exchangeRes = await axios.post('/api/users/google-auth', { code });
        const { firebaseToken, refreshToken } = exchangeRes.data;

        // Step 2: Store the refresh token so syncUser can grab it
        if (refreshToken) {
          pendingRefreshToken = refreshToken;
          console.log('[GoogleLogin] Got refresh token, will pass to syncUser');
        }

        // Step 3: Sign into Firebase — this triggers onAuthStateChanged → syncUser
        // syncUser will store the refresh token on the CORRECT user (by Firebase UID)
        if (firebaseToken) {
          await signInWithIdToken(auth, firebaseToken);
        }
        
        // Step 4: Navigate (syncUser was already called by onAuthStateChanged)
        navigate('/dashboard');
      } catch (err) {
        console.error('Google Sign In failed:', err);
      } finally {
        setLoading(false);
      }
    },
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/calendar.events email profile openid',
    prompt: 'consent',
    access_type: 'offline',
  });

  const googleSignIn = () => {
    googleLogin();
  };

  async function signInWithIdToken(auth, idToken) {
    const credential = GoogleAuthProvider.credential(idToken);
    return signInWithCredential(auth, credential);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    setUserProfile(null);
    return signOut(auth);
  }



  async function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted' && currentUser) {
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        const fcmToken = await getMessagingToken(vapidKey);
        const token = await currentUser.getIdToken();
        await axios.put('/api/users/fcm-token', { fcmToken }, { headers: { Authorization: `Bearer ${token}` } });
        setShowNotificationPrompt(false);
      } else if (permission === 'denied') {
        alert('Push notifications are blocked by your browser. Please click the padlock icon in your address bar, switch Notifications to "Allow", and try again.');
        setShowNotificationPrompt(false);
      } else {
        setShowNotificationPrompt(false);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const value = {
    currentUser,
    userProfile,
    setUserProfile,
    loading,
    googleSignIn,
    login,
    signup,
    logout,
    showNotificationPrompt,
    setShowNotificationPrompt,
    requestNotificationPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
