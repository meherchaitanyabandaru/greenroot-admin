import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

export const baseApi = createApi({
  reducerPath: 'greenrootApi',
  baseQuery: baseQueryWithReauth,
  // One admin runs the console all day: when they come back to the tab or
  // the network returns, open lists refresh themselves.
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: [
    'Auth',
    'Dashboard',
    'Users',
    'Plants',
    'Nurseries',
    'TopItems',
    'Requests',
    'PlantRequests',
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
    'Sourcing',
    'Audit',
    'SecurityLogs',
    'SMS',
    'Email',
    'Market',
  ],
  endpoints: () => ({}),
});
