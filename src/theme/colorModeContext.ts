import { createContext, useContext } from 'react';
import type { ColorMode } from './theme';

/** What the admin picked: a fixed mode, or follow the computer's setting. */
export type ColorModePreference = ColorMode | 'system';

export type ColorModeState = {
  preference: ColorModePreference;
  mode: ColorMode;
  setPreference: (p: ColorModePreference) => void;
};

export const ColorModeContext = createContext<ColorModeState>({
  preference: 'system',
  mode: 'light',
  setPreference: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);
