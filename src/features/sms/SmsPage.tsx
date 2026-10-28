import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import dayjs from 'dayjs';
import { PageHeader } from '../../components/page/PageHeader';
import { ReadinessCard, StatusChip } from '../messaging/shared';
import { useToast } from '../../components/feedback/toastContext';
import { normalizeApiError } from '../../utils/apiError';
import {
  DLT_OPERATORS,
  ENTITY_STATUSES,
  HEADER_TYPES,
  MESSAGE_STATUSES,
  REG_STATUSES,
  useGetSmsEntityQuery,
  useGetSmsStatusQuery,
  useListSmsHeadersQuery,
  useListSmsMessagesQuery,
  useListSmsTemplatesQuery,
  useSaveSmsHeaderMutation,
  useUpdateSmsEntityMutation,
  type SmsEntity,
  type SmsHeader,
  type SmsTemplate,
} from './smsApi';
import { SmsTemplateDrawer } from './SmsTemplateDrawer';
import { FitTableContainer } from '../../components/data-table/FitTableContainer';

const TABS = ['Readiness', 'Principal Entity', 'Headers', 'Templates', 'Message log'] as const;

export function SmsPage() {
  const [tab, setTab] = useState(0);
  const { data: status } = useGetSmsStatusQuery();

  return (
    <Box>
      <PageHeader
        title="SMS / TRAI DLT"
        description="Principal Entity, sender headers and content templates registered on the DLT portal, and every SMS the platform sends."
      />
      {status && (
        <Alert severity={status.live ? 'success' : 'info'} sx={{ mb: 2 }}>
          {status.live ? (
            <>
              Live provider <strong>{status.provider}</strong>: SMS reach handsets. Only DLT-approved templates are sent.
            </>
          ) : (
            <>
              Test mode: no SMS reaches phones yet, and every login uses the test OTP.
            </>
          )}
        </Alert>
      )}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} variant="scrollable">
        {TABS.map((t) => (
          <Tab key={t} label={t} />
        ))}
      </Tabs>
      {tab === 0 && <ReadinessTab />}
      {tab === 1 && <EntityTab />}
      {tab === 2 && <HeadersTab />}
      {tab === 3 && <TemplatesTab live={!!status?.live} />}
      {tab === 4 && <MessagesTab />}
    </Box>
  );
}

// ── Readiness ────────────────────────────────────────────────────────────────

function ReadinessTab() {
  const { data, isLoading, error } = useGetSmsStatusQuery();
  if (isLoading) return <CircularProgress />;
  if (error || !data) return <Alert severity="error">{normalizeApiError(error).message}</Alert>;
  return <ReadinessCard checks={data.checks} ready={data.ready} readyText="ready to go live" />;
}

// ── Principal Entity ─────────────────────────────────────────────────────────

function EntityTab() {
  const { data, isLoading, error } = useGetSmsEntityQuery();
  if (isLoading) return <CircularProgress />;
  // 404 just means no row yet; the form starts from defaults.
  if (error && normalizeApiError(error).status !== 404) return <Alert severity="error">{normalizeApiError(error).message}</Alert>;
  return <EntityForm entity={data?.entity ?? null} />;
}

function EntityForm({ entity }: { entity: SmsEntity | null }) {
  const { showToast } = useToast();
  const [update, { isLoading: saving }] = useUpdateSmsEntityMutation();
  const [form, setForm] = useState<Omit<SmsEntity, 'id'>>(() => ({
    pe_id: entity?.pe_id ?? null,
    entity_name: entity?.entity_name ?? 'GreenRoot',
    dlt_operator: entity?.dlt_operator ?? 'JIO',
    telemarketer_name: entity?.telemarketer_name ?? null,
    telemarketer_id: entity?.telemarketer_id ?? null,
    registration_status: entity?.registration_status ?? 'NOT_REGISTERED',
    notes: entity?.notes ?? null,
  }));
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value === '' ? null : value }));

  const handleSave = async () => {
    try {
      await update(form).unwrap();
      showToast('Principal Entity saved', 'success');
    } catch (err) {
      showToast(normalizeApiError(err).message, 'error');
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, maxWidth: 720 }}>
      <Stack spacing={2}>
        <TextField label="Legal entity name (as on DLT)" value={form.entity_name ?? ''} onChange={(e) => set('entity_name', e.target.value)} fullWidth />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField select label="DLT portal" value={form.dlt_operator} onChange={(e) => set('dlt_operator', e.target.value)} fullWidth>
            {DLT_OPERATORS.map((o) => (
              <MenuItem key={o} value={o}>
                {o}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label="Status" value={form.registration_status} onChange={(e) => set('registration_status', e.target.value)} fullWidth>
            {ENTITY_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <TextField
          label="PE ID (Principal Entity ID)"
          value={form.pe_id ?? ''}
          onChange={(e) => set('pe_id', e.target.value.replace(/\D/g, ''))}
          helperText="Numeric ID issued by the DLT portal. Sent with every SMS."
          fullWidth
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Telemarketer / aggregator" value={form.telemarketer_name ?? ''} onChange={(e) => set('telemarketer_name', e.target.value)} fullWidth />
          <TextField
            label="Telemarketer ID"
            value={form.telemarketer_id ?? ''}
            onChange={(e) => set('telemarketer_id', e.target.value)}
            helperText="For the PE–TM chain binding"
            fullWidth
          />
        </Stack>
        <TextField label="Notes" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} multiline minRows={2} fullWidth />
        <Box>
          <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} onClick={handleSave} disabled={saving}>
            Save
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}

// ── Headers ──────────────────────────────────────────────────────────────────

function HeadersTab() {
  const { data, isLoading } = useListSmsHeadersQuery();
  const [editing, setEditing] = useState<SmsHeader | 'new' | null>(null);
  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" mb={1}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing('new')}>
          New header
        </Button>
      </Stack>
      <FitTableContainer maxHeight={360} component={Paper} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Header</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>DLT header ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.headers ?? []).map((h) => (
              <TableRow key={h.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{h.header}</TableCell>
                <TableCell>{h.header_type}</TableCell>
                <TableCell>{h.dlt_header_id ?? '—'}</TableCell>
                <TableCell>
                  <StatusChip status={h.registration_status} />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" startIcon={<EditIcon fontSize="small" />} onClick={() => setEditing(h)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </FitTableContainer>
      {editing && <HeaderDialog header={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </Box>
  );
}

function HeaderDialog({ header, onClose }: { header: SmsHeader | null; onClose: () => void }) {
  const { showToast } = useToast();
  const [save, { isLoading }] = useSaveSmsHeaderMutation();
  const [form, setForm] = useState<Omit<SmsHeader, 'id'>>(
    header ?? { header: '', header_type: 'SERVICE', dlt_header_id: null, registration_status: 'DRAFT', rejection_reason: null },
  );
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value === '' && key !== 'header' ? null : value }));

  const handleSave = async () => {
    try {
      await save({ id: header?.id, body: form }).unwrap();
      showToast('Header saved', 'success');
      onClose();
    } catch (err) {
      showToast(normalizeApiError(err).message, 'error');
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{header ? `Edit ${header.header}` : 'New header'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField select label="Type" value={form.header_type} onChange={(e) => set('header_type', e.target.value)}>
            {HEADER_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Header"
            value={form.header}
            onChange={(e) => set('header', e.target.value.toUpperCase())}
            inputProps={{ maxLength: 6, style: { fontFamily: 'monospace' } }}
            helperText={form.header_type === 'PROMOTIONAL' ? 'Exactly 6 digits' : 'Exactly 6 letters, related to the brand name'}
          />
          <TextField label="DLT header ID" value={form.dlt_header_id ?? ''} onChange={(e) => set('dlt_header_id', e.target.value)} />
          <TextField select label="Status" value={form.registration_status} onChange={(e) => set('registration_status', e.target.value)}>
            {REG_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          {form.registration_status === 'REJECTED' && (
            <TextField label="Rejection reason" value={form.rejection_reason ?? ''} onChange={(e) => set('rejection_reason', e.target.value)} />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={isLoading}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Templates ────────────────────────────────────────────────────────────────

function TemplatesTab({ live }: { live: boolean }) {
  const { data, isLoading } = useListSmsTemplatesQuery();
  const { data: headers } = useListSmsHeadersQuery();
  const [editing, setEditing] = useState<SmsTemplate | 'new' | null>(null);
  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" mb={1}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing('new')}>
          New template
        </Button>
      </Stack>
      <FitTableContainer maxHeight={360} component={Paper} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Body</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Header</TableCell>
              <TableCell>DLT template ID</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.templates ?? []).map((t) => (
              <TableRow key={t.id} hover onClick={() => setEditing(t)} sx={{ cursor: 'pointer' }}>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace" fontWeight={700}>
                    {t.template_code}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t.template_name}
                    {t.is_system ? ' · system' : ''}
                    {!t.is_active ? ' · inactive' : ''}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 380 }}>
                  <Tooltip title={t.body}>
                    <Typography variant="caption" fontFamily="monospace" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.body}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{t.category}</Typography>
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{t.header ?? '—'}</TableCell>
                <TableCell>{t.dlt_template_id ?? '—'}</TableCell>
                <TableCell>
                  <StatusChip status={t.registration_status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </FitTableContainer>
      {editing && (
        <SmsTemplateDrawer
          template={editing === 'new' ? null : editing}
          headers={headers?.headers ?? []}
          live={live}
          onClose={() => setEditing(null)}
        />
      )}
    </Box>
  );
}

// ── Message log ──────────────────────────────────────────────────────────────

function MessagesTab() {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [status, setStatus] = useState('');
  const [templateCode, setTemplateCode] = useState('');
  const [mobile, setMobile] = useState('');
  const { data, isFetching } = useListSmsMessagesQuery({
    page: page + 1,
    per_page: perPage,
    status: status || undefined,
    template_code: templateCode || undefined,
    mobile: mobile || undefined,
  });

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <TextField select size="small" label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} sx={{ minWidth: 160 }}>
          <MenuItem value="">All</MenuItem>
          {MESSAGE_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" label="Template code" value={templateCode} onChange={(e) => { setTemplateCode(e.target.value.toUpperCase()); setPage(0); }} />
        <TextField size="small" label="Mobile" value={mobile} onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '')); setPage(0); }} />
        {isFetching && <CircularProgress size={20} />}
      </Stack>
      <FitTableContainer maxHeight={360} component={Paper} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Mobile</TableCell>
              <TableCell>Template</TableCell>
              <TableCell>Message (OTP masked)</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.messages ?? []).map((m) => (
              <TableRow key={m.id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{dayjs(m.created_at).format('DD MMM, HH:mm:ss')}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{m.mobile}</TableCell>
                <TableCell>
                  <Typography variant="caption" fontFamily="monospace">
                    {m.template_code}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 420 }}>
                  <Typography variant="caption">{m.message_body}</Typography>
                  {m.error_message && (
                    <Typography variant="caption" color="error" display="block">
                      {m.error_code}: {m.error_message}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <StatusChip status={m.status} />
                </TableCell>
              </TableRow>
            ))}
            {data && data.messages.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    No SMS sent yet
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </FitTableContainer>
      <TablePagination
        component="div"
        count={data?.pagination.total ?? 0}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={perPage}
        onRowsPerPageChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }}
        rowsPerPageOptions={[20, 50, 100]}
      />
    </Box>
  );
}
