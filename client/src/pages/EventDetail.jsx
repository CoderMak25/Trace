import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import { formatDateRange, deadlineLabel, daysUntil } from '../utils/dateHelpers';
import BookmarkButton from '../components/BookmarkButton';
import Navbar from '../components/Navbar';
import axios from 'axios';

export default function EventDetail() {
  const { slug } = useParams();
  const { currentUser } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function fetchEvent() {
      setLoading(true);
      try {
        const token = await currentUser.getIdToken();
        const res = await axios.get(`/api/events/${slug}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEvent(res.data);
      } catch (err) {
        console.error('Failed to load event:', err);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    }
    if (currentUser) fetchEvent();
  }, [slug, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-heading text-2xl tracking-tight text-ink/60 animate-pulse flex items-center gap-3">
          <Icon icon="solar:refresh-linear" className="animate-spin" /> Loading...
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar onSubmitClick={() => {}} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Icon icon="solar:document-text-linear" className="text-6xl text-ink/30 mb-4" />
          <h2 className="font-heading text-3xl tracking-tight text-ink/60">Event not found</h2>
          <Link to="/dashboard" className="mt-4 text-blue hover:underline text-lg flex items-center gap-2">
            <Icon icon="solar:arrow-left-linear" /> Back to events
          </Link>
        </div>
      </div>
    );
  }

  const deadline = deadlineLabel(event.registrationDeadline);
  const isMultiDay = event.endDate && event.endDate !== event.date;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onSubmitClick={() => {}} />

      <div className="w-full max-w-3xl mx-auto px-6 py-12">
        {/* Back */}
        <Link to="/dashboard" className="text-ink/60 hover:text-ink flex items-center gap-2 text-lg transition-colors mb-8">
          <Icon icon="solar:arrow-left-linear" /> Back to events
        </Link>

        {/* Card */}
        <article className="bg-white border-[3px] border-ink p-8 shadow-[8px_8px_0_0_#2d2d2d] relative blob-1 animate-fade-in"
          style={{ backgroundImage: 'radial-gradient(#e5e0d8 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }}>
          {/* Pin */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-red border-[3px] border-ink rounded-full shadow-[2px_2px_0_0_#2d2d2d] z-10 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full opacity-60 absolute top-1 left-1" />
          </div>

          {/* Header */}
          <div className="flex justify-between items-start mb-6 pt-2">
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(event.category) ? event.category : [event.category]).filter(Boolean).map((cat) => (
                <span key={cat} className="border-2 border-ink px-3 py-1 text-xs bg-tan font-heading tracking-tight blob-2">
                  {cat}
                </span>
              ))}
              {event.mode && (
                <span className={`border-2 border-ink px-3 py-1 text-xs font-heading tracking-tight blob-3 ${event.mode === 'Online' ? 'bg-blue/10' : event.mode === 'Hybrid' ? 'bg-yellow' : 'bg-tan'}`}>
                  {event.mode}
                </span>
              )}
            </div>
            <BookmarkButton eventId={event._id} />
          </div>

          {/* Title */}
          <h1 className="font-heading text-4xl md:text-5xl tracking-tight text-ink mb-4">{event.name}</h1>

          {/* Description */}
          {event.description && (
            <p className="text-xl text-ink/80 mb-8 leading-relaxed">{event.description}</p>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-3 text-lg">
              <Icon icon="solar:users-group-rounded-linear" className="text-2xl text-blue shrink-0" />
              <div><span className="text-ink/60 text-sm block">Organizer</span>{event.organizer}</div>
            </div>
            <div className="flex items-center gap-3 text-lg">
              <Icon icon="solar:calendar-linear" className="text-2xl text-red shrink-0" />
              <div>
                <span className="text-ink/60 text-sm block">{isMultiDay ? 'Duration' : 'Date'}</span>
                {formatDateRange(event.date, event.endDate)}
              </div>
            </div>
            <div className="flex items-center gap-3 text-lg">
              <Icon icon="solar:map-point-linear" className="text-2xl text-blue shrink-0" />
              <div><span className="text-ink/60 text-sm block">Location</span>{event.city || 'TBD'} / {event.mode}</div>
            </div>
            <div className="flex items-center gap-3 text-lg">
              <Icon icon="solar:cup-star-linear" className="text-2xl text-red shrink-0" />
              <div><span className="text-ink/60 text-sm block">Prize / Cost</span>{event.prizePool || event.highlights || 'Free'}</div>
            </div>
          </div>

          {/* Registration Status */}
          {event.registered !== undefined && (
            <div className="mb-6 flex flex-wrap gap-4">
              <div className={`inline-flex items-center gap-2 border-[3px] border-ink px-4 py-2 font-heading text-lg shadow-[3px_3px_0_0_#2d2d2d] blob-2 ${event.registered ? 'bg-green-100 text-green-800' : 'bg-yellow text-ink'}`}>
                <Icon icon={event.registered ? 'solar:check-circle-bold' : 'solar:clock-circle-linear'} />
                {event.registered ? 'Registered ✓' : 'Not Registered'}
              </div>
              
              {event.registered && event.selectionStatus && (
                 <div className={`inline-flex items-center gap-2 border-[3px] border-ink px-4 py-2 font-heading text-lg shadow-[3px_3px_0_0_#2d2d2d] blob-3 ${
                   event.selectionStatus === 'Selected' ? 'bg-[#dcfce7] text-[#166534]' : 
                   event.selectionStatus === 'Rejected' ? 'bg-red/20 text-red' : 
                   'bg-tan text-ink/70'
                 }`}>
                   <Icon icon={
                     event.selectionStatus === 'Selected' ? 'solar:verified-check-bold' : 
                     event.selectionStatus === 'Rejected' ? 'solar:close-circle-bold' : 
                     'solar:hourglass-linear'
                   } />
                   Status: {event.selectionStatus}
                 </div>
              )}
            </div>
          )}

          {/* Deadline Badge */}
          {deadline && (
            <div className="mb-8">
              <span className="text-white bg-red border-2 border-ink px-4 py-2 text-lg shadow-[3px_3px_0_0_#2d2d2d] inline-flex items-center gap-2 -rotate-1 blob-3">
                <Icon icon="solar:alarm-linear" /> {deadline}
              </span>
            </div>
          )}

          {/* Register Button */}
          {event.registrationLink && (
            <a
              href={event.registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-red border-[3px] border-ink text-white text-2xl font-heading tracking-tight px-6 py-4 shadow-[6px_6px_0_0_#2d2d2d] hover:-rotate-1 hover:shadow-[3px_3px_0_0_#2d2d2d] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all duration-100 flex items-center justify-center gap-3 blob-3"
            >
              <Icon icon="solar:link-linear" /> Register Now
            </a>
          )}
        </article>
      </div>
    </div>
  );
}
