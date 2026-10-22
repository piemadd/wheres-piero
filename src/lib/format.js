const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
const absolute = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' });

const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

export const timeAgo = (iso, now = Date.now()) => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'unknown';
  const seconds = Math.round((t - now) / 1000);
  if (Math.abs(seconds) < 60) return 'just now';
  const [unit, size] = UNITS.find(([, s]) => Math.abs(seconds) >= s);
  return relative.format(Math.round(seconds / size), unit);
};

export const formatTime = (iso) => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 'Unknown time' : absolute.format(t);
};

export const formatCoords = (lat, lon) => `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

export const formatMeters = (m) => (m == null ? '—' : `${Math.round(m)} m`);
