import { baseApi } from '../../api/baseApi';

export type RetentionRun = {
  id: number;
  rule_code: string;
  mode: 'DRY_RUN' | 'EXECUTE';
  trigger_source: 'SCHEDULE' | 'ADMIN';
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED';
  period_days: number;
  eligible: number;
  held: number;
  excluded: number;
  affected: number;
  failed: number;
  skipped: number;
  bytes: number;
  error_code?: string | null;
  started_at: string;
  finished_at?: string | null;
};

export type RetentionRule = {
  id: number;
  rule_code: string;
  category: string;
  description: string;
  action: 'DELETE' | 'MASK' | 'REPORT';
  period_days: number;
  period_unit: 'DAYS' | 'FINANCIAL_YEARS';
  classification: Classification;
  min_period_days: number;
  is_enabled: boolean;
  dry_run_only: boolean;
  legal_review_required: boolean;
  legal_review_note?: string | null;
  batch_size: number;
  updated_at: string;
  last_dry_run?: RetentionRun | null;
  last_execution?: RetentionRun | null;
  next_run_at?: string | null;
};

export type Classification = 'LEGAL_REQUIREMENT' | 'RECOMMENDATION' | 'LEGAL_REVIEW';

export const CLASSIFICATION_LABEL: Record<Classification, string> = {
  LEGAL_REQUIREMENT: 'Legal requirement',
  RECOMMENDATION: 'GreenRoot recommendation',
  LEGAL_REVIEW: 'Legal review required',
};

export const periodText = (r: Pick<RetentionRule, 'period_days' | 'period_unit'>) =>
  r.period_unit === 'FINANCIAL_YEARS' ? `${r.period_days} financial year${r.period_days === 1 ? '' : 's'}` : `${r.period_days} days`;

/** Where a rule is listed on the page. */
export function ruleSection(code: string): 'Orders' | 'Quotations' | 'Market ads' | 'Other data' {
  if (code.startsWith('ORDER') || code === 'PAYMENTS' || code === 'DELIVERY_PROOF') return 'Orders';
  if (code.startsWith('QUOTATIONS_')) return 'Quotations';
  if (code.startsWith('MARKET_')) return 'Market ads';
  return 'Other data';
}

export type RetentionSummary = {
  enabled_rules: number;
  legal_review_holds: number;
  failed_runs_7d: number;
  accounts_deleted_30d: number;
  deleted_accounts_awaiting_scrub: number;
};

export type RetentionPreview = { eligible: string[]; held: string[]; excluded: string[] };

export type LegalHold = {
  id: number;
  entity_type: 'MARKET_AD' | 'MARKET_ENQUIRY' | 'ORDER' | 'QUOTATION' | 'PAYMENT';
  entity_id: number;
  entity_code?: string | null;
  reason: string;
  placed_by?: string | null;
  placed_at: string;
  released_by?: string | null;
  released_at?: string | null;
  release_reason?: string | null;
};

export type AuditEntry = { id: number; description?: string; user_name?: string; changed_at: string };

export type RuleChange = {
  code: string;
  is_enabled?: boolean;
  period_days?: number;
  legal_review_required?: boolean;
  legal_review_note?: string;
  classification?: Classification;
  reason: string;
};

export const retentionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRetention: builder.query<{ rules: RetentionRule[]; summary: RetentionSummary }, void>({
      query: () => '/api/v1/admin/retention',
      providesTags: ['Retention'],
    }),
    getRetentionRuns: builder.query<{ runs: RetentionRun[] }, string | void>({
      query: (rule) => `/api/v1/admin/retention/runs?limit=50${rule ? `&rule=${encodeURIComponent(rule)}` : ''}`,
      providesTags: ['Retention'],
    }),
    dryRunRule: builder.mutation<{ run: RetentionRun }, string>({
      query: (code) => ({ url: `/api/v1/admin/retention/rules/${code}/dry-run`, method: 'POST', body: {} }),
      invalidatesTags: ['Retention'],
    }),
    dryRunAll: builder.mutation<{ runs: RetentionRun[] }, void>({
      query: () => ({ url: '/api/v1/admin/retention/dry-run', method: 'POST', body: {} }),
      invalidatesTags: ['Retention'],
    }),
    getPreview: builder.query<{ preview: RetentionPreview }, string>({
      query: (code) => `/api/v1/admin/retention/rules/${code}/preview`,
      providesTags: ['Retention'],
    }),
    getRuleHistory: builder.query<{ audit_logs: AuditEntry[] }, number>({
      query: (id) => `/api/v1/audit-logs?entity_type=retention_rule&record_id=${id}&per_page=20`,
      providesTags: ['Retention'],
    }),
    getHolds: builder.query<{ holds: LegalHold[] }, void>({
      query: () => '/api/v1/admin/retention/holds',
      providesTags: ['Retention'],
    }),
    placeHold: builder.mutation<{ id: number }, { entity_type: LegalHold['entity_type']; code: string; reason: string }>({
      query: (body) => ({ url: '/api/v1/admin/retention/holds', method: 'POST', body }),
      invalidatesTags: ['Retention'],
    }),
    releaseHold: builder.mutation<unknown, { id: number; reason: string }>({
      query: ({ id, reason }) => ({ url: `/api/v1/admin/retention/holds/${id}/release`, method: 'POST', body: { reason } }),
      invalidatesTags: ['Retention'],
    }),
    updateRule: builder.mutation<{ rule: RetentionRule }, RuleChange>({
      query: ({ code, ...body }) => ({ url: `/api/v1/admin/retention/rules/${code}`, method: 'PUT', body }),
      invalidatesTags: ['Retention'],
    }),
  }),
});

export const {
  useGetRetentionQuery, useGetRetentionRunsQuery, useDryRunRuleMutation, useDryRunAllMutation, useUpdateRuleMutation,
  useGetPreviewQuery, useGetRuleHistoryQuery, useGetHoldsQuery, usePlaceHoldMutation, useReleaseHoldMutation,
} = retentionApi;

export const ACTION_LABEL: Record<RetentionRule['action'], string> = { DELETE: 'Delete', MASK: 'Mask', REPORT: 'Report only' };

export const formatBytes = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)} GB` : n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : n >= 1e3 ? `${(n / 1e3).toFixed(0)} KB` : `${n} B`);
