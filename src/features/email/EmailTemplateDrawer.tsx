import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  FormControlLabel,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import { useToast } from '../../components/feedback/toastContext';
import { normalizeApiError } from '../../utils/apiError';
import {
  usePreviewEmailTemplateMutation,
  useSaveEmailTemplateMutation,
  useTestEmailTemplateMutation,
  type EmailPreview,
  type EmailTemplate,
  type EmailTemplateBody,
} from './emailApi';

// Sample values matching the semantic event values the API sends.
const SAMPLES: Record<string, string> = {
  otp: '123456',
  valid_minutes: '10',
  amount: '1250.50',
  order_code: 'ORD-20261016-0008',
  payment_code: 'PAY-20261016-0012',
  mobile: '9876543210',
};

type Props = { template: EmailTemplate | null; live: boolean; onClose: () => void };

// Mounted only while open (parent renders it conditionally), so state
// initializes straight from props.
export function EmailTemplateDrawer({ template, live, onClose }: Props) {
  const { showToast } = useToast();
  const [form, setForm] = useState<EmailTemplateBody>(() => ({
    template_code: template?.template_code ?? '',
    template_name: template?.template_name ?? '',
    subject: template?.subject ?? '',
    body_html: template?.body_html ?? '',
    body_text: template?.body_text ?? '',
    is_active: template?.is_active ?? true,
  }));
  const [samples, setSamples] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<EmailPreview | null>(null);
  const [view, setView] = useState<'html' | 'text'>('html');
  const [testTo, setTestTo] = useState('');

  const [save, { isLoading: saving }] = useSaveEmailTemplateMutation();
  const [runPreview] = usePreviewEmailTemplateMutation();
  const [testSend, { isLoading: testing }] = useTestEmailTemplateMutation();

  const set = <K extends keyof EmailTemplateBody>(key: K, value: EmailTemplateBody[K]) => setForm((f) => ({ ...f, [key]: value }));
  const variables = preview?.variables ?? template?.variables ?? [];
  const sampleFor = (name: string) => samples[name] ?? SAMPLES[name] ?? `sample_${name}`;

  // Debounced server-side render: the API owns placeholder parsing and escaping.
  useEffect(() => {
    const handle = setTimeout(() => {
      const values: Record<string, string> = {};
      for (const m of `${form.subject} ${form.body_html} ${form.body_text}`.matchAll(/\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g)) {
        values[m[1]] = samples[m[1]] ?? SAMPLES[m[1]] ?? `sample_${m[1]}`;
      }
      runPreview({ subject: form.subject, body_html: form.body_html, body_text: form.body_text, sample_values: values })
        .unwrap()
        .then(setPreview)
        .catch(() => setPreview(null));
    }, 400);
    return () => clearTimeout(handle);
  }, [form.subject, form.body_html, form.body_text, samples, runPreview]);

  const handleSave = async () => {
    try {
      await save({ id: template?.id, body: form }).unwrap();
      showToast(template ? 'Template saved' : 'Template created', 'success');
      onClose();
    } catch (err) {
      showToast(normalizeApiError(err).message, 'error');
    }
  };

  const handleTest = async () => {
    if (!template) return;
    const values = Object.fromEntries(variables.map((v) => [v, sampleFor(v)]));
    try {
      const { result } = await testSend({ id: template.id, to: testTo, values }).unwrap();
      showToast(`Test email ${result.status.toLowerCase()}`, 'success');
    } catch (err) {
      showToast(normalizeApiError(err).message, 'error');
    }
  };

  return (
    <Drawer anchor="right" open onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', md: 760 } } }}>
      <Box p={3}>
        <Typography variant="h6" fontWeight={700}>
          {template ? `Edit ${template.template_code}` : 'New email template'}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Use <code>{'{{variable_name}}'}</code> placeholders. Values are HTML-escaped automatically. The HTML body is content only — the
          GreenRoot header and footer are added for you.
        </Typography>

        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Template code"
              value={form.template_code}
              onChange={(e) => set('template_code', e.target.value.toUpperCase())}
              disabled={!!template?.is_system}
              helperText={
                template?.is_system
                  ? 'Sent automatically by GreenRoot, so the code cannot change'
                  : 'UPPER_SNAKE_CASE. Use the same code as an SMS template to send both for one event.'
              }
              fullWidth
            />
            <TextField label="Name" value={form.template_name} onChange={(e) => set('template_name', e.target.value)} fullWidth />
          </Stack>
          <TextField label="Subject" value={form.subject} onChange={(e) => set('subject', e.target.value)} fullWidth />
          <TextField
            label="HTML body (content only)"
            value={form.body_html}
            onChange={(e) => set('body_html', e.target.value)}
            multiline
            minRows={6}
            fullWidth
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13 } }}
          />
          <TextField
            label="Plain-text body"
            value={form.body_text}
            onChange={(e) => set('body_text', e.target.value)}
            multiline
            minRows={4}
            fullWidth
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13 } }}
            helperText="Shown by mail clients that do not render HTML; also helps deliverability."
          />

          {variables.length > 0 && (
            <Box>
              <Typography variant="subtitle2" mb={1}>
                Sample values for preview
              </Typography>
              <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                {variables.map((name) => (
                  <TextField
                    key={name}
                    size="small"
                    label={name}
                    value={sampleFor(name)}
                    onChange={(e) => setSamples((s) => ({ ...s, [name]: e.target.value }))}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {preview && (
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">Preview</Typography>
                <Tabs value={view} onChange={(_, v) => setView(v)} sx={{ minHeight: 32 }}>
                  <Tab value="html" label="HTML" sx={{ minHeight: 32, py: 0 }} />
                  <Tab value="text" label="Text" sx={{ minHeight: 32, py: 0 }} />
                </Tabs>
              </Stack>
              {preview.subject && (
                <Typography variant="body2" my={1}>
                  <strong>Subject:</strong> {preview.subject}
                </Typography>
              )}
              {view === 'html' && preview.html && (
                // sandbox="" blocks scripts, forms and navigation inside the preview.
                <Box
                  component="iframe"
                  title="Email preview"
                  sandbox=""
                  srcDoc={preview.html}
                  sx={{ width: '100%', height: 420, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: '#fff' }}
                />
              )}
              {view === 'text' && (
                <Box component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: 13, bgcolor: 'action.hover', p: 1.5, borderRadius: 1, m: 0 }}>
                  {preview.text || '(no text body)'}
                </Box>
              )}
              {preview.errors.map((e) => (
                <Alert key={e} severity="error" sx={{ mt: 1, py: 0 }}>
                  {e}
                </Alert>
              ))}
              {preview.warnings.map((w) => (
                <Alert key={w} severity="warning" sx={{ mt: 1, py: 0 }}>
                  {w}
                </Alert>
              ))}
            </Box>
          )}

          <FormControlLabel
            control={<Switch checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} disabled={!!template?.is_system} />}
            label="Active"
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} onClick={handleSave} disabled={saving}>
              Save
            </Button>
          </Stack>

          {template && (
            <>
              <Divider />
              <Typography variant="subtitle2">Send a test</Typography>
              {live && <Alert severity="warning">The email provider is live: this sends a real email.</Alert>}
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField size="small" label="To address" value={testTo} onChange={(e) => setTestTo(e.target.value)} helperText="Uses the sample values above" />
                <Button variant="outlined" startIcon={testing ? <CircularProgress size={16} /> : <SendIcon />} onClick={handleTest} disabled={testing || !testTo}>
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
