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
