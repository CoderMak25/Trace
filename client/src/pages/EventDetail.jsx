import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import { formatDateRange, deadlineLabel, daysUntil, formatDate } from '../utils/dateHelpers';
import BookmarkButton from '../components/BookmarkButton';
import Navbar from '../components/Navbar';
import axios from 'axios';

export default function EventDetail() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [addingToTeam, setAddingToTeam] = useState(false);
  const [teamSelectionMap, setTeamSelectionMap] = useState({});


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

  useEffect(() => {
    async function fetchTeams() {
      if (!currentUser) return;
      try {
        const token = await currentUser.getIdToken();
        const res = await axios.get('/api/teams', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeams(res.data || []);
      } catch (err) {
        console.error('Failed to load teams:', err);
        setTeams([]);
      }
    }
    fetchTeams();
  }, [currentUser]);

  useEffect(() => {
    if (!event?._id || teams.length === 0) {
      setTeamSelectionMap({});
      return;
    }

    const map = {};
    teams.forEach((team) => {
      const selected = (team.selectedEvents || []).find(
        (item) => item?.event?._id === event._id || item?.event === event._id
      );
      map[team._id] = selected?.status || null;
    });
    setTeamSelectionMap(map);
  }, [event?._id, teams]);

  async function addToSelectedTeam() {
    if (!selectedTeamId) return;
    setAddingToTeam(true);
    try {
      const token = await currentUser.getIdToken();
      await axios.post(
        `/api/teams/${selectedTeamId}/select-event`,
        { eventId: event._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTeamSelectionMap((prev) => ({ ...prev, [selectedTeamId]: 'Saved' }));
      alert('Added to team schedule.');
      setTeamPickerOpen(false);
      setSelectedTeamId('');
    } catch (err) {
      console.error('Failed to add event to team:', err);
      alert(err.response?.data?.message || 'Failed to add event to team');
    } finally {
      setAddingToTeam(false);
    }
  }

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
          <button 
            onClick={() => navigate(-1)} 
            className="mt-4 text-blue hover:underline text-lg flex items-center gap-2 bg-transparent border-none cursor-pointer font-sans"
          >
            <Icon icon="solar:arrow-left-linear" /> Back to events
          </button>
        </div>
      </div>
    );
  }

  const deadline = deadlineLabel(event.registrationDeadline);
  const isMultiDay = event.endDate && event.endDate !== event.date;
  const urlParams = new URLSearchParams(location.search);
  const teamIdFromContext = urlParams.get('teamId');
  const contextTeam = teams.find((team) => team._id === teamIdFromContext);
  const contextTeamStatus = teamIdFromContext ? teamSelectionMap[teamIdFromContext] : null;
  const isInContextTeamSchedule = Boolean(contextTeamStatus);
  const isContextInterested = contextTeamStatus === 'Interested';
  const allTeamsAlreadySelected =
    teams.length > 0 && teams.every((team) => !!teamSelectionMap[team._id]);
  const selectedTeamAlreadyInSchedule = selectedTeamId && !!teamSelectionMap[selectedTeamId];

  async function handleInterestClick(e) {
    e.preventDefault();
    if (!currentUser) return;

    // Team-context behavior: first add to team, then mark interested.
    if (teamIdFromContext) {
      if (!isInContextTeamSchedule) {
        alert('Add this event to team first.');
        return;
      }
      if (isContextInterested) return;
      try {
        const token = await currentUser.getIdToken();
        await axios.put(
          `/api/teams/${teamIdFromContext}/select-event/${event._id}/interest`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTeams((prev) =>
          prev.map((team) => {
            if (team._id !== teamIdFromContext) return team;
            const selectedEvents = Array.isArray(team.selectedEvents) ? team.selectedEvents : [];
            const idx = selectedEvents.findIndex((item) => item?.event?._id === event._id || item?.event === event._id);
            if (idx === -1) return team;
            const next = [...selectedEvents];
            next[idx] = { ...next[idx], status: 'Interested' };
            return {
              ...team,
              selectedEvents: next,
            };
          })
        );
        setTeamSelectionMap((prev) => ({ ...prev, [teamIdFromContext]: 'Interested' }));
        alert(`Marked interested for ${contextTeam?.name || 'team'}.`);
      } catch (err) {
        console.error('Failed to mark interested for team:', err);
        alert(err.response?.data?.message || 'Failed to mark interested for team');
      }
      return;
    }

    // Default behavior: personal bookmark
    try {
      const token = await currentUser.getIdToken();
      await axios.put(
        `/api/users/save/${event._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.reload();
    } catch (err) {
      console.error('Failed to toggle interest:', err);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onSubmitClick={() => {}} />

      <div className="w-full max-w-3xl mx-auto px-6 py-12">
        {/* Back */}
        <button 
          onClick={() => navigate(-1)} 
          className="text-ink/60 hover:text-ink flex items-center gap-2 text-lg transition-colors mb-8 bg-transparent border-none cursor-pointer font-sans"
        >
          <Icon icon="solar:arrow-left-linear" /> Back to events
        </button>

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
                <span className="text-ink/60 text-sm block">
                  {event.source === 'unstop' || event.source === 'devfolio' ? 'End Date' : (isMultiDay ? 'Duration' : 'Date')}
                </span>
                {event.source === 'unstop' || event.source === 'devfolio' 
                  ? (event.endDate ? formatDate(event.endDate) : formatDate(event.date))
                  : formatDateRange(event.date, event.endDate)}
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

          {/* Metadata Section */}
          <div className="border-2 border-ink border-dashed p-6 mb-8 bg-tan/20 blob-3">
            <h3 className="font-heading text-xl mb-4 flex items-center gap-2">
              <Icon icon="solar:info-circle-linear" className="text-blue" /> Participation Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white border-2 border-ink p-3 shadow-[2px_2px_0_0_#2d2d2d] blob-1">
                <span className="block text-[10px] uppercase tracking-widest text-ink/40 font-heading mb-1">Views</span>
                <span className="font-heading text-2xl text-ink">{event.viewsCount?.toLocaleString() || 0}</span>
              </div>
              <div className="bg-white border-2 border-ink p-3 shadow-[2px_2px_0_0_#2d2d2d] blob-2">
                <span className="block text-[10px] uppercase tracking-widest text-ink/40 font-heading mb-1">Registered</span>
                <span className="font-heading text-2xl text-ink">{event.registerCount?.toLocaleString() || 0}</span>
              </div>
              <div className="bg-white border-2 border-ink p-3 shadow-[2px_2px_0_0_#2d2d2d] blob-1">
                <span className="block text-[10px] uppercase tracking-widest text-ink/40 font-heading mb-1">Team Size</span>
                <span className="font-heading text-2xl text-ink">{event.minTeamSize || 1}-{event.maxTeamSize || 1}</span>
              </div>
              <div className="bg-white border-2 border-ink p-3 shadow-[2px_2px_0_0_#2d2d2d] blob-3">
                <span className="block text-[10px] uppercase tracking-widest text-ink/40 font-heading mb-1">Entry Fee</span>
                <span className="font-heading text-2xl text-blue">{event.fees > 0 ? `₹${event.fees}` : 'Free'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {event.registrationLink && (
              <a
                href={event.registrationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-red border-[3px] border-ink text-white text-xl md:text-2xl font-heading tracking-tight px-6 py-4 shadow-[6px_6px_0_0_#2d2d2d] hover:-rotate-1 hover:shadow-[3px_3px_0_0_#2d2d2d] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all duration-100 flex items-center justify-center gap-3 blob-3"
              >
                <Icon icon="solar:link-linear" /> Register Now
              </a>
            )}
            
            <button
              onClick={handleInterestClick}
              className={`flex-1 border-[3px] border-ink text-xl md:text-2xl font-heading tracking-tight px-6 py-4 shadow-[6px_6px_0_0_#2d2d2d] hover:rotate-1 hover:shadow-[3px_3px_0_0_#2d2d2d] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all duration-100 flex items-center justify-center gap-3 ${
                teamIdFromContext
                  ? (isContextInterested ? 'bg-yellow blob-2' : 'bg-tan blob-1')
                  : ((userProfile?.savedEvents || []).some(e => (e._id || e) === event._id) ? 'bg-yellow blob-2' : 'bg-tan blob-1')
              } ${currentUser && currentUser.isDemo ? 'opacity-50 cursor-not-allowed' : ''} text-ink`}
              disabled={teamIdFromContext ? isContextInterested : false}
            >
              <Icon
                icon={
                  teamIdFromContext
                    ? (isContextInterested ? 'solar:check-circle-bold' : 'solar:star-linear')
                    : ((userProfile?.savedEvents || []).some(e => (e._id || e) === event._id) ? 'solar:star-bold' : 'solar:star-linear')
                }
              />
              {teamIdFromContext
                ? (isContextInterested ? 'Interested ✓' : (isInContextTeamSchedule ? 'Mark as Interested' : 'Add To Team First'))
                : ((userProfile?.savedEvents || []).some(e => (e._id || e) === event._id) ? 'Interested ✓' : 'Mark as Interested')}
            </button>
            <button
              onClick={() => {
                if (!teams.length) {
                  alert('Join or create a team first to add events to team schedule.');
                  return;
                }
                if (allTeamsAlreadySelected) return;
                if (teams.length === 1 && !teamSelectionMap[teams[0]._id]) {
                  setSelectedTeamId(teams[0]._id);
                  setTeamPickerOpen(true);
                  return;
                }
                setTeamPickerOpen(true);
              }}
              disabled={allTeamsAlreadySelected}
              className="flex-1 bg-blue border-[3px] border-ink text-white text-xl md:text-2xl font-heading tracking-tight px-6 py-4 shadow-[6px_6px_0_0_#2d2d2d] hover:rotate-1 hover:shadow-[3px_3px_0_0_#2d2d2d] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all duration-100 flex items-center justify-center gap-3 blob-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Icon icon="solar:users-group-rounded-linear" /> {allTeamsAlreadySelected ? 'In Team ✓' : 'Add To Team'}
            </button>
          </div>
        </article>
      </div>

      {teamPickerOpen && (
        <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-transparent w-full h-full">
          <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setTeamPickerOpen(false)} />
          <div className="relative bg-white border-[3px] border-ink shadow-[8px_8px_0_0_#2d2d2d] max-w-md w-full mx-4 p-6 blob-2 z-10 animate-fade-in">
            <button
              onClick={() => setTeamPickerOpen(false)}
              className="absolute top-4 right-4 text-ink hover:text-red transition-colors bg-white rounded-full z-20"
            >
              <Icon icon="solar:close-circle-linear" className="text-3xl" />
            </button>
            <h2 className="font-heading text-2xl tracking-tight text-ink mb-2">Add To Team</h2>
            <p className="text-ink/60 text-sm mb-4">Select the team for this event.</p>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full appearance-none bg-white border-[3px] border-ink text-ink text-lg pl-4 pr-10 py-3 shadow-[4px_4px_0_0_#2d2d2d] cursor-pointer focus:outline-none focus:border-blue blob-2 mb-4"
            >
              <option value="">Choose team</option>
              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {teamSelectionMap[team._id] ? `${team.name} (Already in team)` : team.name}
                </option>
              ))}
            </select>
            <button
              onClick={addToSelectedTeam}
              disabled={!selectedTeamId || addingToTeam || selectedTeamAlreadyInSchedule}
              className="w-full bg-blue border-[3px] border-ink text-white text-lg font-heading tracking-tight px-6 py-2 shadow-[4px_4px_0_0_#2d2d2d] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2d2d2d] transition-all duration-100 blob-3 disabled:opacity-60"
            >
              {selectedTeamAlreadyInSchedule ? 'Already In Team' : addingToTeam ? 'Adding...' : 'Confirm'}
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
