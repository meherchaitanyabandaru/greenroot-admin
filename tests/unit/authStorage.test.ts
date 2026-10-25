import { beforeEach, describe, expect, it } from 'vitest';
import { clearStoredAuth, getStoredAuth, setStoredAuth } from '../../src/api/authStorage';

const key = 'greenroot.admin.auth';

describe('authStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('stores and reads tokens', () => {
    setStoredAuth({ accessToken: 'access', refreshToken: 'refresh' });
    expect(getStoredAuth()).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
  });

  it('keeps tokens for this tab only, never in localStorage', () => {
    setStoredAuth({ accessToken: 'access', refreshToken: 'refresh' });
    expect(window.localStorage.getItem(key)).toBeNull();
    expect(window.sessionStorage.getItem(key)).not.toBeNull();
  });

  it('removes tokens an older build left in localStorage', () => {
    window.localStorage.setItem(key, JSON.stringify({ accessToken: 'old', refreshToken: 'old' }));
    expect(getStoredAuth()).toBeNull();
    expect(window.localStorage.getItem(key)).toBeNull();
  });

  it('clears tokens', () => {
    setStoredAuth({ accessToken: 'access', refreshToken: 'refresh' });
    clearStoredAuth();
    expect(getStoredAuth()).toBeNull();
  });

  it('ignores a corrupted entry', () => {
    window.sessionStorage.setItem(key, '{not json');
    expect(getStoredAuth()).toBeNull();
    expect(window.sessionStorage.getItem(key)).toBeNull();
  });
});
