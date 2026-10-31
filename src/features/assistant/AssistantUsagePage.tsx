import { Alert, Box, Button, Card, CardContent, Chip, FormControlLabel, LinearProgress, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useToast } from '../../components/feedback/toastContext';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { PageHeader } from '../../components/page/PageHeader';
import { normalizeApiError } from '../../utils/apiError';
import { type AssistantSettings, KIND_LABEL, useGetAssistantSettingsQuery, useGetAssistantUsageQuery, useSaveAssistantSettingsMutation } from './assistantApi';

const usd = (n: number) => `$${n.toFixed(4)}`;

/** Admin → Mango AI: what the assistant has cost today and this month, against the limits. */
export function AssistantUsagePage() {
  const { data, isLoading, error, refetch } = useGetAssistantUsageQuery(undefined, { pollingInterval: 60_000 });
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />;
  const today = data.usage.reduce((s, k) => s + k.estimated_usd_today, 0);
  const month = data.usage.reduce((s, k) => s + k.estimated_usd_month, 0);
  const bar = (used: number, limit: number) => Math.min(100, limit > 0 ? (used / limit) * 100 : 0);
  return (
    <Box>
      <PageHeader title="Mango AI" description="Usage of the in-app assistant. No conversation text or audio is stored; only units and estimated cost." />
      <Stack direction="row" spacing={1} mb={2}>
        <Chip color={data.enabled ? 'success' : 'default'} label={data.enabled ? 'AI on' : 'AI switched off (AI_ENABLED)'} />
      </Stack>
      <SettingsCard />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
        {[
          { label: 'Today, all users', used: today, limit: data.limits.global_daily_usd },
          { label: 'This month, all users', used: month, limit: data.limits.global_monthly_usd },
        ].map((b) => (
          <Card key={b.label} variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Typography color="text.secondary" fontSize={13}>{b.label}</Typography>
              <Typography variant="h5">{usd(b.used)} <Typography component="span" color="text.secondary">of {usd(b.limit)}</Typography></Typography>
              <LinearProgress variant="determinate" value={bar(b.used, b.limit)} color={bar(b.used, b.limit) >= 80 ? 'warning' : 'primary'} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Kind</TableCell><TableCell align="right">Calls today</TableCell><TableCell align="right">Est. today</TableCell>
            <TableCell align="right">Calls this month</TableCell><TableCell align="right">Est. this month</TableCell><TableCell align="right">Tokens in / out</TableCell><TableCell align="right">Audio (s)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.usage.length === 0 && <TableRow><TableCell colSpan={7}>No AI calls this month.</TableCell></TableRow>}
          {data.usage.map((k) => (
            <TableRow key={k.kind}>
              <TableCell>{KIND_LABEL[k.kind] ?? k.kind}</TableCell>
              <TableCell align="right">{k.calls_today}</TableCell>
              <TableCell align="right">{usd(k.estimated_usd_today)}</TableCell>
              <TableCell align="right">{k.calls_month}</TableCell>
              <TableCell align="right">{usd(k.estimated_usd_month)}</TableCell>
              <TableCell align="right">{k.input_tokens_month} / {k.output_tokens_month}</TableCell>
              <TableCell align="right">{k.audio_seconds_month.toFixed(0)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Alert severity="info" sx={{ mt: 2 }}>
        Per user: {data.limits.user_minute_calls} calls a minute, {data.limits.user_daily_calls} a day, {usd(data.limits.user_daily_usd)} a day.
        Recordings up to {data.limits.max_audio_seconds} s. {data.note} Limits are set in the API environment (AI_*).
      </Alert>
    </Box>
  );
}

/** Mango on/off and the daily questions per person (owners, managers, customers). */
function SettingsCard() {
  const { showToast } = useToast();
  const { data } = useGetAssistantSettingsQuery();
  const [save, saveState] = useSaveAssistantSettingsMutation();
  const [edit, setEdit] = useState<Partial<AssistantSettings>>({});
  if (!data) return null;
  const s = { ...data.settings, ...edit };
  const valid = Number.isInteger(s.daily_question_limit) && s.daily_question_limit >= 0 && s.daily_question_limit <= data.max_daily_question_limit;
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography fontWeight={700} mb={1}>Mango settings</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <FormControlLabel control={<Switch checked={s.enabled} onChange={(e) => setEdit({ ...edit, enabled: e.target.checked })} />} label="Mango AI on" />
          <TextField size="small" type="number" label="Questions per person per day" value={s.daily_question_limit} sx={{ width: 240 }}
            onChange={(e) => setEdit({ ...edit, daily_question_limit: Number(e.target.value) })}
            error={!valid} helperText={valid ? 'Counted per user, India time; resets at midnight' : `0 to ${data.max_daily_question_limit}`} />
          <Button variant="contained" disabled={!valid || Object.keys(edit).length === 0 || saveState.isLoading}
            onClick={async () => {
              try {
                await save(s).unwrap();
                setEdit({});
                showToast('Mango settings saved', 'success');
              } catch {
                showToast('Could not save Mango settings', 'error');
              }
            }}>
            Save
          </Button>
        </Stack>
        {!data.server_ai_enabled && <Alert severity="warning" sx={{ mt: 1.5 }}>The server has AI off (AI_ENABLED); Mango stays off until it is on.</Alert>}
      </CardContent>
    </Card>
  );
}
