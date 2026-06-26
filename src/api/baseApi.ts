import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

export const baseApi = createApi({
  reducerPath: 'greenrootApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Auth',
    'Dashboard',
    'Users',
    'Plants',
    'Nurseries',
    'Inventory',
    'Requests',
    'Orders',
    'Quotations',
    'Payments',
    'Dispatches',
    'Vehicles',
    'Drivers',
    'Tracking',
    'Notifications',
    'Subscriptions',
    'Attachments',
    'Audit',
  ],
  endpoints: () => ({}),
});
