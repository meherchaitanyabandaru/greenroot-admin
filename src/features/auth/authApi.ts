import { baseApi } from '../../api/baseApi';
import type { AuthResponse, User } from '../../api/apiTypes';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendOtp: builder.mutation<{ message: string; mock_otp?: string }, { mobile: string }>({
      query: (body) => ({ url: '/api/v1/auth/send-otp', method: 'POST', body }),
    }),
    verifyOtp: builder.mutation<AuthResponse, { mobile: string; otp: string }>({
      query: (body) => ({
        url: '/api/v1/auth/verify-otp',
        method: 'POST',
        body: { ...body, device_type: 'admin_web', os_name: 'web', app_version: '0.1.0' },
      }),
      invalidatesTags: ['Auth'],
    }),
    me: builder.query<{ user: User }, void>({
      query: () => '/api/v1/auth/me',
      providesTags: ['Auth'],
    }),
    logout: builder.mutation<{ message: string }, { refresh_token?: string }>({
      query: (body) => ({ url: '/api/v1/auth/logout', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const { useSendOtpMutation, useVerifyOtpMutation, useMeQuery, useLogoutMutation } = authApi;
