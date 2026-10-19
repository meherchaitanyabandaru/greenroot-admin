import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './store';
import { ColorModeProvider } from '../theme/ColorModeProvider';
import { ToastProvider } from '../components/feedback/ToastProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ColorModeProvider>
        <BrowserRouter>
          <ToastProvider>{children}</ToastProvider>
        </BrowserRouter>
      </ColorModeProvider>
    </Provider>
  );
}
