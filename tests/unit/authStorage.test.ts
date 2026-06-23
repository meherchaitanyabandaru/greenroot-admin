import { beforeEach, describe, expect, it } from 'vitest';
import { clearStoredAuth, getStoredAuth, setStoredAuth } from '../../src/api/authStorage';

describe('authStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores and reads tokens', () => {
    setStoredAuth({ accessToken: 'access', refreshToken: 'refresh' });
    expect(getStoredAuth()).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
  });

  it('clears tokens', () => {
    setStoredAuth({ accessToken: 'access', refreshToken: 'refresh' });
    clearStoredAuth();
    expect(getStoredAuth()).toBeNull();
  });
});
