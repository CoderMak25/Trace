export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateRange(start, end) {
  if (!start) return '';
  let s = new Date(start);
  let e = end ? new Date(end) : s;

  // Normalized midnight to previous day
  if (e.getHours() === 0 && e.getMinutes() === 0 && e.getSeconds() === 0 && e.getTime() !== s.getTime()) {
    e = new Date(e.getTime() - 1000);
  }

  if (s.getTime() === e.getTime() || !end) return formatDate(s);
  
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    return `${s.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${formatDate(s)} - ${formatDate(e)}`;
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(dateStr);
  
  // Normalize midnight deadlines (00:00:00) to the previous day's end
  // This aligns 'Ends on Monday 00:00' with 'Ends Today' on Sunday.
  if (target.getHours() === 0 && target.getMinutes() === 0 && target.getSeconds() === 0) {
    target.setSeconds(-1);
  }

  const d1 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const d2 = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

export function deadlineLabel(dateStr) {
  const days = daysUntil(dateStr);
  if (days === null) return null;
  if (days < 0) return 'Ended';
  if (days === 0) return 'Today!';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `${days}d left`;
  return null;
}

export function isUpcoming(dateStr) {
  return daysUntil(dateStr) >= 0;
}
