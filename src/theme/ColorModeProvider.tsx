import { CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { type ReactNode, useMemo, useState } from 'react';
import { ColorModeContext, type ColorModePreference } from './colorModeContext';
import { createAppTheme } from './theme';

const KEY = 'greenroot.admin.colorMode';

function readPreference(): ColorModePreference {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

/** Light or dark theme from the saved choice, else the computer's setting. */
export function ColorModeProvider({ children }: { children: ReactNode }) {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });
  const [preference, setPreferenceState] = useState<ColorModePreference>(readPreference);
  const mode = preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference;
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const value = useMemo(
    () => ({
      preference,
      mode,
      setPreference: (p: ColorModePreference) => {
        setPreferenceState(p);
        try {
          if (p === 'system') localStorage.removeItem(KEY);
          else localStorage.setItem(KEY, p);
        } catch {
          // private mode: the choice lasts until reload
        }
      },
    }),
    [preference, mode],
  );
  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
