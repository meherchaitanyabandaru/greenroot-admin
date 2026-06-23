import {
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import { env } from '../app/env';
import { clearAuth, setCredentials } from '../features/auth/authSlice';
import { clearStoredAuth, getStoredAuth, setStoredAuth } from './authStorage';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  prepareHeaders: (headers) => {
    const auth = getStoredAuth();
    if (auth?.accessToken) {
      headers.set('authorization', `Bearer ${auth.accessToken}`);
    }
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status !== 401) {
    return result;
  }

  const auth = getStoredAuth();
  if (!auth?.refreshToken) {
    api.dispatch(clearAuth());
    return result;
  }

  const refresh = await rawBaseQuery(
    {
      url: '/api/v1/auth/refresh-token',
      method: 'POST',
      body: { refresh_token: auth.refreshToken },
    },
    api,
    extraOptions,
  );

  if (refresh.data && typeof refresh.data === 'object') {
    const data = refresh.data as {
      access_token?: string;
      refresh_token?: string;
      user?: unknown;
    };
    if (data.access_token && data.refresh_token) {
      setStoredAuth({ accessToken: data.access_token, refreshToken: data.refresh_token });
      api.dispatch(
        setCredentials({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          user: data.user,
        }),
      );
      result = await rawBaseQuery(args, api, extraOptions);
      return result;
    }
  }

  clearStoredAuth();
  api.dispatch(clearAuth());
  return result;
};
