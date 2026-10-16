import { baseApi } from '../../api/baseApi';

export const DLT_OPERATORS = ['JIO', 'AIRTEL', 'VI', 'BSNL', 'TATA', 'SMARTPING'] as const;
export const ENTITY_STATUSES = ['NOT_REGISTERED', 'SUBMITTED', 'APPROVED', 'REJECTED'] as const;
export const REG_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'INACTIVE'] as const;
export const HEADER_TYPES = ['SERVICE', 'TRANSACTIONAL', 'PROMOTIONAL', 'GOVERNMENT'] as const;
export const CATEGORIES = ['SERVICE_IMPLICIT', 'SERVICE_EXPLICIT', 'TRANSACTIONAL', 'PROMOTIONAL'] as const;
export const VARIABLE_TAGS = ['numeric', 'alphanumeric', 'url', 'urlott', 'cbn', 'email'] as const;
export const MESSAGE_STATUSES = ['SENT', 'MOCKED', 'BLOCKED', 'FAILED', 'DELIVERED'] as const;

export type SmsEntity = {
  id: number;
  pe_id: string | null;
  entity_name: string;
  dlt_operator: string;
  telemarketer_name: string | null;
  telemarketer_id: string | null;
  registration_status: string;
  notes: string | null;
};

export type SmsHeader = {
  id: number;
  header: string;
  header_type: string;
  dlt_header_id: string | null;
  registration_status: string;
  rejection_reason: string | null;
};

export type SmsTemplate = {
  id: number;
  template_code: string;
  template_name: string;
  category: string;
  header_id: number | null;
  header: string | null;
  header_type: string | null;
  header_status: string | null;
  body: string;
  variables: string[];
  is_unicode: boolean;
  dlt_template_id: string | null;
  registration_status: string;
  rejection_reason: string | null;
  whitelisted_urls: string[];
  whitelisted_numbers: string[];
  is_active: boolean;
  is_system: boolean;
  approved_at: string | null;
};

export type SmsTemplateBody = Omit<
  SmsTemplate,
  'id' | 'header' | 'header_type' | 'header_status' | 'is_system' | 'approved_at'
>;

export type SmsMessage = {
  id: number;
  template_code: string;
  user_id: number | null;
  mobile: string;
  message_body: string;
  header: string | null;
  dlt_template_id: string | null;
  category: string;
  parts: number;
  provider: string;
  status: string;
  error_code: string | null;
  error_message: string | null;
  reference_type: string | null;
  reference_id: number | null;
  created_at: string;
};

export type ReadinessCheck = { key: string; label: string; ok: boolean; detail?: string };

export type SmsStatus = {
  provider: string;
  live: boolean;
  ready: boolean;
  checks: ReadinessCheck[];
};

export type SmsPreview = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  rendered?: string;
  encoding: string;
  chars: number;
  parts: number;
};

export type Pagination = { page: number; per_page: number; total: number; total_pages: number };

const smsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSmsStatus: builder.query<SmsStatus, void>({
      query: () => '/api/v1/sms/status',
      providesTags: ['SMS'],
    }),
    getSmsEntity: builder.query<{ entity: SmsEntity }, void>({
      query: () => '/api/v1/sms/entity',
      providesTags: ['SMS'],
    }),
    updateSmsEntity: builder.mutation<{ entity: SmsEntity }, Omit<SmsEntity, 'id'>>({
      query: (body) => ({ url: '/api/v1/sms/entity', method: 'PUT', body }),
      invalidatesTags: ['SMS'],
    }),
    listSmsHeaders: builder.query<{ headers: SmsHeader[] }, void>({
      query: () => '/api/v1/sms/headers',
      providesTags: ['SMS'],
    }),
    saveSmsHeader: builder.mutation<{ header: SmsHeader }, { id?: number; body: Omit<SmsHeader, 'id'> }>({
      query: ({ id, body }) =>
        id ? { url: `/api/v1/sms/headers/${id}`, method: 'PUT', body } : { url: '/api/v1/sms/headers', method: 'POST', body },
      invalidatesTags: ['SMS'],
    }),
    listSmsTemplates: builder.query<{ templates: SmsTemplate[] }, void>({
      query: () => '/api/v1/sms/templates',
      providesTags: ['SMS'],
    }),
    saveSmsTemplate: builder.mutation<{ template: SmsTemplate }, { id?: number; body: SmsTemplateBody }>({
      query: ({ id, body }) =>
        id ? { url: `/api/v1/sms/templates/${id}`, method: 'PUT', body } : { url: '/api/v1/sms/templates', method: 'POST', body },
      invalidatesTags: ['SMS'],
    }),
    previewSmsTemplate: builder.mutation<
      SmsPreview,
      Pick<SmsTemplateBody, 'body' | 'variables' | 'category' | 'header_id' | 'is_unicode' | 'whitelisted_urls' | 'whitelisted_numbers'> & {
        sample_values: Record<string, string>;
      }
    >({
      query: (body) => ({ url: '/api/v1/sms/templates/preview', method: 'POST', body }),
    }),
    testSmsTemplate: builder.mutation<
      { result: { message_id: number; status: string; parts: number } },
      { id: number; mobile: string; values: Record<string, string> }
    >({
      query: ({ id, mobile, values }) => ({ url: `/api/v1/sms/templates/${id}/test`, method: 'POST', body: { mobile, values } }),
      invalidatesTags: ['SMS'],
    }),
    listSmsMessages: builder.query<
      { messages: SmsMessage[]; pagination: Pagination },
      { page: number; per_page: number; status?: string; template_code?: string; mobile?: string }
    >({
      query: (params) => ({ url: '/api/v1/sms/messages', params }),
      providesTags: ['SMS'],
    }),
  }),
});

export const {
  useGetSmsStatusQuery,
  useGetSmsEntityQuery,
  useUpdateSmsEntityMutation,
  useListSmsHeadersQuery,
  useSaveSmsHeaderMutation,
  useListSmsTemplatesQuery,
  useSaveSmsTemplateMutation,
  usePreviewSmsTemplateMutation,
  useTestSmsTemplateMutation,
  useListSmsMessagesQuery,
} = smsApi;
