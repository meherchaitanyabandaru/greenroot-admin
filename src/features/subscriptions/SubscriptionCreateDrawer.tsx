import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useListSubscriptionPlansQuery,
  useCreateSubscriptionMutation,
} from '../../api/adminResources';
import { normalizeApiError } from '../../utils/apiError';
import { CYCLE_LABEL } from './cyclePricing';

// Money received outside the app (as in Record Offline Payment).
const OFFLINE_METHODS: [string, string][] = [
  ['UPI', 'UPI (direct)'],
  ['BANK_TRANSFER', 'Bank transfer'],
  ['NET_BANKING', 'Net banking'],
  ['CASH', 'Cash'],
  ['CHEQUE', 'Cheque'],
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function SubscriptionCreateDrawer({ open, onClose, onCreated }: Props) {
  const plansQuery = useListSubscriptionPlansQuery();
  const [create, createState] = useCreateSubscriptionMutation();
  const [planId, setPlanId] = useState('');
  const [userId, setUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);
  const [cycle, setCycle] = useState('MONTHLY');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [error, setError] = useState('');

  const plans = plansQuery.data?.plans ?? [];
  const plan = plans.find((p) => String(p.id) === planId);
  const isTrial = plan?.plan_code === 'TRIAL' || plan?.plan_code === 'FREE';
  const price = plan?.cycle_prices?.find((c) => c.billing_cycle === cycle);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!planId || !userId || !startDate) {
      setError('Plan, User ID, and Start Date are required.');
      return;
    }
    try {
      setError('');
      await create({
        plan_id: Number(planId),
        user_id: Number(userId),
        start_date: startDate,
        auto_renew: autoRenew,
        // Without a cycle the API would bill six months.
        billing_cycle: isTrial ? 'TRIAL' : cycle,
        ...(isTrial ? {} : { payment_method: method }),
      }).unwrap();
      setPlanId('');
      setUserId('');
      setStartDate('');
      setAutoRenew(false);
      onCreated();
      onClose();
    } catch (e) {
      setError(normalizeApiError(e).message);
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 3 } }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>Create Subscription</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="Plan"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            required
          >
            {plans
              .filter((p) => p.plan_code !== 'FREE')
              .map((p) => (
                <MenuItem key={String(p.id)} value={String(p.id)}>
                  {p.plan_name}
                  {p.monthly_price ? ` — ₹${p.monthly_price}/mo` : ' — free'}
                </MenuItem>
              ))}
          </TextField>

          {plan && !isTrial && (
            <>
              <TextField
                select
                fullWidth
                size="small"
                label="Billing period"
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                helperText={price ? `Amount recorded as paid: ₹${price.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : undefined}
              >
                {(plan.cycle_prices ?? []).map((c) => (
                  <MenuItem key={c.billing_cycle} value={c.billing_cycle}>
                    {CYCLE_LABEL[c.billing_cycle]} — ₹{c.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    {c.discount_percent > 0 ? ` (${c.discount_percent}% off)` : ''}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                fullWidth
                size="small"
                label="Received via"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {OFFLINE_METHODS.map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </TextField>
            </>
          )}

          <TextField
            fullWidth
            size="small"
            label="User ID"
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />

          <TextField
            fullWidth
            size="small"
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />

          <FormControlLabel
            control={
              <Switch
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                size="small"
              />
            }
            label="Auto Renew"
          />

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={createState.isLoading}
            >
              {createState.isLoading ? <CircularProgress size={14} /> : 'Create'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
