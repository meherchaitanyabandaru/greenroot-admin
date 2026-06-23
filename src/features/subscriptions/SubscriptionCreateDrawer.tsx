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
  const [error, setError] = useState('');

  const plans = plansQuery.data?.plans ?? [];

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
            {plans.map((plan) => (
              <MenuItem key={String(plan.id)} value={String(plan.id)}>
                {String(plan.plan_name ?? plan.plan_code)} — ₹{String(plan.monthly_price ?? '?')}/mo
              </MenuItem>
            ))}
          </TextField>

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
