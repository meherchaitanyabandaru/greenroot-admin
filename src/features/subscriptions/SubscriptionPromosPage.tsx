import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import {
  useListSubscriptionPromosQuery,
  useBlastSubscriptionPromoMutation,
  type SubscriptionPromo,
} from '../../api/adminResources';
import { PromoCreateDrawer } from './PromoCreateDrawer';

function discountLabel(promo: SubscriptionPromo) {
  return promo.discount_type === 'PERCENTAGE'
    ? `${promo.discount_value}% off`
    : `₹${promo.discount_value.toLocaleString('en-IN')} off`;
}

function isExpired(validUntil: string) {
  return validUntil < new Date().toISOString().slice(0, 10);
}

function statusChip(promo: SubscriptionPromo) {
  if (!promo.is_active) return <Chip label="Inactive" size="small" color="default" />;
  if (isExpired(promo.valid_until)) return <Chip label="Expired" size="small" color="error" />;
  const today = new Date().toISOString().slice(0, 10);
  if (promo.valid_from > today) return <Chip label="Scheduled" size="small" color="info" />;
  return <Chip label="Active" size="small" color="success" />;
}

type BlastDialogProps = {
  promo: SubscriptionPromo | null;
  onClose: () => void;
};

function BlastDialog({ promo, onClose }: BlastDialogProps) {
  const [blast, { isLoading, isSuccess, data, error }] = useBlastSubscriptionPromoMutation();

  if (!promo) return null;

  return (
    <Dialog open={!!promo} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SendIcon color="primary" />
        Send Promo to Unsubscribed Owners
      </DialogTitle>
      <DialogContent>
        {isSuccess ? (
          <Alert severity="success" sx={{ mt: 1 }}>
            Sent to <strong>{data?.sent_count ?? 0}</strong> nursery owner{(data?.sent_count ?? 0) !== 1 ? 's' : ''}!
            They'll receive an in-app notification with code <strong>{promo.promo_code}</strong>.
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" mb={2}>
              This will send an in-app notification with promo code <strong>{promo.promo_code}</strong> ({discountLabel(promo)}) to all nursery owners who don't have an active subscription.
            </Typography>
            <Box sx={{ bgcolor: '#f0fdf4', borderRadius: 2, p: 2, border: '1px solid #bbf7d0' }}>
              <Stack direction="row" gap={1} alignItems="center" mb={0.5}>
                <LocalOfferIcon sx={{ fontSize: 18, color: 'success.main' }} />
                <Typography variant="subtitle2" fontWeight={700}>{promo.name}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">{discountLabel(promo)} · Valid until {promo.valid_until}</Typography>
            </Box>
            {error && <Alert severity="error" sx={{ mt: 2 }}>Failed to send. Please try again.</Alert>}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {isSuccess ? (
          <Button onClick={onClose} variant="contained">Done</Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              disabled={isLoading}
              onClick={() => blast(promo.id)}
            >
              Send Notification
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export function SubscriptionPromosPage() {
  const { data, isLoading, error } = useListSubscriptionPromosQuery();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPromo | null>(null);
  const [blasting, setBlasting] = useState<SubscriptionPromo | null>(null);

  const promos = data?.promos ?? [];

  if (isLoading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 3 }}>Failed to load promos</Alert>;

  return (
    <Box p={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Promo Offers</Typography>
          <Typography variant="body2" color="text.secondary">
            Create festive offers (Diwali, Christmas, New Year…) and blast them to unsubscribed nursery owners
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>
          New Promo
        </Button>
      </Stack>

      {promos.length === 0 ? (
        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 3,
            p: 6,
            textAlign: 'center',
          }}
        >
          <LocalOfferIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">No promo offers yet</Typography>
          <Typography variant="body2" color="text.disabled" mb={2}>
            Create your first promo to attract unsubscribed nursery owners
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>
            Create First Promo
          </Button>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Discount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Applicable</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Valid From</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Valid Until</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Uses</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {promos.map((promo) => (
                <TableRow key={promo.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} fontFamily="monospace" color="primary.main">
                      {promo.promo_code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{promo.name}</Typography>
                    {promo.description && (
                      <Typography variant="caption" color="text.secondary">{promo.description}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={discountLabel(promo)}
                      size="small"
                      sx={{ bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 700, fontSize: 11 }}
                    />
                    {promo.max_discount_cap && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        cap ₹{promo.max_discount_cap}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack gap={0.5}>
                      {promo.applicable_plans.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">All plans</Typography>
                      ) : (
                        promo.applicable_plans.map((p) => (
                          <Chip key={p} label={p} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                        ))
                      )}
                      {promo.applicable_cycles.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">All cycles</Typography>
                      ) : (
                        promo.applicable_cycles.map((c) => (
                          <Chip key={c} label={c} size="small" variant="outlined" color="secondary" sx={{ fontSize: 10, height: 18 }} />
                        ))
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{promo.valid_from}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{promo.valid_until}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {promo.used_count}{promo.max_uses ? ` / ${promo.max_uses}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>{statusChip(promo)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" gap={0.5} justifyContent="flex-end">
                      <Tooltip title="Send to unsubscribed owners">
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setBlasting(promo)}
                            disabled={!promo.is_active || isExpired(promo.valid_until)}
                          >
                            <SendIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Edit promo">
                        <IconButton size="small" onClick={() => setEditing(promo)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Divider sx={{ my: 3 }} />
      <Box sx={{ bgcolor: '#f0f9ff', borderRadius: 2, p: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} mb={0.5}>How it works</Typography>
        <Stack component="ol" sx={{ m: 0, pl: 2.5, gap: 0.5 }}>
          {[
            'Create a promo with a festive code (e.g. DIWALI2026), discount, and validity dates.',
            'Click the send icon to blast an in-app notification to all nursery owners without an active subscription.',
            'Owners see the notification in their GreenRoot app and can apply the code at checkout.',
            'Track usage with the used / max counter. Deactivate a promo any time.',
          ].map((step, i) => (
            <Typography key={i} component="li" variant="body2" color="text.secondary">{step}</Typography>
          ))}
        </Stack>
      </Box>

      <PromoCreateDrawer
        open={creating || !!editing}
        promo={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
      />
      <BlastDialog promo={blasting} onClose={() => setBlasting(null)} />
    </Box>
  );
}
