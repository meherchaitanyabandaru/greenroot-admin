import { baseApi } from '../../api/baseApi';

export type ArchiveRow = { reference: string; date: string; party: string; mobile?: string; status: string; amount?: number | null; paid?: number | null };

export type ArchiveReport = {
  type: 'orders' | 'quotations';
  financial_year?: string;
  from: string;
  to: string;
  summary: { total: number; delivered?: number; cancelled?: number; sales?: number; accepted?: number; rejected_expired?: number };
  rows: ArchiveRow[];
  pagination: { page: number; per_page: number; total: number; total_pages: number };
};

export type ArchiveQuery = { type: 'orders' | 'quotations'; fy: string; q: string; page: number };

export const archiveQuery = ({ type, fy, q, page }: ArchiveQuery, format?: 'csv' | 'pdf') => {
  const params = new URLSearchParams({ fy, page: String(page), per_page: '50' });
  if (q.trim()) params.set('q', q.trim());
  if (format) params.set('format', format);
  return `/api/v1/reports/${type}?${params}`;
};

export const archiveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getArchive: builder.query<ArchiveReport, ArchiveQuery>({ query: (a) => archiveQuery(a) }),
    downloadArchive: builder.query<{ blob: Blob; filename?: string }, { query: ArchiveQuery; format: 'csv' | 'pdf' }>({
      query: ({ query, format }) => ({
        url: archiveQuery(query, format),
        responseHandler: async (response) => {
          const disposition = response.headers.get('content-disposition') ?? '';
          return { blob: await response.blob(), filename: disposition.match(/filename="([^"]+)"/)?.[1] };
        },
      }),
      keepUnusedDataFor: 0,
    }),
  }),
});

export const { useGetArchiveQuery, useLazyDownloadArchiveQuery } = archiveApi;

/** Indian financial year (April–March, India time) of a date. */
export function financialYear(d: Date): string {
  const ist = new Date(d.getTime() + (5.5 * 60 + d.getTimezoneOffset()) * 60_000);
  const y = ist.getMonth() < 3 ? ist.getFullYear() - 1 : ist.getFullYear();
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
}

/** The current financial year and the ones before it, newest first, back to FY 2025-26. */
export function financialYears(now = new Date(), earliest = 2025): string[] {
  const current = Number(financialYear(now).slice(0, 4));
  const out: string[] = [];
  for (let y = current; y >= earliest; y--) out.push(`${y}-${String((y + 1) % 100).padStart(2, '0')}`);
  return out;
}
