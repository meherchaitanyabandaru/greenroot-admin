import { baseApi } from '../../api/baseApi';
import type { ReadinessCheck } from '../messaging/shared';

export const EMAIL_MESSAGE_STATUSES = ['SENT', 'MOCKED', 'BLOCKED', 'FAILED', 'DELIVERED', 'BOUNCED'] as const;

export type EmailSender = {
  id: number;
  from_name: string;
  from_address: string | null;
  reply_to: string | null;
  domain_verified: boolean;
};

export type EmailTemplate = {
  id: number;
  template_code: string;
  template_name: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: string[];
  is_active: boolean;
  is_system: boolean;
};

export type EmailTemplateBody = Pick<EmailTemplate, 'template_code' | 'template_name' | 'subject' | 'body_html' | 'body_text' | 'is_active'>;

export type EmailMessage = {
  id: number;
  template_code: string;
  user_id: number | null;
  to_email: string;
  subject: string;
  body: string;
  provider: string;
  status: string;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
};

export type EmailStatus = { provider: string; live: boolean; ready: boolean; checks: ReadinessCheck[] };

export type EmailPreview = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  variables: string[];
  subject?: string;
  html?: string;
  text?: string;
};

type Pagination = { page: number; per_page: number; total: number; total_pages: number };

const emailApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmailStatus: builder.query<EmailStatus, void>({
      query: () => '/api/v1/email/status',
      providesTags: ['Email'],
    }),
    getEmailSender: builder.query<{ sender: EmailSender }, void>({
      query: () => '/api/v1/email/sender',
      providesTags: ['Email'],
    }),
    updateEmailSender: builder.mutation<{ sender: EmailSender }, Omit<EmailSender, 'id'>>({
      query: (body) => ({ url: '/api/v1/email/sender', method: 'PUT', body }),
      invalidatesTags: ['Email'],
    }),
    listEmailTemplates: builder.query<{ templates: EmailTemplate[] }, void>({
      query: () => '/api/v1/email/templates',
      providesTags: ['Email'],
    }),
    saveEmailTemplate: builder.mutation<{ template: EmailTemplate }, { id?: number; body: EmailTemplateBody }>({
      query: ({ id, body }) =>
        id ? { url: `/api/v1/email/templates/${id}`, method: 'PUT', body } : { url: '/api/v1/email/templates', method: 'POST', body },
      invalidatesTags: ['Email'],
    }),
    previewEmailTemplate: builder.mutation<
      EmailPreview,
      { subject: string; body_html: string; body_text: string; sample_values: Record<string, string> }
    >({
      query: (body) => ({ url: '/api/v1/email/templates/preview', method: 'POST', body }),
    }),
    testEmailTemplate: builder.mutation<
      { result: { message_id: number; status: string } },
      { id: number; to: string; values: Record<string, string> }
    >({
      query: ({ id, to, values }) => ({ url: `/api/v1/email/templates/${id}/test`, method: 'POST', body: { to, values } }),
      invalidatesTags: ['Email'],
    }),
    listEmailMessages: builder.query<
      { messages: EmailMessage[]; pagination: Pagination },
      { page: number; per_page: number; status?: string; template_code?: string; to_email?: string }
    >({
      query: (params) => ({ url: '/api/v1/email/messages', params }),
      providesTags: ['Email'],
    }),
  }),
});

export const {
  useGetEmailStatusQuery,
  useGetEmailSenderQuery,
  useUpdateEmailSenderMutation,
  useListEmailTemplatesQuery,
  useSaveEmailTemplateMutation,
  usePreviewEmailTemplateMutation,
  useTestEmailTemplateMutation,
  useListEmailMessagesQuery,
} = emailApi;
