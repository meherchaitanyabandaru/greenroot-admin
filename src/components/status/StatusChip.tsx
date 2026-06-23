import { Chip } from '@mui/material';

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

  // Inventory
  AVAILABLE:           { label: 'Available',           color: '#17803D', bg: '#D1FAE5' },
  LOW_STOCK:           { label: 'Low Stock',           color: '#B7791F', bg: '#FEF3C7' },
  OUT_OF_STOCK:        { label: 'Out of Stock',        color: '#C2410C', bg: '#FEE2E2' },
  RESERVED:            { label: 'Reserved',            color: '#2563EB', bg: '#DBEAFE' },
  DISCONTINUED:        { label: 'Discontinued',        color: '#667085', bg: '#F2F4F7' },

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
};

export function StatusChip({ value }: { value?: unknown }) {
  const key = String(value ?? '').toUpperCase().trim();
  const cfg = STATUS_MAP[key];

  if (!cfg) {
    if (!key || key === 'UNKNOWN') {
      return <Chip size="small" label="—" sx={{ fontSize: 11, height: 22 }} />;
    }
    return (
      <Chip
        size="small"
        label={key}
        sx={{ fontSize: 11, height: 22, '& .MuiChip-label': { px: 1 } }}
      />
    );
  }

  return (
    <Chip
      size="small"
      label={cfg.label}
      sx={{
        fontSize: 11,
        fontWeight: 600,
        height: 22,
        bgcolor: cfg.bg,
        color: cfg.color,
        border: 'none',
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}
