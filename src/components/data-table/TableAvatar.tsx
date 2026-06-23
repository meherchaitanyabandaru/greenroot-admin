import { Avatar } from '@mui/material';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function stringToColor(str: string): string {
  const palette = [
    '#166B35', '#1F7A3A', '#2E8B47', '#4CAF64',
    '#2563EB', '#7C3AED', '#B7791F', '#C2410C',
    '#0E7490', '#059669',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function TableAvatar({
  src,
  name,
  size = 28,
  variant = 'circular',
}: {
  src?: string;
  name?: string;
  size?: number;
  variant?: 'circular' | 'rounded' | 'square';
}) {
  const label = name ?? '';
  const bgcolor = stringToColor(label);

  if (src) {
    return (
      <Avatar
        src={src}
        variant={variant}
        sx={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials(label)}
      </Avatar>
    );
  }

  return (
    <Avatar
      variant={variant}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        bgcolor,
        fontWeight: 700,
        color: '#fff',
      }}
    >
      {initials(label) || '?'}
    </Avatar>
  );
}
