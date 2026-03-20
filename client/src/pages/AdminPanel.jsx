import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';

export default function AdminPanel() {
  const { currentUser, userProfile } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('submissions');

  // Demo submissions
  const demoSubmissions = [
    { _id: 's1', name: 'React Summit Delhi', category: 'Workshop', date: '2024-12-20', city: 'Delhi', mode: 'In-Person', submittedBy: 'user@example.com', status: 'pending' },
    { _id: 's2', name: 'Cloud Computing Hackathon', category: 'Hackathon', date: '2025-01-10', city: 'Online', mode: 'Online', submittedBy: 'dev@college.edu', status: 'pending' },
    { _id: 's3', name: 'Blockchain Bootcamp', category: 'Workshop', date: '2025-01-15', city: 'Pune', mode: 'In-Person', submittedBy: 'admin@fest.org', status: 'pending' },
  ];

  useEffect(() => {
    async function loadSubmissions() {
      try {
        if (currentUser?.isDemo) {
          setSubmissions(demoSubmissions);
        } else if (currentUser) {
          const token = await currentUser.getIdToken();
          const res = await axios.get('/api/submissions', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setSubmissions(res.data);
        }
      } catch {
        setSubmissions(demoSubmissions);
      } finally {
        setLoading(false);
      }
    }
    loadSubmissions();
  }, [currentUser]);

  async function handleAction(id, action) {
    try {
      if (currentUser?.isDemo) {
        setSubmissions((prev) => prev.filter((s) => s._id !== id));
        return;
      }
      const token = await currentUser.getIdToken();
      await axios.put(`/api/submissions/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmissions((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error('Action failed:', err);
    }
  }

  if (userProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar onSubmitClick={() => {}} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Icon icon="solar:shield-warning-linear" className="text-6xl text-red mb-4" />
          <h2 className="font-heading text-3xl tracking-tight">Admin Only</h2>
          <p className="text-ink/60 mt-2">You need admin access to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onSubmitClick={() => {}} />

      <div className="w-full max-w-6xl mx-auto px-6 py-12">
        <h1 className="font-heading text-4xl md:text-5xl tracking-tight text-ink mb-2 flex items-center gap-3">
          <Icon icon="solar:shield-check-linear" className="text-blue" />
          Admin Panel
        </h1>
        <p className="text-xl text-ink/60 mb-8">Review submissions, manage events, send notifications.</p>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {['submissions', 'notifications'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-heading text-xl tracking-tight px-6 py-2 border-[3px] border-ink shadow-[3px_3px_0_0_#2d2d2d] transition-all blob-2 capitalize ${
                tab === t ? 'bg-red text-white' : 'bg-white text-ink hover:bg-yellow'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'submissions' && (
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="text-center py-12 font-heading text-xl text-ink/60 animate-pulse">Loading submissions...</div>
            ) : submissions.length === 0 ? (
              <div className="bg-white border-[3px] border-ink p-12 text-center shadow-[4px_4px_0_0_#2d2d2d] blob-1">
                <Icon icon="solar:inbox-linear" className="text-5xl text-ink/30 mb-4 mx-auto block" />
                <p className="font-heading text-2xl tracking-tight text-ink/60">No pending submissions</p>
              </div>
            ) : (
              submissions.map((sub) => (
                <div key={sub._id} className="bg-white border-[3px] border-ink p-6 shadow-[4px_4px_0_0_#2d2d2d] flex flex-col md:flex-row md:items-center justify-between gap-4 blob-1">
                  <div className="flex-1">
                    <h3 className="font-heading text-2xl tracking-tight">{sub.name}</h3>
                    <div className="flex flex-wrap gap-4 text-ink/70 mt-1">
                      <span className="flex items-center gap-1"><Icon icon="solar:tag-linear" /> {sub.category}</span>
                      <span className="flex items-center gap-1"><Icon icon="solar:calendar-linear" /> {sub.date}</span>
                      <span className="flex items-center gap-1"><Icon icon="solar:map-point-linear" /> {sub.city}</span>
                      <span className="flex items-center gap-1"><Icon icon="solar:user-linear" /> {sub.submittedBy}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction(sub._id, 'approve')}
                      className="bg-green-500 border-[3px] border-ink text-white px-4 py-2 shadow-[3px_3px_0_0_#2d2d2d] hover:shadow-[1px_1px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all blob-2 flex items-center gap-1"
                    >
                      <Icon icon="solar:check-circle-linear" /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(sub._id, 'reject')}
                      className="bg-red border-[3px] border-ink text-white px-4 py-2 shadow-[3px_3px_0_0_#2d2d2d] hover:shadow-[1px_1px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all blob-3 flex items-center gap-1"
                    >
                      <Icon icon="solar:close-circle-linear" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'notifications' && (
          <div className="bg-white border-[3px] border-ink p-8 shadow-[4px_4px_0_0_#2d2d2d] blob-1">
            <h3 className="font-heading text-2xl tracking-tight mb-4">Send Push Notification</h3>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Notification title"
                className="w-full bg-white border-[3px] border-ink p-3 text-lg focus:outline-none focus:border-blue shadow-[2px_2px_0_0_#2d2d2d] blob-2"
              />
              <textarea
                placeholder="Notification message"
                rows="3"
                className="w-full bg-white border-[3px] border-ink p-3 text-lg focus:outline-none focus:border-blue shadow-[2px_2px_0_0_#2d2d2d] blob-3"
              />
              <button className="bg-blue border-[3px] border-ink text-white text-xl font-heading tracking-tight px-6 py-3 shadow-[4px_4px_0_0_#2d2d2d] hover:shadow-[2px_2px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all blob-1 flex items-center gap-2 w-fit">
                <Icon icon="solar:bell-linear" /> Send to All Users
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
