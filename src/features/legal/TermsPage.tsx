import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Container, Divider, Paper, Typography } from '@mui/material';
import { Fragment, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseLegal, type Block } from './parseLegal';
import terms from './terms-and-conditions.md?raw';

function rich(text: string): ReactNode {
  return text.split('**').map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>));
}

function render(b: Block, i: number) {
  switch (b.kind) {
    case 'h1': return <Typography key={i} variant="h4" component="h1" fontWeight={800}>{b.text}</Typography>;
    case 'h2': return <Typography key={i} variant="h6" component="h2" color="primary" sx={{ mt: 4 }}>{b.text}</Typography>;
    case 'h3': return <Typography key={i} variant="subtitle1" component="h3" fontWeight={700} sx={{ mt: 2 }}>{b.text}</Typography>;
    case 'hr': return <Divider key={i} sx={{ my: 3 }} />;
    case 'li':
    case 'ol':
      return (
        <Box key={i} sx={{ display: 'flex', gap: 1.25, mt: 0.75, pl: 1 }}>
          <Typography color="primary" fontWeight={700} sx={{ minWidth: 18 }}>{b.kind === 'ol' ? `${b.n}.` : '•'}</Typography>
          <Typography color="text.secondary" lineHeight={1.65}>{rich(b.text)}</Typography>
        </Box>
      );
    default: return <Typography key={i} color="text.secondary" lineHeight={1.65} sx={{ mt: 1.25 }}>{rich(b.text)}</Typography>;
  }
}

/** Public: linked from the sign-in page, so it is readable before login. */
export function TermsPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 2, sm: 5 } }}>
      <Container maxWidth="md">
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
        <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 5 }, border: 1, borderColor: 'divider' }}>
          {parseLegal(terms).map(render)}
        </Paper>
      </Container>
    </Box>
  );
}
