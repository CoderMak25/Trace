import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { currentUser, userProfile, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onSubmitClick={() => {}} />

      <div className="w-full max-w-3xl mx-auto px-6 py-12">
        {/* Profile Card */}
        <div className="bg-white border-[3px] border-ink p-8 shadow-[8px_8px_0_0_#2d2d2d] relative blob-1 animate-fade-in"
          style={{ backgroundImage: 'radial-gradient(#e5e0d8 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }}>
          
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue border-[3px] border-ink rounded-full shadow-[2px_2px_0_0_#2d2d2d] z-10 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full opacity-60 absolute top-1 left-1" />
          </div>

          <div className="flex flex-col items-center mb-8 pt-4">
            <div className="w-24 h-24 bg-tan border-[3px] border-ink rounded-full shadow-[4px_4px_0_0_#2d2d2d] flex items-center justify-center mb-4 overflow-hidden">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <Icon icon="solar:user-linear" className="text-4xl text-ink/60" />
              )}
            </div>
            <h1 className="font-heading text-3xl tracking-tight text-ink">
              {userProfile?.displayName || currentUser?.displayName || 'User'}
            </h1>
            <p className="text-ink/60 text-lg">{userProfile?.email || currentUser?.email}</p>
            {userProfile?.role === 'admin' && (
              <span className="mt-2 bg-blue border-2 border-ink text-white px-3 py-1 text-sm font-heading tracking-tight blob-2 shadow-[2px_2px_0_0_#2d2d2d]">
                Admin
              </span>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link to="/saved" className="bg-yellow border-[3px] border-ink p-4 shadow-[3px_3px_0_0_#2d2d2d] hover:shadow-[1px_1px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all blob-2 flex items-center gap-3 text-lg">
              <Icon icon="solar:star-bold" className="text-2xl" /> Saved Events
            </Link>
            {userProfile?.role === 'admin' && (
              <Link to="/admin" className="bg-white border-[3px] border-ink p-4 shadow-[3px_3px_0_0_#2d2d2d] hover:shadow-[1px_1px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all blob-3 flex items-center gap-3 text-lg">
                <Icon icon="solar:shield-check-linear" className="text-2xl text-blue" /> Admin Panel
              </Link>
            )}
          </div>

          {/* Notification Toggle */}
          <div className="border-t-[3px] border-dashed border-ink/20 pt-6 mb-6">
            <h3 className="font-heading text-xl tracking-tight mb-3">Notifications</h3>
            <label className="flex items-center gap-3 cursor-pointer text-lg">
              <input type="checkbox" className="w-5 h-5 accent-red" />
              Enable push notifications for deadline reminders
            </label>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full bg-red border-[3px] border-ink text-white text-xl font-heading tracking-tight px-6 py-3 shadow-[4px_4px_0_0_#2d2d2d] hover:shadow-[2px_2px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all blob-3 flex items-center justify-center gap-2"
          >
            <Icon icon="solar:logout-2-linear" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
