import { baseApi } from './baseApi';
import type { ListParams, Pagination } from './apiTypes';

export type ResourceConfig = {
  key: string;
  tag:
    | 'Users'
    | 'Plants'
    | 'Nurseries'
    | 'Inventory'
    | 'PlantRequests'
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

export type RequestDetailResponse = {
  request: Record<string, unknown>;
};

export type RequestResponsesResponse = {
  responses: Record<string, unknown>[];
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

export type PlantCareGuideResponse = {
  care_guide: Record<string, unknown>;
};

export type PlantCategoriesResponse = {
  categories: Record<string, unknown>[];
};

export type PlantCategoryResponse = {
  category: Record<string, unknown>;
};

export const resourceConfigs = {
  users: {
    key: 'users',
    tag: 'Users',
    path: '/api/v1/admin/users',
    collectionKey: 'users',
  },
  plants: { key: 'plants', tag: 'Plants', path: '/api/v1/plants', collectionKey: 'plants' },
  plantCategories: { key: 'plantCategories', tag: 'Plants', path: '/api/v1/plants/categories', collectionKey: 'categories' },
  nurseries: {
    key: 'nurseries',
    tag: 'Nurseries',
    path: '/api/v1/nurseries',
    collectionKey: 'nurseries',
  },
  inventory: {
    key: 'inventory',
    tag: 'Inventory',
    path: '/api/v1/inventory',
    collectionKey: 'inventory',
  },
  plantRequests: {
    key: 'plantRequests',
    tag: 'PlantRequests',
    path: '/api/v1/plant-requests',
    collectionKey: 'plant_requests',
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
  sourcingPosts: {
    key: 'sourcingPosts',
    tag: 'Sourcing',
    path: '/api/v1/sourcing-posts',
    collectionKey: 'posts',
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
    createPlant: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: '/api/v1/plants', method: 'POST', body }),
      invalidatesTags: ['Plants', 'Dashboard'],
    }),
    updatePlant: builder.mutation<unknown, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/v1/plants/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Plants', 'Dashboard'],
    }),
    deletePlant: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/v1/plants/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Plants', 'Dashboard'],
    }),
    listPlantCategories: builder.query<PlantCategoriesResponse, void>({
      query: () => '/api/v1/plants/categories',
      providesTags: ['Plants'],
    }),
    createPlantCategory: builder.mutation<PlantCategoryResponse, { name: string }>({
      query: (body) => ({ url: '/api/v1/plants/categories', method: 'POST', body }),
      invalidatesTags: ['Plants'],
    }),
    updatePlantCategory: builder.mutation<PlantCategoryResponse, { id: number; body: { name?: string; is_active?: boolean } }>({
      query: ({ id, body }) => ({ url: `/api/v1/plants/categories/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Plants'],
    }),
    deletePlantCategory: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/v1/plants/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Plants'],
    }),
    getPlant: builder.query<PlantDetailResponse, number>({
      query: (id) => `/api/v1/plants/${id}`,
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
        body: { status, ...(reason ? { admin_note: reason } : {}) },
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
    createDispatch: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: '/api/v1/dispatches', method: 'POST', body }),
      invalidatesTags: ['Dispatches', 'Dashboard'],
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
    deleteQuotation: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/v1/quotations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Quotations'],
    }),
    sendQuotation: builder.mutation<QuotationDetailResponse, number>({
      query: (id) => ({ url: `/api/v1/quotations/${id}/send`, method: 'POST' }),
      invalidatesTags: ['Quotations'],
    }),
    getQuotationCurrentDocument: builder.query<{ document: Record<string, unknown> & { created_at?: string }; download_url: string }, number>({
      query: (id) => `/api/v1/quotations/${id}/documents/current`,
      providesTags: ['Quotations'],
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
    getRequest: builder.query<RequestDetailResponse, number>({
      query: (id) => `/api/v1/plant-requests/${id}`,
      providesTags: ['PlantRequests'],
    }),
    listRequestResponses: builder.query<RequestResponsesResponse, number>({
      query: (id) => `/api/v1/plant-requests/${id}/responses`,
      providesTags: ['PlantRequests'],
    }),
    createRequest: builder.mutation<RequestDetailResponse, Record<string, unknown>>({
      query: (body) => ({ url: '/api/v1/plant-requests', method: 'POST', body }),
      invalidatesTags: ['PlantRequests', 'Dashboard'],
    }),
    createRequestResponse: builder.mutation<unknown, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/v1/plant-requests/${id}/responses`, method: 'POST', body }),
      invalidatesTags: ['PlantRequests'],
    }),
    updateRequestStatus: builder.mutation<RequestDetailResponse, { id: number; status: string }>({
      query: ({ id, status }) => ({
        url: `/api/v1/plant-requests/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['PlantRequests', 'Dashboard'],
    }),
    cancelRequest: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/v1/plant-requests/${id}`, method: 'DELETE' }),
      invalidatesTags: ['PlantRequests', 'Dashboard'],
    }),
    updateRequestResponse: builder.mutation<unknown, { responseId: number; body: { status: string } }>({
      query: ({ responseId, body }) => ({
        url: `/api/v1/plant-requests/responses/${responseId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['PlantRequests'],
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
    listNurseryInventory: builder.query<{ inventory: Record<string, unknown>[] }, number>({
      query: (nurseryId) => `/api/v1/nurseries/${nurseryId}/inventory`,
      providesTags: ['Inventory'],
    }),
    deleteNursery: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/v1/nurseries/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Nurseries', 'Dashboard'],
    }),
    createInventory: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: '/api/v1/inventory', method: 'POST', body }),
      invalidatesTags: ['Inventory', 'Dashboard'],
    }),
    updateInventory: builder.mutation<unknown, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/v1/inventory/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Inventory', 'Dashboard'],
    }),
    deleteInventory: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/v1/inventory/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Inventory', 'Dashboard'],
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
    updateDriverLocation: builder.mutation<unknown, { id: number; body: { latitude: number; longitude: number } }>({
      query: ({ id, body }) => ({ url: `/api/v1/drivers/${id}/location`, method: 'POST', body }),
      invalidatesTags: ['Drivers'],
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
    recordTracking: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: '/api/v1/tracking', method: 'POST', body }),
      invalidatesTags: ['Vehicles', 'Drivers', 'Dispatches'],
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
  useLazyGetQuotationCurrentDocumentQuery,
  useLazyGetQuotationRenderedPdfQuery,
  useCreateQuotationMutation,
  useDeleteQuotationMutation,
  useSendQuotationMutation,
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
  useGetRequestQuery,
  useListRequestResponsesQuery,
  useCreateRequestMutation,
  useCreateRequestResponseMutation,
  useUpdateRequestStatusMutation,
  useCancelRequestMutation,
  useUpdateRequestResponseMutation,
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
  useListNurseryInventoryQuery,
  useDeleteNurseryMutation,
  useCreateInventoryMutation,
  useCreateManualPaymentMutation,
  useCreatePlantImageMutation,
  useGetOrderQuery,
  useGetPlantCareGuideQuery,
  useGetPlantQuery,
  useCreateOrderMutation,
  useDeleteOrderMutation,
  useCreateOrderItemMutation,
  useUpdateOrderItemMutation,
  useDeleteOrderItemMutation,
  useCreateDispatchMutation,
  useCreateDriverMutation,
  useCreateNurseryMutation,
  useCreatePlantMutation,
  useDeactivateDriverMutation,
  useDeletePlantMutation,
  useDeleteInventoryMutation,
  useListOrderDispatchesQuery,
  useListOrderItemsQuery,
  useListOrderPaymentsQuery,
  useListResourceQuery,
  useCreateVehicleMutation,
  useRetireVehicleMutation,
  useUpdateDispatchStatusMutation,
  useUpdateDriverMutation,
  useUpdateInventoryMutation,
  useUpdateNurseryMutation,
  useUpdateOrderStatusMutation,
  useUpdateOrderDeliveryMutation,
  useUpdatePaymentStatusMutation,
  useUpdatePlantMutation,
  useUpdateVehicleMutation,
  useListPlantCategoriesQuery,
  useCreatePlantCategoryMutation,
  useUpdatePlantCategoryMutation,
  useDeletePlantCategoryMutation,
  useGetVehicleQuery,
  useListVehicleTrackingQuery,
  useGetVehicleLatestTrackingQuery,
  useGetDriverQuery,
  useUpdateDriverLocationMutation,
  useGetDriverLatestTrackingQuery,
  useGetLiveDriverLocationQuery,
  useUpdateNurseryStatusMutation,
  useApproveDriverMutation,
  useGetDispatchQuery,
  useAddDispatchItemMutation,
  useListDispatchTrackingQuery,
  useRecordTrackingMutation,
  useGetNotificationQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useUpdateNotificationTemplateMutation,
  useDeleteNotificationMutation,
  usePresignUploadMutation,
  useCreateAttachmentMutation,
} = adminResourcesApi;
