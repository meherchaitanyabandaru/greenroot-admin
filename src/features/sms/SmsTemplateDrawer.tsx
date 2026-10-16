import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import { useToast } from '../../components/feedback/ToastProvider';
import { normalizeApiError } from '../../utils/apiError';
import {
  CATEGORIES,
  REG_STATUSES,
  VARIABLE_TAGS,
  usePreviewSmsTemplateMutation,
  useSaveSmsTemplateMutation,
  useTestSmsTemplateMutation,
  type SmsHeader,
  type SmsPreview,
  type SmsTemplate,
  type SmsTemplateBody,
} from './smsApi';

const TAG_RE = /\{#([^{}#]*)#\}/g;

// Defaults that satisfy each tag's validation, so the preview renders immediately.
const SAMPLE_BY_TAG: Record<string, string> = {
  numeric: '123456',
  alphanumeric: 'ABC123',
  email: 'support@greenroot.in',
};

const SAMPLE_BY_NAME: Record<string, string> = {
  otp: '123456',
  valid_minutes: '5',
  mobile_last4: '3210',
  amount_rupees: '1250',
  amount_paise: '50',
  order_date: '20261016',
  order_seq: '0008',
  payment_date: '20261016',
  payment_seq: '0012',
};

const CATEGORY_HELP: Record<string, string> = {
  SERVICE_IMPLICIT: 'OTP, order and payment alerts to existing customers. No consent needed. Use for all GreenRoot system SMS.',
  SERVICE_EXPLICIT: 'Service messages that need recorded consent (the user must have opted in).',
  TRANSACTIONAL: 'Reserved for banks (OTP for a banking transaction). Do not use for GreenRoot.',
  PROMOTIONAL: 'Marketing. Needs opt-in, delivered only 10:00–21:00 IST, numeric header, must say how to opt out.',
};

function parseTags(body: string) {
  return Array.from(body.matchAll(TAG_RE), (m) => m[1]);
}

function splitList(value: string) {
  return value
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

const EMPTY: SmsTemplateBody = {
  template_code: '',
  template_name: '',
  category: 'SERVICE_IMPLICIT',
  header_id: null,
  body: '',
  variables: [],
  is_unicode: false,
  dlt_template_id: null,
  registration_status: 'DRAFT',
  rejection_reason: null,
  whitelisted_urls: [],
  whitelisted_numbers: [],
  is_active: true,
};

type Props = {
  template: SmsTemplate | null;
  headers: SmsHeader[];
  live: boolean;
  onClose: () => void;
};

function initialForm(template: SmsTemplate | null, headers: SmsHeader[]): SmsTemplateBody {
  if (!template) return { ...EMPTY, header_id: headers[0]?.id ?? null };
  return {
    template_code: template.template_code,
    template_name: template.template_name,
    category: template.category,
    header_id: template.header_id,
    body: template.body,
    variables: [...template.variables],
    is_unicode: template.is_unicode,
    dlt_template_id: template.dlt_template_id,
    registration_status: template.registration_status,
    rejection_reason: template.rejection_reason,
    whitelisted_urls: template.whitelisted_urls,
    whitelisted_numbers: template.whitelisted_numbers,
    is_active: template.is_active,
  };
}

// Mounted only while open (parent renders it conditionally), so state
// initializes straight from props.
export function SmsTemplateDrawer({ template, headers, live, onClose }: Props) {
  const { showToast } = useToast();
  const [form, setForm] = useState<SmsTemplateBody>(() => initialForm(template, headers));
  const [urls, setUrls] = useState(() => form.whitelisted_urls.join('\n'));
  const [numbers, setNumbers] = useState(() => form.whitelisted_numbers.join('\n'));
  const [samples, setSamples] = useState<Record<string, string>>({});
  const [testMobile, setTestMobile] = useState('');
  const [preview, setPreview] = useState<SmsPreview | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [save, { isLoading: saving }] = useSaveSmsTemplateMutation();
  const [runPreview] = usePreviewSmsTemplateMutation();
  const [testSend, { isLoading: testing }] = useTestSmsTemplateMutation();

  const tags = useMemo(() => parseTags(form.body), [form.body]);

  // Keep one variable name per placeholder, preserving names already typed.
  const setBody = (body: string) =>
    setForm((f) => ({ ...f, body, variables: parseTags(body).map((_, i) => f.variables[i] ?? `var_${i + 1}`) }));

  const sampleFor = (name: string, tag: string) =>
    samples[name] ?? SAMPLE_BY_NAME[name] ?? SAMPLE_BY_TAG[tag] ?? '';

  const sampleValues = useMemo(() => {
    const values: Record<string, string> = {};
    form.variables.forEach((name, i) => {
      values[name] = sampleFor(name, tags[i] ?? '');
    });
    return values;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.variables, tags, samples]);

  // Debounced server-side validation: the API is the source of truth for DLT rules.
  useEffect(() => {
    if (!form.body.trim()) return;
    const handle = setTimeout(() => {
      runPreview({
        body: form.body,
        variables: form.variables,
        category: form.category,
        header_id: form.header_id,
        is_unicode: form.is_unicode,
        whitelisted_urls: splitList(urls),
        whitelisted_numbers: splitList(numbers),
        sample_values: sampleValues,
      })
        .unwrap()
        .then(setPreview)
        .catch(() => setPreview(null));
    }, 400);
    return () => clearTimeout(handle);
  }, [form.body, form.variables, form.category, form.header_id, form.is_unicode, urls, numbers, sampleValues, runPreview]);

  const wasApproved = template?.registration_status === 'APPROVED';
  const contentLocked = wasApproved && form.registration_status === 'APPROVED';
  const set = <K extends keyof SmsTemplateBody>(key: K, value: SmsTemplateBody[K]) => setForm((f) => ({ ...f, [key]: value }));

  const insertTag = (tag: string) => {
    const el = bodyRef.current;
    const placeholder = `{#${tag}#}`;
    const start = el?.selectionStart ?? form.body.length;
    const end = el?.selectionEnd ?? form.body.length;
    setBody(form.body.slice(0, start) + placeholder + form.body.slice(end));
  };

  const handleSave = async () => {
    try {
      await save({
        id: template?.id,
        body: {
          ...form,
          dlt_template_id: form.dlt_template_id?.trim() || null,
          rejection_reason: form.rejection_reason?.trim() || null,
          whitelisted_urls: splitList(urls),
          whitelisted_numbers: splitList(numbers),
        },
      }).unwrap();
      showToast(template ? 'Template saved' : 'Template created', 'success');
      onClose();
    } catch (err) {
      showToast(normalizeApiError(err).message, 'error');
    }
  };

  const handleTest = async () => {
    if (!template) return;
    try {
      const { result } = await testSend({ id: template.id, mobile: testMobile, values: sampleValues }).unwrap();
      showToast(`Test SMS ${result.status.toLowerCase()} (${result.parts} part${result.parts === 1 ? '' : 's'})`, 'success');
    } catch (err) {
      showToast(normalizeApiError(err).message, 'error');
    }
  };

  const copyBody = async () => {
    try {
      await navigator.clipboard.writeText(form.body);
      showToast('Template text copied — paste it into the DLT portal exactly as is', 'info');
    } catch {
      showToast('Copy failed — select the text manually', 'error');
    }
  };

  return (
    <Drawer anchor="right" open onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', md: 720 } } }}>
      <Box p={3}>
        <Typography variant="h6" fontWeight={700}>
          {template ? `Edit ${template.template_code}` : 'New SMS template'}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          The body must match the text registered on the DLT portal character for character.
        </Typography>

        {contentLocked && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This template is DLT-approved, so its text is locked. To change it, set the status to DRAFT, edit, re-register on DLT,
            then enter the new template ID and approve again.
          </Alert>
        )}

        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Template code"
              value={form.template_code}
              onChange={(e) => set('template_code', e.target.value.toUpperCase())}
              disabled={!!template?.is_system}
              helperText={template?.is_system ? 'System template — the API sends it by this code' : 'UPPER_SNAKE_CASE'}
              fullWidth
            />
            <TextField label="Name" value={form.template_name} onChange={(e) => set('template_name', e.target.value)} fullWidth />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="DLT category"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              disabled={contentLocked}
              helperText={CATEGORY_HELP[form.category]}
              fullWidth
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Header (sender ID)"
              value={form.header_id ?? ''}
              onChange={(e) => set('header_id', e.target.value === '' ? null : Number(e.target.value))}
              disabled={contentLocked}
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {headers.map((h) => (
                <MenuItem key={h.id} value={h.id}>
                  {h.header} · {h.header_type} · {h.registration_status}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Box>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mb={1} alignItems="center">
              <Typography variant="caption" color="text.secondary" mr={0.5}>
                Insert variable:
              </Typography>
              {VARIABLE_TAGS.map((tag) => (
                <Chip key={tag} label={`{#${tag}#}`} size="small" onClick={() => insertTag(tag)} disabled={contentLocked} sx={{ fontFamily: 'monospace' }} />
              ))}
            </Stack>
            <TextField
              label="Template body"
              value={form.body}
              onChange={(e) => setBody(e.target.value)}
              inputRef={bodyRef}
              disabled={contentLocked}
              multiline
              minRows={4}
              fullWidth
              InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13 } }}
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
              <FormControlLabel
                control={<Switch checked={form.is_unicode} onChange={(e) => set('is_unicode', e.target.checked)} disabled={contentLocked} />}
                label={<Typography variant="body2">Unicode (Hindi/Telugu, ₹ etc. — 70 chars per SMS instead of 160)</Typography>}
              />
              <Button size="small" startIcon={<ContentCopyIcon fontSize="small" />} onClick={copyBody} disabled={!form.body}>
                Copy for DLT
              </Button>
            </Stack>
          </Box>

          {tags.length > 0 && (
            <Box>
              <Typography variant="subtitle2" mb={1}>
                Variables (in order of appearance)
              </Typography>
              <Stack spacing={1}>
                {tags.map((tag, i) => {
                  const name = form.variables[i] ?? '';
                  return (
                    <Stack key={i} direction="row" spacing={1} alignItems="center">
                      <Chip label={`${i + 1}. {#${tag}#}`} size="small" variant="outlined" sx={{ fontFamily: 'monospace', minWidth: 150 }} />
                      <TextField
                        size="small"
                        label="Name"
                        value={name}
                        disabled={contentLocked}
                        onChange={(e) => {
                          const variables = [...form.variables];
                          variables[i] = e.target.value.toLowerCase();
                          set('variables', variables);
                        }}
                      />
                      <TextField
                        size="small"
                        label="Sample value"
                        value={sampleFor(name, tag)}
                        onChange={(e) => setSamples((s) => ({ ...s, [name]: e.target.value }))}
                      />
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          )}

          {(tags.includes('url') || tags.includes('urlott') || tags.includes('cbn') || urls || numbers) && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Whitelisted URLs (one per line)"
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                disabled={contentLocked}
                multiline
                minRows={2}
                fullWidth
                helperText="Must match the CTA URLs registered with this template on DLT"
              />
              <TextField
                label="Whitelisted callback numbers"
                value={numbers}
                onChange={(e) => setNumbers(e.target.value)}
                disabled={contentLocked}
                multiline
                minRows={2}
                fullWidth
              />
            </Stack>
          )}

          <SmsPreviewCard preview={form.body.trim() ? preview : null} />

          <Divider />
          <Typography variant="subtitle2">DLT registration</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="Status"
              value={form.registration_status}
              onChange={(e) => set('registration_status', e.target.value)}
              fullWidth
            >
              {REG_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="DLT template ID"
              value={form.dlt_template_id ?? ''}
              onChange={(e) => set('dlt_template_id', e.target.value.replace(/\D/g, ''))}
              helperText="Required before APPROVED"
              fullWidth
            />
          </Stack>
          {form.registration_status === 'REJECTED' && (
            <TextField
              label="Rejection reason from DLT"
              value={form.rejection_reason ?? ''}
              onChange={(e) => set('rejection_reason', e.target.value)}
              fullWidth
            />
          )}
          <FormControlLabel
            control={<Switch checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} disabled={!!template?.is_system} />}
            label="Active"
          />

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              Save
            </Button>
          </Stack>

          {template && (
            <>
              <Divider />
              <Typography variant="subtitle2">Send a test</Typography>
              {live && (
                <Alert severity="warning">
                  The SMS provider is live: this sends a real, billable SMS. Unapproved templates are blocked.
                </Alert>
              )}
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  size="small"
                  label="Mobile number"
                  value={testMobile}
                  onChange={(e) => setTestMobile(e.target.value)}
                  helperText="Uses the sample values above"
                />
                <Button variant="outlined" startIcon={testing ? <CircularProgress size={16} /> : <SendIcon />} onClick={handleTest} disabled={testing || !testMobile}>
                  Send test
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
}

function SmsPreviewCard({ preview }: { preview: SmsPreview | null }) {
  if (!preview) return null;
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.default' }}>
      <Stack direction="row" justifyContent="space-between" mb={1}>
        <Typography variant="subtitle2">Preview</Typography>
        {preview.valid && (
          <Typography variant="caption" color="text.secondary">
            {preview.encoding} · {preview.chars} chars · {preview.parts} SMS part{preview.parts === 1 ? '' : 's'}
          </Typography>
        )}
      </Stack>
      {preview.rendered && (
        <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 1.5, mb: 1, whiteSpace: 'pre-wrap', fontSize: 14 }}>{preview.rendered}</Box>
      )}
      {preview.errors.map((e) => (
        <Alert key={e} severity="error" sx={{ mb: 0.5, py: 0 }}>
          {e}
        </Alert>
      ))}
      {preview.warnings.map((w) => (
        <Alert key={w} severity="warning" sx={{ mb: 0.5, py: 0 }}>
          {w}
        </Alert>
      ))}
    </Box>
  );
}
