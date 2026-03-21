import { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { formatDateRange } from '../utils/dateHelpers';

// Color coding by category
const CAT_COLORS = {
  Hackathon: { bg: 'bg-red/20', dot: 'bg-red', border: 'border-red/30', text: 'text-red' },
  Workshop: { bg: 'bg-blue/15', dot: 'bg-blue', border: 'border-blue/30', text: 'text-blue' },
  'Tech Fest': { bg: 'bg-yellow', dot: 'bg-amber-500', border: 'border-amber-400', text: 'text-amber-600' },
};
const TEAM_COLOR = { bg: 'bg-purple-100', dot: 'bg-purple-500', border: 'border-purple-300', text: 'text-purple-600' };
const DEFAULT_COLOR = { bg: 'bg-yellow/50', dot: 'bg-ink/40', border: 'border-ink/20', text: 'text-ink/60' };

function getEventColor(event) {
  if (event.team || event.teamName) return TEAM_COLOR;
  const cat = Array.isArray(event.category) ? event.category[0] : event.category;
  return CAT_COLORS[cat] || DEFAULT_COLOR;
}

export default function MiniCalendar({ events, title = 'Calendar' }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expanded, setExpanded] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  // Map day → list of events on that day (including all days in range for multi-day events)
  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      const start = new Date(e.date);
      const end = e.endDate ? new Date(e.endDate) : start;

      // Iterate through each day from start to end
      const cursor = new Date(start);
      while (cursor <= end) {
        if (cursor.getMonth() === month && cursor.getFullYear() === year) {
          const day = cursor.getDate();
          if (!map[day]) map[day] = [];
          // Avoid duplicate entries for same event on same day
          if (!map[day].find((x) => x._id === e._id)) {
            map[day].push(e);
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      // Also add to registrationDeadline day if it exists
      if (e.registrationDeadline) {
        const rDate = new Date(e.registrationDeadline);
        if (rDate.getMonth() === month && rDate.getFullYear() === year) {
          const rDay = rDate.getDate();
          if (!map[rDay]) map[rDay] = [];
          if (!map[rDay].find((x) => x._id === e._id)) {
            map[rDay].push(e);
          }
        }
      }
    });
    return map;
  }, [events, month, year]);

  const eventDates = useMemo(() => new Set(Object.keys(eventsByDay).map(Number)), [eventsByDay]);

  const prevMonth = () => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDay(null); };
  const nextMonth = () => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDay(null); };
  const today = new Date();

  // Events for the selected day
  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] || []) : [];

  // Get unique dot colors for a day's events (max 3)
  function getDayDots(day) {
    const dayEvents = eventsByDay[day] || [];
    const seen = new Set();
    const dots = [];
    for (const ev of dayEvents) {
      const color = getEventColor(ev);
      if (!seen.has(color.dot)) {
        seen.add(color.dot);
        dots.push(color.dot);
        if (dots.length >= 3) break;
      }
    }
    return dots;
  }

  // Check if a day is a start/end/deadline boundary
  function getDayRole(day) {
    const dayEvents = eventsByDay[day] || [];
    let isStart = false, isEnd = false, isDeadline = false;
    for (const ev of dayEvents) {
      const startD = new Date(ev.date);
      const endD = ev.endDate ? new Date(ev.endDate) : startD;
      
      const isDayStart = startD.getDate() === day && startD.getMonth() === month && startD.getFullYear() === year;
      const isDayEnd = endD.getDate() === day && endD.getMonth() === month && endD.getFullYear() === year;

      if (ev.source === 'unstop') {
        // For Unstop, we only want the date shown as an End point
        if (isDayEnd) isEnd = true;
      } else {
        if (isDayStart) isStart = true;
        if (isDayEnd && endD.getTime() !== startD.getTime()) isEnd = true;
      }

      if (ev.registrationDeadline) {
        const rD = new Date(ev.registrationDeadline);
        if (rD.getDate() === day && rD.getMonth() === month && rD.getFullYear() === year) isDeadline = true;
      }
    }
    return { isStart, isEnd, isDeadline };
  }

  // ── Mini (sidebar) view ──
  if (!expanded) {
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

        {/* Mini grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
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
            const isSelected = selectedDay === day;
            const dots = getDayDots(day);
            const { isStart, isEnd, isDeadline } = getDayRole(day);
            return (
              <div
                key={day}
                onClick={() => hasEvent && setSelectedDay(isSelected ? null : day)}
                className={`relative rounded-lg transition-all cursor-default py-1.5 text-sm
                  ${isToday && !isSelected ? 'bg-red text-white font-bold' : ''}
                  ${isSelected ? 'bg-blue text-white font-bold ring-2 ring-blue/30' : ''}
                  ${hasEvent && !isToday && !isSelected ? 'bg-yellow/60 font-bold cursor-pointer hover:ring-2 hover:ring-ink/20' : ''}
                  ${!isToday && !hasEvent && !isSelected ? 'hover:bg-tan/50' : ''}
                `}
              >
                {/* Start/End markers */}
                {isStart && !isSelected && !isToday && (
                  <div className="absolute top-0 left-0 w-0 h-0 border-t-[8px] border-t-green-500 border-r-[8px] border-r-transparent rounded-tl-lg" />
                )}
                {isEnd && !isSelected && !isToday && (
                  <div className="absolute top-0 right-0 w-0 h-0 border-t-[8px] border-t-orange-500 border-l-[8px] border-l-transparent rounded-tr-lg" />
                )}
                {isDeadline && !isSelected && !isToday && (
                  <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[8px] border-b-blue-400 border-l-[8px] border-l-transparent rounded-br-lg" />
                )}
                {day}
                {hasEvent && dots.length > 0 && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dots.map((dotColor, j) => (
                      <div key={j} className={`rounded-full ${dotColor} w-1 h-1`} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend + Expand */}
        <div className="flex flex-col gap-2 mt-3 pt-3 border-t-2 border-dashed border-ink/10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/50">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red inline-block" /> Today</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue inline-block" /> Personal</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Team</span>
            <span className="flex items-center gap-1">
              <span className="w-0 h-0 border-t-[6px] border-t-green-500 border-r-[6px] border-r-transparent inline-block" /> Start
            </span>
            <span className="flex items-center gap-1">
              <span className="w-0 h-0 border-t-[6px] border-t-orange-500 border-l-[6px] border-l-transparent inline-block" /> End
            </span>
            <span className="flex items-center gap-1">
              <span className="w-0 h-0 border-b-[6px] border-b-blue-400 border-l-[6px] border-l-transparent inline-block" /> Reg Ends
            </span>
          </div>
          <button
            onClick={() => setExpanded(true)}
            className="text-ink/40 hover:text-blue transition-colors flex items-center gap-1 text-xs font-heading self-end"
            title="Expand Calendar"
          >
            <Icon icon="solar:maximize-linear" className="text-base" /> Expand
          </button>
        </div>

        {/* Quick peek at selected day events */}
        {selectedDay && selectedEvents.length > 0 && (
          <div className="mt-3 pt-3 border-t-2 border-dashed border-ink/10 animate-fade-in">
            <p className="font-heading text-sm text-ink/60 mb-2">
              {selectedDay} {currentDate.toLocaleDateString('en-IN', { month: 'short' })} — {selectedEvents.length} event{selectedEvents.length > 1 ? 's' : ''}
            </p>
            {selectedEvents.map((ev) => {
              const color = getEventColor(ev);
              return (
                <div key={ev._id} className="text-sm text-ink/80 flex items-center gap-2 py-1">
                  <span className={`w-2 h-2 rounded-full ${color.dot} shrink-0`} />
                  <span className="truncate">
                    {ev.source === 'unstop' ? <span className="text-[10px] font-heading text-red mr-1 tracking-tighter uppercase opacity-70">Ends:</span> : ''}
                    {ev.name}
                  </span>
                  {ev.teamName && <span className="text-xs text-purple-500 ml-auto shrink-0">({ev.teamName})</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Expanded (full-screen modal) view ──
  return (
    <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-transparent w-full h-full">
      <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setExpanded(false)} />
      <div
        className="relative bg-white border-[3px] border-ink shadow-[8px_8px_0_0_#2d2d2d] w-full max-w-4xl mx-4 blob-1 animate-fade-in z-10 max-h-[90vh] flex flex-col"
        style={{ backgroundImage: 'radial-gradient(#e5e0d8 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        {/* Pin */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-red border-[3px] border-ink rounded-full shadow-[2px_2px_0_0_#2d2d2d] z-10 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full opacity-60 absolute top-1 left-1" />
        </div>

        {/* Close */}
        <button onClick={() => setExpanded(false)} className="absolute top-3 right-3 text-ink hover:text-red transition-colors bg-white rounded-full z-20 p-1">
          <Icon icon="solar:close-circle-linear" className="text-2xl" />
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-6 md:p-8 flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2d2d2d #e5e0d8' }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pr-8">
            <button onClick={prevMonth} className="border-[3px] border-ink p-2 shadow-[2px_2px_0_0_#2d2d2d] hover:bg-tan transition-colors blob-2">
              <Icon icon="solar:alt-arrow-left-linear" className="text-2xl" />
            </button>
            <h2 className="font-heading text-3xl md:text-4xl tracking-tight text-ink">
              {currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextMonth} className="border-[3px] border-ink p-2 shadow-[2px_2px_0_0_#2d2d2d] hover:bg-tan transition-colors blob-3">
              <Icon icon="solar:alt-arrow-right-linear" className="text-2xl" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 text-center mb-6">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
              <div key={d} className="text-ink/40 font-heading text-sm py-2 hidden md:block">{d}</div>
            ))}
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="text-ink/40 font-heading text-sm py-2 md:hidden">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const hasEvent = eventDates.has(day);
              const isSelected = selectedDay === day;
              const dayEvents = eventsByDay[day] || [];
              const { isStart, isEnd, isDeadline } = getDayRole(day);
              const dots = getDayDots(day);
              return (
                <div
                  key={day}
                  onClick={() => hasEvent && setSelectedDay(isSelected ? null : day)}
                  className={`relative rounded-lg transition-all min-h-[60px] md:min-h-[80px] p-2 text-left border-2
                    ${isToday && !isSelected ? 'bg-red/10 border-red font-bold' : ''}
                    ${isSelected ? 'bg-blue/10 border-blue font-bold ring-2 ring-blue/30' : ''}
                    ${hasEvent && !isToday && !isSelected ? 'bg-yellow/30 border-ink/20 cursor-pointer hover:border-ink/40' : ''}
                    ${!isToday && !hasEvent && !isSelected ? 'border-ink/10 hover:bg-tan/30' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-heading text-lg ${isToday ? 'text-red' : ''}`}>{day}</span>
                    {/* Start/End badges */}
                    <div className="flex gap-0.5">
                      {isStart && <span className="text-[9px] bg-green-500 text-white px-1 rounded font-heading leading-tight">S</span>}
                      {isEnd && <span className="text-[9px] bg-orange-500 text-white px-1 rounded font-heading leading-tight">E</span>}
                      {isDeadline && <span className="text-[9px] bg-blue-400 text-white px-1 rounded font-heading leading-tight" title="Registration Deadline">R</span>}
                    </div>
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="mt-1 flex flex-col gap-0.5">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const color = getEventColor(ev);
                        return (
                          <div key={ev._id} className={`text-xs ${color.bg} ${color.text} px-1 py-0.5 rounded truncate border ${color.border}`}>
                            {ev.name}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <span className="text-xs text-ink/40">+{dayEvents.length - 2} more</span>
                      )}
                    </div>
                  )}
                  {/* Color dots at bottom */}
                  {hasEvent && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dots.map((dotColor, j) => (
                        <div key={j} className={`rounded-full ${dotColor} w-1.5 h-1.5`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected day detail panel */}
          {selectedDay && selectedEvents.length > 0 && (
            <div className="border-[3px] border-ink p-5 shadow-[4px_4px_0_0_#2d2d2d] blob-2 animate-fade-in">
              <h3 className="font-heading text-2xl tracking-tight mb-4 flex items-center gap-2">
                <Icon icon="solar:calendar-linear" className="text-red" />
                {selectedDay} {currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                <span className="text-ink/40 text-lg ml-1">({selectedEvents.length} event{selectedEvents.length > 1 ? 's' : ''})</span>
              </h3>
              <div className="flex flex-col gap-3">
                {selectedEvents.map((ev) => {
                  const color = getEventColor(ev);
                  return (
                    <div key={ev._id} className={`bg-white border-2 ${color.border} p-4 rounded-lg flex items-start gap-4 hover:border-ink/40 transition-colors`}>
                      <div className={`w-10 h-10 ${color.dot} border-2 border-ink rounded-full flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#2d2d2d] text-white font-heading text-sm`}>
                        {((Array.isArray(ev.category) ? ev.category[0] : ev.category) || 'E').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-heading text-xl tracking-tight truncate">
                            {ev.source === 'unstop' ? <span className="text-xs text-red mr-2 uppercase tracking-tight opacity-70">Ends:</span> : ''}
                            {ev.name}
                          </h4>
                          {ev.teamName && (
                            <span className="text-xs bg-purple-100 text-purple-600 border border-purple-300 px-2 py-0.5 rounded-full font-heading shrink-0">
                              {ev.teamName}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-ink/60 mt-1">
                          {ev.organizer && (
                            <span className="flex items-center gap-1">
                              <Icon icon="solar:users-group-rounded-linear" className="text-blue" /> {ev.organizer}
                            </span>
                          )}
                          {ev.city && (
                            <span className="flex items-center gap-1">
                              <Icon icon="solar:map-point-linear" className="text-blue" /> {ev.city}
                            </span>
                          )}
                          {ev.mode && (
                            <span className={`border border-ink px-2 py-0.5 text-xs font-heading ${ev.mode === 'Online' ? 'bg-blue/10' : 'bg-tan'}`}>
                              {ev.mode}
                            </span>
                          )}
                          {ev.endDate && ev.endDate !== ev.date && (
                            <span className="flex items-center gap-1 text-xs">
                              <Icon icon="solar:calendar-linear" className="text-red" /> {formatDateRange(ev.date, ev.endDate)}
                            </span>
                          )}
                          {ev.registrationDeadline && (
                            <span className="flex items-center gap-1 text-xs font-heading bg-red/10 text-red border border-red/30 px-2 py-0.5 rounded-full shrink-0">
                              <Icon icon="solar:alarm-linear" /> Reg Ends: {new Date(ev.registrationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                        {ev.description && (
                          <p className="text-sm text-ink/50 mt-2 line-clamp-2">{ev.description}</p>
                        )}
                      </div>
                      {ev.prizePool && ev.prizePool !== 'Free' && (
                        <span className="bg-yellow border-2 border-ink px-2 py-1 text-xs font-heading shadow-[1px_1px_0_0_#2d2d2d] blob-3 shrink-0">
                          {ev.prizePool}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-ink/50">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red inline-block" /> Hackathon</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue inline-block" /> Workshop</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Tech Fest</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> Team Event</span>
            <span className="flex items-center gap-1"><span className="text-[10px] bg-green-500 text-white px-1 rounded font-heading">S</span> Start</span>
            <span className="flex items-center gap-1"><span className="text-[10px] bg-orange-500 text-white px-1 rounded font-heading">E</span> End</span>
            <span className="flex items-center gap-1"><span className="text-[10px] bg-blue-400 text-white px-1 rounded font-heading" title="Registration Deadline">R</span> Reg Ends</span>
          </div>
        </div>
      </div>
    </dialog>
  );
}
