import { CssBaseline, ThemeProvider } from '@mui/material';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './store';
import { theme } from '../theme/theme';
import { ToastProvider } from '../components/feedback/ToastProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <ToastProvider>{children}</ToastProvider>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
