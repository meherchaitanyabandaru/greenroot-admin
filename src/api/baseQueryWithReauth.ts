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

type Api = Parameters<typeof rawBaseQuery>[1];
type Extra = Parameters<typeof rawBaseQuery>[2];

// Refresh tokens rotate: a second refresh with the same token is refused.
// The dashboard fires several requests at once, so when the access token
// expires they all get 401 together; they share this one refresh instead of
// racing (the loser used to sign the admin out).
let refreshing: Promise<boolean> | null = null;

async function refreshTokens(refreshToken: string, api: Api, extraOptions: Extra): Promise<boolean> {
  const refresh = await rawBaseQuery(
    { url: '/api/v1/auth/refresh-token', method: 'POST', body: { refresh_token: refreshToken } },
    api,
    extraOptions,
  );
  const data = refresh.data as { access_token?: string; refresh_token?: string; user?: unknown } | undefined;
  if (!data?.access_token || !data.refresh_token) {
    return false;
  }
  setStoredAuth({ accessToken: data.access_token, refreshToken: data.refresh_token });
  api.dispatch(
    setCredentials({ accessToken: data.access_token, refreshToken: data.refresh_token, user: data.user }),
  );
  return true;
}

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const sentWith = getStoredAuth()?.accessToken;
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status !== 401) {
    return result;
  }

  const auth = getStoredAuth();
  if (!auth?.refreshToken) {
    api.dispatch(clearAuth());
    return result;
  }

  // Another request may already have refreshed while this one was in flight.
  const fresh =
    auth.accessToken !== sentWith ||
    (await (refreshing ??= refreshTokens(auth.refreshToken, api, extraOptions).finally(() => {
      refreshing = null;
    })));
  if (fresh) {
    return rawBaseQuery(args, api, extraOptions);
  }

  clearStoredAuth();
  api.dispatch(clearAuth());
  return result;
};
