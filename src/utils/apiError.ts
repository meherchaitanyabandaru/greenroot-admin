import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import type { ApiError, ApiErrorBody } from '../api/apiTypes';

export function normalizeApiError(error: unknown): ApiError {
  if (!error) return { code: 'UNKNOWN_ERROR', message: 'Something went wrong' };
  if (typeof error === 'object' && 'status' in (error as object)) {
    const e = error as FetchBaseQueryError;
    const body = e.data as ApiErrorBody | undefined;
    return {
      status: typeof e.status === 'number' ? e.status : undefined,
      code: body?.error?.code || 'API_ERROR',
      message: body?.error?.message || 'Request failed',
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
