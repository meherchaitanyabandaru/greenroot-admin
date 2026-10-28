import { baseApi } from './baseApi';
import type { ListParams, Pagination } from './apiTypes';
import type {
  AdminMarketAd,
  AdminMarketAdsResponse,
  BlockedNursery,
  BotanicalDetailResponse,
  BotanicalFamiliesResponse,
  BotanicalListParams,
  BotanicalListResponse,
  CrashReportsResponse,
  LiveDriverLocationResponse,
  MarketReport,
  MarketReportsResponse,
  ModerationOutcome,
  NurseryAddressesResponse,
  NurseryDetailResponse,
  NurseryUsersResponse,
  OrderDetailResponse,
  OrderItemsResponse,
  PaymentIssue,
  PlantCareGuideResponse,
  PlantDetailResponse,
  PlantLookupResponse,
  PlantSize,
  PlantSuggestion,
  PlantSuggestionsResponse,
  QuotationDetailResponse,
  QuotationPDFResponse,
  RelatedDispatchesResponse,
  RelatedPaymentsResponse,
  ResourceConfig,
  ResourceListResponse,
  SubscriptionPlan,
  SubscriptionPromo,
  TopItem,
  TopItemInput,
  TopItemListResponse,
  UserAddressesResponse,
  UserDetailResponse,
  UserRolesResponse,
  UserSessionsResponse,
} from './adminTypes';
import { resourceConfigs } from './resourceConfigs';

export * from './adminTypes';
export { resourceConfigs } from './resourceConfigs';


function toQuery(params: ListParams) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  return search.toString();
}

export type LoadingProof = {
  photos: Array<{ id: number; url: string; uploaded_at: string }>;
  declared_no_prohibited_items: boolean;
  completed_at?: string;
  completed_by_name?: string;
  truck?: Record<string, unknown> | null;
};

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
    createPlant: builder.mutation<PlantDetailResponse, Record<string, unknown>>({
      query: (body) => ({ url: '/api/v1/plants', method: 'POST', body }),
      invalidatesTags: ['Plants', 'Dashboard'],
    }),
    listPlantSuggestions: builder.query<PlantSuggestionsResponse, { status?: string; page: number; per_page: number }>({
      query: (params) => `/api/v1/plants/suggestions?${toQuery(params)}`,
      providesTags: ['Plants'],
    }),
    listPaymentIssues: builder.query<{ issues: PaymentIssue[] }, { status?: string }>({
      query: ({ status }) => `/api/v1/payment-issues${status ? `?status=${encodeURIComponent(status)}` : ''}`,
      providesTags: ['Payments'],
    }),
    resolvePaymentIssue: builder.mutation<{ issue: PaymentIssue }, { id: number; note: string }>({
      query: ({ id, note }) => ({ url: `/api/v1/payment-issues/${id}/resolve`, method: 'POST', body: { note } }),
      invalidatesTags: ['Payments', 'Dashboard'],
    }),
    reviewPlantSuggestion: builder.mutation<
      { suggestion: PlantSuggestion },
      { id: number; action: 'APPROVED' | 'LINKED' | 'REJECTED'; plant_id?: number; note?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/api/v1/plants/suggestions/${id}/review`, method: 'POST', body }),
      invalidatesTags: ['Plants', 'Dashboard'],
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
    // Photos (signed links), the no-prohibited-items declaration, who loaded and the truck.
    getOrderLoadingProof: builder.query<{ loading_proof: LoadingProof }, number>({
      query: (id) => `/api/v1/orders/${id}/loading-proof`,
      providesTags: ['Orders'],
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
    updateOrderItem: builder.mutation<unknown, { orderId: number; itemId: number; body: Record<string, unknown> }>({
      query: ({ orderId, itemId, body }) => ({ url: `/api/v1/orders/${orderId}/items/${itemId}`, method: 'PUT', body }),
      invalidatesTags: ['Orders'],
    }),
    deleteOrderItem: builder.mutation<unknown, { orderId: number; itemId: number }>({
      query: ({ orderId, itemId }) => ({ url: `/api/v1/orders/${orderId}/items/${itemId}`, method: 'DELETE' }),
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
      { id: number; body: { billing_cycle: string; plan_id?: number; payment_method?: string; provider?: string; provider_order_id?: string } }
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
    refundSubscriptionPayment: builder.mutation<
      { subscription: Record<string, unknown> },
      { id: number; paymentId: number; reason: string }
    >({
      query: ({ id, paymentId, reason }) => ({
        url: `/api/v1/subscriptions/${id}/payments/${paymentId}/refund`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Payments', 'Subscriptions', 'Dashboard'],
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
          /** The base price; the API prices quarterly / half-yearly / yearly from it. */
          monthly_price: number;
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
      { bucket: string; file_name: string; content_type?: string; size: number }
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
  useRefundSubscriptionPaymentMutation,
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
  useCreatePlantMutation,
  useListPlantSuggestionsQuery,
  useReviewPlantSuggestionMutation,
  useListPaymentIssuesQuery,
  useResolvePaymentIssueMutation,
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
  useGetOrderLoadingProofQuery,
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
