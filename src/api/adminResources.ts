import { baseApi } from './baseApi';
import type { ListParams, Pagination } from './apiTypes';

export type ResourceConfig = {
  key: string;
  tag:
    | 'Users'
    | 'Plants'
    | 'Nurseries'
    | 'TopItems'
    | 'Orders'
    | 'Quotations'
    | 'Payments'
    | 'Dispatches'
    | 'Vehicles'
    | 'Drivers'
    | 'Tracking'
    | 'Notifications'
    | 'Subscriptions'
    | 'Attachments'
    | 'Sourcing'
    | 'Audit'
    | 'SecurityLogs';
  path?: string;
  collectionKey?: string;
  integrationNote?: string;
};

export type ResourceListResponse = {
  rows: Record<string, unknown>[];
  pagination?: Pagination;
};

export type OrderDetailResponse = {
  order: Record<string, unknown>;
};

export type QuotationDetailResponse = {
  quotation: Record<string, unknown>;
};

export type QuotationItemsResponse = {
  items: Record<string, unknown>[];
};

export type QuotationPDFResponse = {
  blob: Blob;
  filename?: string;
};

export type OrderItemsResponse = {
  items: Record<string, unknown>[];
};

export type RelatedPaymentsResponse = {
  payments: Record<string, unknown>[];
  pagination?: Pagination;
};

export type RelatedDispatchesResponse = {
  dispatches: Record<string, unknown>[];
  pagination?: Pagination;
};

export type UserDetailResponse = {
  user: Record<string, unknown>;
};

export type UserRolesResponse = {
  roles: Record<string, unknown>[];
};

export type UserSessionsResponse = {
  sessions: Record<string, unknown>[];
};

export type UserAddressesResponse = {
  addresses: Record<string, unknown>[];
};

export type NurseryDetailResponse = {
  nursery: Record<string, unknown>;
};

export type NurseryAddressesResponse = {
  addresses: Record<string, unknown>[];
};

export type NurseryUsersResponse = {
  users: Record<string, unknown>[];
};

export type LiveDriverLocationResponse = {
  location: Record<string, unknown> | null;
};

export type SubscriptionPromo = {
  id: number;
  promo_code: string;
  name: string;
  description?: string;
  discount_type: 'PERCENTAGE' | 'FLAT';
  discount_value: number;
  max_discount_cap?: number;
  applicable_plans: string[];
  applicable_cycles: string[];
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  max_uses?: number;
  used_count: number;
  created_by?: number;
  created_at: string;
  updated_at?: string;
};

export type SubscriptionPlan = {
  id: number;
  plan_code: string;
  plan_name: string;
  description?: string;
  monthly_price?: number;
  six_month_price?: number;
  yearly_price?: number;
  max_managers?: number;
  max_nurseries?: number;
  is_active: boolean;
  features?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
};

export type PlantDetailResponse = {
  plant: Record<string, unknown>;
};

/** A World Flora Online name not in the catalog yet (GET /plants/lookup). */
export type BotanicalName = {
  wfo_id: string;
  scientific_name: string;
  authorship?: string;
  family?: string;
  taxon_rank: string;
  status: 'ACCEPTED' | 'SYNONYM' | 'UNCHECKED';
  accepted_wfo_id?: string;
  accepted_name?: string;
};

/** Exactly one of plant (already in the catalog) or name is set. */
export type PlantLookupResult = {
  plant?: Record<string, unknown>;
  name?: BotanicalName;
};

/** A nursery's top item: its showcase, not stock (max 20 per nursery). */
export type TopItem = {
  id: number;
  top_item_code: string;
  nursery_id: number;
  nursery_name: string;
  plant_id: number;
  scientific_name: string;
  common_name?: string;
  size_id: number;
  size_code: string;
  size_name: string;
  unit_price?: number;
  display_order: number;
  quality_notes?: string;
  photos: string[];
  updated_at: string;
  version: number;
  capabilities?: { can_edit: boolean; can_delete: boolean };
};

export type TopItemListResponse = { top_items: TopItem[]; pagination: Pagination };

export type TopItemInput = {
  nursery_id?: number;
  plant_id: number;
  size_id: number;
  unit_price?: number | null;
  display_order?: number;
  quality_notes?: string | null;
  photos?: string[];
};

export type PlantSize = { id: number; size_code: string; display_name: string };

export type PlantLookupResponse = {
  results: PlantLookupResult[];
};

/** A row on Admin → Plants: one of the ~1.66 M botanical names. */
export type BotanicalRow = BotanicalName & {
  genus?: string;
  catalog_plant_id?: number;
  catalog_plant_code?: string;
  /** The catalog plant's common name; World Flora Online has none. */
  english_name?: string;
  /** Old names (synonyms) pointing to this name. */
  synonym_count?: number;
  /** The old name that matched the search, when this row's own name did not. */
  matched_name?: string;
};

export type BotanicalListParams = {
  page: number;
  per_page: number;
  search?: string;
  family?: string;
  status?: string;
  rank?: string;
  in_catalog?: string;
  show_synonyms?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

export type BotanicalListResponse = {
  names: BotanicalRow[];
  pagination: Pagination;
};

export type BotanicalFamily = { family: string; names: number; accepted: number; in_catalog: number };

export type BotanicalFamiliesResponse = { families: BotanicalFamily[]; total_names: number };

export type BotanicalDetailResponse = {
  name: BotanicalRow;
  accepted?: BotanicalRow;
  synonyms: BotanicalRow[];
  synonym_count: number;
};

/** A nursery's report of a local-market ad, for Admin → Local Market. */
export type MarketReport = {
  id: number;
  ad_id: number;
  ad_code: string;
  ad_title: string;
  ad_status: string;
  ad_nursery_name: string;
  ad_description?: string;
  ad_photos: string[];
  /** Ads of this nursery GreenRoot already removed. */
  ad_nursery_strikes: number;
  ad_nursery_blocked_until?: string;
  reason: string;
  /** Explicit images or a banned item: the ad was hidden on report. */
  serious: boolean;
  notes?: string;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED';
  reported_by_name?: string;
  reported_by_nursery_name: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  created_at: string;
};

export type MarketReportsResponse = { reports: MarketReport[]; pagination: Pagination };

/** Any market ad, as Admin → Local Market → All ads lists it. */
export type AdminMarketAd = {
  id: number;
  code: string;
  /** SELL offers plants; WANT asks for them (no price, no photos). */
  ad_type: 'SELL' | 'WANT';
  title: string;
  plant_name: string;
  description?: string;
  photos: string[];
  status: string;
  /** Why GreenRoot hid or removed it; the seller sees this. */
  moderation_note?: string;
  quantity?: number;
  price_per_unit?: number;
  price_unit?: string;
  view_count: number;
  enquiry_count: number;
  pending_reports: number;
  nursery_id: number;
  nursery_name: string;
  nursery_verified: boolean;
  nursery_strikes: number;
  nursery_blocked_until?: string;
  posted_by_name?: string;
  posted_by_photo?: string;
  published_at?: string;
  expires_at?: string;
  created_at: string;
  size_description?: string;
  /** Wanted posts: the date the plants are needed by (YYYY-MM-DD). */
  needed_by?: string;
  /** False: the ad has no position, so nearby lists (60-100 km) never show it. */
  has_location: boolean;
  pickup_latitude?: number;
  pickup_longitude?: number;
  pickup_location_source?: string;
  pickup_address?: string;
  /** Where buyers collect ("pickup point"); required when there is no road. */
  pickup_landmark?: string;
  road_accessible?: boolean;
  truck_accessible?: boolean;
  access_instructions?: string;
  /** Owner soft delete (status DELETED). */
  deleted_at?: string;
  deleted_by_name?: string;
};

export type AdminMarketAdsResponse = { ads: AdminMarketAd[]; pagination: Pagination };
export type ModerationOutcome = { strikes: number; blocked_until?: string };
export type BlockedNursery = { nursery_id: number; nursery_name: string; strikes: number; blocked_until: string };

/** An uncaught error reported by the mobile or web app. */
export type CrashReport = {
  id: number;
  user_id?: number;
  user_name?: string;
  platform: 'android' | 'ios' | 'web';
  app_version: string;
  build_number?: string;
  os_version?: string;
  device_model?: string;
  error_type: string;
  message: string;
  stack_trace?: string;
  context?: Record<string, unknown>;
  is_fatal: boolean;
  occurred_at: string;
  received_at: string;
};

export type CrashReportsResponse = { items: CrashReport[]; total: number };

export type PlantCareGuideResponse = {
  care_guide: Record<string, unknown>;
};

export const resourceConfigs = {
  users: {
    key: 'users',
    tag: 'Users',
    path: '/api/v1/admin/users',
    collectionKey: 'users',
  },
  nurseries: {
    key: 'nurseries',
    tag: 'Nurseries',
    path: '/api/v1/nurseries',
    collectionKey: 'nurseries',
  },

  orders: { key: 'orders', tag: 'Orders', path: '/api/v1/orders', collectionKey: 'orders' },
  quotations: { key: 'quotations', tag: 'Quotations', path: '/api/v1/quotations', collectionKey: 'quotations' },
  payments: {
    key: 'payments',
    tag: 'Payments',
    path: '/api/v1/payments',
    collectionKey: 'payments',
  },
  dispatches: {
    key: 'dispatches',
    tag: 'Dispatches',
    path: '/api/v1/dispatches',
    collectionKey: 'dispatches',
  },
  vehicles: {
    key: 'vehicles',
    tag: 'Vehicles',
    path: '/api/v1/vehicles',
    collectionKey: 'vehicles',
  },
  drivers: { key: 'drivers', tag: 'Drivers', path: '/api/v1/drivers', collectionKey: 'drivers' },
  notifications: {
    key: 'notifications',
    tag: 'Notifications',
    path: '/api/v1/notifications',
    collectionKey: 'notifications',
  },
  notificationDevices: {
    key: 'notificationDevices',
    tag: 'Notifications',
    path: '/api/v1/notifications/devices',
    collectionKey: 'devices',
  },
  notificationTemplates: {
    key: 'notificationTemplates',
    tag: 'Notifications',
    path: '/api/v1/notifications/templates',
    collectionKey: 'templates',
  },
  subscriptionPlans: {
    key: 'subscriptionPlans',
    tag: 'Subscriptions',
    path: '/api/v1/subscription-plans',
    collectionKey: 'plans',
  },
  subscriptions: {
    key: 'subscriptions',
    tag: 'Subscriptions',
    path: '/api/v1/subscriptions',
    collectionKey: 'subscriptions',
  },
  attachments: {
    key: 'attachments',
    tag: 'Attachments',
    path: '/api/v1/attachments',
    collectionKey: 'attachments',
  },
  sourcingNetwork: {
    key: 'sourcingNetwork',
    tag: 'Sourcing',
    path: '/api/v1/sourcing-network/nurseries',
    collectionKey: 'nurseries',
  },
  tracking: {
    key: 'tracking',
    tag: 'Tracking',
    integrationNote:
      'Swagger exposes tracking by vehicle, driver, and dispatch ID. This needs an admin lookup/map screen instead of a generic global list.',
  },
  audit: { key: 'audit', tag: 'Audit', path: '/api/v1/audit-logs', collectionKey: 'audit_logs' },
  securityLogs: { key: 'securityLogs', tag: 'SecurityLogs', path: '/api/v1/security-logs', collectionKey: 'security_logs' },
} satisfies Record<string, ResourceConfig>;

function toQuery(params: ListParams) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  return search.toString();
}

export const adminResourcesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listResource: builder.query<
      ResourceListResponse,
      { resource: keyof typeof resourceConfigs; params?: ListParams }
    >({
      query: ({ resource, params = {} }) => {
        const config: ResourceConfig = resourceConfigs[resource];
        if (!config.path) return '/api/v1';
        const query = toQuery({ page: 1, per_page: 10, ...params });
        return `${config.path}${query ? `?${query}` : ''}`;
      },
      transformResponse: (response: Record<string, unknown>, _meta, arg) => {
        const config: ResourceConfig = resourceConfigs[arg.resource];
        return {
          rows: config.collectionKey
            ? (response[config.collectionKey] as Record<string, unknown>[] | undefined) ?? []
            : [],
          pagination: response.pagination as Pagination | undefined,
        };
      },
      providesTags: (_result, _error, arg) => [resourceConfigs[arg.resource].tag],
    }),
    updatePlant: builder.mutation<unknown, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/v1/plants/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Plants', 'Dashboard'],
    }),
    getPlant: builder.query<PlantDetailResponse, number>({
      query: (id) => `/api/v1/plants/${id}`,
      providesTags: ['Plants'],
    }),
    listBotanicalNames: builder.query<BotanicalListResponse, BotanicalListParams>({
      query: (params) => `/api/v1/botanical-names?${toQuery(params)}`,
      providesTags: ['Plants'],
    }),
    listMarketReports: builder.query<MarketReportsResponse, { status?: string; page: number; per_page: number }>({
      query: (params) => `/api/v1/market/reports?${toQuery(params)}`,
      providesTags: ['Market'],
    }),
    listMarketAdminAds: builder.query<AdminMarketAdsResponse, { status?: string; search?: string; no_location?: 'true'; page: number; per_page: number }>({
      query: (params) => `/api/v1/market/admin/ads?${toQuery(params)}`,
      providesTags: ['Market'],
    }),
    moderateMarketAd: builder.mutation<
      { ad: AdminMarketAd; outcome: ModerationOutcome },
      { id: number; action: 'HIDE' | 'RESTORE' | 'REMOVE'; note?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/api/v1/market/admin/ads/${id}/moderate`, method: 'POST', body }),
      invalidatesTags: ['Market', 'Dashboard'],
    }),
    listMarketBlockedNurseries: builder.query<{ nurseries: BlockedNursery[] }, void>({
      query: () => '/api/v1/market/admin/blocked-nurseries',
      providesTags: ['Market'],
    }),
    unblockMarketNursery: builder.mutation<{ nursery_id: number }, number>({
      query: (id) => ({ url: `/api/v1/market/admin/nurseries/${id}/unblock`, method: 'POST' }),
      invalidatesTags: ['Market'],
    }),
    reviewMarketReport: builder.mutation<
      { report: MarketReport; outcome: ModerationOutcome },
      { id: number; decision: 'REMOVE' | 'DISMISS' }
    >({
      query: ({ id, ...body }) => ({ url: `/api/v1/market/reports/${id}/review`, method: 'POST', body }),
      invalidatesTags: ['Market', 'Dashboard'],
    }),
    listCrashReports: builder.query<CrashReportsResponse, { platform?: string; app_version?: string; fatal?: string; page: number; per_page: number }>({
      query: (params) => `/api/v1/admin/crash-reports?${toQuery(params)}`,
    }),
    listBotanicalFamilies: builder.query<BotanicalFamiliesResponse, void>({
      query: () => '/api/v1/botanical-names/families',
      providesTags: ['Plants'],
    }),
    getBotanicalName: builder.query<BotanicalDetailResponse, string>({
      query: (wfoId) => `/api/v1/botanical-names/${encodeURIComponent(wfoId)}`,
      providesTags: ['Plants'],
    }),
    resolvePlant: builder.mutation<PlantDetailResponse, string>({
      query: (wfoId) => ({ url: '/api/v1/plants/resolve', method: 'POST', body: { wfo_id: wfoId } }),
      invalidatesTags: ['Plants', 'Dashboard'],
    }),
    lookupPlants: builder.query<PlantLookupResponse, string>({
      query: (q) => `/api/v1/plants/lookup?${new URLSearchParams({ q, limit: '15' })}`,
      providesTags: ['Plants'],
    }),
    getPlantCareGuide: builder.query<PlantCareGuideResponse, number>({
      query: (id) => `/api/v1/plants/${id}/care-guide`,
      providesTags: ['Plants'],
    }),
    createPlantImage: builder.mutation<unknown, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/v1/plants/${id}/images`, method: 'POST', body }),
      invalidatesTags: ['Plants'],
    }),
    createNursery: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: '/api/v1/nurseries', method: 'POST', body }),
      invalidatesTags: ['Nurseries', 'Dashboard'],
    }),
    updateNursery: builder.mutation<unknown, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/v1/nurseries/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Nurseries', 'Dashboard'],
    }),
    updateNurseryStatus: builder.mutation<unknown, { id: number; status: string; reason?: string }>({
      query: ({ id, status, reason }) => ({
        url: `/api/v1/nurseries/${id}/status`,
        method: 'PUT',
        body: { status, reason: reason ?? '' },
      }),
      invalidatesTags: ['Nurseries', 'Dashboard'],
    }),
    updateUserStatus: builder.mutation<unknown, { id: number; status: string; reason?: string }>({
      query: ({ id, status, reason }) => ({
        url: `/api/v1/admin/users/${id}/status`,
        method: 'PUT',
        body: { status, reason: reason ?? '' },
      }),
      invalidatesTags: ['Users', 'Dashboard'],
    }),
    updateNurseryStatusAdmin: builder.mutation<unknown, { id: number; status: string; reason?: string }>({
      query: ({ id, status, reason }) => ({
        url: `/api/v1/admin/nurseries/${id}/status`,
        method: 'PUT',
        body: { status, reason: reason ?? '' },
      }),
      invalidatesTags: ['Nurseries', 'Dashboard'],
    }),
    approveDriver: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/v1/drivers/${id}/approve`, method: 'POST', body: {} }),
      invalidatesTags: ['Drivers', 'Dashboard'],
    }),
    createDriver: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: '/api/v1/drivers', method: 'POST', body }),
      invalidatesTags: ['Drivers', 'Dashboard'],
    }),
    updateDriver: builder.mutation<unknown, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/v1/drivers/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Drivers', 'Dashboard'],
    }),
    deactivateDriver: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/v1/drivers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Drivers', 'Dashboard'],
    }),
    createVehicle: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: '/api/v1/vehicles', method: 'POST', body }),
      invalidatesTags: ['Vehicles', 'Dashboard'],
    }),
    updateVehicle: builder.mutation<unknown, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/v1/vehicles/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Vehicles', 'Dashboard'],
    }),
    retireVehicle: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/v1/vehicles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Vehicles', 'Dashboard'],
    }),
    updateDispatchStatus: builder.mutation<unknown, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/v1/dispatches/${id}/status`, method: 'PUT', body }),
      invalidatesTags: ['Dispatches', 'Dashboard'],
    }),
    getOrder: builder.query<OrderDetailResponse, number>({
      query: (id) => `/api/v1/orders/${id}`,
      providesTags: ['Orders'],
    }),
    getQuotation: builder.query<QuotationDetailResponse, number>({
      query: (id) => `/api/v1/quotations/${id}`,
      providesTags: ['Quotations'],
    }),
    createQuotation: builder.mutation<QuotationDetailResponse, Record<string, unknown>>({
      query: (body) => ({ url: '/api/v1/quotations', method: 'POST', body }),
      invalidatesTags: ['Quotations'],
    }),
    getQuotationRenderedPdf: builder.query<QuotationPDFResponse, number>({
      query: (id) => ({
        url: `/api/v1/quotations/${id}/documents/render`,
        responseHandler: async (response) => {
          const disposition = response.headers.get('content-disposition') ?? '';
          const filename = disposition.match(/filename="([^"]+)"/)?.[1];
          return { blob: await response.blob(), filename };
        },
      }),
      providesTags: ['Quotations'],
    }),
    listOrderItems: builder.query<OrderItemsResponse, number>({
      query: (id) => `/api/v1/orders/${id}/items`,
      providesTags: ['Orders'],
    }),
    listOrderPayments: builder.query<RelatedPaymentsResponse, number>({
      query: (id) => `/api/v1/orders/${id}/payments?page=1&per_page=20`,
      providesTags: ['Payments'],
    }),
    listOrderDispatches: builder.query<RelatedDispatchesResponse, number>({
      query: (id) => `/api/v1/orders/${id}/dispatches?page=1&per_page=20`,
      providesTags: ['Dispatches'],
    }),
    updateOrderStatus: builder.mutation<unknown, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/v1/orders/${id}/status`, method: 'PUT', body }),
      invalidatesTags: ['Orders', 'Dashboard'],
    }),
    updateOrderDelivery: builder.mutation<unknown, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/v1/orders/${id}/delivery`, method: 'PUT', body }),
      invalidatesTags: ['Orders', 'Dispatches', 'Dashboard'],
    }),
    createOrder: builder.mutation<{ order: Record<string, unknown> }, Record<string, unknown>>({
      query: (body) => ({ url: '/api/v1/orders', method: 'POST', body }),
      invalidatesTags: ['Orders', 'Dashboard'],
    }),
    deleteOrder: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/v1/orders/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Orders', 'Dashboard'],
    }),
    createOrderItem: builder.mutation<unknown, { orderId: number; body: Record<string, unknown> }>({
      query: ({ orderId, body }) => ({ url: `/api/v1/orders/${orderId}/items`, method: 'POST', body }),
      invalidatesTags: ['Orders'],
    }),
    updateOrderItem: builder.mutation<unknown, { itemId: number; body: Record<string, unknown> }>({
      query: ({ itemId, body }) => ({ url: `/api/v1/orders/items/${itemId}`, method: 'PUT', body }),
      invalidatesTags: ['Orders'],
    }),
    deleteOrderItem: builder.mutation<unknown, number>({
      query: (itemId) => ({ url: `/api/v1/orders/items/${itemId}`, method: 'DELETE' }),
      invalidatesTags: ['Orders'],
    }),
    createManualPayment: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: '/api/v1/payments/manual', method: 'POST', body }),
      invalidatesTags: ['Payments', 'Orders', 'Subscriptions', 'Dashboard'],
    }),
    updatePaymentStatus: builder.mutation<unknown, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/v1/payments/${id}/status`, method: 'PUT', body }),
      invalidatesTags: ['Payments', 'Orders', 'Subscriptions', 'Dashboard'],
    }),
    listSubscriptionPlans: builder.query<{ plans: SubscriptionPlan[] }, void>({
      query: () => '/api/v1/subscription-plans',
      providesTags: ['Subscriptions'],
    }),
    getSubscription: builder.query<{ subscription: Record<string, unknown> }, number>({
      query: (id) => `/api/v1/subscriptions/${id}`,
      providesTags: ['Subscriptions'],
    }),
    createSubscription: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: '/api/v1/subscriptions', method: 'POST', body }),
      invalidatesTags: ['Subscriptions', 'Dashboard'],
    }),
    renewSubscription: builder.mutation<
      unknown,
      { id: number; body: { billing_cycle: string; payment_method?: string; provider?: string; provider_order_id?: string } }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/subscriptions/${id}/renew`, method: 'POST', body }),
      invalidatesTags: ['Subscriptions'],
    }),
    cancelSubscription: builder.mutation<unknown, { id: number; body?: { cancel_immediately?: boolean; reason?: string } }>({
      query: ({ id, body }) => ({ url: `/api/v1/subscriptions/${id}/cancel`, method: 'POST', body: body ?? { cancel_immediately: true } }),
      invalidatesTags: ['Subscriptions', 'Dashboard'],
    }),
    updateSubscriptionStatus: builder.mutation<unknown, { id: number; status: string }>({
      query: ({ id, status }) => ({ url: `/api/v1/subscriptions/${id}/status`, method: 'PUT', body: { subscription_status: status } }),
      invalidatesTags: ['Subscriptions'],
    }),
    listSubscriptionPayments: builder.query<{ payments: Record<string, unknown>[] }, number>({
      query: (id) => `/api/v1/subscriptions/${id}/payments`,
      providesTags: ['Payments', 'Subscriptions'],
    }),
    listSubscriptionPromos: builder.query<{ promos: SubscriptionPromo[] }, void>({
      query: () => '/api/v1/subscription-promos',
      providesTags: ['Subscriptions'],
    }),
    createSubscriptionPromo: builder.mutation<
      { promo: SubscriptionPromo },
      {
        promo_code: string;
        name: string;
        description?: string;
        discount_type: string;
        discount_value: number;
        max_discount_cap?: number;
        applicable_plans: string[];
        applicable_cycles: string[];
        valid_from: string;
        valid_until: string;
        max_uses?: number;
      }
    >({
      query: (body) => ({ url: '/api/v1/subscription-promos', method: 'POST', body }),
      invalidatesTags: ['Subscriptions'],
    }),
    updateSubscriptionPromo: builder.mutation<
      { promo: SubscriptionPromo },
      {
        id: number;
        body: {
          name: string;
          description?: string;
          discount_type: string;
          discount_value: number;
          max_discount_cap?: number;
          applicable_plans: string[];
          applicable_cycles: string[];
          valid_from: string;
          valid_until: string;
          is_active: boolean;
          max_uses?: number;
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/subscription-promos/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Subscriptions'],
    }),
    blastSubscriptionPromo: builder.mutation<{ sent_count: number }, number>({
      query: (id) => ({ url: `/api/v1/subscription-promos/${id}/blast`, method: 'POST' }),
      invalidatesTags: ['Subscriptions'],
    }),
    updateSubscriptionPlan: builder.mutation<
      { plan: SubscriptionPlan },
      {
        id: number;
        body: {
          plan_name: string;
          description?: string | null;
          six_month_price: number;
          yearly_price: number;
          max_managers?: number | null;
          is_active: boolean;
          features: Record<string, unknown>;
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/subscription-plans/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Subscriptions'],
    }),
    getUser: builder.query<UserDetailResponse, number>({
      query: (id) => `/api/v1/users/${id}`,
      providesTags: ['Users'],
    }),
    listUserRoles: builder.query<UserRolesResponse, number>({
      query: (id) => `/api/v1/users/${id}/roles`,
      providesTags: ['Users'],
    }),
    listUserSessions: builder.query<UserSessionsResponse, number>({
      query: (id) => `/api/v1/users/${id}/sessions`,
      providesTags: ['Users'],
    }),
    listUserAddresses: builder.query<UserAddressesResponse, number>({
      query: (id) => `/api/v1/users/${id}/addresses`,
      providesTags: ['Users'],
    }),
    getNursery: builder.query<NurseryDetailResponse, number>({
      query: (id) => `/api/v1/nurseries/${id}`,
      providesTags: ['Nurseries'],
    }),
    listNurseryAddresses: builder.query<NurseryAddressesResponse, number>({
      query: (id) => `/api/v1/nurseries/${id}/addresses`,
      providesTags: ['Nurseries'],
    }),
    createNurseryAddress: builder.mutation<unknown, { nurseryId: number; body: Record<string, unknown> }>({
      query: ({ nurseryId, body }) => ({ url: `/api/v1/nurseries/${nurseryId}/addresses`, method: 'POST', body }),
      invalidatesTags: ['Nurseries'],
    }),
    updateNurseryAddress: builder.mutation<unknown, { addressId: number; body: Record<string, unknown> }>({
      query: ({ addressId, body }) => ({ url: `/api/v1/nurseries/addresses/${addressId}`, method: 'PUT', body }),
      invalidatesTags: ['Nurseries'],
    }),
    deleteNurseryAddress: builder.mutation<unknown, number>({
      query: (addressId) => ({ url: `/api/v1/nurseries/addresses/${addressId}`, method: 'DELETE' }),
      invalidatesTags: ['Nurseries'],
    }),
    listNurseryUsers: builder.query<NurseryUsersResponse, number>({
      query: (id) => `/api/v1/nurseries/${id}/managers`,
      providesTags: ['Nurseries'],
    }),
    listTopItems: builder.query<TopItemListResponse, ListParams>({
      query: (params) => `/api/v1/top-items?${toQuery(params)}`,
      providesTags: ['TopItems'],
    }),
    listNurseryTopItems: builder.query<TopItemListResponse, number>({
      query: (nurseryId) => `/api/v1/nurseries/${nurseryId}/top-items?per_page=20`,
      providesTags: ['TopItems'],
    }),
    listPlantTopItems: builder.query<TopItemListResponse, number>({
      query: (plantId) => `/api/v1/plants/${plantId}/top-items?per_page=50`,
      providesTags: ['TopItems'],
    }),
    listPlantSizes: builder.query<{ sizes: PlantSize[] }, void>({
      query: () => '/api/v1/plants/sizes',
    }),
    deleteNursery: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/v1/nurseries/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Nurseries', 'Dashboard'],
    }),
    createTopItem: builder.mutation<{ top_item: TopItem }, TopItemInput>({
      query: (body) => ({ url: '/api/v1/top-items', method: 'POST', body }),
      invalidatesTags: ['TopItems', 'Dashboard'],
    }),
    updateTopItem: builder.mutation<{ top_item: TopItem }, { id: number; body: TopItemInput }>({
      query: ({ id, body }) => ({ url: `/api/v1/top-items/${id}`, method: 'PUT', body }),
      invalidatesTags: ['TopItems'],
    }),
    deleteTopItem: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/v1/top-items/${id}`, method: 'DELETE' }),
      invalidatesTags: ['TopItems', 'Dashboard'],
    }),
    getVehicle: builder.query<{ vehicle: Record<string, unknown> }, number>({
      query: (id) => `/api/v1/vehicles/${id}`,
      providesTags: ['Vehicles'],
    }),
    listVehicleTracking: builder.query<{ tracking: Record<string, unknown>[] }, number>({
      query: (id) => `/api/v1/vehicles/${id}/tracking`,
      providesTags: ['Vehicles'],
    }),
    getVehicleLatestTracking: builder.query<{ tracking: Record<string, unknown> | null }, number>({
      query: (id) => `/api/v1/vehicles/${id}/tracking/latest`,
      providesTags: ['Vehicles'],
    }),
    getDriver: builder.query<{ driver: Record<string, unknown> }, number>({
      query: (id) => `/api/v1/drivers/${id}`,
      providesTags: ['Drivers'],
    }),
    getDriverLatestTracking: builder.query<{ tracking: Record<string, unknown> | null }, number>({
      query: (id) => `/api/v1/drivers/${id}/tracking/latest`,
      providesTags: ['Drivers'],
    }),
    getLiveDriverLocation: builder.query<LiveDriverLocationResponse, number>({
      query: (driverUserId) => `/api/v1/tracking/live/drivers/${driverUserId}`,
      providesTags: ['Tracking'],
    }),
    getDispatch: builder.query<{ dispatch: Record<string, unknown> }, number>({
      query: (id) => `/api/v1/dispatches/${id}`,
      providesTags: ['Dispatches'],
    }),
    addDispatchItem: builder.mutation<unknown, { dispatchId: number; body: Record<string, unknown> }>({
      query: ({ dispatchId, body }) => ({ url: `/api/v1/dispatches/${dispatchId}/items`, method: 'POST', body }),
      invalidatesTags: ['Dispatches'],
    }),
    listDispatchTracking: builder.query<{ tracking: Record<string, unknown>[] }, number>({
      query: (id) => `/api/v1/dispatches/${id}/tracking`,
      providesTags: ['Dispatches'],
    }),
    getNotification: builder.query<{ notification: Record<string, unknown> }, number>({
      query: (id) => `/api/v1/notifications/${id}`,
      providesTags: ['Notifications'],
    }),
    markNotificationRead: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/v1/notifications/${id}/read`, method: 'PUT' }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsRead: builder.mutation<unknown, void>({
      query: () => ({ url: '/api/v1/notifications/read-all', method: 'PUT' }),
      invalidatesTags: ['Notifications'],
    }),
    updateNotificationTemplate: builder.mutation<unknown, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/v1/notifications/templates/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Notifications'],
    }),
    deleteNotification: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/v1/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notifications'],
    }),
    presignUpload: builder.mutation<
      { upload_url: string; file_url: string; key: string; bucket: string },
      { bucket: string; file_name: string; content_type?: string }
    >({
      query: (body) => ({ url: '/api/v1/storage/presign', method: 'POST', body }),
    }),
    createAttachment: builder.mutation<unknown, {
      entity_type: string;
      entity_id: number;
      file_name: string;
      file_url: string;
      file_type?: string;
      file_size?: number;
    }>({
      query: (body) => ({ url: '/api/v1/attachments', method: 'POST', body }),
      invalidatesTags: ['Attachments'],
    }),
  }),
});

export const {
  useGetQuotationQuery,
  useLazyGetQuotationRenderedPdfQuery,
  useCreateQuotationMutation,
  useListSubscriptionPlansQuery,
  useUpdateSubscriptionPlanMutation,
  useListSubscriptionPromosQuery,
  useCreateSubscriptionPromoMutation,
  useUpdateSubscriptionPromoMutation,
  useBlastSubscriptionPromoMutation,
  useGetSubscriptionQuery,
  useCreateSubscriptionMutation,
  useRenewSubscriptionMutation,
  useCancelSubscriptionMutation,
  useUpdateSubscriptionStatusMutation,
  useListSubscriptionPaymentsQuery,
  useGetUserQuery,
  useListUserRolesQuery,
  useListUserSessionsQuery,
  useListUserAddressesQuery,
  useGetNurseryQuery,
  useListNurseryAddressesQuery,
  useCreateNurseryAddressMutation,
  useUpdateNurseryAddressMutation,
  useDeleteNurseryAddressMutation,
  useListNurseryUsersQuery,
  useListNurseryTopItemsQuery,
  useListPlantTopItemsQuery,
  useListTopItemsQuery,
  useListPlantSizesQuery,
  useDeleteNurseryMutation,
  useCreateTopItemMutation,
  useCreateManualPaymentMutation,
  useCreatePlantImageMutation,
  useGetOrderQuery,
  useGetPlantCareGuideQuery,
  useGetPlantQuery,
  useLookupPlantsQuery,
  useListBotanicalNamesQuery,
  useListBotanicalFamiliesQuery,
  useGetBotanicalNameQuery,
  useResolvePlantMutation,
  useListMarketReportsQuery,
  useListMarketAdminAdsQuery,
  useModerateMarketAdMutation,
  useUnblockMarketNurseryMutation,
  useListMarketBlockedNurseriesQuery,
  useReviewMarketReportMutation,
  useListCrashReportsQuery,
  useCreateOrderMutation,
  useDeleteOrderMutation,
  useCreateOrderItemMutation,
  useUpdateOrderItemMutation,
  useDeleteOrderItemMutation,
  useCreateDriverMutation,
  useCreateNurseryMutation,
  useDeactivateDriverMutation,
  useDeleteTopItemMutation,
  useListOrderDispatchesQuery,
  useListOrderItemsQuery,
  useListOrderPaymentsQuery,
  useListResourceQuery,
  useCreateVehicleMutation,
  useRetireVehicleMutation,
  useUpdateDispatchStatusMutation,
  useUpdateDriverMutation,
  useUpdateTopItemMutation,
  useUpdateNurseryMutation,
  useUpdateOrderStatusMutation,
  useUpdateOrderDeliveryMutation,
  useUpdatePaymentStatusMutation,
  useUpdatePlantMutation,
  useUpdateVehicleMutation,
  useGetVehicleQuery,
  useListVehicleTrackingQuery,
  useGetVehicleLatestTrackingQuery,
  useGetDriverQuery,
  useGetDriverLatestTrackingQuery,
  useGetLiveDriverLocationQuery,
  useUpdateNurseryStatusMutation,
  useUpdateUserStatusMutation,
  useUpdateNurseryStatusAdminMutation,
  useApproveDriverMutation,
  useGetDispatchQuery,
  useAddDispatchItemMutation,
  useListDispatchTrackingQuery,
  useGetNotificationQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useUpdateNotificationTemplateMutation,
  useDeleteNotificationMutation,
  usePresignUploadMutation,
  useCreateAttachmentMutation,
} = adminResourcesApi;
