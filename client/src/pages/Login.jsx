import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { googleSignIn } = useAuth();
  const [error, setError] = useState('');

  async function handleGoogle() {
    setError('');
    try {
      googleSignIn();
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '') || 'Google sign-in failed');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
      {/* Decorative elements */}
      <div className="hidden md:block absolute top-20 left-20 text-tan -rotate-12 opacity-60">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <path d="M10,50 Q30,10 50,50 T90,50" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
      <div className="hidden md:block absolute bottom-20 right-20 text-yellow rotate-12 opacity-60">
        <svg width="80" height="80" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="8 8" />
        </svg>
      </div>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-10 h-10 bg-red border-[3px] border-ink flex items-center justify-center shadow-[3px_3px_0_0_#2d2d2d] group-hover:rotate-6 transition-transform blob-1">
          <Icon icon="solar:pen-linear" className="text-white text-xl" />
        </div>
        <span className="font-heading text-3xl tracking-tight text-ink">Trace</span>
      </Link>

      {/* Login Card */}
      <div
        className="bg-white border-[3px] border-ink p-8 shadow-[8px_8px_0_0_#2d2d2d] w-full max-w-md relative blob-1 animate-fade-in"
        style={{ backgroundImage: 'radial-gradient(#e5e0d8 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        {/* Pin */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-red border-[3px] border-ink rounded-full shadow-[2px_2px_0_0_#2d2d2d] z-10 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full opacity-60 absolute top-1 left-1" />
        </div>

        <h1 className="font-heading text-4xl tracking-tight text-ink text-center mb-2">
          Welcome to Trace
        </h1>
        <p className="text-ink/60 text-center mb-8 text-lg">
          Sign in to save events, join teams, and get deadline alerts.
        </p>

        {error && (
          <div className="bg-red/10 border-2 border-red text-red px-4 py-2 mb-4 text-sm blob-2">
            {error}
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogle}
          className="w-full bg-white border-[3px] border-ink text-ink text-xl font-heading tracking-tight px-6 py-4 shadow-[6px_6px_0_0_#2d2d2d] hover:-rotate-1 hover:shadow-[3px_3px_0_0_#2d2d2d] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all duration-100 flex items-center justify-center gap-3 blob-2"
        >
          <Icon icon="logos:google-icon" className="text-2xl" />
          Continue with Google
        </button>

        <p className="text-center mt-6 text-ink/40 text-sm">
          By signing in, you agree to our{' '}
          <Link to="/terms" className="text-blue hover:underline">Terms</Link> and{' '}
          <Link to="/privacy" className="text-blue hover:underline">Privacy Policy</Link>.
        </p>
      </div>

      {/* Back to landing */}
      <Link
        to="/"
        className="mt-8 text-ink/60 hover:text-ink flex items-center gap-2 text-lg transition-colors"
      >
        <Icon icon="solar:arrow-left-linear" /> Back to home
      </Link>
    </div>
  );
}
