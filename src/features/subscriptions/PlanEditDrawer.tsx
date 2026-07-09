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

type Props = {
  plan: SubscriptionPlan;
  open: boolean;
  onClose: () => void;
};

type FeaturesState = {
  unlimited_orders: boolean;
  unlimited_quotations: boolean;
  support: string;
  analytics: string;
  market_posts_per_day: string;
  mrp_six_month: string;
  mrp_yearly: string;
};

function parseFeaturesState(features?: Record<string, unknown>): FeaturesState {
  const mpd = features?.market_posts_per_day;
  return {
    unlimited_orders: Boolean(features?.unlimited_orders ?? true),
    unlimited_quotations: Boolean(features?.unlimited_quotations ?? true),
    support: String(features?.support ?? 'community'),
    analytics: String(features?.analytics ?? 'basic'),
    market_posts_per_day: mpd != null ? String(mpd) : '',
    mrp_six_month: features?.mrp_six_month != null ? String(features.mrp_six_month) : '',
    mrp_yearly: features?.mrp_yearly != null ? String(features.mrp_yearly) : '',
  };
}

export function PlanEditDrawer({ plan, open, onClose }: Props) {
  const [updatePlan, { isLoading, error, isSuccess }] = useUpdateSubscriptionPlanMutation();

  const [name, setName] = useState(plan.plan_name);
  const [description, setDescription] = useState(plan.description ?? '');
  const [sixMonthPrice, setSixMonthPrice] = useState(String(plan.six_month_price ?? 0));
  const [yearlyPrice, setYearlyPrice] = useState(String(plan.yearly_price ?? 0));
  const [maxManagers, setMaxManagers] = useState(String(plan.max_managers ?? ''));
  const [isActive, setIsActive] = useState(plan.is_active);
  const [features, setFeatures] = useState<FeaturesState>(() => parseFeaturesState(plan.features));

  useEffect(() => {
    if (isSuccess) onClose();
  }, [isSuccess, onClose]);

  const sixMonthNum = parseFloat(sixMonthPrice) || 0;
  const yearlyNum = parseFloat(yearlyPrice) || 0;
  const annualIfSixMonth = sixMonthNum * 2;
  const discount = annualIfSixMonth > 0 && yearlyNum < annualIfSixMonth
    ? Math.round(((annualIfSixMonth - yearlyNum) / annualIfSixMonth) * 100)
    : 0;

  function handleSave() {
    const billingCycles = plan.plan_code === 'TRIAL' ? ['TRIAL'] : ['SIX_MONTH', 'YEARLY'];
    const maxMgr = maxManagers.trim() !== '' ? parseInt(maxManagers) : null;
    const mpdRaw = features.market_posts_per_day.trim();
    const marketPostsPerDay = mpdRaw !== '' ? parseInt(mpdRaw) : null;
    const mrpSixMonth = features.mrp_six_month.trim() !== '' ? parseFloat(features.mrp_six_month) : null;
    const mrpYearly = features.mrp_yearly.trim() !== '' ? parseFloat(features.mrp_yearly) : null;
    updatePlan({
      id: plan.id,
      body: {
        plan_name: name.trim(),
        description: description.trim() || undefined,
        six_month_price: sixMonthNum,
        yearly_price: yearlyNum,
        max_managers: maxMgr,
        is_active: isActive,
        features: {
          unlimited_orders: features.unlimited_orders,
          unlimited_quotations: features.unlimited_quotations,
          support: features.support,
          analytics: features.analytics,
          billing_cycles: billingCycles,
          ...(maxMgr != null ? { max_managers: maxMgr } : {}),
          market_posts_per_day: marketPostsPerDay,
          ...(mrpSixMonth != null ? { mrp_six_month: mrpSixMonth } : {}),
          ...(mrpYearly != null ? { mrp_yearly: mrpYearly } : {}),
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

        <Stack direction="row" gap={2}>
          <TextField
            label="6-Month Price"
            value={sixMonthPrice}
            onChange={(e) => setSixMonthPrice(e.target.value)}
            type="number"
            size="small"
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            helperText="Price per 6-month cycle"
          />
          <TextField
            label="Yearly Price"
            value={yearlyPrice}
            onChange={(e) => setYearlyPrice(e.target.value)}
            type="number"
            size="small"
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            helperText={discount > 0 ? `Saves ${discount}% vs 2× 6-month` : 'Annual price'}
          />
        </Stack>

        {discount > 0 && (
          <Alert severity="success" sx={{ py: 0.5 }}>
            Yearly saves <strong>{discount}%</strong> — customers pay ₹{yearlyNum.toLocaleString('en-IN')} instead of ₹{annualIfSixMonth.toLocaleString('en-IN')}
          </Alert>
        )}

        <Divider />
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Anchor Pricing (MRP)</Typography>
        <Typography variant="caption" color="text.secondary">
          Shown as strikethrough "was" price. Creates perceived discount for users.
        </Typography>
        <Stack direction="row" gap={2}>
          <TextField
            label="Original 6-Month Price"
            value={features.mrp_six_month}
            onChange={(e) => setFeatures((f) => ({ ...f, mrp_six_month: e.target.value }))}
            type="number"
            size="small"
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            helperText={
              features.mrp_six_month && sixMonthNum
                ? `${Math.round(((parseFloat(features.mrp_six_month) - sixMonthNum) / parseFloat(features.mrp_six_month)) * 100)}% off shown`
                : 'Leave blank to hide'
            }
          />
          <TextField
            label="Original Yearly Price"
            value={features.mrp_yearly}
            onChange={(e) => setFeatures((f) => ({ ...f, mrp_yearly: e.target.value }))}
            type="number"
            size="small"
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            helperText={
              features.mrp_yearly && yearlyNum
                ? `${Math.round(((parseFloat(features.mrp_yearly) - yearlyNum) / parseFloat(features.mrp_yearly)) * 100)}% off shown`
                : 'Leave blank to hide'
            }
          />
        </Stack>

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
