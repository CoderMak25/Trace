import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const TEAM_COLORS = ['#ff4d4d', '#2d5da1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

// Demo teams for offline / demo mode
const DEMO_TEAMS = [
  {
    _id: 't1',
    name: 'ByteBuilders',
    code: 'BYT3BL',
    description: 'IIT Bombay CSE squad. We hack every weekend.',
    color: '#ff4d4d',
    owner: { displayName: 'Demo User', email: 'demo@trace.app' },
    members: [
      { displayName: 'Demo User', email: 'demo@trace.app' },
      { displayName: 'Arjun Mehta', email: 'arjun@iitb.ac.in' },
      { displayName: 'Priya Sharma', email: 'priya@iitb.ac.in' },
    ],
    events: [],
  },
];

export default function Teams() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('my-teams'); // my-teams | create | join
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [newTeam, setNewTeam] = useState({ name: '', description: '', color: '#ff4d4d' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, [currentUser]);

  async function fetchTeams() {
    try {
      if (currentUser?.isDemo) {
        setTeams(DEMO_TEAMS);
        setLoading(false);
        return;
      }
      const token = await currentUser.getIdToken();
      const res = await axios.get('/api/teams', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeams(res.data);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    try {
      if (currentUser?.isDemo) {
        const fakeTeam = {
          _id: 't' + Date.now(),
          name: newTeam.name,
          code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          description: newTeam.description,
          color: newTeam.color,
          owner: { displayName: 'Demo User', email: 'demo@trace.app' },
          members: [{ displayName: 'Demo User', email: 'demo@trace.app' }],
          events: [],
        };
        setTeams((prev) => [fakeTeam, ...prev]);
        setTab('my-teams');
        setNewTeam({ name: '', description: '', color: '#ff4d4d' });
      } else {
        const token = await currentUser.getIdToken();
        await axios.post('/api/teams', newTeam, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchTeams();
        setTab('my-teams');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create team. Ensure you are logged in properly.');
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    setJoinError('');
    setJoinSuccess('');
    try {
      if (currentUser?.isDemo) {
        setJoinSuccess('Joined team successfully! (Demo mode)');
        return;
      }
      const token = await currentUser.getIdToken();
      const res = await axios.post('/api/teams/join', { code: joinCode }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJoinSuccess(`Joined "${res.data.name}" successfully!`);
      setJoinCode('');
      await fetchTeams();
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Failed to join team');
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onSubmitClick={() => {}} />

      <div className="w-full max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-4xl md:text-5xl tracking-tight text-ink flex items-center gap-3">
              <Icon icon="solar:users-group-rounded-linear" className="text-blue" />
              Teams
            </h1>
            <p className="text-xl text-ink/60 mt-1">Collaborate with your squad. Share event schedules.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'my-teams', label: 'My Teams', icon: 'solar:users-group-rounded-linear' },
            { id: 'create', label: 'Create Team', icon: 'solar:add-circle-linear' },
            { id: 'join', label: 'Join Team', icon: 'solar:login-2-linear' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setJoinError(''); setJoinSuccess(''); }}
              className={`font-heading text-lg tracking-tight px-5 py-2.5 border-[3px] border-ink shadow-[3px_3px_0_0_#2d2d2d] transition-all blob-2 flex items-center gap-2 whitespace-nowrap ${
                tab === t.id ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-yellow'
              }`}
            >
              <Icon icon={t.icon} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── My Teams ── */}
        {tab === 'my-teams' && (
          <>
            {loading ? (
              <div className="text-center py-16 font-heading text-xl text-ink/60 animate-pulse">Loading teams...</div>
            ) : teams.length === 0 ? (
              <div className="bg-white border-[3px] border-ink p-16 text-center shadow-[4px_4px_0_0_#2d2d2d] blob-1">
                <Icon icon="solar:users-group-rounded-linear" className="text-6xl text-ink/20 mx-auto mb-4" />
                <h3 className="font-heading text-2xl tracking-tight text-ink/50 mb-2">No teams yet</h3>
                <p className="text-ink/40 mb-6">Create a team or join one with a code!</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => setTab('create')} className="bg-red border-[3px] border-ink text-white px-5 py-2 shadow-[3px_3px_0_0_#2d2d2d] hover:shadow-[1px_1px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all blob-1 flex items-center gap-2">
                    <Icon icon="solar:add-circle-linear" /> Create
                  </button>
                  <button onClick={() => setTab('join')} className="bg-white border-[3px] border-ink text-ink px-5 py-2 shadow-[3px_3px_0_0_#2d2d2d] hover:shadow-[1px_1px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all blob-2 flex items-center gap-2">
                    <Icon icon="solar:login-2-linear" /> Join
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teams.map((team, i) => (
                  <Link
                    key={team._id}
                    to={`/teams/${team._id}`}
                    className={`bg-white border-[3px] border-ink p-6 shadow-[4px_4px_0_0_#2d2d2d] relative group transition-all duration-200 hover:shadow-[8px_8px_0_0_#2d2d2d] hover:-translate-y-1 ${['blob-1','blob-2','blob-3'][i%3]} ${['hover:-rotate-1','hover:rotate-1','hover:-rotate-2'][i%3]}`}
                  >
                    {/* Color bar */}
                    <div className="absolute top-0 left-0 right-0 h-2 rounded-t-lg" style={{ backgroundColor: team.color }} />

                    <div className="flex items-start gap-4 pt-2">
                      <div className="w-12 h-12 border-[3px] border-ink rounded-full flex items-center justify-center shadow-[2px_2px_0_0_#2d2d2d] shrink-0 text-white font-heading text-lg" style={{ backgroundColor: team.color }}>
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading text-2xl tracking-tight group-hover:text-red transition-colors truncate">{team.name}</h3>
                        <p className="text-ink/60 text-sm truncate">{team.description || 'No description'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t-2 border-dashed border-ink/10">
                      <div className="flex items-center gap-2 text-sm text-ink/60">
                        <Icon icon="solar:users-group-rounded-linear" className="text-blue" />
                        {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-ink/60">
                        <Icon icon="solar:calendar-linear" className="text-red" />
                        {team.events?.length || 0} event{(team.events?.length || 0) !== 1 ? 's' : ''}
                      </div>
                      <span className="bg-tan border-2 border-ink px-2 py-0.5 text-xs font-heading blob-2 shadow-[1px_1px_0_0_#2d2d2d]">
                        {team.code}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Create Team ── */}
        {tab === 'create' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-white border-[3px] border-ink p-8 shadow-[8px_8px_0_0_#2d2d2d] blob-1 relative animate-fade-in"
              style={{ backgroundImage: 'radial-gradient(#e5e0d8 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue border-[3px] border-ink rounded-full shadow-[2px_2px_0_0_#2d2d2d] z-10 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full opacity-60 absolute top-1 left-1" />
              </div>

              <h2 className="font-heading text-3xl tracking-tight text-ink mb-6 text-center">Create a Team</h2>

              <form onSubmit={handleCreate} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <label className="font-heading text-xl tracking-tight ml-2">Team Name *</label>
                  <input
                    type="text" required value={newTeam.name}
                    onChange={(e) => setNewTeam((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., ByteBuilders"
                    className="w-full bg-white border-[3px] border-ink p-3 text-lg focus:outline-none focus:border-blue focus:ring-4 focus:ring-blue/10 shadow-[2px_2px_0_0_#2d2d2d] blob-2"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-heading text-xl tracking-tight ml-2">Description</label>
                  <textarea
                    rows="2" value={newTeam.description}
                    onChange={(e) => setNewTeam((p) => ({ ...p, description: e.target.value }))}
                    placeholder="What's your team about?"
                    className="w-full bg-white border-[3px] border-ink p-3 text-lg focus:outline-none focus:border-blue focus:ring-4 focus:ring-blue/10 shadow-[2px_2px_0_0_#2d2d2d] blob-3"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-heading text-xl tracking-tight ml-2">Team Color</label>
                  <div className="flex gap-3 ml-2">
                    {TEAM_COLORS.map((c) => (
                      <button
                        key={c} type="button"
                        onClick={() => setNewTeam((p) => ({ ...p, color: c }))}
                        className={`w-10 h-10 rounded-full border-[3px] transition-transform ${newTeam.color === c ? 'border-ink scale-110 shadow-[2px_2px_0_0_#2d2d2d]' : 'border-ink/20 hover:scale-105'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit" disabled={creating}
                  className="mt-2 bg-red border-[3px] border-ink text-white text-xl font-heading tracking-tight px-6 py-3 shadow-[6px_6px_0_0_#2d2d2d] hover:-rotate-1 hover:shadow-[3px_3px_0_0_#2d2d2d] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all duration-100 blob-3 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Icon icon="solar:add-circle-linear" /> {creating ? 'Creating...' : 'Create Team'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Join Team ── */}
        {tab === 'join' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-white border-[3px] border-ink p-8 shadow-[8px_8px_0_0_#2d2d2d] blob-3 relative animate-fade-in"
              style={{ backgroundImage: 'radial-gradient(#e5e0d8 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-red border-[3px] border-ink rounded-full shadow-[2px_2px_0_0_#2d2d2d] z-10 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full opacity-60 absolute top-1 left-1" />
              </div>

              <h2 className="font-heading text-3xl tracking-tight text-ink mb-2 text-center">Join a Team</h2>
              <p className="text-ink/60 text-center mb-6">Enter the 6-character team code shared by your teammate.</p>

              {joinError && (
                <div className="bg-red/10 border-2 border-red text-red px-4 py-2 mb-4 text-sm blob-2">{joinError}</div>
              )}
              {joinSuccess && (
                <div className="bg-green-50 border-2 border-green-500 text-green-700 px-4 py-2 mb-4 text-sm blob-2 flex items-center gap-2">
                  <Icon icon="solar:check-circle-bold" /> {joinSuccess}
                </div>
              )}

              <form onSubmit={handleJoin} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <label className="font-heading text-xl tracking-tight ml-2">Team Code</label>
                  <input
                    type="text" required value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g., BYT3BL"
                    maxLength={6}
                    className="w-full bg-white border-[3px] border-ink p-4 text-3xl text-center font-heading tracking-[0.4em] uppercase focus:outline-none focus:border-blue focus:ring-4 focus:ring-blue/10 shadow-[2px_2px_0_0_#2d2d2d] blob-1"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-blue border-[3px] border-ink text-white text-xl font-heading tracking-tight px-6 py-3 shadow-[6px_6px_0_0_#2d2d2d] hover:-rotate-1 hover:shadow-[3px_3px_0_0_#2d2d2d] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all duration-100 blob-1 flex items-center justify-center gap-2"
                >
                  <Icon icon="solar:login-2-linear" /> Join Team
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
