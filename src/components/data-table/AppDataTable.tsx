import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from '@mui/material';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { EmptyState } from '../feedback/EmptyState';
import { FitTableContainer } from './FitTableContainer';

export function AppDataTable<T>({
  columns,
  data,
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  sortBy,
  sortOrder,
  onSortChange,
  maxHeight,
  sortableColumns,
}: {
  columns: ColumnDef<T>[];
  data: T[];
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (column: string) => void;
  /** Cap the height instead of filling the window (pages with more below the table). */
  maxHeight?: number | string;
  /**
   * Column id → the API's sort key. When given, only these columns sort, so
   * a header never offers a sort the server cannot do.
   */
  sortableColumns?: Record<string, string>;
}) {
  // TanStack Table intentionally returns table helper functions; this component does not pass
  // those functions into memoized children, so the React Compiler skip warning is acceptable.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <Paper variant="outlined">
      {/* Rows scroll inside; header and pagination stay put. 78 = pagination + page padding. */}
      <FitTableContainer reserve={78} maxHeight={maxHeight}>
        <Table size="small" stickyHeader sx={{ minWidth: 720 }}>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortKey = sortableColumns
                    ? sortableColumns[header.id]
                    : header.id !== 'actions' && !header.id.startsWith('_') ? header.id : undefined;
                  const sortable = !!onSortChange && !!sortKey;
                  const active = sortable && sortBy === sortKey;
                  return (
                    // Header colours come from the theme (MuiTableHead).
                    <TableCell key={header.id}>
                      {header.isPlaceholder ? null : sortable ? (
                        <TableSortLabel
                          active={active}
                          direction={active ? sortOrder : 'asc'}
                          onClick={() => onSortChange(sortKey)}
                          sx={{ '&.Mui-active, &.Mui-active .MuiTableSortLabel-icon': { color: '#166534' } }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableSortLabel>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState />
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow hover key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </FitTableContainer>
      <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
        <TablePagination
          component="div"
          count={count}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, nextPage) => onPageChange(nextPage)}
          onRowsPerPageChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </Box>
    </Paper>
  );
}
