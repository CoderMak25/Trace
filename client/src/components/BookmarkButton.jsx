import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function BookmarkButton({ eventId }) {
  const { currentUser, userProfile, setUserProfile } = useAuth();
  const [saved, setSaved] = useState(userProfile?.savedEvents?.some(e => (e._id || e) === eventId) || false);
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
            : [...prev.savedEvents, eventId]; // For Demo mode, pushing string is fine since it's transient
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
      setSaved((prev) => !prev); // revert on error
    }
  }

  return (
    <button
      onClick={toggleBookmark}
      className={`transition-all duration-200 ${animating ? 'scale-125' : ''} ${
        saved
          ? 'text-yellow drop-shadow-[1px_1px_0_#2d2d2d] hover:scale-110'
          : 'text-ink/40 hover:text-yellow hover:drop-shadow-[1px_1px_0_#2d2d2d]'
      }`}
    >
      <Icon
        icon={saved ? 'solar:star-bold' : 'solar:star-linear'}
        className="text-3xl"
      />
    </button>
  );
}
