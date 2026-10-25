// When the access token expires, the dashboard's parallel requests all get
// 401 together. They must share one refresh (refresh tokens rotate, so a
// second refresh with the same token is refused and used to sign the admin out).

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BaseQueryApi } from '@reduxjs/toolkit/query';
import { baseQueryWithReauth } from '../../src/api/baseQueryWithReauth';
import { getStoredAuth, setStoredAuth } from '../../src/api/authStorage';

const api = { signal: new AbortController().signal, dispatch: vi.fn(), getState: () => ({}) } as unknown as BaseQueryApi;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => vi.unstubAllGlobals());

describe('baseQueryWithReauth', () => {
  it('parallel 401s refresh once and all retry with the new token', async () => {
    setStoredAuth({ accessToken: 'old', refreshToken: 'r1' });
    let refreshes = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (req: Request) => {
        if (req.url.endsWith('/auth/refresh-token')) {
          refreshes++;
          await new Promise((r) => setTimeout(r, 10));
          return refreshes === 1
            ? json(200, { access_token: 'new', refresh_token: 'r2' })
            : json(401, { error: { code: 'invalid_token' } }); // rotated: a second refresh is refused
        }
        return req.headers.get('authorization') === 'Bearer new' ? json(200, { ok: true }) : json(401, {});
      }),
    );

    const results = await Promise.all(['/a', '/b', '/c'].map((url) => baseQueryWithReauth(url, api, {})));

    expect(refreshes).toBe(1);
    expect(results.every((r) => !r.error)).toBe(true);
    expect(getStoredAuth()).toEqual({ accessToken: 'new', refreshToken: 'r2' });
  });
});
