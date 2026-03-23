import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { googleSignIn, login, signup } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEmailAuth(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }

      if ('Notification' in window && Notification.permission === 'default') {
        try { await Notification.requestPermission(); } catch (e) {}
      }

      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '') || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    try {
      googleSignIn();
      // Redirect and notification prompt are now handled in AuthContext onSuccess
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
          {isSignup ? 'Join the Board' : 'Welcome Back'}
        </h1>
        <p className="text-ink/60 text-center mb-6 text-lg">
          {isSignup ? 'Create your account to start tracking events' : 'Sign in to track your favorite events'}
        </p>

        {error && (
          <div className="bg-red/10 border-2 border-red text-red px-4 py-2 mb-4 text-sm blob-2">
            {error}
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogle}
          className="w-full bg-white border-[3px] border-ink text-ink text-lg px-6 py-3 shadow-[4px_4px_0_0_#2d2d2d] hover:shadow-[2px_2px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 flex items-center justify-center gap-3 mb-4 blob-2"
        >
          <Icon icon="logos:google-icon" className="text-xl" />
          Continue with Google
        </button>



        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 border-t-2 border-dashed border-ink/20" />
          <span className="text-ink/50 text-sm font-heading tracking-tight">or use email</span>
          <div className="flex-1 border-t-2 border-dashed border-ink/20" />
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white border-[3px] border-ink p-3 text-lg focus:outline-none focus:border-blue focus:ring-4 focus:ring-blue/10 shadow-[2px_2px_0_0_#2d2d2d] blob-2 placeholder:text-ink/40"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-white border-[3px] border-ink p-3 text-lg focus:outline-none focus:border-blue focus:ring-4 focus:ring-blue/10 shadow-[2px_2px_0_0_#2d2d2d] blob-3 placeholder:text-ink/40"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-red border-[3px] border-ink text-white text-xl font-heading tracking-tight px-6 py-3 shadow-[6px_6px_0_0_#2d2d2d] hover:-rotate-1 hover:shadow-[3px_3px_0_0_#2d2d2d] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all duration-100 blob-1 disabled:opacity-60"
          >
            {loading ? 'Loading...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center mt-6 text-ink/70 text-lg">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignup(!isSignup); setError(''); }}
            className="text-blue font-heading tracking-tight hover:underline"
          >
            {isSignup ? 'Sign In' : 'Sign Up'}
          </button>
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
