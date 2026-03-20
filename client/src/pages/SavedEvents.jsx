import { useState, useEffect } from 'react';
import axios from 'axios';
import { Icon } from '@iconify/react';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../context/AuthContext';

export default function SavedEvents() {
  const { events } = useEvents(); // Used as fallback for demo users
  const { currentUser, userProfile } = useAuth();
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    async function fetchSaved() {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      if (currentUser.isDemo) {
        const savedIds = userProfile?.savedEvents || [];
        setSavedEvents(events.filter((e) => savedIds.includes(e._id)));
        setLoading(false);
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        const res = await axios.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const savedData = res.data.savedEvents || [];
        const formattedSaved = savedData.map(ev => 
          ev.team && ev.team.name ? { ...ev, teamName: ev.team.name } : ev
        );
        setSavedEvents(formattedSaved);
      } catch (err) {
        console.error('Failed to fetch saved events:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSaved();
  }, [currentUser]); // Fetch once when user is available

  // Sync removals: If userProfile.savedEvents changes (e.g. from BookmarkButton),
  // we filter out any events that are no longer bookmarked.
  useEffect(() => {
    if (!loading && userProfile?.savedEvents) {
      setSavedEvents((prev) => prev.filter((e) => userProfile.savedEvents.includes(e._id)));
    }
  }, [userProfile?.savedEvents, loading]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onSubmitClick={() => {}} />

      <div className="w-full max-w-6xl mx-auto px-6 py-12 flex-1">
        <h1 className="font-heading text-4xl md:text-5xl tracking-tight text-ink mb-2">
          <Icon icon="solar:star-bold" className="text-yellow inline mr-2" style={{ filter: 'drop-shadow(1px 1px 0 #2d2d2d)' }} />
          Saved Events
        </h1>
        <p className="text-xl text-ink/60 mb-8">Your bookmarked events in one place.</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <Icon icon="svg-spinners:180-ring" className="text-4xl text-blue" />
          </div>
        ) : savedEvents.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <Icon icon="solar:star-linear" className="text-6xl text-ink/20 mb-4" />
            <p className="font-heading text-2xl tracking-tight text-ink/50">No saved events yet</p>
            <p className="text-ink/40 mt-2">Click the star on any event to bookmark it!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedEvents.map((event, i) => (
              <EventCard key={event._id} event={event} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
