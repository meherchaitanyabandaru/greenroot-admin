import { Accordion, AccordionDetails, AccordionSummary, Box, Paper, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { formatDateTime } from '../../utils/labels';
import { useOrderConsentsQuery } from '../risk/riskApi';

const STEP: Record<string, string> = {
  BUYER_QUOTATION_ACCEPT: 'Buyer accepted the quotation',
  SELLER_LOADING: 'Seller confirmed the loading',
  DRIVER_DISPATCH: 'Driver confirmed the load and the trip',
  BUYER_DELIVERY: 'Buyer confirmed delivery',
};

/** What each party confirmed on this order, word for word, and when. */
export function OrderConsents({ orderId }: { orderId: number }) {
  const { data } = useOrderConsentsQuery(orderId);
  const consents = data?.consents ?? [];
  if (consents.length === 0) return null;
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography fontWeight={700} mb={1}>Confirmations</Typography>
      {consents.map((c) => (
        <Accordion key={c.id} disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box>
              <Typography fontSize={13} fontWeight={600}>{STEP[c.consent_type] ?? c.consent_type}</Typography>
              <Typography fontSize={12} color="text.secondary">
                {c.user_name ?? `User #${c.user_id}`} ({c.user_role}) · {formatDateTime(c.created_at)} · wording v{c.consent_version}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {c.statements.map((s) => <Typography key={s} fontSize={13}>✓ {s}</Typography>)}
            {c.evidence.length > 0 && <Typography fontSize={12} color="text.secondary" mt={1}>Evidence: {c.evidence.length} item(s)</Typography>}
          </AccordionDetails>
        </Accordion>
      ))}
    </Paper>
  );
}
