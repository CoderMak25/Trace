import { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import FilterBar from '../components/FilterBar';
import SubmitEventModal from '../components/SubmitEventModal';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../context/AuthContext';
import { daysUntil, formatDate } from '../utils/dateHelpers';

// ─── Mini Calendar ─────────────────────────────────────
function MiniCalendar({ events }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const eventDates = useMemo(() => {
    const set = new Set();
    events.forEach((e) => {
      const d = new Date(e.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        set.add(d.getDate());
      }
    });
    return set;
  }, [events, month, year]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date();

  return (
    <div className="bg-white border-[3px] border-ink p-5 shadow-[4px_4px_0_0_#2d2d2d] blob-1">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="hover:text-red transition-colors">
          <Icon icon="solar:alt-arrow-left-linear" className="text-xl" />
        </button>
        <span className="font-heading text-xl tracking-tight">
          {currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} className="hover:text-red transition-colors">
          <Icon icon="solar:alt-arrow-right-linear" className="text-xl" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-ink/40 font-heading text-xs py-1">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const hasEvent = eventDates.has(day);
          return (
            <div
              key={day}
              className={`py-1.5 text-sm relative rounded-lg transition-colors cursor-default
                ${isToday ? 'bg-red text-white font-bold' : ''}
                ${hasEvent && !isToday ? 'bg-yellow font-bold' : ''}
                ${!isToday && !hasEvent ? 'hover:bg-tan/50' : ''}
              `}
            >
              {day}
              {hasEvent && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red" />}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t-2 border-dashed border-ink/10 text-xs text-ink/50">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red inline-block" /> Today</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow border border-ink/20 inline-block" /> Event day</span>
      </div>
    </div>
  );
}

// ─── Deadline Ticker ───────────────────────────────────
function DeadlineTicker({ events }) {
  const upcoming = events
    .filter((e) => e.registrationDeadline && daysUntil(e.registrationDeadline) >= 0 && daysUntil(e.registrationDeadline) <= 7)
    .sort((a, b) => daysUntil(a.registrationDeadline) - daysUntil(b.registrationDeadline))
    .slice(0, 5);

  if (upcoming.length === 0) return null;

  return (
    <div className="bg-red/5 border-[3px] border-red/30 border-dashed p-4 blob-2">
      <h3 className="font-heading text-lg tracking-tight text-red flex items-center gap-2 mb-3">
        <Icon icon="solar:alarm-linear" /> Closing Soon
      </h3>
      <div className="flex flex-col gap-2">
        {upcoming.map((e) => (
          <Link to={`/event/${e.slug}`} key={e._id} className="flex items-center justify-between text-sm hover:text-red transition-colors">
            <span className="truncate mr-2">{e.name}</span>
            <span className="text-red font-heading shrink-0">{daysUntil(e.registrationDeadline)}d left</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────
export default function Home() {
  const { events, loading, filters, setFilters } = useEvents();
  const { currentUser, userProfile } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid | list

  const savedEvents = events.filter((e) => userProfile?.savedEvents?.includes(e._id));
  const upcomingCount = events.filter((e) => daysUntil(e.date) >= 0).length;
  const onlineCount = events.filter((e) => e.mode === 'Online').length;
  const inPersonCount = events.filter((e) => e.mode === 'In-Person').length;

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <Navbar onSubmitClick={() => setModalOpen(true)} />

      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 flex-1">
        {/* ── Welcome Bar ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl tracking-tight text-ink">
              Hey, {userProfile?.displayName?.split(' ')[0] || 'there'}!{' '}
              <span className="inline-block animate-[wave_1.5s_ease-in-out_infinite] origin-[70%_70%]">👋</span>
            </h1>
            <p className="text-ink/60 text-lg mt-1">Here's what's happening in the tech community.</p>
          </div>
          <div className="flex items-center gap-3">
            {userProfile?.role === 'admin' && (
              <Link to="/admin" className="bg-blue border-[3px] border-ink text-white px-4 py-2 shadow-[3px_3px_0_0_#2d2d2d] hover:shadow-[1px_1px_0_0_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all blob-2 flex items-center gap-2 text-sm">
                <Icon icon="solar:shield-check-linear" /> Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { value: upcomingCount, label: 'Upcoming', icon: 'solar:calendar-linear', color: 'red', rotate: 'rotate-1' },
            { value: onlineCount, label: 'Online', icon: 'solar:monitor-linear', color: 'blue', rotate: '-rotate-1' },
            { value: inPersonCount, label: 'In-Person', icon: 'solar:map-point-linear', color: 'red', rotate: 'rotate-2' },
            { value: savedEvents.length, label: 'Saved', icon: 'solar:star-bold', color: 'blue', rotate: '-rotate-2' },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`bg-yellow border-[3px] border-ink p-4 flex items-center gap-3 shadow-[3px_3px_0_0_#2d2d2d] ${s.rotate} hover:${i%2===0?'-rotate-1':'rotate-1'} transition-transform ${['blob-1','blob-2','blob-3','blob-4'][i]} relative`}
            >
              <div className={`w-10 h-10 bg-${s.color} border-2 border-ink rounded-full flex items-center justify-center shadow-[2px_2px_0_0_#2d2d2d] shrink-0`}>
                <Icon icon={s.icon} className="text-white text-lg" />
              </div>
              <div>
                <span className="text-3xl font-heading tracking-tight text-ink leading-none">{s.value}</span>
                <span className="block text-xs text-ink/60 uppercase tracking-widest">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Grid: Content + Sidebar ── */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left: Events ── */}
          <div className="flex-1 min-w-0">
            {/* Filter Bar */}
            <FilterBar filters={filters} setFilters={setFilters} />

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="font-heading text-xl tracking-tight text-ink/70">
                {events.length} event{events.length !== 1 ? 's' : ''} found
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 border-2 border-ink transition-colors ${viewMode === 'grid' ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-tan'}`}
                  style={{ borderRadius: '8px' }}
                >
                  <Icon icon="solar:widget-linear" className="text-lg" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 border-2 border-ink transition-colors ${viewMode === 'list' ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-tan'}`}
                  style={{ borderRadius: '8px' }}
                >
                  <Icon icon="solar:list-linear" className="text-lg" />
                </button>
              </div>
            </div>

            {/* Events */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="font-heading text-2xl tracking-tight text-ink/60 animate-pulse flex items-center gap-3">
                  <Icon icon="solar:refresh-linear" className="animate-spin" /> Loading events...
                </div>
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center py-20 bg-white border-[3px] border-ink/20 border-dashed blob-1">
                <Icon icon="solar:inbox-linear" className="text-6xl text-ink/20 mb-4" />
                <p className="font-heading text-2xl tracking-tight text-ink/50">No events found</p>
                <p className="text-ink/40 mt-2">Try adjusting your filters</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {events.map((event, i) => (
                  <EventCard key={event._id} event={event} index={i} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {events.map((event) => (
                  <Link
                    key={event._id}
                    to={`/event/${event.slug}`}
                    className="bg-white border-[3px] border-ink p-4 shadow-[3px_3px_0_0_#2d2d2d] flex items-center gap-4 hover:shadow-[5px_5px_0_0_#2d2d2d] hover:-translate-y-0.5 transition-all blob-1 group"
                  >
                    <div className={`w-12 h-12 border-2 border-ink rounded-full flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#2d2d2d] ${event.category?.includes('Hackathon') ? 'bg-red text-white' : event.category?.includes('Workshop') ? 'bg-blue text-white' : 'bg-yellow text-ink'}`}>
                      <Icon icon={event.category?.includes('Hackathon') ? 'solar:code-linear' : event.category?.includes('Workshop') ? 'solar:notebook-linear' : 'solar:cup-star-linear'} className="text-xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-xl tracking-tight truncate group-hover:text-red transition-colors">{event.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-ink/60 mt-0.5">
                        <span>{event.organizer}</span>
                        <span>•</span>
                        <span>{formatDate(event.date)}</span>
                        <span>•</span>
                        <span>{event.city}</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      {event.prizePool && event.prizePool !== 'Free' && (
                        <span className="bg-yellow border-2 border-ink px-2 py-0.5 text-xs font-heading shadow-[1px_1px_0_0_#2d2d2d] blob-2">{event.prizePool}</span>
                      )}
                      <span className={`border-2 border-ink px-2 py-0.5 text-xs font-heading blob-3 ${event.mode === 'Online' ? 'bg-blue/10' : 'bg-tan'}`}>{event.mode}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
            {/* Calendar */}
            <MiniCalendar events={events} />

            {/* Deadlines */}
            <DeadlineTicker events={events} />

            {/* Saved Events Quick View */}
            <div className="bg-white border-[3px] border-ink p-5 shadow-[4px_4px_0_0_#2d2d2d] blob-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading text-xl tracking-tight flex items-center gap-2">
                  <Icon icon="solar:star-bold" className="text-yellow drop-shadow-[1px_1px_0_#2d2d2d33]" /> Saved
                </h3>
                <Link to="/saved" className="text-blue text-sm hover:underline">View all</Link>
              </div>
              {savedEvents.length === 0 ? (
                <p className="text-ink/40 text-sm">Star events to save them here!</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {savedEvents.slice(0, 4).map((e) => (
                    <Link
                      key={e._id}
                      to={`/event/${e.slug}`}
                      className="flex items-center gap-2 text-sm hover:text-red transition-colors p-1 -mx-1 rounded-lg hover:bg-yellow/30"
                    >
                      <Icon icon="solar:star-bold" className="text-yellow text-xs shrink-0" />
                      <span className="truncate">{e.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-tan/50 border-[3px] border-ink/20 border-dashed p-5 blob-2">
              <h3 className="font-heading text-lg tracking-tight mb-3 text-ink/70">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2 text-sm text-ink/70 hover:text-red transition-colors p-2 -mx-2 rounded-lg hover:bg-white/50"
                >
                  <Icon icon="solar:add-circle-linear" className="text-lg" /> Submit new event
                </button>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm text-ink/70 hover:text-blue transition-colors p-2 -mx-2 rounded-lg hover:bg-white/50"
                >
                  <Icon icon="solar:user-linear" className="text-lg" /> Edit profile
                </Link>
                <Link
                  to="/teams"
                  className="flex items-center gap-2 text-sm text-ink/70 hover:text-blue transition-colors p-2 -mx-2 rounded-lg hover:bg-white/50"
                >
                  <Icon icon="solar:users-group-rounded-linear" className="text-lg" /> My Teams
                </Link>
                <button
                  onClick={() => setFilters({ search: '', mode: 'Online', category: '', city: '' })}
                  className="flex items-center gap-2 text-sm text-ink/70 hover:text-blue transition-colors p-2 -mx-2 rounded-lg hover:bg-white/50"
                >
                  <Icon icon="solar:monitor-linear" className="text-lg" /> Filter online only
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full mt-12 pt-8 pb-6 text-center px-6 border-t-[3px] border-dashed border-ink/10">
        <p className="text-sm text-ink/40 flex items-center justify-center gap-2">
          <Icon icon="solar:pen-linear" /> Trace — Built with <Icon icon="solar:heart-linear" className="text-red" /> by camelCase Studio
        </p>
      </footer>

      <SubmitEventModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
