import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebaseConfig';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Demo user object for demo login
const DEMO_USER = {
  uid: 'demo-user-001',
  email: 'demo@trace.app',
  displayName: 'Demo User',
  photoURL: null,
  isDemo: true,
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Sync user with backend
  async function syncUser(user) {
    try {
      if (user.isDemo) {
        setUserProfile({
          firebaseUID: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: 'user',
          savedEvents: [],
        });
        return;
      }
      const token = await user.getIdToken();
      const res = await axios.post(
        '/api/users/sync',
        {
          firebaseUID: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
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
    if (currentUser?.isDemo) {
      setCurrentUser(null);
      return Promise.resolve();
    }
    return signOut(auth);
  }

  function demoLogin() {
    setCurrentUser(DEMO_USER);
    setUserProfile({
      firebaseUID: DEMO_USER.uid,
      email: DEMO_USER.email,
      displayName: DEMO_USER.displayName,
      role: 'admin', // Demo user gets admin to see all features
      savedEvents: [],
    });
    setLoading(false);
  }

  const value = {
    currentUser,
    userProfile,
    loading,
    googleSignIn,
    login,
    signup,
    logout,
    demoLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
