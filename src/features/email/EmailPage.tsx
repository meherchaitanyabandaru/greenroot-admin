import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import dayjs from 'dayjs';
import { PageHeader } from '../../components/page/PageHeader';
import { useToast } from '../../components/feedback/ToastProvider';
import { normalizeApiError } from '../../utils/apiError';
import { ReadinessCard, StatusChip, StepsCard } from '../messaging/shared';
import {
  EMAIL_MESSAGE_STATUSES,
  useGetEmailSenderQuery,
  useGetEmailStatusQuery,
  useListEmailMessagesQuery,
  useListEmailTemplatesQuery,
  useUpdateEmailSenderMutation,
  type EmailSender,
  type EmailTemplate,
} from './emailApi';
import { EmailTemplateDrawer } from './EmailTemplateDrawer';

const TABS = ['Readiness', 'Sender', 'Templates', 'Message log'] as const;

export function EmailPage() {
  const [tab, setTab] = useState(0);
  const { data: status } = useGetEmailStatusQuery();

  return (
    <Box p={3}>
      <PageHeader
        title="Email"
        description="Sender identity, email templates and every email the platform sends. Templates that share a code with an SMS template go out together for the same event."
      />
      {status && (
        <Alert severity={status.live ? 'success' : 'info'} sx={{ mb: 2 }}>
          {status.live ? (
            <>
              Live provider <strong>{status.provider}</strong>: emails are delivered.
            </>
          ) : (
            <>
              Mock mode (<code>EMAIL_PROVIDER=mock</code>): nothing is delivered and the email verification code is the fixed dev code.
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
      {tab === 1 && <SenderTab />}
      {tab === 2 && <TemplatesTab live={!!status?.live} />}
      {tab === 3 && <MessagesTab />}
    </Box>
  );
}

function ReadinessTab() {
  const { data, isLoading, error } = useGetEmailStatusQuery();
  if (isLoading) return <CircularProgress />;
  if (error || !data) return <Alert severity="error">{normalizeApiError(error).message}</Alert>;
  return (
    <Stack spacing={3}>
      <ReadinessCard checks={data.checks} ready={data.ready} readyText="ready to switch the provider to live" />
      <StepsCard
        title="How to go live"
        steps={[
          'Pick an email provider (e.g. Amazon SES, SendGrid, Postmark) and verify the sending domain there.',
          'Publish the SPF, DKIM and DMARC DNS records the provider gives you, then tick "Domain verified" under Sender.',
          'Set the From address (e.g. no-reply@yourdomain) and an optional Reply-To under Sender.',
          'Implement the provider in platform/email and set EMAIL_PROVIDER. Verification codes become random immediately.',
        ]}
      />
    </Stack>
  );
}

function SenderTab() {
  const { data, isLoading, error } = useGetEmailSenderQuery();
  if (isLoading) return <CircularProgress />;
  if (error && normalizeApiError(error).status !== 404) return <Alert severity="error">{normalizeApiError(error).message}</Alert>;
  return <SenderForm sender={data?.sender ?? null} />;
}

function SenderForm({ sender }: { sender: EmailSender | null }) {
  const { showToast } = useToast();
  const [update, { isLoading }] = useUpdateEmailSenderMutation();
  const [form, setForm] = useState(() => ({
    from_name: sender?.from_name ?? 'GreenRoot',
    from_address: sender?.from_address ?? '',
    reply_to: sender?.reply_to ?? '',
    domain_verified: sender?.domain_verified ?? false,
  }));

  const handleSave = async () => {
    try {
      await update({
        from_name: form.from_name,
        from_address: form.from_address.trim() || null,
        reply_to: form.reply_to.trim() || null,
        domain_verified: form.domain_verified,
      }).unwrap();
      showToast('Sender saved', 'success');
    } catch (err) {
      showToast(normalizeApiError(err).message, 'error');
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, maxWidth: 640 }}>
      <Stack spacing={2}>
        <TextField label="From name" value={form.from_name} onChange={(e) => setForm({ ...form, from_name: e.target.value })} />
        <TextField
          label="From address"
          value={form.from_address}
          onChange={(e) => setForm({ ...form, from_address: e.target.value })}
          helperText="Must be on a domain you have verified with the email provider"
        />
        <TextField label="Reply-To (optional)" value={form.reply_to} onChange={(e) => setForm({ ...form, reply_to: e.target.value })} />
        <FormControlLabel
          control={<Switch checked={form.domain_verified} onChange={(e) => setForm({ ...form, domain_verified: e.target.checked })} />}
          label="Domain verified (SPF, DKIM and DMARC records published)"
        />
        <Box>
          <Button variant="contained" startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} onClick={handleSave} disabled={isLoading}>
            Save
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}

function TemplatesTab({ live }: { live: boolean }) {
  const { data, isLoading } = useListEmailTemplatesQuery();
  const [editing, setEditing] = useState<EmailTemplate | 'new' | null>(null);
  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" mb={1}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing('new')}>
          New template
        </Button>
      </Stack>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Variables</TableCell>
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
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{t.subject}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" fontFamily="monospace">
                    {t.variables.join(', ') || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <StatusChip status={t.is_active ? 'ACTIVE' : 'INACTIVE'} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {editing && <EmailTemplateDrawer template={editing === 'new' ? null : editing} live={live} onClose={() => setEditing(null)} />}
    </Box>
  );
}

function MessagesTab() {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [status, setStatus] = useState('');
  const [templateCode, setTemplateCode] = useState('');
  const [toEmail, setToEmail] = useState('');
  const { data, isFetching } = useListEmailMessagesQuery({
    page: page + 1,
    per_page: perPage,
    status: status || undefined,
    template_code: templateCode || undefined,
    to_email: toEmail || undefined,
  });

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <TextField select size="small" label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} sx={{ minWidth: 160 }}>
          <MenuItem value="">All</MenuItem>
          {EMAIL_MESSAGE_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" label="Template code" value={templateCode} onChange={(e) => { setTemplateCode(e.target.value.toUpperCase()); setPage(0); }} />
        <TextField size="small" label="To" value={toEmail} onChange={(e) => { setToEmail(e.target.value); setPage(0); }} />
        {isFetching && <CircularProgress size={20} />}
      </Stack>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Template</TableCell>
              <TableCell>Subject / body (codes masked)</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.messages ?? []).map((m) => (
              <TableRow key={m.id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{dayjs(m.created_at).format('DD MMM, HH:mm:ss')}</TableCell>
                <TableCell>{m.to_email}</TableCell>
                <TableCell>
                  <Typography variant="caption" fontFamily="monospace">
                    {m.template_code}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 420 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {m.subject}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {m.body}
                  </Typography>
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
                    No email sent yet
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
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
