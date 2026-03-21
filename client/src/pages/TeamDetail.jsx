import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { formatDate, daysUntil } from '../utils/dateHelpers';
import axios from 'axios';
import MiniCalendar from '../components/MiniCalendar';
import SubmitEventModal from '../components/SubmitEventModal';

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { events: allEvents } = useEvents();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [copied, setCopied] = useState(false);
  const [announceModalOpen, setAnnounceModalOpen] = useState(false);
  const [announceText, setAnnounceText] = useState('');
  const [announcing, setAnnouncing] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]);


  useEffect(() => {
    async function loadTeam() {
      try {

        const token = await currentUser.getIdToken();
        const res = await axios.get(`/api/teams/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeam(res.data);
      } catch (err) {
        console.error('Failed to load team:', err);
        setTeam(null);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, [id, currentUser, allEvents]);

  useEffect(() => {
    async function loadSelectedEvents() {
      if (!currentUser) return;
      try {
        const token = await currentUser.getIdToken();
        const res = await axios.get(`/api/teams/${id}/selected-events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSelectedEvents(res.data || []);
      } catch (err) {
        console.error('Failed to load selected events:', err);
        setSelectedEvents([]);
      }
    }
    loadSelectedEvents();
  }, [id, currentUser]);

  // Refresh team manually after adding an event
  const handleEventSaved = (savedEvent, isEdit) => {
    setModalOpen(false);
    setEditEvent(null);
    if (isEdit) {
      setTeam((prev) => ({
        ...prev,
        events: prev.events.map((e) => (e._id === savedEvent._id ? savedEvent : e)),
      }));
    } else {
      setTeam((prev) => ({
        ...prev,
        events: [...prev.events, savedEvent],
      }));
    }
  };

  const handleEventDeleted = (eventId) => {
    setModalOpen(false);
    setEditEvent(null);
    setTeam((prev) => ({
      ...prev,
      events: prev.events.filter((e) => (e._id || e) !== eventId),
    }));
  };

  async function removeEvent(eventId) {
    try {

      const token = await currentUser.getIdToken();
      await axios.put(`/api/teams/${id}/remove-event`, { eventId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeam((prev) => ({
        ...prev,
        events: prev.events.filter((e) => (e._id || e) !== eventId),
      }));
    } catch (err) {
      console.error(err);
    }
  }

  async function removeSelectedEvent(eventId) {
    try {
      const token = await currentUser.getIdToken();
      await axios.delete(`/api/teams/${id}/select-event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedEvents((prev) => prev.filter((item) => (item.event?._id || item.event) !== eventId));
    } catch (err) {
      console.error('Failed to remove selected event:', err);
      alert(err.response?.data?.message || 'Failed to remove selected event');
    }
  }

  async function markSelectedEventInterested(eventId) {
    try {
      const token = await currentUser.getIdToken();
      await axios.put(
        `/api/teams/${id}/select-event/${eventId}/interest`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedEvents((prev) =>
        prev.map((item) => {
          const selectedEventId = item?.event?._id || item?.event;
          if (selectedEventId !== eventId) return item;
          return { ...item, status: 'Interested' };
        })
      );
    } catch (err) {
      console.error('Failed to mark selected event interested:', err);
      alert(err.response?.data?.message || 'Failed to mark as interested');
    }
  }

  async function handleLeave() {
    if (!confirm('Are you sure you want to leave this team?')) return;
    try {

      const token = await currentUser.getIdToken();
      await axios.delete(`/api/teams/${id}/leave`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate('/teams');
    } catch (err) {
      console.error(err);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(team.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAnnounce(e) {
    e.preventDefault();
    if (!announceText.trim()) return;
    setAnnouncing(true);
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.post(`/api/teams/${id}/announce`, { message: announceText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnounceText('');
      setAnnounceModalOpen(false);
      alert(res.data?.message || 'Announcement sent!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to send announcement');
    } finally {
      setAnnouncing(false);
    }
  }


  // Remove availableEvents computation that was used for inline picker

  // Team schedule merged: manual + selected events
  const schedule = useMemo(() => {
    if (!team) return [];

    const merged = new Map();
    (team.events || []).forEach((event) => {
      if (!event?._id) return;
      merged.set(event._id, { event, sourceType: 'manual' });
    });

    (selectedEvents || []).forEach((item) => {
      if (item?.status !== 'Interested') return;
      const event = item?.event;
      if (!event?._id) return;
      if (!merged.has(event._id)) {
        merged.set(event._id, { event, sourceType: 'selected', selectionId: item._id });
      }
    });

    return Array.from(merged.values()).sort(
      (a, b) => new Date(a.event.date || 0) - new Date(b.event.date || 0)
    );
  }, [team, selectedEvents]);

  const savedSelections = useMemo(
    () =>
      (selectedEvents || []).filter(
        (item) => item?.status === 'Saved' && item?.event?._id
      ),
    [selectedEvents]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-heading text-2xl text-ink/60 animate-pulse flex items-center gap-3">
          <Icon icon="solar:refresh-linear" className="animate-spin" /> Loading team...
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar onSubmitClick={() => {}} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Icon icon="solar:users-group-rounded-linear" className="text-6xl text-ink/20 mb-4" />
          <h2 className="font-heading text-3xl text-ink/50">Team not found</h2>
          <Link to="/teams" className="mt-4 text-blue hover:underline">Back to Teams</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onSubmitClick={() => {}} />

      <div className="w-full max-w-6xl mx-auto px-6 py-8">
        {/* Back */}
        <Link to="/teams" className="text-ink/60 hover:text-ink flex items-center gap-2 text-lg transition-colors mb-6">
          <Icon icon="solar:arrow-left-linear" /> All Teams
        </Link>

        {/* Team Header */}
        <div className="bg-white border-[3px] border-ink p-6 md:p-8 shadow-[6px_6px_0_0_#2d2d2d] blob-1 relative mb-8 animate-fade-in"
          style={{ backgroundImage: 'radial-gradient(#e5e0d8 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }}>
          {/* Color bar */}
          <div className="absolute top-0 left-0 right-0 h-3 rounded-t-lg" style={{ backgroundColor: team.color }} />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 border-[3px] border-ink rounded-full flex items-center justify-center shadow-[3px_3px_0_0_#2d2d2d] text-white font-heading text-2xl shrink-0" style={{ backgroundColor: team.color }}>
                {team.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="font-heading text-3xl md:text-4xl tracking-tight text-ink">{team.name}</h1>
                <p className="text-ink/60 text-lg">{team.description || 'No description'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Share Code */}
              <button
                onClick={() => setShowCode(!showCode)}
                className="bg-yellow border-[3px] border-ink px-4 py-2 shadow-[3px_3px_0_0_#2d2d2d] hover:shadow-[1px_1px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all blob-2 flex items-center gap-2 font-heading text-sm"
              >
                <Icon icon="solar:share-linear" /> Share Code
              </button>
              {/* Announce (Leader Only) */}
              {(team.owner?.email === currentUser?.email || team.owner?._id === userProfile?._id || team.owner === userProfile?._id) && (
                <button
                  onClick={() => setAnnounceModalOpen(true)}
                  className="bg-blue border-[3px] border-ink text-white px-4 py-2 shadow-[3px_3px_0_0_#2d2d2d] hover:shadow-[1px_1px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all blob-3 flex items-center gap-2 font-heading text-sm"
                >
                  <Icon icon="solar:bell-bing-bold" /> Announce
                </button>
              )}
              {/* Add Event */}
              <button
                onClick={() => setModalOpen(true)}
                className="bg-red border-[3px] border-ink text-white px-4 py-2 shadow-[3px_3px_0_0_#2d2d2d] hover:shadow-[1px_1px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all blob-1 flex items-center gap-2 font-heading text-sm"
              >
                <Icon icon="solar:add-circle-linear" /> Add Event
              </button>
              {/* Leave */}
              <button
                onClick={handleLeave}
                className="bg-white border-[3px] border-ink text-red px-4 py-2 shadow-[3px_3px_0_0_#2d2d2d] hover:bg-red hover:text-white hover:shadow-[1px_1px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all blob-3 flex items-center gap-2 font-heading text-sm"
              >
                <Icon icon="solar:logout-2-linear" /> Leave
              </button>
            </div>
          </div>

          {/* Share Code Panel */}
          {showCode && (
            <div className="mt-6 pt-4 border-t-[3px] border-dashed border-ink/10 animate-fade-in">
              <p className="text-ink/60 mb-2">Share this code with your teammates:</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="bg-tan border-[3px] border-ink px-6 py-3 text-3xl font-heading tracking-[0.3em] shadow-[3px_3px_0_0_#2d2d2d] blob-2 select-all text-center">
                  {team.code}
                </div>
                <button
                  onClick={copyCode}
                  className={`border-[3px] border-ink px-4 py-3 shadow-[2px_2px_0_0_#2d2d2d] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all blob-1 flex justify-center items-center gap-2 ${copied ? 'bg-green-500 text-white' : 'bg-white'}`}
                >
                  <Icon icon={copied ? 'solar:check-circle-bold' : 'solar:copy-linear'} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Team Schedule */}
          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-2xl tracking-tight text-ink mb-4 flex items-center gap-2">
              <Icon icon="solar:calendar-linear" className="text-red" /> Team Schedule
              <span className="text-ink/40 text-lg ml-1">({schedule.length})</span>
            </h2>


            {/* Schedule */}
            {schedule.length === 0 ? (
              <div className="bg-white border-[3px] border-ink/20 border-dashed p-12 text-center blob-1">
                <Icon icon="solar:calendar-linear" className="text-5xl text-ink/20 mx-auto mb-4" />
                <p className="font-heading text-xl text-ink/50">No events in the schedule yet</p>
                <p className="text-ink/40 mt-1">Add events for the whole team to track!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {schedule.map((item, i) => (
                  <div key={item.event._id} className="relative">
                    {/* Timeline connector */}
                    {i < schedule.length - 1 && (
                      <div className="absolute left-6 top-full w-[3px] h-4 border-l-[3px] border-dashed border-ink/15" />
                    )}
                    <div className="flex gap-4 items-start">
                      {/* Date badge */}
                      <div className="w-12 h-12 border-[3px] border-ink rounded-full flex flex-col items-center justify-center shadow-[2px_2px_0_0_#2d2d2d] shrink-0 text-white font-heading text-xs" style={{ backgroundColor: team.color }}>
                        {new Date(item.event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).split(' ').map((p, j) => <span key={j}>{p}</span>)}
                      </div>
                      {/* Event info */}
                      <div className="flex-1 bg-white border-[3px] border-ink p-4 shadow-[3px_3px_0_0_#2d2d2d] blob-1 group">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                          <Link to={`/event/${item.event.slug}?teamId=${team._id}`} className="flex-1 min-w-0">
                            <h3 className="font-heading text-xl tracking-tight group-hover:text-red transition-colors truncate">{item.event.name}</h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/60 mt-1">
                              <span className="flex items-center gap-1"><Icon icon="solar:users-group-rounded-linear" className="text-blue shrink-0" /> <span className="truncate">{item.event.organizer}</span></span>
                              <span className="flex items-center gap-1"><Icon icon="solar:map-point-linear" className="text-blue shrink-0" /> <span className="truncate">{item.event.city}</span></span>
                              <span className={`border border-ink px-2 py-0.5 text-xs font-heading shrink-0 ${item.event.mode === 'Online' ? 'bg-blue/10' : 'bg-tan'}`}>{item.event.mode}</span>
                              {item.sourceType === 'selected' && (
                                <span className="border border-ink px-2 py-0.5 text-xs font-heading shrink-0 bg-yellow">saved</span>
                              )}
                            </div>
                          </Link>
                          <div className="flex gap-1 shrink-0">
                            {(item.event.owner === userProfile?._id || userProfile?.role === 'admin') && item.sourceType === 'manual' && (
                              <button
                                onClick={(e) => { e.preventDefault(); setEditEvent(item.event); setModalOpen(true); }}
                                className="text-ink/30 hover:text-blue transition-colors p-1"
                                title="Edit event"
                              >
                                <Icon icon="solar:pen-linear" className="text-xl" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (item.sourceType === 'manual') removeEvent(item.event._id);
                                else removeSelectedEvent(item.event._id);
                              }}
                              className="text-ink/30 hover:text-red transition-colors p-1"
                              title="Remove from schedule"
                            >
                              <Icon icon="solar:close-circle-linear" className="text-xl" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 className="font-heading text-2xl tracking-tight text-ink mt-10 mb-4 flex items-center gap-2">
              <Icon icon="solar:bookmark-linear" className="text-blue" /> Saved (Not Interested Yet)
              <span className="text-ink/40 text-lg ml-1">({savedSelections.length})</span>
            </h2>

            {savedSelections.length === 0 ? (
              <div className="bg-white border-[3px] border-ink/20 border-dashed p-8 text-center blob-2">
                <Icon icon="solar:bookmark-linear" className="text-4xl text-ink/20 mx-auto mb-3" />
                <p className="font-heading text-lg text-ink/50">No saved team events pending interest</p>
                <p className="text-ink/40 mt-1">Add events to team, then mark interested when ready.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {savedSelections.map((item) => (
                  <div key={`saved-${item.event._id}`} className="bg-white border-[3px] border-ink p-4 shadow-[3px_3px_0_0_#2d2d2d] blob-2">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/event/${item.event.slug}?teamId=${team._id}`} className="min-w-0">
                        <h3 className="font-heading text-xl tracking-tight truncate">{item.event.name}</h3>
                        <p className="text-sm text-ink/60 truncate mt-1">{item.event.organizer} {item.event.city ? `• ${item.event.city}` : ''}</p>
                      </Link>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => markSelectedEventInterested(item.event._id)}
                          className="bg-blue border-[2px] border-ink text-white px-3 py-1 text-sm font-heading shadow-[2px_2px_0_0_#2d2d2d] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all blob-1"
                        >
                          Mark Interested
                        </button>
                        <button
                          onClick={() => removeSelectedEvent(item.event._id)}
                          className="text-red hover:underline text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Right: Members */}
          <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
            <MiniCalendar events={schedule.map((item) => item.event)} />
            <div className="bg-white border-[3px] border-ink p-5 shadow-[4px_4px_0_0_#2d2d2d] blob-3 sticky top-6">
              <h3 className="font-heading text-xl tracking-tight mb-4 flex items-center gap-2">
                <Icon icon="solar:users-group-rounded-linear" className="text-blue" /> Members
                <span className="text-ink/40 text-sm">({team.members.length})</span>
              </h3>
              <div className="flex flex-col gap-3">
                {team.members.map((m, i) => (
                  <div key={m._id || i} className="flex items-center gap-3">
                    <div className="w-9 h-9 border-2 border-ink rounded-full flex items-center justify-center overflow-hidden shadow-[1px_1px_0_0_#2d2d2d] shrink-0" style={{ backgroundColor: `hsl(${i * 60}, 60%, 85%)` }}>
                      {m.photoURL ? (
                        <img src={m.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-heading text-sm">{m.displayName?.charAt(0) || '?'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-heading truncate">
                        {m.displayName || 'Unknown'}
                        {m.email === team.owner?.email && (
                          <span className="ml-1 text-xs text-yellow bg-ink px-1.5 py-0.5 rounded-full">owner</span>
                        )}
                      </p>
                      <p className="text-xs text-ink/40 truncate">{m.email}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Invite hint */}
              <div className="mt-4 pt-3 border-t-2 border-dashed border-ink/10">
                <p className="text-xs text-ink/40 flex items-center gap-1">
                  <Icon icon="solar:share-linear" /> Share code <strong>{team.code}</strong> to invite members
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Announce Modal */}
      {announceModalOpen && (
        <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-transparent w-full h-full">
          <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setAnnounceModalOpen(false)} />
          <div className="relative bg-white border-[3px] border-ink shadow-[8px_8px_0_0_#2d2d2d] max-w-sm w-full mx-4 p-6 blob-2 z-10 animate-fade-in"
               style={{ backgroundImage: 'radial-gradient(#e5e0d8 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            <button onClick={() => setAnnounceModalOpen(false)} className="absolute top-4 right-4 text-ink hover:text-red transition-colors bg-white rounded-full z-20">
              <Icon icon="solar:close-circle-linear" className="text-3xl" />
            </button>
            <h2 className="font-heading text-2xl tracking-tight text-ink mb-2">Push Announcement</h2>
            <p className="text-ink/60 text-sm mb-4">Send a push notification to all team members.</p>
            <form onSubmit={handleAnnounce} className="flex flex-col gap-4">
              <textarea
                required
                value={announceText}
                onChange={(e) => setAnnounceText(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                className="w-full bg-white border-[3px] border-ink p-3 text-lg focus:outline-none focus:border-blue shadow-[2px_2px_0_0_#2d2d2d] blob-1 resize-none line-clamp-3"
              />
              <button
                type="submit" disabled={announcing}
                className="bg-blue border-[3px] border-ink text-white text-lg font-heading tracking-tight px-6 py-2 shadow-[4px_4px_0_0_#2d2d2d] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2d2d2d] transition-all duration-100 blob-3 disabled:opacity-60"
              >
                {announcing ? 'Sending...' : 'Send Push'}
              </button>
            </form>
          </div>
        </dialog>
      )}

      <SubmitEventModal 
        isOpen={modalOpen} 
        onClose={() => { setModalOpen(false); setEditEvent(null); }} 
        teamId={team._id}
        initialData={editEvent} 
        onSuccess={handleEventSaved} 
        onDelete={handleEventDeleted}
      />
    </div>
  );
}
