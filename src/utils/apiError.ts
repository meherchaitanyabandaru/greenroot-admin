import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import type { ApiError, ApiErrorBody } from '../api/apiTypes';

/** Codes whose server text is too technical for an admin screen. */
const FRIENDLY_MESSAGES: Record<string, string> = {
  version_conflict: 'Someone else changed this record while you were editing. Reload it and apply your change again.',
  rate_limited: 'Too many requests. Wait a minute and try again.',
  network_error: 'Cannot reach the GreenRoot API. Check your connection and try again.',
};

export function normalizeApiError(error: unknown): ApiError {
  if (!error) return { code: 'UNKNOWN_ERROR', message: 'Something went wrong' };
  if (typeof error === 'object' && 'status' in (error as object)) {
    const e = error as FetchBaseQueryError;
    const body = e.data as ApiErrorBody | undefined;
    const code = body?.error?.code || (e.status === 'FETCH_ERROR' ? 'network_error' : 'API_ERROR');
    return {
      status: typeof e.status === 'number' ? e.status : undefined,
      code,
      message: FRIENDLY_MESSAGES[code] || body?.error?.message || 'Request failed',
    };
  }
  if (typeof error === 'object' && ('message' in (error as object) || 'name' in (error as object))) {
    const e = error as SerializedError;
    return {
      code: e.name || 'CLIENT_ERROR',
      message: e.message || 'Client error',
    };
  }
  return { code: 'UNKNOWN_ERROR', message: 'Something went wrong' };
}
