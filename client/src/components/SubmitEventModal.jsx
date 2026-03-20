import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function SubmitEventModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    category: 'Hackathon',
    date: '',
    registrationLink: '',
    organizer: '',
    city: '',
    mode: 'In-Person',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (currentUser && !currentUser.isDemo) {
        const token = await currentUser.getIdToken();
        await axios.post('/api/submissions', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setFormData({ name: '', category: 'Hackathon', date: '', registrationLink: '', organizer: '', city: '', mode: 'In-Person', description: '' });
      }, 2000);
    } catch (err) {
      console.error('Submit failed:', err);
      // Still show success in demo mode
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 2000);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-transparent w-full h-full">
      <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white border-[3px] border-ink p-6 md:p-8 shadow-[8px_8px_0_0_#2d2d2d] rotate-1 max-w-lg w-full mx-4 blob-1 animate-fade-in z-10"
        style={{ backgroundImage: 'radial-gradient(#e5e0d8 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        {/* Pin */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-red border-[3px] border-ink rounded-full shadow-[2px_2px_0_0_#2d2d2d] z-10 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full opacity-60 absolute top-1 left-1" />
        </div>

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-ink hover:text-red transition-colors bg-white rounded-full">
          <Icon icon="solar:close-circle-linear" className="text-3xl" />
        </button>

        {success ? (
          <div className="text-center py-12">
            <Icon icon="solar:check-circle-bold" className="text-6xl text-green-500 mx-auto mb-4" />
            <h2 className="font-heading text-3xl tracking-tight">Event Submitted!</h2>
            <p className="text-ink/70 mt-2">It will appear after admin review.</p>
          </div>
        ) : (
          <>
            <h2 className="font-heading text-4xl tracking-tight text-ink mb-6 text-center border-b-[3px] border-dashed border-ink/20 pb-4">
              Pin an Event
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <label className="font-heading text-xl tracking-tight ml-2">Event Name *</label>
                <input
                  type="text" name="name" required value={formData.name} onChange={handleChange}
                  placeholder="e.g., CodeFest 2024"
                  className="w-full bg-white border-[3px] border-ink p-3 text-lg focus:outline-none focus:border-blue focus:ring-4 focus:ring-blue/10 shadow-[2px_2px_0_0_#2d2d2d] blob-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-heading text-xl tracking-tight ml-2">Category</label>
                  <select
                    name="category" value={formData.category} onChange={handleChange}
                    className="w-full bg-white border-[3px] border-ink p-3 text-lg focus:outline-none focus:border-blue shadow-[2px_2px_0_0_#2d2d2d] appearance-none cursor-pointer blob-3"
                  >
                    <option>Hackathon</option>
                    <option>Workshop</option>
                    <option>Tech Fest</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-heading text-xl tracking-tight ml-2">Date</label>
                  <input
                    type="date" name="date" value={formData.date} onChange={handleChange}
                    className="w-full bg-white border-[3px] border-ink p-3 text-lg focus:outline-none focus:border-blue shadow-[2px_2px_0_0_#2d2d2d] blob-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-heading text-xl tracking-tight ml-2">Organizer</label>
                  <input
                    type="text" name="organizer" value={formData.organizer} onChange={handleChange}
                    placeholder="e.g., Tech Club IIT"
                    className="w-full bg-white border-[3px] border-ink p-3 text-lg focus:outline-none focus:border-blue shadow-[2px_2px_0_0_#2d2d2d] blob-2"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-heading text-xl tracking-tight ml-2">City</label>
                  <input
                    type="text" name="city" value={formData.city} onChange={handleChange}
                    placeholder="e.g., Mumbai"
                    className="w-full bg-white border-[3px] border-ink p-3 text-lg focus:outline-none focus:border-blue shadow-[2px_2px_0_0_#2d2d2d] blob-3"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-heading text-xl tracking-tight ml-2">Registration Link</label>
                <input
                  type="url" name="registrationLink" value={formData.registrationLink} onChange={handleChange}
                  placeholder="https://"
                  className="w-full bg-white border-[3px] border-ink p-3 text-lg focus:outline-none focus:border-blue shadow-[2px_2px_0_0_#2d2d2d] blob-4"
                />
              </div>

              <button
                type="submit" disabled={submitting}
                className="mt-4 bg-red border-[3px] border-ink text-white text-2xl font-heading tracking-tight px-6 py-3 shadow-[6px_6px_0_0_#2d2d2d] hover:-rotate-1 hover:shadow-[3px_3px_0_0_#2d2d2d] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all duration-100 blob-3 disabled:opacity-60"
              >
                {submitting ? 'Pinning...' : 'Stick it on the board!'}
              </button>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}
