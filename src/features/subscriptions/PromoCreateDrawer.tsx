import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  InputAdornment,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import {
  useCreateSubscriptionPromoMutation,
  useUpdateSubscriptionPromoMutation,
  type SubscriptionPromo,
} from '../../api/adminResources';

const PLAN_OPTIONS = ['TRIAL', 'GROWTH', 'ENTERPRISE'];
const CYCLE_OPTIONS = ['SIX_MONTH', 'YEARLY'];

type Props = {
  open: boolean;
  promo?: SubscriptionPromo | null;
  onClose: () => void;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function PromoCreateDrawer({ open, promo, onClose }: Props) {
  const isEdit = !!promo;
  const [create, { isLoading: creating, isSuccess: created, error: createErr }] =
    useCreateSubscriptionPromoMutation();
  const [update, { isLoading: updating, isSuccess: updated, error: updateErr }] =
    useUpdateSubscriptionPromoMutation();

  const isLoading = creating || updating;
  const isSuccess = created || updated;
  const error = createErr || updateErr;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [maxCap, setMaxCap] = useState('');
  const [validFrom, setValidFrom] = useState(today());
  const [validUntil, setValidUntil] = useState(daysFromNow(30));
  const [maxUses, setMaxUses] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [plans, setPlans] = useState<string[]>([]);
  const [cycles, setCycles] = useState<string[]>([]);

  useEffect(() => {
    if (promo) {
      setCode(promo.promo_code);
      setName(promo.name);
      setDescription(promo.description ?? '');
      setDiscountType(promo.discount_type);
      setDiscountValue(String(promo.discount_value));
      setMaxCap(promo.max_discount_cap != null ? String(promo.max_discount_cap) : '');
      setValidFrom(promo.valid_from);
      setValidUntil(promo.valid_until);
      setMaxUses(promo.max_uses != null ? String(promo.max_uses) : '');
      setIsActive(promo.is_active);
      setPlans(promo.applicable_plans ?? []);
      setCycles(promo.applicable_cycles ?? []);
    } else {
      setCode(''); setName(''); setDescription('');
      setDiscountType('PERCENTAGE'); setDiscountValue(''); setMaxCap('');
      setValidFrom(today()); setValidUntil(daysFromNow(30));
      setMaxUses(''); setIsActive(true); setPlans([]); setCycles([]);
    }
  }, [promo, open]);

  useEffect(() => {
    if (isSuccess) onClose();
  }, [isSuccess, onClose]);

  function togglePlan(p: string) {
    setPlans((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  function toggleCycle(c: string) {
    setCycles((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  function handleSave() {
    const body = {
      name: name.trim(),
      description: description.trim() || undefined,
      discount_type: discountType,
      discount_value: parseFloat(discountValue) || 0,
      max_discount_cap: maxCap.trim() ? parseFloat(maxCap) : undefined,
      applicable_plans: plans,
      applicable_cycles: cycles,
      valid_from: validFrom,
      valid_until: validUntil,
      max_uses: maxUses.trim() ? parseInt(maxUses) : undefined,
    };
    if (isEdit && promo) {
      update({ id: promo.id, body: { ...body, is_active: isActive } });
    } else {
      create({ promo_code: code.toUpperCase().trim(), ...body });
    }
  }

  const discountNum = parseFloat(discountValue) || 0;
  const capNum = parseFloat(maxCap) || 0;
  const previewSaving = discountType === 'PERCENTAGE'
    ? `${discountNum}% off` + (capNum > 0 ? ` (max ₹${capNum})` : '')
    : `₹${discountNum} flat off`;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 460, p: 3, display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%', overflow: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>
            {isEdit ? 'Edit Promo Offer' : 'New Promo Offer'}
          </Typography>
          {isEdit && (
            <FormControlLabel
              control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} color="success" size="small" />}
              label={isActive ? 'Active' : 'Inactive'}
              labelPlacement="start"
            />
          )}
        </Stack>

        <Divider />
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Basic Details</Typography>

        {!isEdit && (
          <TextField
            label="Promo Code *"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            size="small"
            fullWidth
            placeholder="e.g. DIWALI2026"
            helperText="Uppercase, no spaces. Owners enter this at checkout."
            inputProps={{ style: { fontFamily: 'monospace', letterSpacing: 2 } }}
          />
        )}

        <TextField
          label="Offer Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="small"
          fullWidth
          placeholder="e.g. Diwali Festival Offer"
        />

        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          size="small"
          fullWidth
          multiline
          rows={2}
          placeholder="e.g. Celebrate Diwali with 20% off your first subscription!"
        />

        <Divider />
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Discount</Typography>

        <FormControl>
          <FormLabel sx={{ fontSize: 13 }}>Discount Type</FormLabel>
          <RadioGroup
            row
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as 'PERCENTAGE' | 'FLAT')}
          >
            <FormControlLabel value="PERCENTAGE" control={<Radio size="small" />} label="Percentage %" />
            <FormControlLabel value="FLAT" control={<Radio size="small" />} label="Flat Amount ₹" />
          </RadioGroup>
        </FormControl>

        <Stack direction="row" gap={2}>
          <TextField
            label={discountType === 'PERCENTAGE' ? 'Discount %' : 'Amount (₹)'}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            type="number"
            size="small"
            fullWidth
            InputProps={discountType === 'PERCENTAGE'
              ? { endAdornment: <InputAdornment position="end">%</InputAdornment> }
              : { startAdornment: <InputAdornment position="start">₹</InputAdornment> }
            }
          />
          {discountType === 'PERCENTAGE' && (
            <TextField
              label="Max Cap (₹)"
              value={maxCap}
              onChange={(e) => setMaxCap(e.target.value)}
              type="number"
              size="small"
              fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              helperText="Leave blank for no cap"
            />
          )}
        </Stack>

        {discountNum > 0 && (
          <Box sx={{ bgcolor: '#fef9c3', borderRadius: 2, px: 2, py: 1.5, border: '1px solid #fde68a' }}>
            <Typography variant="body2" fontWeight={700} color="#854d0e">
              Preview: {previewSaving}
            </Typography>
          </Box>
        )}

        <Divider />
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Applicable To</Typography>

        <FormGroup row>
          <FormLabel sx={{ fontSize: 13, width: '100%', mb: 0.5 }}>Plans (empty = all plans)</FormLabel>
          {PLAN_OPTIONS.map((p) => (
            <FormControlLabel
              key={p}
              control={<Checkbox checked={plans.includes(p)} onChange={() => togglePlan(p)} size="small" />}
              label={p}
            />
          ))}
        </FormGroup>

        <FormGroup row>
          <FormLabel sx={{ fontSize: 13, width: '100%', mb: 0.5 }}>Billing Cycles (empty = all cycles)</FormLabel>
          {CYCLE_OPTIONS.map((c) => (
            <FormControlLabel
              key={c}
              control={<Checkbox checked={cycles.includes(c)} onChange={() => toggleCycle(c)} size="small" />}
              label={c === 'SIX_MONTH' ? '6 Months' : 'Yearly'}
            />
          ))}
        </FormGroup>

        <Divider />
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Validity & Limits</Typography>

        <Stack direction="row" gap={2}>
          <TextField
            label="Valid From *"
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Valid Until *"
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Stack>

        <TextField
          label="Max Total Uses"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          type="number"
          size="small"
          helperText="Leave blank for unlimited uses"
        />

        {error && <Alert severity="error">Failed to save. Check your inputs and try again.</Alert>}

        <Box flex={1} />

        <Stack direction="row" gap={1.5} justifyContent="flex-end" pt={1}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={isLoading || !name.trim() || !discountValue || !validFrom || !validUntil || (!isEdit && !code.trim())}
          >
            {isEdit ? 'Save Changes' : 'Create Promo'}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
