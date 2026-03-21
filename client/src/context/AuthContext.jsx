import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider, getMessagingToken } from '../firebase/firebaseConfig';
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

  // Sync user with backend
  async function syncUser(user) {
    try {
      let fcmToken = null;
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
            if (vapidKey) fcmToken = await getMessagingToken(vapidKey);
          } catch (e) {
            console.error('FCM Notification permission error:', e);
          }
        } else if (Notification.permission !== 'granted') {
          setShowNotificationPrompt(true);
        }
      }

      const token = await user.getIdToken();
      const res = await axios.post(
        '/api/users/sync',
        {
          firebaseUID: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          fcmToken: fcmToken,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserProfile(res.data);
    } catch (err) {
      console.error('User sync failed:', err);
      // Still allow usage, just no backend sync
      setUserProfile({
        firebaseUID: user.uid,
        email: user.email,
        displayName: user.displayName || user.email,
        role: 'user',
        savedEvents: [],
      });
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) await syncUser(user);
      else setUserProfile(null);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Auth methods
  function googleSignIn() {
    return signInWithPopup(auth, googleProvider);
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
