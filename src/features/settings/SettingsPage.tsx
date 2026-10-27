import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EmailIcon from '@mui/icons-material/Email';
import GavelIcon from '@mui/icons-material/Gavel';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CategoryIcon from '@mui/icons-material/Category';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SmsIcon from '@mui/icons-material/Sms';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { createElement, useState, type ElementType, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../components/feedback/toastContext';
import { PageHeader } from '../../components/page/PageHeader';
import { useAppSelector } from '../../hooks/redux';
import { toLabel } from '../../utils/labels';
import { useGetEmailStatusQuery } from '../email/emailApi';
import { useGetSmsStatusQuery } from '../sms/smsApi';

// Same key the sidebar reads (AdminLayout).
const COLLAPSED_KEY = 'gr_nav_collapsed';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography fontWeight={700} fontSize={15} mb={1.5}>{title}</Typography>
        {children}
      </CardContent>
    </Card>
  );
}

function LinkRow({ to, icon, label, hint }: { to: string; icon: ElementType; label: string; hint: string }) {
  return (
    <Stack
      component={Link}
      to={to}
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{ py: 1, px: 1, mx: -1, borderRadius: 1.5, color: 'inherit', textDecoration: 'none', '&:hover': { bgcolor: '#f1f5f9' } }}
    >
      <Box sx={{ width: 32, height: 32, borderRadius: 1.5, display: 'grid', placeItems: 'center', bgcolor: '#ecfdf3', color: '#166534', flexShrink: 0 }}>
        {createElement(icon, { sx: { fontSize: 18 } })}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography fontSize={13.5} fontWeight={600}>{label}</Typography>
        <Typography fontSize={12} color="text.secondary">{hint}</Typography>
      </Box>
      <ChevronRightIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
    </Stack>
  );
}

/** The admin's own preferences, system status and links to configuration. */
export function SettingsPage() {
  const { showToast } = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const sms = useGetSmsStatusQuery().data;
  const email = useGetEmailStatusQuery().data;
  const [startCollapsed, setStartCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) !== 'false'; } catch { return true; }
  });

  function toggleCollapsed(on: boolean) {
    setStartCollapsed(on);
    try { localStorage.setItem(COLLAPSED_KEY, String(on)); } catch { /* storage blocked */ }
    showToast(on ? 'The menu will open collapsed' : 'The menu will open expanded');
  }

  function resetFilters() {
    try {
      Object.keys(sessionStorage).filter((k) => k.startsWith('gr_list_')).forEach((k) => sessionStorage.removeItem(k));
    } catch { /* storage blocked */ }
    showToast('Saved filters and sorting cleared');
  }

  const name = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'Admin';
  const status = (live?: boolean) =>
    live == null ? <Chip size="small" label="Checking…" /> : live
      ? <Chip size="small" color="success" label="Live" />
      : <Chip size="small" color="warning" label="Test mode" />;

  return (
    <Box>
      <PageHeader title="Settings" description="Your account, how this console behaves, and where platform settings live." />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Section title="Your account">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: '#166534', width: 48, height: 48 }}>{name[0]}</Avatar>
              <Box>
                <Typography fontWeight={700}>{name}</Typography>
                <Typography fontSize={13} color="text.secondary">{user?.mobile}{user?.email ? ` · ${user.email}` : ''}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.75} mt={1.5} flexWrap="wrap" useFlexGap>
              {(user?.roles ?? []).map((r) => (
                <Chip key={r.code} size="small" label={r.name || toLabel(r.code)} />
              ))}
            </Stack>
          </Section>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Section title="This console">
            <Stack direction="row" alignItems="center">
              <Box sx={{ flex: 1 }}>
                <Typography fontSize={13.5} fontWeight={600}>Start with the menu collapsed</Typography>
                <Typography fontSize={12} color="text.secondary">Icons only, more room for tables. Hover an icon to see its name.</Typography>
              </Box>
              <Switch checked={startCollapsed} onChange={(e) => toggleCollapsed(e.target.checked)} />
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ flex: 1 }}>
                <Typography fontSize={13.5} fontWeight={600}>Saved filters and sorting</Typography>
                <Typography fontSize={12} color="text.secondary">Each list remembers its filters while this tab is open.</Typography>
              </Box>
              <Button size="small" variant="outlined" startIcon={<RestartAltIcon />} onClick={resetFilters}>Reset</Button>
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            <Typography fontSize={12} color="text.secondary">
              Lists refresh by themselves when you come back to this tab; the notification bell checks every minute.
            </Typography>
          </Section>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Section title="Messaging">
            <Stack spacing={0.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ flex: 1 }}><LinkRow to="/sms" icon={SmsIcon} label="SMS / TRAI DLT" hint={`Provider: ${sms?.provider ?? '…'}`} /></Box>
                {status(sms?.live)}
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ flex: 1 }}><LinkRow to="/email" icon={EmailIcon} label="Email" hint={`Provider: ${email?.provider ?? '…'}`} /></Box>
                {status(email?.live)}
              </Stack>
              <LinkRow to="/notifications/templates" icon={TextSnippetIcon} label="Notification templates" hint="Wording of in-app and push messages" />
            </Stack>
          </Section>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Section title="Platform">
            <LinkRow to="/subscription-plans" icon={WorkspacePremiumIcon} label="Subscription plans" hint="Prices, limits and trial length" />
            <LinkRow to="/subscription-promos" icon={LocalOfferIcon} label="Promo offers" hint="Discount codes for nurseries" />
            <LinkRow to="/plants/categories" icon={CategoryIcon} label="Plant categories" hint="How the catalogue is grouped" />
            <LinkRow to="/terms" icon={GavelIcon} label="Terms & Conditions" hint="What every user agrees to at sign-up" />
          </Section>
        </Grid>
      </Grid>
    </Box>
  );
}
