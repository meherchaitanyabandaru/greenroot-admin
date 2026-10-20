import { Checkbox, ListItemText, MenuItem, TextField } from '@mui/material';
import { toLabel } from '../../utils/labels';

/**
 * A filter dropdown with a checkbox per option: pick none (all), one or
 * several. The field shows "All", the single choice, or "N selected".
 */
export function MultiSelectFilter({
  label,
  options,
  value,
  onChange,
  minWidth = 170,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  minWidth?: number;
}) {
  return (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      sx={{ minWidth }}
      SelectProps={{
        multiple: true,
        displayEmpty: true,
        renderValue: (sel) => {
          const picked = sel as string[];
          if (picked.length === 0) return 'All';
          if (picked.length === 1) return toLabel(picked[0]);
          return `${picked.length} selected`;
        },
        MenuProps: { PaperProps: { sx: { maxHeight: 360 } } },
      }}
      InputLabelProps={{ shrink: true }}
      onChange={(e) => {
        const v = e.target.value as unknown as string[] | string;
        onChange(typeof v === 'string' ? v.split(',') : v);
      }}
    >
      {options.map((o) => (
        <MenuItem key={o} value={o} dense>
          <Checkbox size="small" checked={value.includes(o)} sx={{ py: 0.25 }} />
          <ListItemText primary={toLabel(o)} primaryTypographyProps={{ fontSize: 13.5 }} />
        </MenuItem>
      ))}
    </TextField>
  );
}
