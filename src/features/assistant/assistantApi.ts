import { baseApi } from '../../api/baseApi';

// Mango AI spend against the budget (estimates; the provider's dashboard is the bill).
export type KindUsage = {
  kind: 'STT' | 'LLM' | 'TTS';
  calls_today: number;
  estimated_usd_today: number;
  calls_month: number;
  estimated_usd_month: number;
  input_tokens_month: number;
  output_tokens_month: number;
  audio_seconds_month: number;
};

export type AssistantUsage = {
  enabled: boolean;
  usage: KindUsage[];
  limits: { global_daily_usd: number; global_monthly_usd: number; user_daily_usd: number; user_daily_calls: number; user_minute_calls: number; max_audio_seconds: number };
  note: string;
};

export type AssistantSettings = { enabled: boolean; daily_question_limit: number };

export const assistantApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAssistantUsage: builder.query<AssistantUsage, void>({ query: () => '/api/v1/admin/assistant/usage' }),
    getAssistantSettings: builder.query<{ settings: AssistantSettings; server_ai_enabled: boolean; max_daily_question_limit: number }, void>({
      query: () => '/api/v1/admin/assistant/settings',
    }),
    saveAssistantSettings: builder.mutation<{ settings: AssistantSettings }, AssistantSettings>({
      query: (body) => ({ url: '/api/v1/admin/assistant/settings', method: 'PUT', body }),
      // The reply carries the saved values; no refetch needed.
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(assistantApi.util.updateQueryData('getAssistantSettings', undefined, (d) => { d.settings = data.settings; }));
      },
    }),
  }),
});

export const { useGetAssistantUsageQuery, useGetAssistantSettingsQuery, useSaveAssistantSettingsMutation } = assistantApi;

export const KIND_LABEL: Record<string, string> = { STT: 'Speech to text', LLM: 'Answers (model)', TTS: 'Read aloud' };
