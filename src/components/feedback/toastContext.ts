import { createContext, useContext } from 'react';

export type Severity = 'success' | 'error' | 'info' | 'warning';

export interface ToastContextValue {
  showToast: (message: string, severity?: Severity) => void;
}

export const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}
