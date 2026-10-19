import { describe, expect, it } from 'vitest';
import { normalizeApiError } from '../../src/utils/apiError';

describe('normalizeApiError', () => {
  it('normalizes GreenRoot API errors', () => {
    expect(
      normalizeApiError({
        status: 403,
        data: { error: { code: 'forbidden', message: 'admin only' } },
      }),
    ).toEqual({ status: 403, code: 'forbidden', message: 'admin only' });
  });
});

describe('normalizeApiError friendly messages', () => {
  it('explains an optimistic-concurrency conflict', () => {
    const e = normalizeApiError({ status: 409, data: { error: { code: 'version_conflict', message: 'row version mismatch' } } });
    expect(e.status).toBe(409);
    expect(e.message).toMatch(/Someone else changed this record/);
  });

  it('reports an unreachable API', () => {
    expect(normalizeApiError({ status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }).code).toBe('network_error');
  });
});
