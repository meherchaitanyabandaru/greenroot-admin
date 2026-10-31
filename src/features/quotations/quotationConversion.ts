import { baseApi } from '../../api/baseApi';

export type AuditEntry = { id: number; action_type: string; new_data?: string; user_id?: number; user_name?: string; changed_at: string };

const parse = (s?: string): Record<string, unknown> => {
  try { return s ? JSON.parse(s) : {}; } catch { return {}; }
};

/**
 * When an internal draft became a customer quotation, and by whom, from the
 * quotation's audit trail. Newer conversions carry converted_from_type;
 * older ones are the first customer change after an INTERNAL create.
 */
export function findConversion(logs: AuditEntry[]): AuditEntry | null {
  const asc = [...logs].sort((a, b) => a.changed_at.localeCompare(b.changed_at) || a.id - b.id);
  const marked = asc.find((l) => parse(l.new_data).converted_from_type === 'INTERNAL');
  if (marked) return marked;
  const created = asc.find((l) => l.action_type === 'INSERT');
  if (!created || parse(created.new_data).quotation_type !== 'INTERNAL') return null;
  return asc.find((l) => l.action_type === 'UPDATE' && 'customer' in parse(l.new_data)) ?? null;
}

export const quotationAuditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getQuotationAudit: builder.query<{ audit_logs: AuditEntry[] }, number>({
      query: (id) => `/api/v1/audit-logs?entity_type=quotation&record_id=${id}&per_page=100`,
    }),
  }),
});

export const { useGetQuotationAuditQuery } = quotationAuditApi;
