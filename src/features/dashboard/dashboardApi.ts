import { baseApi } from '../../api/baseApi';
import type { DashboardResponse } from '../../api/apiTypes';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    dashboard: builder.query<DashboardResponse, void>({
      query: () => '/api/v1/admin/dashboard',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useDashboardQuery } = dashboardApi;
