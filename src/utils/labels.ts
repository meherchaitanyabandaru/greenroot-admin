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
