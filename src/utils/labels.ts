/** Words that stay upper case in labels ("UPI", not "Upi"). */
const ACRONYMS = new Set(['UPI', 'NEFT', 'RTGS', 'IMPS', 'OTP', 'SMS', 'GST', 'PDF', 'QR', 'DLT', 'ID', 'API', 'URL', 'IP', 'PE', 'TM', 'WFO', 'KM']);

export function toLabel(snakeOrEnum: string): string {
  if (!snakeOrEnum) return '—';
  return snakeOrEnum
    .split('_')
    .filter(Boolean)
    .map((word) => (ACRONYMS.has(word.toUpperCase()) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join(' ');
}

export function formatCurrency(amount: unknown): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(iso: unknown): string {
  if (!iso) return '—';
  const d = new Date(String(iso));
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** When something happened, as the app shows it: "Wed, 28 Oct · 10:42 AM" (local time). */
export function formatDateTime(iso: unknown): string {
  if (!iso) return '—';
  const d = new Date(String(iso));
  if (isNaN(d.getTime())) return '—';
  const h = d.getHours();
  const time = `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} · ${time}`;
}
