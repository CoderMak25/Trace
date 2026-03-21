import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function SubmitEventModal({ isOpen, onClose, teamId = null, initialData = null, onSuccess, onDelete }) {
  const { currentUser } = useAuth();
  const emptyForm = {
    name: '',
    category: 'Hackathon',
    date: '',
    endDate: '',
    registrationDeadline: '',
    registered: false,
    registrationLink: '',
    organizer: '',
    city: '',
    mode: 'In-Person',
    prizePool: '',
    description: '',
    selectionStatus: 'Pending',
  };
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category?.[0] || initialData.category || 'Hackathon',
        date: initialData.date ? initialData.date.split('T')[0] : '',
        endDate: initialData.endDate ? initialData.endDate.split('T')[0] : '',
        registrationDeadline: initialData.registrationDeadline ? initialData.registrationDeadline.split('T')[0] : '',
        registered: initialData.registered || false,
        registrationLink: initialData.registrationLink || '',
        organizer: initialData.organizer || '',
        city: initialData.city || '',
        mode: initialData.mode || 'In-Person',
        prizePool: initialData.prizePool || '',
        description: initialData.description || '',
        selectionStatus: initialData.selectionStatus || 'Pending',
      });
    } else if (isOpen && !initialData) {
      setFormData(emptyForm);
    }
    setErrorMsg('');
  }, [initialData, isOpen]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      let savedEvent = null;
      if (currentUser && !currentUser.isDemo) {
        const token = await currentUser.getIdToken();
        const payload = { ...formData };
        if (teamId && !initialData) payload.teamId = teamId;

        let res;
        if (initialData) {
          res = await axios.put('/api/events/' + initialData._id, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          res = await axios.post('/api/events', payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        savedEvent = res.data;
      } else {
        savedEvent = { _id: initialData?._id || 'demo-' + Date.now(), slug: 'demo-' + Date.now(), ...formData };
      }

      setSuccess(true);
      if (onSuccess) onSuccess(savedEvent, !!initialData);

      setTimeout(() => {
        setSuccess(false);
        onClose();
        setFormData(emptyForm);
      }, 1500);
    } catch (err) {
      console.error('Submit failed:', err);
      const message = err.response?.data?.message || err.message || 'Failed to save event.';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return;
    setDeleting(true);
    setErrorMsg('');
    try {
      if (currentUser && !currentUser.isDemo) {
        const token = await currentUser.getIdToken();
        await axios.delete('/api/events/' + initialData._id, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (onDelete) onDelete(initialData._id);
      onClose();
      setFormData(emptyForm);
    } catch (err) {
      console.error('Delete failed:', err);
      const message = err.response?.data?.message || err.message || 'Failed to delete event.';
      setErrorMsg(message);
    } finally {
      setDeleting(false);
    }
  }

  if (!isOpen) return null;

  // Styled scrollbar CSS-in-JS
  const scrollStyle = {
    scrollbarWidth: 'thin',
    scrollbarColor: '#2d2d2d #e5e0d8',
  };

  const inputCls = "w-full bg-white border-[3px] border-ink p-3 text-lg focus:outline-none focus:border-blue shadow-[2px_2px_0_0_#2d2d2d]";

  return (
    <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-transparent w-full h-full">
      <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white border-[3px] border-ink shadow-[8px_8px_0_0_#2d2d2d] max-w-lg w-full mx-4 blob-1 animate-fade-in z-10 max-h-[90vh] flex flex-col"
        style={{ backgroundImage: 'radial-gradient(#e5e0d8 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        {/* Pin */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-red border-[3px] border-ink rounded-full shadow-[2px_2px_0_0_#2d2d2d] z-10 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full opacity-60 absolute top-1 left-1" />
        </div>

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-ink hover:text-red transition-colors bg-white rounded-full z-20">
          <Icon icon="solar:close-circle-linear" className="text-3xl" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 md:p-8 flex-1" style={scrollStyle}>
          {success ? (
            <div className="text-center py-12">
              <Icon icon="solar:check-circle-bold" className="text-6xl text-green-500 mx-auto mb-4" />
              <h2 className="font-heading text-3xl tracking-tight">{initialData ? 'Event Updated!' : 'Event Added!'}</h2>
              <p className="text-ink/70 mt-2">Your event is securely saved.</p>
            </div>
          ) : (
            <>
              <h2 className="font-heading text-4xl tracking-tight text-ink mb-6 text-center border-b-[3px] border-dashed border-ink/20 pb-4">
                {initialData ? 'Edit Event' : 'Pin an Event'}
              </h2>

              {errorMsg && (
                <div className="bg-red/10 border-2 border-red text-red p-3 mb-4 font-heading text-lg blob-1">
                  <Icon icon="solar:danger-triangle-bold" className="inline mr-2" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Event Name */}
                <div className="flex flex-col gap-1">
                  <label className="font-heading text-lg tracking-tight ml-2">Event Name *</label>
                  <input
                    type="text" name="name" required value={formData.name} onChange={handleChange}
                    placeholder="e.g., CodeFest 2024"
                    className={`${inputCls} blob-2`}
                  />
                </div>

                {/* Category + Mode */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-heading text-lg tracking-tight ml-2">Category</label>
                    <select
                      name="category" value={formData.category} onChange={handleChange}
                      className={`${inputCls} appearance-none cursor-pointer blob-3`}
                    >
                      <option>Hackathon</option>
                      <option>Workshop</option>
                      <option>Tech Fest</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-heading text-lg tracking-tight ml-2">Mode</label>
                    <select
                      name="mode" value={formData.mode} onChange={handleChange}
                      className={`${inputCls} appearance-none cursor-pointer blob-1`}
                    >
                      <option>In-Person</option>
                      <option>Online</option>
                      <option>Hybrid</option>
                    </select>
                  </div>
                </div>

                {/* Start Date + End Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-heading text-lg tracking-tight ml-2">Start Date *</label>
                    <input
                      type="date" name="date" required value={formData.date} onChange={handleChange}
                      className={`${inputCls} blob-1`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-heading text-lg tracking-tight ml-2">End Date</label>
                    <input
                      type="date" name="endDate" value={formData.endDate} onChange={handleChange}
                      className={`${inputCls} blob-2`}
                    />
                    <span className="text-xs text-ink/40 ml-2">Leave blank for single-day events</span>
                  </div>
                </div>

                {/* Organizer + City */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-heading text-lg tracking-tight ml-2">Organizer *</label>
                    <input
                      type="text" name="organizer" required value={formData.organizer} onChange={handleChange}
                      placeholder="e.g., Tech Club IIT"
                      className={`${inputCls} blob-2`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-heading text-lg tracking-tight ml-2">City</label>
                    <input
                      type="text" name="city" value={formData.city} onChange={handleChange}
                      placeholder="e.g., Mumbai"
                      className={`${inputCls} blob-3`}
                    />
                  </div>
                </div>

                {/* Registration Status */}
                <div className="bg-tan/40 border-[3px] border-ink/20 border-dashed p-4 blob-2">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox" name="registered" checked={formData.registered} onChange={handleChange}
                      id="registered-check"
                      className="w-5 h-5 border-[3px] border-ink accent-blue cursor-pointer"
                    />
                    <label htmlFor="registered-check" className="font-heading text-lg tracking-tight cursor-pointer select-none">
                      Already Registered
                    </label>
                  </div>
                  {formData.registered ? (
                    <div className="flex flex-col gap-1 animate-fade-in mt-2">
                      <label className="font-heading text-sm tracking-tight ml-2 text-ink/70">Selection Status</label>
                      <select
                        name="selectionStatus" value={formData.selectionStatus} onChange={handleChange}
                        className={`${inputCls} appearance-none cursor-pointer blob-3 text-base`}
                      >
                        <option value="Pending">Pending (Awaiting Results)</option>
                        <option value="Selected">Selected 🎉</option>
                        <option value="Rejected">Not Selected ❌</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 animate-fade-in mt-2">
                      <label className="font-heading text-sm tracking-tight ml-2 text-ink/70">Registration Deadline</label>
                      <input
                        type="date" name="registrationDeadline" value={formData.registrationDeadline} onChange={handleChange}
                        className={`${inputCls} blob-4 text-base`}
                      />
                    </div>
                  )}
                </div>

                {/* Reg Link + Cost */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-heading text-lg tracking-tight ml-2">Registration Link</label>
                    <input
                      type="url" name="registrationLink" value={formData.registrationLink} onChange={handleChange}
                      placeholder="https://"
                      className={`${inputCls} blob-4`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-heading text-lg tracking-tight ml-2">Cost / Prize</label>
                    <input
                      type="text" name="prizePool" value={formData.prizePool} onChange={handleChange}
                      placeholder="e.g. Free, ₹50K"
                      className={`${inputCls} blob-1`}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1">
                  <label className="font-heading text-lg tracking-tight ml-2">Description</label>
                  <textarea
                    name="description" value={formData.description} onChange={handleChange}
                    placeholder="What's this event about?"
                    rows={3}
                    className={`${inputCls} blob-2 resize-none`}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 mt-2">
                  <button
                    type="submit" disabled={submitting}
                    className="bg-red border-[3px] border-ink text-white text-xl font-heading tracking-tight px-6 py-3 shadow-[6px_6px_0_0_#2d2d2d] hover:-rotate-1 hover:shadow-[3px_3px_0_0_#2d2d2d] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all duration-100 blob-3 disabled:opacity-60"
                  >
                    {submitting ? 'Saving...' : initialData ? 'Save Changes' : 'Stick it on the board!'}
                  </button>

                  {initialData && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-white border-[3px] border-red text-red text-lg font-heading tracking-tight px-6 py-2 shadow-[4px_4px_0_0_#2d2d2d] hover:bg-red hover:text-white hover:shadow-[2px_2px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 blob-1 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <Icon icon="solar:trash-bin-minimalistic-linear" />
                      {deleting ? 'Deleting...' : 'Delete Event'}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
