import { baseApi } from '../../api/baseApi';

// Image upload rules per category. The API is the final authority: it checks
// every upload against these and refuses unsafe values (bounds below).

export type ImagePolicy = {
  category: string;
  max_side: number;
  min_side: number;
  quality: number;
  max_bytes: number;
  allowed_formats: string[];
  is_compression_enabled: boolean;
  version: number;
  updated_by_user_id?: number | null;
  updated_at?: string | null;
};

export type PolicyBounds = {
  max_side_min: number;
  max_side_max: number;
  min_side_min: number;
  quality_min: number;
  quality_max: number;
  max_bytes_min: number;
  max_bytes_max: number;
  hard_max_pixels: number;
};

export type AdminImagePolicy = ImagePolicy & { default: ImagePolicy; bounds: PolicyBounds };

export type PolicyHistoryEntry = {
  version: number;
  policy: ImagePolicy;
  changed_by_user_id?: number | null;
  changed_by_name?: string | null;
  change_note?: string | null;
  created_at: string;
};

export type PolicyUpdate = Pick<
  ImagePolicy,
  'max_side' | 'min_side' | 'quality' | 'max_bytes' | 'allowed_formats' | 'is_compression_enabled' | 'version'
> & { change_note: string };

export const CATEGORY_LABELS: Record<string, string> = {
  SELFIE: 'Profile selfies',
  MARKET_AD: 'Local Market ad photos',
  NURSERY_BRANDING: 'Nursery logos & branding',
  DELIVERY_PROOF: 'Delivery proof',
  LOADING_PROOF: 'Loading proof',
  DRIVER_LICENCE: 'Driver licences',
  ATTACHMENT: 'Photos attached as documents',
};

export const imagePoliciesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAdminImagePolicies: builder.query<{ policies: AdminImagePolicy[]; can_edit: boolean }, void>({
      query: () => '/api/v1/admin/image-policies',
      providesTags: ['ImagePolicies'],
    }),
    updateImagePolicy: builder.mutation<{ policy: AdminImagePolicy }, { category: string; body: PolicyUpdate }>({
      query: ({ category, body }) => ({ url: `/api/v1/admin/image-policies/${category}`, method: 'PUT', body }),
      invalidatesTags: ['ImagePolicies'],
    }),
    imagePolicyHistory: builder.query<{ history: PolicyHistoryEntry[] }, string>({
      query: (category) => `/api/v1/admin/image-policies/${category}/history`,
      providesTags: ['ImagePolicies'],
    }),
    uploadImage: builder.mutation<{ file_url: string; content_type: string; size: number }, { category: string; file: File }>({
      query: ({ category, file }) => {
        const form = new FormData();
        form.append('category', category); // before the file: the API reads it first
        form.append('file', file);
        return { url: '/api/v1/storage/images', method: 'POST', body: form };
      },
    }),
  }),
});

export const {
  useListAdminImagePoliciesQuery,
  useUpdateImagePolicyMutation,
  useImagePolicyHistoryQuery,
  useUploadImageMutation,
} = imagePoliciesApi;

/** Why an edit is unsafe (mirrors the API's bounds), or '' when it is fine. */
export function policyProblem(p: PolicyUpdate, b: PolicyBounds): string {
  if (p.max_side < b.max_side_min || p.max_side > b.max_side_max) return `Longest side must be ${b.max_side_min}–${b.max_side_max} px.`;
  if (p.min_side < b.min_side_min || p.min_side > p.max_side) return `Shortest side must be ${b.min_side_min} px up to the longest side.`;
  if (p.quality < b.quality_min || p.quality > b.quality_max) return `Quality must be ${b.quality_min}–${b.quality_max}.`;
  if (p.max_bytes < b.max_bytes_min || p.max_bytes > b.max_bytes_max)
    return `File size must be ${Math.round(b.max_bytes_min / 1024)} KB–${Math.round(b.max_bytes_max / 1024 / 1024)} MB.`;
  if (p.allowed_formats.length === 0) return 'Allow at least one format.';
  if (p.change_note.trim().length < 5) return 'Say why you are changing it (at least 5 characters).';
  return '';
}

/** Changes that are allowed but deserve a second look before saving. */
export function policyRisks(p: PolicyUpdate, d: ImagePolicy): string[] {
  const risks: string[] = [];
  if (p.quality < d.quality - 10) risks.push(`Quality ${p.quality} is well below the default ${d.quality}: photos may look blocky.`);
  if (p.max_side < d.max_side) risks.push(`Longest side ${p.max_side} px is smaller than the default ${d.max_side} px: details may be unreadable.`);
  if (p.min_side > d.min_side * 1.5) risks.push(`Shortest side ${p.min_side} px refuses more photos than the default ${d.min_side} px.`);
  if (p.max_bytes > d.max_bytes * 2) risks.push('Allowing much larger files costs users mobile data and storage.');
  if (!p.is_compression_enabled) risks.push('With compression off, photos already within the limits are uploaded unchanged (bigger files).');
  if (d.allowed_formats.includes('PNG') && !p.allowed_formats.includes('PNG')) risks.push('Without PNG, transparent logos lose their transparency.');
  return risks;
}
