import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function BookmarkButton({ eventId }) {
  const { currentUser, userProfile, setUserProfile } = useAuth();
  const [saved, setSaved] = useState(userProfile?.savedEvents?.some(e => (e._id || e) === eventId) || false);
  const [registered, setRegistered] = useState(
    userProfile?.registeredEvents?.some(e => (e._id || e) === eventId) || false
  );
  const [animating, setAnimating] = useState(false);

  async function toggleBookmark(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!currentUser) return;
    setAnimating(true);
    setSaved((prev) => !prev);
    setTimeout(() => setAnimating(false), 300);

    try {
      if (currentUser.isDemo) {
        setUserProfile((prev) => {
          if (!prev) return prev;
          const exists = prev.savedEvents.some(x => (x._id || x) === eventId);
          const newSaved = exists
            ? prev.savedEvents.filter((x) => (x._id || x) !== eventId)
            : [...prev.savedEvents, eventId];
          return { ...prev, savedEvents: newSaved };
        });
        return;
      }
      const token = await currentUser.getIdToken();
      const res = await axios.put(
        `/api/users/save/${eventId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserProfile((prev) => (prev ? { ...prev, savedEvents: res.data.savedEvents } : prev));
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
      setSaved((prev) => !prev);
    }
  }

  async function toggleRegistered(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!currentUser || currentUser.isDemo) return;

    const prev = registered;
    setRegistered(!prev);

    try {
      const token = await currentUser.getIdToken();
      const res = await axios.put(
        `/api/users/register/${eventId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserProfile((p) => (p ? { ...p, registeredEvents: res.data.registeredEvents } : p));
    } catch (err) {
      console.error('Register toggle failed:', err);
      setRegistered(prev);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={toggleBookmark}
        className={`transition-all duration-200 ${animating ? 'scale-125' : ''} ${
          saved
            ? 'text-yellow drop-shadow-[1px_1px_0_#2d2d2d] hover:scale-110'
            : 'text-ink/40 hover:text-yellow hover:drop-shadow-[1px_1px_0_#2d2d2d]'
        }`}
        title={saved ? 'Unsave' : 'Save'}
      >
        <Icon
          icon={saved ? 'solar:star-bold' : 'solar:star-linear'}
          className="text-3xl"
        />
      </button>
      {saved && (
        <button
          onClick={toggleRegistered}
          className={`transition-all duration-200 text-xs font-heading px-2 py-1 border-2 rounded-full ${
            registered
              ? 'bg-green-500 text-white border-green-600 hover:bg-green-600'
              : 'bg-white text-ink/50 border-ink/20 hover:border-green-400 hover:text-green-600'
          }`}
          title={registered ? 'Mark as not registered' : 'Mark as registered (stops reminders)'}
        >
          <Icon icon={registered ? 'solar:check-circle-bold' : 'solar:check-circle-linear'} className="inline mr-0.5 text-sm" />
          {registered ? 'Registered' : 'Register?'}
        </button>
      )}
    </div>
  );
}
