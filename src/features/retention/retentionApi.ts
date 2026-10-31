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
  affected: number;
  failed: number;
  skipped: number;
  bytes: number;
  error_code?: string | null;
  started_at: string;
  finished_at?: string | null;
};

export type RetentionRule = {
  rule_code: string;
  category: string;
  description: string;
  action: 'DELETE' | 'MASK' | 'REPORT';
  period_days: number;
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

export type RetentionSummary = {
  enabled_rules: number;
  legal_review_holds: number;
  failed_runs_7d: number;
  accounts_deleted_30d: number;
  deleted_accounts_awaiting_scrub: number;
};

export type RuleChange = {
  code: string;
  is_enabled?: boolean;
  period_days?: number;
  legal_review_required?: boolean;
  legal_review_note?: string;
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
    updateRule: builder.mutation<{ rule: RetentionRule }, RuleChange>({
      query: ({ code, ...body }) => ({ url: `/api/v1/admin/retention/rules/${code}`, method: 'PUT', body }),
      invalidatesTags: ['Retention'],
    }),
  }),
});

export const { useGetRetentionQuery, useGetRetentionRunsQuery, useDryRunRuleMutation, useDryRunAllMutation, useUpdateRuleMutation } = retentionApi;

export const ACTION_LABEL: Record<RetentionRule['action'], string> = { DELETE: 'Delete', MASK: 'Mask', REPORT: 'Report only' };

export const formatBytes = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)} GB` : n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : n >= 1e3 ? `${(n / 1e3).toFixed(0)} KB` : `${n} B`);
