import { describe, expect, it } from 'vitest';
import { toLabel } from '../../../src/utils/labels';

describe('toLabel', () => {
  it('keeps acronyms upper case', () => {
    expect(toLabel('UPI')).toBe('UPI');
    expect(toLabel('AUTH_LOGIN_OTP')).toBe('Auth Login OTP');
  });
  it('humanizes codes', () => {
    expect(toLabel('CUSTOMER_REJECTED')).toBe('Customer Rejected');
    expect(toLabel('IN_APP')).toBe('In App');
    expect(toLabel('')).toBe('—');
  });
});
