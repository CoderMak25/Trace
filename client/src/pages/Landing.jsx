import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

const TICKER_EVENTS = [
  'Mumbai Hack 2024 🚀',
  'Intro to Rust — FOSS India 🦀',
  "Synapse '24 — NIT Surat ⚡",
  'AI/ML Bootcamp — Google DSC 🤖',
  'HackBengaluru — Web3 Track 🔗',
  'DevOps Day Delhi ☁️',
  'CodeFest IIT Kanpur 💻',
];

function TickerMarquee() {
  const doubled = [...TICKER_EVENTS, ...TICKER_EVENTS];
  return (
    <div className="overflow-hidden whitespace-nowrap border-y-[3px] border-ink py-3 bg-yellow relative">
      <div className="inline-flex animate-[marquee_30s_linear_infinite]">
        {doubled.map((e, i) => (
          <span key={i} className="mx-8 text-lg font-heading tracking-tight text-ink">
            {e}
            <span className="mx-8 text-ink/30">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const { currentUser } = useAuth();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* ───── Navbar ───── */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between relative z-30">
        <div className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-red border-[3px] border-ink flex items-center justify-center shadow-[3px_3px_0_0_#2d2d2d] group-hover:rotate-12 transition-transform blob-1">
            <Icon icon="solar:pen-linear" className="text-white text-xl" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-3xl tracking-tight leading-none text-ink">Trace</span>
            <span className="text-xs text-ink/70 -mt-1">Track every event.</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="#features" className="hidden md:block text-ink/70 hover:text-ink text-lg transition-colors">Features</a>
          <a href="#how" className="hidden md:block text-ink/70 hover:text-ink text-lg transition-colors">How It Works</a>
          <Link
            to={currentUser ? '/dashboard' : '/login'}
            className="bg-red border-[3px] border-ink text-white text-lg px-6 py-2 shadow-[4px_4px_0_0_#2d2d2d] hover:shadow-[2px_2px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 flex items-center gap-2 blob-1"
          >
            <Icon icon="solar:login-2-linear" className="text-xl" />
            {currentUser ? 'Dashboard' : 'Get Started'}
          </Link>
        </div>
      </header>

      {/* ───── Hero ───── */}
      <section className="relative w-full max-w-6xl mx-auto px-6 pt-8 pb-20 md:pt-16 md:pb-32 z-10">
        {/* Floating doodle elements that follow mouse slightly */}
        <div
          className="hidden lg:block absolute top-0 left-8 -z-10 opacity-40 transition-transform duration-[2000ms]"
          style={{ transform: `translate(${mousePos.x * 0.01}px, ${mousePos.y * 0.01}px) rotate(-12deg)` }}
        >
          <svg width="140" height="140" viewBox="0 0 100 100">
            <path d="M10,50 Q30,10 50,50 T90,50" fill="none" stroke="#e5e0d8" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
        <div
          className="hidden lg:block absolute top-16 right-12 -z-10 opacity-30 transition-transform duration-[2000ms]"
          style={{ transform: `translate(${-mousePos.x * 0.015}px, ${mousePos.y * 0.012}px) rotate(8deg)` }}
        >
          <svg width="100" height="100" viewBox="0 0 100 100">
            <polygon points="50,5 61,40 98,40 68,62 79,96 50,75 21,96 32,62 2,40 39,40" fill="none" stroke="#ff4d4d" strokeWidth="3" />
          </svg>
        </div>
        <div
          className="hidden lg:block absolute bottom-10 left-1/4 -z-10 opacity-25 transition-transform duration-[2000ms]"
          style={{ transform: `translate(${mousePos.x * 0.008}px, ${-mousePos.y * 0.01}px)` }}
        >
          <svg width="80" height="80" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#fff9c4" strokeWidth="4" strokeDasharray="8 8" />
          </svg>
        </div>

        <div className="flex flex-col items-center text-center">
          {/* Tagline pill */}
          <div className="bg-yellow border-2 border-ink px-4 py-1 text-sm font-heading tracking-tight shadow-[2px_2px_0_0_#2d2d2d] mb-6 -rotate-2 blob-2 flex items-center gap-2">
            <Icon icon="solar:fire-bold" className="text-red" /> 142+ events live now
          </div>

          <h1 className="font-heading text-5xl sm:text-6xl md:text-8xl tracking-tight text-ink max-w-4xl leading-[1.05] relative z-10 mb-4">
            Your{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-red -rotate-2 inline-block">college</span>
              <svg className="absolute -bottom-2 left-0 w-full h-4 z-0 text-red/30" viewBox="0 0 200 20" preserveAspectRatio="none">
                <path d="M0,15 Q50,0 100,15 T200,12" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </span>{' '}
            event
            <br />
            <span className="relative inline-block mt-2">
              corkboard.
              <svg className="absolute -bottom-4 left-0 w-full h-8 z-0 text-blue animate-squiggle" viewBox="0 0 400 30" preserveAspectRatio="none">
                <path d="M5,20 Q50,5 100,20 T200,20 T300,20 T395,15" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-ink/70 max-w-2xl mt-4 mb-10 leading-relaxed">
            Pin hackathons, tech fests & workshops. Get deadline alerts. Built by students, for students across India.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-5 relative">
            {/* Hand-drawn arrow */}
            <div className="hidden md:block absolute -left-28 -top-6 text-ink/60">
              <svg width="80" height="60" viewBox="0 0 100 100">
                <path d="M10,90 Q40,20 90,40" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" />
                <path d="M70,25 L95,43 L75,60" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <Link
              to={currentUser ? '/dashboard' : '/login'}
              className="bg-red border-[3px] border-ink text-white text-xl md:text-2xl px-10 py-5 shadow-[6px_6px_0_0_#2d2d2d] hover:-rotate-2 hover:shadow-[3px_3px_0_0_#2d2d2d] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all duration-100 flex items-center gap-3 blob-3"
            >
              <Icon icon="solar:magnifer-linear" /> Explore Events
            </Link>
            <Link
              to="/login"
              className="bg-white border-[3px] border-ink border-dashed text-ink text-xl px-10 py-5 shadow-[4px_4px_0_0_#2d2d2d] hover:bg-blue hover:text-white hover:border-solid hover:shadow-[2px_2px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 rotate-1 blob-2 flex items-center gap-2"
            >
              <Icon icon="solar:pen-linear" /> Pin an Event
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Event Ticker Marquee ───── */}
      <TickerMarquee />

      {/* ───── Bento Grid Features ───── */}
      <section id="features" className="w-full max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-heading text-4xl md:text-5xl tracking-tight text-ink text-center mb-4">
          Everything you need,{' '}
          <span className="relative inline-block">
            pinned.
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-red/40" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0,5 Q25,0 50,5 T100,5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className="text-xl text-ink/60 text-center max-w-xl mx-auto mb-12">
          Stop scrolling through 50 WhatsApp groups. We got you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Big card — Discover */}
          <div className="md:col-span-4 bg-white border-[3px] border-ink p-8 shadow-[6px_6px_0_0_#2d2d2d] blob-1 relative overflow-hidden group hover:-rotate-[0.5deg] transition-transform">
            <div className="absolute -top-3 left-8 w-28 h-7 bg-tan/80 border border-dashed border-ink/30 rotate-2 backdrop-blur-[2px]" />
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-red border-[3px] border-ink rounded-full flex items-center justify-center shadow-[3px_3px_0_0_#2d2d2d] shrink-0">
                <Icon icon="solar:magnifer-linear" className="text-white text-2xl" />
              </div>
              <div>
                <h3 className="font-heading text-3xl tracking-tight mb-2">Discover Events</h3>
                <p className="text-ink/70 text-lg leading-relaxed">
                  Browse hackathons, workshops, tech fests — filtered by city, mode, category, or deadline. Search across 142+ curated events from colleges across India.
                </p>
              </div>
            </div>
            {/* Mini event cards preview */}
            <div className="flex gap-3 mt-6 overflow-hidden">
              {['Mumbai Hack', 'Intro to Rust', "Synapse '24"].map((name, i) => (
                <div key={name} className={`bg-paper border-2 border-ink p-3 text-sm shadow-[2px_2px_0_0_#2d2d2d] ${['blob-1','blob-2','blob-3'][i]} ${['-rotate-1','rotate-2','-rotate-2'][i]} shrink-0`}>
                  <span className="font-heading text-base">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Small — Bookmark */}
          <div className="md:col-span-2 bg-yellow border-[3px] border-ink p-6 shadow-[6px_6px_0_0_#2d2d2d] blob-2 flex flex-col items-center justify-center text-center hover:rotate-1 transition-transform relative">
            <div className="pin bg-red" />
            <Icon icon="solar:star-bold" className="text-5xl text-ink mb-3 mt-4 drop-shadow-[2px_2px_0_#2d2d2d33]" />
            <h3 className="font-heading text-2xl tracking-tight mb-1">Bookmark & Save</h3>
            <p className="text-ink/70">Save events. Access them later. Sync across devices.</p>
          </div>

          {/* Small — Notifications */}
          <div className="md:col-span-2 bg-white border-[3px] border-ink p-6 shadow-[6px_6px_0_0_#2d2d2d] blob-3 flex flex-col items-center justify-center text-center hover:-rotate-1 transition-transform relative">
            <div className="pin bg-blue" />
            <Icon icon="solar:bell-bing-linear" className="text-5xl text-red mb-3 mt-4" />
            <h3 className="font-heading text-2xl tracking-tight mb-1">Deadline Alerts</h3>
            <p className="text-ink/70">Push notification 3 days before a deadline. Never miss a registration.</p>
          </div>

          {/* Big card — Community */}
          <div className="md:col-span-4 bg-white border-[3px] border-ink p-8 shadow-[6px_6px_0_0_#2d2d2d] blob-1 relative overflow-hidden hover:rotate-[0.5deg] transition-transform">
            <div className="absolute -top-3 right-8 w-24 h-7 bg-tan/80 border border-dashed border-ink/30 -rotate-3 backdrop-blur-[2px]" />
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue border-[3px] border-ink rounded-full flex items-center justify-center shadow-[3px_3px_0_0_#2d2d2d] shrink-0">
                <Icon icon="solar:users-group-rounded-linear" className="text-white text-2xl" />
              </div>
              <div>
                <h3 className="font-heading text-3xl tracking-tight mb-2">Collaborative Tracking</h3>
                <p className="text-ink/70 text-lg leading-relaxed">
                  Add your own events, build your tech schedule, and monitor deadlines. The ultimate personal and team tracker for every student opportunity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── How It Works ───── */}
      <section id="how" className="w-full max-w-5xl mx-auto px-6 py-20">
        <h2 className="font-heading text-4xl md:text-5xl tracking-tight text-ink text-center mb-16">
          Three steps. That&apos;s it.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-[3px] border-t-[3px] border-dashed border-ink/20" />

          {[
            { step: '01', icon: 'solar:login-2-linear', title: 'Sign Up', desc: 'One-click Google sign in or use email. Takes 5 seconds.', color: 'red', rotate: 'rotate-2' },
            { step: '02', icon: 'solar:magnifer-linear', title: 'Explore & Save', desc: 'Filter by city, mode, or topic. Star the events you love.', color: 'blue', rotate: '-rotate-1' },
            { step: '03', icon: 'solar:bell-bing-linear', title: 'Get Reminded', desc: "We'll ping you 3 days before deadlines. You focus on building.", color: 'red', rotate: 'rotate-1' },
          ].map((s, i) => (
            <div key={s.step} className={`flex flex-col items-center text-center relative ${s.rotate} hover:${i % 2 === 0 ? '-rotate-1' : 'rotate-2'} transition-transform`}>
              <div className={`w-24 h-24 bg-${s.color} border-[3px] border-ink rounded-full flex flex-col items-center justify-center shadow-[4px_4px_0_0_#2d2d2d] mb-6 relative z-10`}>
                <Icon icon={s.icon} className="text-white text-3xl" />
              </div>
              <span className="font-heading text-5xl text-ink/10 absolute -top-2">{s.step}</span>
              <h3 className="font-heading text-2xl tracking-tight mb-2">{s.title}</h3>
              <p className="text-ink/60 text-lg max-w-xs">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Social Proof ───── */}
      <section className="w-full max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '142+', label: 'Events Listed', pinColor: 'bg-red', rotate: 'rotate-1' },
            { value: '50+', label: 'Colleges', pinColor: 'bg-blue', rotate: '-rotate-2' },
            { value: '12K+', label: 'Students', pinColor: 'bg-red', rotate: 'rotate-2' },
            { value: '24/7', label: 'Updated', pinColor: 'bg-blue', rotate: '-rotate-1' },
          ].map((s, i) => (
            <div key={s.label} className={`bg-yellow border-[3px] border-ink p-5 flex flex-col items-center justify-center shadow-[4px_4px_0_0_#2d2d2d] relative ${s.rotate} hover:${i%2===0?'-rotate-1':'rotate-1'} transition-transform ${['blob-1','blob-2','blob-3','blob-4'][i]}`}>
              <div className={`pin ${s.pinColor}`} />
              <span className="text-4xl md:text-5xl font-heading tracking-tight text-ink mt-3">{s.value}</span>
              <span className="text-base text-ink/80 uppercase tracking-widest mt-1 border-t-2 border-dashed border-ink/20 w-full text-center pt-1">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="w-full max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-red border-[3px] border-ink p-10 md:p-16 shadow-[8px_8px_0_0_#2d2d2d] blob-1 text-white text-center relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-[3px] border-ink rounded-full shadow-[2px_2px_0_0_#2d2d2d] z-10" />
          <h2 className="font-heading text-4xl md:text-5xl tracking-tight mb-4">Ready to never miss an event?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-lg mx-auto">Join thousands of students already using Trace to stay on top of college tech events.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-3 bg-white border-[3px] border-ink text-ink text-xl md:text-2xl px-10 py-5 shadow-[6px_6px_0_0_#2d2d2d] hover:-rotate-2 hover:shadow-[3px_3px_0_0_#2d2d2d] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all duration-100 blob-3"
          >
            <Icon icon="solar:rocket-2-linear" /> Get Started — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="w-full mt-auto relative z-10 pt-8 pb-8 text-center px-6">
        <div className="max-w-4xl mx-auto border-t-[3px] border-dashed border-ink/30 pt-8 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 opacity-80">
            <Icon icon="solar:pen-linear" className="text-2xl" />
            <span className="font-heading text-3xl tracking-tight">Trace</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-lg font-heading tracking-tight mb-6">
            {['About', 'Guidelines', 'API', 'Twitter'].map((label, i) => (
              <a key={label} href="#" className={`relative group hover:text-${i % 2 === 0 ? 'blue' : 'red'}`}>
                {label}
                <span className={`absolute left-0 top-1/2 w-full h-[2px] bg-${i % 2 === 0 ? 'blue' : 'red'} scale-x-0 group-hover:scale-x-100 transition-transform origin-left`} />
              </a>
            ))}
          </div>
          <p className="text-sm text-ink/50 flex items-center gap-2">
            Built with <Icon icon="solar:heart-linear" className="text-red" /> by camelCase Studio
          </p>
        </div>
      </footer>
    </div>
  );
}
