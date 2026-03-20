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
  const s = new Date(start);
  if (!end || start === end) return formatDate(start);
  const e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    return `${s.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
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
