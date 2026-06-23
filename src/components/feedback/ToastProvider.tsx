import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Alert, Snackbar } from '@mui/material';
import { createContext, useCallback, useContext, useState } from 'react';

type Severity = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  message: string;
  severity: Severity;
}

interface ToastContextValue {
  showToast: (message: string, severity?: Severity) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<Severity, React.ReactNode> = {
  success: <CheckCircleOutlineIcon fontSize="small" />,
  error: <ErrorOutlineIcon fontSize="small" />,
  info: <InfoOutlinedIcon fontSize="small" />,
  warning: <InfoOutlinedIcon fontSize="small" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [open, setOpen] = useState(false);

  const showToast = useCallback((message: string, severity: Severity = 'success') => {
    setToast({ message, severity });
    setOpen(true);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={3500}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          icon={toast ? ICONS[toast.severity] : undefined}
          severity={toast?.severity ?? 'success'}
          variant="filled"
          onClose={() => setOpen(false)}
          sx={{ minWidth: 280, fontSize: 13.5, borderRadius: 2, boxShadow: 4 }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
