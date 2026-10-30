import { baseApi } from '../../api/baseApi';

// Unusual activity for admins (never an automatic fraud verdict), their
// decisions and notes, the rule thresholds, and the parties' confirmations.

export type RiskSignal = {
  id: number;
  signal_code: string;
  description: string;
  entity_type: 'ORDER' | 'QUOTATION' | 'NURSERY' | 'USER' | 'DRIVER';
  entity_id: number;
  entity_label?: string | null;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CONFIRMED_FRAUD';
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  details: Record<string, unknown>;
  is_hold: boolean;
  resolution_note?: string | null;
  created_at: string;
  notes?: { id: number; user_name?: string | null; action: string; note: string; created_at: string }[];
};

export type RiskRule = { signal_code: string; is_enabled: boolean; threshold: number; risk_level: string; description: string; updated_at: string };

export type ConsentEntry = {
  id: number;
  consent_type: string;
  consent_version: number;
  statements: string[];
  user_id: number;
  user_name?: string | null;
  user_role: string;
  dispatch_id?: number | null;
  evidence: string[];
  created_at: string;
};

export const riskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listRiskSignals: builder.query<{ signals: RiskSignal[]; total: number }, { status?: string; risk_level?: string; entity_type?: string; page: number; per_page: number }>({
      query: (params) => ({ url: '/api/v1/admin/risk-signals', params }),
      providesTags: ['Risk'],
    }),
    getRiskSignal: builder.query<{ signal: RiskSignal }, number>({
      query: (id) => `/api/v1/admin/risk-signals/${id}`,
      providesTags: ['Risk'],
    }),
    actOnRiskSignal: builder.mutation<{ signal: RiskSignal }, { id: number; action: string; note: string }>({
      query: ({ id, ...body }) => ({ url: `/api/v1/admin/risk-signals/${id}/actions`, method: 'POST', body }),
      invalidatesTags: ['Risk', 'Orders'],
    }),
    scanRisk: builder.mutation<{ raised: number }, void>({
      query: () => ({ url: '/api/v1/admin/risk-signals/scan', method: 'POST' }),
      invalidatesTags: ['Risk'],
    }),
    listRiskRules: builder.query<{ rules: RiskRule[] }, void>({
      query: () => '/api/v1/admin/risk-rules',
      providesTags: ['Risk'],
    }),
    updateRiskRule: builder.mutation<unknown, { code: string; is_enabled: boolean; threshold: number; risk_level: string }>({
      query: ({ code, ...body }) => ({ url: `/api/v1/admin/risk-rules/${code}`, method: 'PUT', body }),
      invalidatesTags: ['Risk'],
    }),
    orderConsents: builder.query<{ consents: ConsentEntry[] }, number>({
      query: (orderId) => `/api/v1/orders/${orderId}/consents`,
      providesTags: ['Orders'],
    }),
  }),
});

export const {
  useListRiskSignalsQuery,
  useGetRiskSignalQuery,
  useActOnRiskSignalMutation,
  useScanRiskMutation,
  useListRiskRulesQuery,
  useUpdateRiskRuleMutation,
  useOrderConsentsQuery,
} = riskApi;

/** What an admin can do with a signal now (the API enforces the same). */
export function riskActions(s: RiskSignal): { action: string; label: string; danger?: boolean }[] {
  const closed = s.status === 'RESOLVED' || s.status === 'DISMISSED';
  if (closed) return [{ action: 'REVIEW', label: 'Reopen' }, { action: 'NOTE', label: 'Add note' }];
  return [
    ...(s.status === 'OPEN' ? [{ action: 'REVIEW', label: 'Start review' }] : []),
    ...(s.entity_type === 'ORDER' ? [s.is_hold ? { action: 'RELEASE_HOLD', label: 'Release hold' } : { action: 'HOLD', label: 'Hold order' }] : []),
    { action: 'REQUEST_VERIFICATION', label: 'Ask partner to verify' },
    { action: 'NOTE', label: 'Add note' },
    { action: 'RESOLVE', label: 'Resolve' },
    { action: 'DISMISS', label: 'Dismiss (false alarm)' },
    ...(s.risk_level !== 'CONFIRMED_FRAUD' ? [{ action: 'CONFIRM_FRAUD', label: 'Confirm fraud', danger: true }] : []),
  ];
}
