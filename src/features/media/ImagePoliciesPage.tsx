import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useToast } from '../../components/feedback/toastContext';
import { FormDrawer } from '../../components/forms/FormDrawer';
import { PageHeader } from '../../components/page/PageHeader';
import { normalizeApiError } from '../../utils/apiError';
import { formatDateTime } from '../../utils/labels';
import {
  type AdminImagePolicy,
  CATEGORY_LABELS,
  type PolicyUpdate,
  policyProblem,
  policyRisks,
  useImagePolicyHistoryQuery,
  useListAdminImagePoliciesQuery,
  useUpdateImagePolicyMutation,
} from './imagePoliciesApi';

const kb = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);

function Value({ label, value, def }: { label: string; value: string; def: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600}>
        {value}
        {value !== def && <Typography component="span" variant="caption" color="warning.main"> (default {def})</Typography>}
      </Typography>
    </Box>
  );
}

/**
 * Admin → Image Policies: how photos of each kind are resized and compressed
 * in the apps, and what the API accepts. Only a super admin edits; each save
 * is a new version with a reason. Stored photos are never changed.
 */
export function ImagePoliciesPage() {
  const { data, isLoading, error, refetch } = useListAdminImagePoliciesQuery();
  const [editing, setEditing] = useState<AdminImagePolicy | null>(null);
  const [history, setHistory] = useState<string | null>(null);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />;
  const canEdit = data?.can_edit ?? false;

  return (
    <Box>
      <PageHeader
        title="Image Policies"
        description="How the apps resize and compress each kind of photo, and what the API accepts. The API checks every upload (format, a readable image, size limits, a 40 MP cap), whatever is set here. Changes apply to new uploads only."
      />
      {!canEdit && <Alert severity="info" sx={{ mb: 2 }}>Only a super admin can change image policies.</Alert>}
      <Grid container spacing={2}>
        {(data?.policies ?? []).map((p) => (
          <Grid key={p.category} size={{ xs: 12, md: 6, lg: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                  <Box>
                    <Typography fontWeight={700}>{CATEGORY_LABELS[p.category] ?? p.category}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.category} · version {p.version}</Typography>
                  </Box>
                  <Chip size="small" label={p.is_compression_enabled ? 'Compressed' : 'Compression off'} color={p.is_compression_enabled ? 'success' : 'warning'} />
                </Stack>
                <Grid container spacing={1}>
                  <Grid size={6}><Value label="Longest side" value={`${p.max_side} px`} def={`${p.default.max_side} px`} /></Grid>
                  <Grid size={6}><Value label="Shortest side at least" value={`${p.min_side} px`} def={`${p.default.min_side} px`} /></Grid>
                  <Grid size={6}><Value label="JPEG quality" value={String(p.quality)} def={String(p.default.quality)} /></Grid>
                  <Grid size={6}><Value label="Max file size" value={kb(p.max_bytes)} def={kb(p.default.max_bytes)} /></Grid>
                  <Grid size={12}><Value label="Formats" value={p.allowed_formats.join(', ')} def={p.default.allowed_formats.join(', ')} /></Grid>
                </Grid>
                {p.updated_at && <Typography variant="caption" color="text.secondary" display="block" mt={1}>Updated {formatDateTime(p.updated_at)}</Typography>}
              </CardContent>
              <CardActions>
                {canEdit && <Button size="small" variant="contained" onClick={() => setEditing(p)}>Edit</Button>}
                <Button size="small" onClick={() => setHistory(p.category)}>History</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <FormDrawer open={editing !== null} title={editing ? `Edit: ${CATEGORY_LABELS[editing.category] ?? editing.category}` : ''} onClose={() => setEditing(null)} width={{ xs: '100%', sm: 560 }}>
        {editing && <PolicyForm key={`${editing.category}-${editing.version}`} policy={editing} onDone={() => setEditing(null)} />}
      </FormDrawer>
      <FormDrawer open={history !== null} title="Policy history" onClose={() => setHistory(null)} width={{ xs: '100%', sm: 640 }}>
        {history && <PolicyHistory category={history} />}
      </FormDrawer>
    </Box>
  );
}

export function PolicyForm({ policy, onDone }: { policy: AdminImagePolicy; onDone: () => void }) {
  const { showToast } = useToast();
  const [save, saveState] = useUpdateImagePolicyMutation();
  const b = policy.bounds;
  const [form, setForm] = useState<PolicyUpdate>({
    max_side: policy.max_side,
    min_side: policy.min_side,
    quality: policy.quality,
    max_bytes: policy.max_bytes,
    allowed_formats: policy.allowed_formats,
    is_compression_enabled: policy.is_compression_enabled,
    version: policy.version,
    change_note: '',
  });
  const [confirming, setConfirming] = useState<string[] | null>(null);
  const [err, setErr] = useState('');
  const problem = policyProblem(form, b);
  const set = (patch: Partial<PolicyUpdate>) => setForm((f) => ({ ...f, ...patch }));
  const num = (key: 'max_side' | 'min_side' | 'quality') => (e: React.ChangeEvent<HTMLInputElement>) => set({ [key]: Number(e.target.value) });

  async function submit() {
    setErr('');
    try {
      await save({ category: policy.category, body: { ...form, change_note: form.change_note.trim() } }).unwrap();
      showToast('Policy saved — new uploads follow it within a minute', 'success');
      onDone();
    } catch (e) {
      setConfirming(null);
      setErr(normalizeApiError(e).message);
    }
  }

  function trySave() {
    const risks = policyRisks(form, policy.default);
    if (risks.length) setConfirming(risks);
    else void submit();
  }

  const toggleFormat = (f: string) =>
    set({ allowed_formats: form.allowed_formats.includes(f) ? form.allowed_formats.filter((x) => x !== f) : [...form.allowed_formats, f].sort() });

  return (
    <Stack spacing={2}>
      {err && <Alert severity="error">{err}</Alert>}
      <TextField label="Longest side (px)" type="number" value={form.max_side} onChange={num('max_side')}
        helperText={`Photos are resized to this. Default ${policy.default.max_side}; allowed ${b.max_side_min}–${b.max_side_max}.`} />
      <TextField label="Shortest side at least (px)" type="number" value={form.min_side} onChange={num('min_side')}
        helperText={`Smaller photos are refused with a retake hint. Default ${policy.default.min_side}; at least ${b.min_side_min}.`} />
      <TextField label="JPEG quality" type="number" value={form.quality} onChange={num('quality')}
        helperText={`Default ${policy.default.quality}; allowed ${b.quality_min}–${b.quality_max}.`} />
      <TextField label="Max file size (KB)" type="number" value={Math.round(form.max_bytes / 1024)}
        onChange={(e) => set({ max_bytes: Number(e.target.value) * 1024 })}
        helperText={`Default ${kb(policy.default.max_bytes)}; allowed ${kb(b.max_bytes_min)}–${kb(b.max_bytes_max)}.`} />
      <FormGroup row>
        {['JPEG', 'PNG'].map((f) => (
          <FormControlLabel key={f} control={<Checkbox checked={form.allowed_formats.includes(f)} onChange={() => toggleFormat(f)} />} label={f} />
        ))}
      </FormGroup>
      <FormControlLabel
        control={<Switch checked={form.is_compression_enabled} onChange={(e) => set({ is_compression_enabled: e.target.checked })} />}
        label="Compress photos (off: photos already within the limits go unchanged; resizing and all API checks still apply)"
      />
      <Button size="small" onClick={() => setForm((f) => ({ ...f, ...policy.default, version: f.version, change_note: f.change_note }))}>
        Reset to the safe default
      </Button>
      <Divider />
      <PolicyPreview policy={form} />
      <Divider />
      <TextField label="Why are you changing it?" required multiline minRows={2} value={form.change_note}
        onChange={(e) => set({ change_note: e.target.value })} helperText="Kept in the policy history and the audit log." />
      {problem && form.change_note && <Alert severity="warning">{problem}</Alert>}
      <Button variant="contained" disabled={Boolean(problem) || saveState.isLoading} onClick={trySave}>Save as version {policy.version + 1}</Button>

      <Dialog open={confirming !== null} onClose={() => setConfirming(null)}>
        <DialogTitle>Save this policy?</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            {(confirming ?? []).map((r) => <Alert key={r} severity="warning">{r}</Alert>)}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(null)}>Go back</Button>
          <Button variant="contained" color="warning" disabled={saveState.isLoading} onClick={() => void submit()}>Save anyway</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

/**
 * What a photo would become under the policy: picked here, resized and
 * compressed in the browser like the apps do. Nothing is uploaded.
 */
function PolicyPreview({ policy }: { policy: PolicyUpdate }) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ url: string; w: number; h: number; bytes: number; inBytes: number; tooSmall: boolean } | null>(null);

  useEffect(() => {
    if (!file) return;
    let url = '';
    let cancelled = false;
    const src = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const longest = Math.max(image.width, image.height);
      const scale = Math.min(1, policy.max_side / longest);
      const w = Math.round(image.width * scale);
      const h = Math.round(image.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')?.drawImage(image, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (!blob || cancelled) return;
        url = URL.createObjectURL(blob);
        setResult({ url, w, h, bytes: blob.size, inBytes: file.size, tooSmall: Math.min(image.width, image.height) < policy.min_side });
      }, 'image/jpeg', policy.quality / 100);
      URL.revokeObjectURL(src);
    };
    image.src = src;
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file, policy.max_side, policy.min_side, policy.quality]);

  return (
    <Stack spacing={1}>
      <Typography fontWeight={700}>Preview</Typography>
      <Typography variant="caption" color="text.secondary">Pick a sample photo to see what the apps would upload. It stays on this computer.</Typography>
      <Button component="label" variant="outlined" size="small" sx={{ alignSelf: 'flex-start' }}>
        Choose a sample photo
        <input hidden type="file" accept="image/jpeg,image/png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </Button>
      {result && (
        <Stack spacing={1}>
          {result.tooSmall && <Alert severity="error">This photo would be refused: its shortest side is under {policy.min_side} px.</Alert>}
          {!result.tooSmall && result.bytes > policy.max_bytes && <Alert severity="error">The result ({kb(result.bytes)}) is over the {kb(policy.max_bytes)} limit.</Alert>}
          <Typography variant="body2">
            {result.w} × {result.h} px · {kb(result.inBytes)} → <strong>{kb(result.bytes)}</strong>
          </Typography>
          <Box component="img" src={result.url} alt="Preview of the compressed photo" sx={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 1, border: 1, borderColor: 'divider' }} />
        </Stack>
      )}
    </Stack>
  );
}

function PolicyHistory({ category }: { category: string }) {
  const { data, isLoading, error, refetch } = useImagePolicyHistoryQuery(category);
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />;
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {['Version', 'When / who', 'Values', 'Why'].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
        </TableRow>
      </TableHead>
      <TableBody>
        {(data?.history ?? []).map((h) => (
          <TableRow key={h.version}>
            <TableCell>v{h.version}</TableCell>
            <TableCell>
              <Typography fontSize={13}>{formatDateTime(h.created_at)}</Typography>
              <Typography fontSize={12} color="text.secondary">{h.changed_by_name ?? (h.changed_by_user_id ? `User #${h.changed_by_user_id}` : 'System')}</Typography>
            </TableCell>
            <TableCell>
              <Typography fontSize={12}>
                {h.policy.max_side}px max · {h.policy.min_side}px min · q{h.policy.quality} · {kb(h.policy.max_bytes)} · {h.policy.allowed_formats.join('/')}
                {h.policy.is_compression_enabled ? '' : ' · compression off'}
              </Typography>
            </TableCell>
            <TableCell>{h.change_note ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
