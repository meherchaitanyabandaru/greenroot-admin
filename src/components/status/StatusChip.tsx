import { Chip } from '@mui/material';
import { tone } from '../../theme/tone';
import { toLabel } from '../../utils/labels';

type StatusConfig = { label: string; color: string; bg: string };

const STATUS_MAP: Record<string, StatusConfig> = {
  // Generic
  ACTIVE:              { label: 'Active',              color: '#17803D', bg: '#D1FAE5' },
  INACTIVE:            { label: 'Inactive',            color: '#667085', bg: '#F2F4F7' },
  BANNED:              { label: 'Banned',              color: '#C2410C', bg: '#FEE2E2' },
  DELETED:             { label: 'Deleted',             color: '#C2410C', bg: '#FEE2E2' },

  // Orders
  PENDING:             { label: 'Pending',             color: '#B7791F', bg: '#FEF3C7' },
  CONFIRMED:           { label: 'Confirmed',           color: '#2563EB', bg: '#DBEAFE' },
  PARTIALLY_FULFILLED: { label: 'Partial',             color: '#7C3AED', bg: '#EDE9FE' },
  COMPLETED:           { label: 'Completed',           color: '#17803D', bg: '#D1FAE5' },
  CANCELLED:           { label: 'Cancelled',           color: '#C2410C', bg: '#FEE2E2' },

  // Plant-request responses and sourcing posts
  AVAILABLE:           { label: 'Available',           color: '#17803D', bg: '#D1FAE5' },

  // Payments
  SUCCESS:             { label: 'Paid',                color: '#17803D', bg: '#D1FAE5' },
  FAILED:              { label: 'Failed',              color: '#C2410C', bg: '#FEE2E2' },
  REFUNDED:            { label: 'Refunded',            color: '#7C3AED', bg: '#EDE9FE' },

  // Dispatch
  DISPATCHED:          { label: 'Dispatched',          color: '#2563EB', bg: '#DBEAFE' },
  IN_TRANSIT:          { label: 'In Transit',          color: '#7C3AED', bg: '#EDE9FE' },
  DELIVERED:           { label: 'Delivered',           color: '#17803D', bg: '#D1FAE5' },

  // Vehicle / Driver
  MAINTENANCE:         { label: 'Maintenance',         color: '#B7791F', bg: '#FEF3C7' },
  RETIRED:             { label: 'Retired',             color: '#667085', bg: '#F2F4F7' },
  SUSPENDED:           { label: 'Suspended',           color: '#C2410C', bg: '#FEE2E2' },

  // Requests
  OPEN:                { label: 'Open',                color: '#2563EB', bg: '#DBEAFE' },
  MATCHED:             { label: 'Matched',             color: '#7C3AED', bg: '#EDE9FE' },
  CLOSED:              { label: 'Closed',              color: '#667085', bg: '#F2F4F7' },

  // Subscriptions
  TRIAL:               { label: 'Trial',               color: '#0E7490', bg: '#CFFAFE' },
  ACTIVE_PAID:         { label: 'Active',              color: '#17803D', bg: '#D1FAE5' },
  EXPIRED:             { label: 'Expired',             color: '#C2410C', bg: '#FEE2E2' },
  PAUSED:              { label: 'Paused',              color: '#B7791F', bg: '#FEF3C7' },

  // Notifications
  SENT:                { label: 'Sent',                color: '#17803D', bg: '#D1FAE5' },
  READ:                { label: 'Read',                color: '#667085', bg: '#F2F4F7' },
  UNREAD:              { label: 'Unread',              color: '#2563EB', bg: '#DBEAFE' },

  // Botanical names (World Flora Online)
  ACCEPTED:            { label: 'Accepted',            color: '#17803D', bg: '#D1FAE5' },
  SYNONYM:             { label: 'Synonym',             color: '#2563EB', bg: '#DBEAFE' },
  UNCHECKED:           { label: 'Unchecked',           color: '#667085', bg: '#F2F4F7' },

  // Nursery applications
  APPROVED:            { label: 'Approved',            color: '#17803D', bg: '#D1FAE5' },
  REJECTED:            { label: 'Rejected',            color: '#C2410C', bg: '#FEE2E2' },

  // Orders (loading) and dispatches
  LOADING:             { label: 'Loading',             color: '#2563EB', bg: '#DBEAFE' },
  LOADED:              { label: 'Loaded',              color: '#7C3AED', bg: '#EDE9FE' },

  // Quotations
  DRAFT:               { label: 'Draft',               color: '#667085', bg: '#F2F4F7' },
  CUSTOMER_DRAFT:      { label: 'Draft',               color: '#667085', bg: '#F2F4F7' },
  CUSTOMER_SENT:       { label: 'Sent to customer',    color: '#2563EB', bg: '#DBEAFE' },
  CUSTOMER_ACCEPTED:   { label: 'Accepted',            color: '#17803D', bg: '#D1FAE5' },
  CUSTOMER_REJECTED:   { label: 'Rejected',            color: '#C2410C', bg: '#FEE2E2' },
  INTERNAL_DRAFT:      { label: 'Internal draft',      color: '#667085', bg: '#F2F4F7' },
  INTERNAL_FINAL:      { label: 'Internal final',      color: '#7C3AED', bg: '#EDE9FE' },
  CONVERTED:           { label: 'Converted to order',  color: '#17803D', bg: '#D1FAE5' },

  // Local market ads and reports
  PUBLISHED:           { label: 'Published',           color: '#17803D', bg: '#D1FAE5' },
  ARCHIVED:            { label: 'Archived',            color: '#667085', bg: '#F2F4F7' },
  REVIEWED:            { label: 'Action taken',        color: '#17803D', bg: '#D1FAE5' },
  DISMISSED:           { label: 'Dismissed',           color: '#667085', bg: '#F2F4F7' },

  // Messages (SMS / email)
  MOCKED:              { label: 'Mocked',              color: '#B7791F', bg: '#FEF3C7' },
  BLOCKED:             { label: 'Blocked',             color: '#C2410C', bg: '#FEE2E2' },
  BOUNCED:             { label: 'Bounced',             color: '#C2410C', bg: '#FEE2E2' },
};

export function StatusChip({ value }: { value?: unknown }) {
  const key = String(value ?? '').toUpperCase().trim();
  const cfg = STATUS_MAP[key];

  if (!cfg) {
    if (!key || key === 'UNKNOWN') {
      return <Chip size="small" label="—" sx={{ fontSize: 11, height: 22 }} />;
    }
    // Unknown status: readable label, neutral colours (never a raw CODE_VALUE).
    return (
      <Chip
        size="small"
        label={toLabel(key)}
        sx={(t) => ({ fontSize: 11, height: 22, ...tone(t, '#475467', '#F2F4F7'), '& .MuiChip-label': { px: 1 } })}
      />
    );
  }

  return (
    <Chip
      size="small"
      label={cfg.label}
      sx={(t) => ({
        fontSize: 11,
        fontWeight: 600,
        height: 22,
        ...tone(t, cfg.color, cfg.bg),
        border: 'none',
        '& .MuiChip-label': { px: 1 },
      })}
    />
  );
}
