import { useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useListSubscriptionPlansQuery, type SubscriptionPlan } from '../../api/adminResources';
import { PlanEditDrawer } from './PlanEditDrawer';

const PLAN_META: Record<string, { accent: string; headerBg: string }> = {
  TRIAL:      { accent: '#16a34a', headerBg: '#f0fdf4' },
  GROWTH:     { accent: '#2563eb', headerBg: '#eff6ff' },
  ENTERPRISE: { accent: '#7c3aed', headerBg: '#faf5ff' },
};

function fmt(value?: number | null) {
  if (!value) return '₹0';
  return `₹${value.toLocaleString('en-IN')}`;
}

function mrpDiscount(actual: number | undefined, mrp: number | undefined): number | null {
  if (!actual || !mrp || mrp <= actual) return null;
  return Math.round(((mrp - actual) / mrp) * 100);
}

// All feature rows to compare across plans
const FEATURE_ROWS: { label: string; key: string; type: 'bool' | 'text' | 'managers' | 'daily' }[] = [
  { label: 'Unlimited Orders',       key: 'unlimited_orders',      type: 'bool' },
  { label: 'Unlimited Quotations',   key: 'unlimited_quotations',  type: 'bool' },
  { label: 'Managers per Nursery',   key: 'max_managers',          type: 'managers' },
  { label: 'Local Market Posts/Day', key: 'market_posts_per_day',  type: 'daily' },
  { label: 'Analytics',              key: 'analytics',             type: 'text' },
  { label: 'Support',                key: 'support',               type: 'text' },
];

function FeatureCell({ plan, row }: { plan: SubscriptionPlan; row: typeof FEATURE_ROWS[0] }) {
  const meta = PLAN_META[plan.plan_code] ?? { accent: '#64748b', headerBg: '#f8fafc' };

  if (row.type === 'managers') {
    const val = plan.max_managers;
    if (val == null) {
      return <Typography variant="body2" fontWeight={600} color={meta.accent}>Unlimited</Typography>;
    }
    return <Typography variant="body2" fontWeight={600}>{val}</Typography>;
  }

  if (row.type === 'daily') {
    const val = plan.features?.[row.key];
    if (val == null) {
      return <Typography variant="body2" fontWeight={600} color={meta.accent}>Unlimited</Typography>;
    }
    return (
      <Typography variant="body2" fontWeight={600}>
        {String(val)}<Typography component="span" variant="caption" color="text.secondary">/day</Typography>
      </Typography>
    );
  }

  const raw = plan.features?.[row.key];

  if (row.type === 'bool') {
    const on = raw === true || raw === 'true';
    return on
      ? <CheckIcon sx={{ fontSize: 18, color: meta.accent }} />
      : <RemoveIcon sx={{ fontSize: 18, color: '#cbd5e1' }} />;
  }

  // text
  if (!raw) return <RemoveIcon sx={{ fontSize: 18, color: '#cbd5e1' }} />;
  return (
    <Chip
      label={String(raw)}
      size="small"
      sx={{ bgcolor: meta.accent + '18', color: meta.accent, fontWeight: 700, fontSize: 11, textTransform: 'capitalize' }}
    />
  );
}

export function SubscriptionPlansPage() {
  const { data, isLoading, error } = useListSubscriptionPlansQuery();
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);

  const plans = (data?.plans ?? []).filter(
    (p) => p.plan_code !== 'FREE' && p.plan_code !== 'PRO',
  );

  if (isLoading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 3 }}>Failed to load plans</Alert>;

  return (
    <Box p={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Subscription Plans</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage pricing, features, and plan availability
          </Typography>
        </Box>
      </Stack>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}
      >
        <Table sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            {/* Plan name row */}
            <TableRow>
              <TableCell
                sx={{ width: 200, minWidth: 200, bgcolor: '#f8fafc', borderRight: '1px solid', borderColor: 'divider' }}
              />
              {plans.map((plan) => {
                const meta = PLAN_META[plan.plan_code] ?? { accent: '#64748b', headerBg: '#f8fafc' };
                return (
                  <TableCell
                    key={plan.id}
                    align="center"
                    sx={{ bgcolor: meta.headerBg, borderRight: '1px solid', borderColor: 'divider', py: 2.5, overflow: 'hidden' }}
                  >
                    <Stack alignItems="center" gap={0.5} sx={{ width: '100%' }}>
                      <Typography variant="h6" fontWeight={700} sx={{ color: meta.accent }}>
                        {plan.plan_name}
                      </Typography>
                      <Stack direction="row" gap={0.5} alignItems="center" mt={0.5}>
                        {plan.is_active
                          ? <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
                          : <CancelIcon sx={{ fontSize: 14, color: 'error.main' }} />}
                        <Typography variant="caption" color={plan.is_active ? 'success.main' : 'error.main'} fontWeight={600}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </Typography>
                        <Tooltip title="Edit plan">
                          <IconButton size="small" onClick={() => setEditing(plan)} sx={{ ml: 0.5, color: meta.accent }}>
                            <EditIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {/* Description row */}
            <TableRow>
              <TableCell sx={{ borderRight: '1px solid', borderColor: 'divider', py: 1.5 }}>
                <Typography variant="body2" fontWeight={700} color="text.secondary">About</Typography>
              </TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.id} align="center" sx={{ borderRight: '1px solid', borderColor: 'divider', py: 1.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    {plan.description ?? '—'}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>

            {/* 6-Month Price */}
            <TableRow sx={{ bgcolor: '#fafafa' }}>
              <TableCell sx={{ borderRight: '1px solid', borderColor: 'divider', py: 2 }}>
                <Typography variant="body2" fontWeight={700} color="text.secondary">6-Month Price</Typography>
              </TableCell>
              {plans.map((plan) => {
                const meta = PLAN_META[plan.plan_code] ?? { accent: '#64748b', headerBg: '#f8fafc' };
                const mrp = plan.features?.mrp_six_month as number | undefined;
                const disc = mrpDiscount(plan.six_month_price, mrp);
                return (
                  <TableCell key={plan.id} align="center" sx={{ borderRight: '1px solid', borderColor: 'divider', py: 2 }}>
                    <Stack alignItems="center" gap={0.25}>
                      {mrp && disc && (
                        <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#94a3b8' }}>
                          {fmt(mrp)}
                        </Typography>
                      )}
                      <Typography variant="h6" fontWeight={800} color={meta.accent}>
                        {plan.six_month_price ? fmt(plan.six_month_price) : '₹0'}
                      </Typography>
                      {disc ? (
                        <Chip label={`${disc}% off`} size="small"
                          sx={{ bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 800, fontSize: 10, height: 18 }} />
                      ) : !plan.six_month_price ? (
                        <Typography variant="caption" color="success.main" fontWeight={600}>Free</Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">per 6 months</Typography>
                      )}
                    </Stack>
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Yearly Price */}
            <TableRow>
              <TableCell sx={{ borderRight: '1px solid', borderColor: 'divider', py: 2 }}>
                <Typography variant="body2" fontWeight={700} color="text.secondary">Yearly Price</Typography>
              </TableCell>
              {plans.map((plan) => {
                const meta = PLAN_META[plan.plan_code] ?? { accent: '#64748b', headerBg: '#f8fafc' };
                const mrp = plan.features?.mrp_yearly as number | undefined;
                const disc = mrpDiscount(plan.yearly_price, mrp);
                return (
                  <TableCell key={plan.id} align="center" sx={{ borderRight: '1px solid', borderColor: 'divider', py: 2 }}>
                    <Stack alignItems="center" gap={0.25}>
                      {mrp && disc && (
                        <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#94a3b8' }}>
                          {fmt(mrp)}
                        </Typography>
                      )}
                      <Typography variant="h6" fontWeight={800} color={meta.accent}>
                        {plan.yearly_price ? fmt(plan.yearly_price) : '₹0'}
                      </Typography>
                      {disc ? (
                        <Chip label={`${disc}% off`} size="small"
                          sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: 10, height: 18 }} />
                      ) : !plan.yearly_price ? (
                        <Typography variant="caption" color="success.main" fontWeight={600}>Free</Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">per year</Typography>
                      )}
                    </Stack>
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Divider label */}
            <TableRow>
              <TableCell
                colSpan={plans.length + 1}
                sx={{ bgcolor: '#f1f5f9', py: 1, borderTop: '1px solid', borderColor: 'divider' }}
              >
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  Features
                </Typography>
              </TableCell>
            </TableRow>

            {/* Feature rows */}
            {FEATURE_ROWS.map((row, i) => (
              <TableRow key={row.key} sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <TableCell sx={{ borderRight: '1px solid', borderColor: 'divider', py: 1.5 }}>
                  <Typography variant="body2" color="text.primary">{row.label}</Typography>
                </TableCell>
                {plans.map((plan) => (
                  <TableCell key={plan.id} align="center" sx={{ borderRight: '1px solid', borderColor: 'divider', py: 1.5 }}>
                    <FeatureCell plan={plan} row={row} />
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {/* Billing Cycles */}
            <TableRow sx={{ bgcolor: '#fafafa' }}>
              <TableCell sx={{ borderRight: '1px solid', borderColor: 'divider', py: 1.5 }}>
                <Typography variant="body2" color="text.primary">Billing Cycles</Typography>
              </TableCell>
              {plans.map((plan) => {
                const cycles = (plan.features?.billing_cycles as string[]) ?? [];
                return (
                  <TableCell key={plan.id} align="center" sx={{ borderRight: '1px solid', borderColor: 'divider', py: 1.5 }}>
                    <Stack direction="row" gap={0.5} justifyContent="center" flexWrap="wrap">
                      {cycles.length === 0
                        ? <Typography variant="caption" color="text.secondary">—</Typography>
                        : cycles.map((c) => (
                            <Chip
                              key={c}
                              label={c === 'SIX_MONTH' ? '6-Month' : c === 'TRIAL' ? 'Trial' : 'Yearly'}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: 10, height: 20 }}
                            />
                          ))}
                    </Stack>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {editing && (
        <PlanEditDrawer
          plan={editing}
          open={!!editing}
          onClose={() => setEditing(null)}
        />
      )}
    </Box>
  );
}
