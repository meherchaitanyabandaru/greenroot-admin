import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import { useState } from 'react';
import { type ColorModePreference, useColorMode } from '../../theme/colorModeContext';

const OPTIONS: { value: ColorModePreference; label: string; Icon: typeof LightModeOutlinedIcon }[] = [
  { value: 'light', label: 'Light', Icon: LightModeOutlinedIcon },
  { value: 'dark', label: 'Dark', Icon: DarkModeOutlinedIcon },
  { value: 'system', label: 'Match system', Icon: SettingsBrightnessIcon },
];

/** Top-bar switch between light, dark and the computer's setting. */
export function ColorModeMenu() {
  const { preference, mode, setPreference } = useColorMode();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const Current = mode === 'dark' ? DarkModeOutlinedIcon : LightModeOutlinedIcon;
  return (
    <>
      <Tooltip title="Appearance">
        <IconButton size="small" aria-label="Appearance" onClick={(e) => setAnchor(e.currentTarget)} sx={{ color: 'text.secondary' }}>
          <Current sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
        {OPTIONS.map(({ value, label, Icon }) => (
          <MenuItem
            key={value}
            selected={preference === value}
            onClick={() => {
              setPreference(value);
              setAnchor(null);
            }}
          >
            <ListItemIcon><Icon fontSize="small" /></ListItemIcon>
            <ListItemText>{label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
