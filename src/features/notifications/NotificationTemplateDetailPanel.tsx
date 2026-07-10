import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useListResourceQuery, useUpdateNotificationTemplateMutation } from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { normalizeApiError } from '../../utils/apiError';

function text(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value);
}

export function NotificationTemplateDetailPanel({ templateId }: { templateId: number }) {
  const { data, isLoading, error, refetch } = useListResourceQuery(
    { resource: 'notificationTemplates', params: { page: 1, per_page: 100 } },
  );

  const [updateTemplate, updateState] = useUpdateNotificationTemplateMutation();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const template = data?.rows.find((r) => Number(r.id) === templateId) ?? null;

  useEffect(() => {
    if (template) {
      setName(text(template.template_name));
      setSubject(text(template.subject));
      setMessageTemplate(text(template.message_template));
      setIsActive(Boolean(template.is_active));
    }
  }, [template]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />;
  if (!template) return <Typography color="text.secondary">Template not found.</Typography>;

  async function handleSave() {
    try {
      setSaveError('');
      setSaved(false);
      await updateTemplate({
        id: templateId,
        body: {
          template_code: text(template!.template_code),
          template_name: name || undefined,
          channel: text(template!.channel),
          subject: subject || undefined,
          message_template: messageTemplate || undefined,
          is_active: isActive,
        },
      }).unwrap();
      setSaved(true);
      refetch();
    } catch (e) {
      setSaveError(normalizeApiError(e).message);
    }
  }

  return (
    <Stack spacing={2}>
      {saved && <Alert severity="success">Template updated.</Alert>}
      {saveError && <Alert severity="error">{saveError}</Alert>}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography color="text.secondary" variant="body2">Notification Template</Typography>
              <Typography variant="h6" fontFamily="monospace">{text(template.template_code)}</Typography>
            </Box>
            <Chip
              size="small"
              label={isActive ? 'Active' : 'Inactive'}
              color={isActive ? 'success' : 'default'}
              variant="outlined"
            />
          </Stack>

          {/* Read-only meta */}
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography color="text.secondary" variant="caption">Template Code</Typography>
              <Typography variant="body2" fontFamily="monospace">{text(template.template_code)}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography color="text.secondary" variant="caption">Channel</Typography>
              <Typography variant="body2">{text(template.channel)}</Typography>
            </Grid>
          </Grid>

          {/* Editable fields */}
          <TextField
            label="Template Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            size="small"
            fullWidth
            helperText="Used for email channel."
          />
          <TextField
            label="Message Template"
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={5}
            helperText="Use {{variable}} placeholders."
          />
          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                size="small"
              />
            }
            label="Active"
          />

          <Button
            variant="contained"
            size="small"
            onClick={handleSave}
            disabled={updateState.isLoading}
            sx={{ alignSelf: 'flex-start' }}
          >
            {updateState.isLoading ? 'Saving…' : 'Save Changes'}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
