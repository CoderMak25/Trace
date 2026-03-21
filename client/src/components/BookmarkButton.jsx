import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function BookmarkButton({ eventId }) {
  const { currentUser, userProfile, setUserProfile } = useAuth();
  const [saved, setSaved] = useState(userProfile?.savedEvents?.includes(eventId) || false);
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
          const newSaved = prev.savedEvents.includes(eventId)
            ? prev.savedEvents.filter((x) => x !== eventId)
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
