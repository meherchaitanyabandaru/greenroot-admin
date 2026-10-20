import { TableContainer, type TableContainerProps } from '@mui/material';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * A table area that fills the window below where it starts, so rows scroll
 * inside it (pair with `<Table stickyHeader>`) and the page does not.
 * `reserve` keeps room underneath, e.g. for pagination. Pass `maxHeight` for
 * a fixed cap instead (pages with several tables).
 */
export function FitTableContainer({
  reserve = 24,
  maxHeight,
  sx,
  ...rest
}: TableContainerProps & { reserve?: number; maxHeight?: number | string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<number>();

  // Re-measured after every render: filters, alerts or data above can move it.
  // It only sets state when the height changes, so it cannot loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (maxHeight != null || !ref.current) return;
    const next = Math.max(240, Math.floor(window.innerHeight - ref.current.getBoundingClientRect().top - reserve));
    if (next !== fit) setFit(next);
  });

  useEffect(() => {
    if (maxHeight != null) return;
    const onResize = () => {
      if (!ref.current) return;
      setFit(Math.max(240, Math.floor(window.innerHeight - ref.current.getBoundingClientRect().top - reserve)));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [maxHeight, reserve]);

  return <TableContainer ref={ref} sx={{ maxHeight: maxHeight ?? fit, overflow: 'auto', ...sx }} {...rest} />;
}
