import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onSubmitClick }) {
  const { currentUser, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="w-full max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 relative z-20">
      <Link to={currentUser ? '/dashboard' : '/'} className="flex items-center gap-2 group">
        <div
          className="w-10 h-10 bg-red border-[3px] border-ink flex items-center justify-center shadow-[3px_3px_0_0_#2d2d2d] group-hover:rotate-6 transition-transform blob-1"
        >
          <Icon icon="solar:pen-linear" className="text-white text-xl" />
        </div>
        <div className="flex flex-col">
          <span className="font-heading text-3xl tracking-tight leading-none text-ink">Trace</span>
          <span className="text-xs text-ink/70 -mt-1">Track every event.</span>
        </div>
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-8 text-lg">
        {['Hackathons', 'Workshops', 'Tech Fests'].map((label, i) => (
          <button
            key={label}
            onClick={() => navigate('/dashboard')}
            className={`nav-link hover:text-${i % 2 === 0 ? 'red' : 'blue'} transition-colors`}
          >
            {label}
            <svg viewBox="0 0 100 20" preserveAspectRatio="none">
              <path
                d="M0,10 Q25,20 50,10 T100,10"
                fill="none"
                stroke={i % 2 === 0 ? '#ff4d4d' : '#2d5da1'}
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        {currentUser ? (
          <>
            <Link
              to="/teams"
              className="bg-yellow border-[3px] border-ink text-ink text-lg px-6 py-2 shadow-[4px_4px_0_0_#2d2d2d] hover:bg-blue hover:text-white hover:shadow-[2px_2px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 flex items-center gap-2 group blob-3"
            >
              <Icon icon="solar:users-group-rounded-linear" className="text-xl group-hover:-rotate-12 transition-transform duration-300" />
              Teams
            </Link>
            <button
              onClick={onSubmitClick}
              className="bg-white border-[3px] border-ink text-ink text-lg px-6 py-2 shadow-[4px_4px_0_0_#2d2d2d] hover:bg-red hover:text-white hover:shadow-[2px_2px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 flex items-center gap-2 group blob-2"
            >
              <Icon icon="solar:add-circle-linear" className="text-xl group-hover:rotate-90 transition-transform duration-300" />
              Submit Event
            </button>
            <div className="relative group">
              <button className="w-10 h-10 bg-tan border-[3px] border-ink rounded-full shadow-[2px_2px_0_0_#2d2d2d] flex items-center justify-center hover:bg-blue hover:text-white transition-colors overflow-hidden">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Icon icon="solar:user-linear" className="text-xl" />
                )}
              </button>
              <div className="absolute right-0 top-full mt-2 bg-white border-[3px] border-ink shadow-[4px_4px_0_0_#2d2d2d] py-2 min-w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 blob-3">
                <Link to="/profile" className="block px-4 py-2 hover:bg-yellow transition-colors">Profile</Link>
                <Link to="/saved" className="block px-4 py-2 hover:bg-yellow transition-colors">Saved Events</Link>
                <Link to="/teams" className="block px-4 py-2 hover:bg-yellow transition-colors">Teams</Link>
                <button onClick={logout} className="block w-full text-left px-4 py-2 hover:bg-red hover:text-white transition-colors">
                  Logout
                </button>
              </div>
            </div>
          </>
        ) : (
          <Link
            to="/login"
            className="bg-red border-[3px] border-ink text-white text-lg px-6 py-2 shadow-[4px_4px_0_0_#2d2d2d] hover:shadow-[2px_2px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 flex items-center gap-2 blob-1"
          >
            <Icon icon="solar:login-2-linear" className="text-xl" />
            Sign In
          </Link>
        )}

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-10 h-10 border-[3px] border-ink flex items-center justify-center shadow-[2px_2px_0_0_#2d2d2d] blob-1"
        >
          <Icon icon={mobileOpen ? 'solar:close-circle-linear' : 'solar:hamburger-menu-linear'} className="text-2xl" />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b-[3px] border-ink shadow-[0_4px_0_0_#2d2d2d] px-6 py-4 flex flex-col gap-4 text-lg z-50 animate-fade-in">
          {['Hackathons', 'Workshops', 'Tech Fests'].map((label) => (
            <button key={label} onClick={() => { navigate('/dashboard'); setMobileOpen(false); }} className="text-left hover:text-red transition-colors">
              {label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
