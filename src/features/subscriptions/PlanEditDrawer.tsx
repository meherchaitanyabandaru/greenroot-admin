import { useEffect, useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Stack,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  Chip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useUpdateSubscriptionPlanMutation, type SubscriptionPlan } from '../../api/adminResources';
import { CYCLES, cyclePrice } from './cyclePricing';

type Props = {
  plan: SubscriptionPlan;
  open: boolean;
  onClose: () => void;
};

type FeaturesState = {
  unlimited_orders: boolean;
  unlimited_quotations: boolean;
  local_market_ads: boolean;
  support: string;
  analytics: string;
  market_posts_per_day: string;
};

function parseFeaturesState(features?: Record<string, unknown>): FeaturesState {
  const mpd = features?.market_posts_per_day;
  return {
    unlimited_orders: Boolean(features?.unlimited_orders ?? true),
    unlimited_quotations: Boolean(features?.unlimited_quotations ?? true),
    local_market_ads: Boolean(features?.local_market_ads ?? true),
    support: String(features?.support ?? 'community'),
    analytics: String(features?.analytics ?? 'basic'),
    market_posts_per_day: mpd != null ? String(mpd) : '',
  };
}

export function PlanEditDrawer({ plan, open, onClose }: Props) {
  const [updatePlan, { isLoading, error, isSuccess }] = useUpdateSubscriptionPlanMutation();

  const [name, setName] = useState(plan.plan_name);
  const [description, setDescription] = useState(plan.description ?? '');
  const [monthlyPrice, setMonthlyPrice] = useState(String(plan.monthly_price ?? 0));
  const [maxManagers, setMaxManagers] = useState(String(plan.max_managers ?? ''));
  const [isActive, setIsActive] = useState(plan.is_active);
  const [features, setFeatures] = useState<FeaturesState>(() => parseFeaturesState(plan.features));

  useEffect(() => {
    if (isSuccess) onClose();
  }, [isSuccess, onClose]);

  const monthlyNum = parseFloat(monthlyPrice) || 0;
  const isFree = plan.plan_code === 'TRIAL' || plan.plan_code === 'FREE';

  function handleSave() {
    const billingCycles = isFree ? (plan.features?.billing_cycles ?? [plan.plan_code]) : CYCLES.map((c) => c.code);
    const maxMgr = maxManagers.trim() !== '' ? parseInt(maxManagers) : null;
    const mpdRaw = features.market_posts_per_day.trim();
    const marketPostsPerDay = mpdRaw !== '' ? parseInt(mpdRaw) : null;
    // Keep feature keys this form does not edit (e.g. unlimited_customers);
    // drop the retired list ("MRP") prices.
    const { mrp_six_month: _oldSix, mrp_yearly: _oldYear, ...kept } = plan.features ?? {};
    void _oldSix;
    void _oldYear;
    updatePlan({
      id: plan.id,
      body: {
        plan_name: name.trim(),
        description: description.trim() || undefined,
        monthly_price: isFree ? 0 : monthlyNum,
        max_managers: maxMgr,
        is_active: isActive,
        features: {
          ...kept,
          unlimited_orders: features.unlimited_orders,
          unlimited_quotations: features.unlimited_quotations,
          local_market_ads: features.local_market_ads,
          support: features.support,
          analytics: features.analytics,
          billing_cycles: billingCycles,
          ...(maxMgr != null ? { max_managers: maxMgr } : {}),
          market_posts_per_day: marketPostsPerDay,
        },
      },
    });
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 440, p: 3, display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%', overflow: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={700}>Edit Plan</Typography>
            <Chip label={plan.plan_code} size="small" sx={{ mt: 0.5, fontWeight: 600 }} />
          </Box>
          <FormControlLabel
            control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} color="success" />}
            label={isActive ? 'Active' : 'Inactive'}
            labelPlacement="start"
          />
        </Stack>

        <Divider />

        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Basic Info</Typography>

        <TextField
          label="Plan Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          size="small"
        />

        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={2}
          size="small"
        />

        <Divider />
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Pricing</Typography>

        {isFree ? (
          <Typography variant="body2" color="text.secondary">This plan is free.</Typography>
        ) : (
          <>
            <TextField
              label="Monthly Price"
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
              type="number"
              size="small"
              fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              helperText="Longer cycles are priced from this, with a pay-ahead discount"
            />
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& td': { py: 0.5, fontSize: 14 } }}>
              <tbody>
                {CYCLES.map((c) => {
                  const amount = cyclePrice(monthlyNum, c.months, c.discount);
                  return (
                    <tr key={c.code}>
                      <td>{c.label}</td>
                      <td style={{ color: '#64748b' }}>{c.discount > 0 ? `${c.discount}% off` : ''}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Box>
          </>
        )}

        <Divider />
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Limits</Typography>

        <Stack direction="row" gap={2}>
          <TextField
            label="Max Managers per Nursery"
            value={maxManagers}
            onChange={(e) => setMaxManagers(e.target.value)}
            type="number"
            size="small"
            fullWidth
            helperText="Leave blank for unlimited"
          />
          <TextField
            label="Local Market Posts/Day"
            value={features.market_posts_per_day}
            onChange={(e) => setFeatures((f) => ({ ...f, market_posts_per_day: e.target.value }))}
            type="number"
            size="small"
            fullWidth
            helperText="Leave blank for unlimited"
          />
        </Stack>

        <Divider />
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Features</Typography>

        <Stack gap={1}>
          <FormControlLabel
            control={
              <Switch
                checked={features.unlimited_orders}
                onChange={(e) => setFeatures((f) => ({ ...f, unlimited_orders: e.target.checked }))}
                size="small"
              />
            }
            label="Unlimited Orders"
          />
          <FormControlLabel
            control={
              <Switch
                checked={features.unlimited_quotations}
                onChange={(e) => setFeatures((f) => ({ ...f, unlimited_quotations: e.target.checked }))}
                size="small"
              />
            }
            label="Unlimited Quotations"
          />
          <FormControlLabel
            control={
              <Switch
                checked={features.local_market_ads}
                onChange={(e) => setFeatures((f) => ({ ...f, local_market_ads: e.target.checked }))}
                size="small"
              />
            }
            label="Local Market Ads"
          />
        </Stack>

        <Stack direction="row" gap={2}>
          <TextField
            label="Support Tier"
            value={features.support}
            onChange={(e) => setFeatures((f) => ({ ...f, support: e.target.value }))}
            size="small"
            fullWidth
            helperText="e.g. community, email, priority, dedicated"
          />
          <TextField
            label="Analytics"
            value={features.analytics}
            onChange={(e) => setFeatures((f) => ({ ...f, analytics: e.target.value }))}
            size="small"
            fullWidth
            helperText="e.g. basic, full, advanced"
          />
        </Stack>

        {error && (
          <Alert severity="error">Failed to save plan. Please try again.</Alert>
        )}

        <Box flex={1} />

        <Stack direction="row" gap={1.5} justifyContent="flex-end" pt={1}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={isLoading || !name.trim()}
          >
            Save Changes
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
