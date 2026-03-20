import { Icon } from '@iconify/react';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../context/AuthContext';

export default function SavedEvents() {
  const { events } = useEvents();
  const { userProfile } = useAuth();

  const savedIds = userProfile?.savedEvents || [];
  const savedEvents = events.filter((e) => savedIds.includes(e._id));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onSubmitClick={() => {}} />

      <div className="w-full max-w-6xl mx-auto px-6 py-12">
        <h1 className="font-heading text-4xl md:text-5xl tracking-tight text-ink mb-2">
          <Icon icon="solar:star-bold" className="text-yellow inline mr-2" style={{ filter: 'drop-shadow(1px 1px 0 #2d2d2d)' }} />
          Saved Events
        </h1>
        <p className="text-xl text-ink/60 mb-8">Your bookmarked events in one place.</p>

        {savedEvents.length === 0 ? (
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
