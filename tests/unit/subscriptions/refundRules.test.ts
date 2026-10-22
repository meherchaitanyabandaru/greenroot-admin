import { describe, expect, it } from 'vitest';
import { canRefund } from '../../../src/features/subscriptions/refundRules';

const now = Date.parse('2026-10-22T12:00:00Z');
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();
const razorpay = { id: 2, payment_status: 'SUCCESS', provider: 'razorpay', provider_payment_id: 'pay_2', payment_date: daysAgo(1) };
const cash = { id: 1, payment_status: 'SUCCESS', payment_method: 'CASH', payment_date: daysAgo(100) };

describe('canRefund', () => {
  it('allows the latest Razorpay payment within 7 days', () => {
    expect(canRefund(razorpay, [razorpay, cash], now)).toBe(true);
  });
  it('refuses cash, older, refunded and out-of-window payments', () => {
    expect(canRefund(cash, [razorpay, cash], now)).toBe(false);
    const newer = { ...razorpay, id: 3 };
    expect(canRefund(razorpay, [newer, razorpay], now)).toBe(false);
    const refunded = { ...razorpay, payment_status: 'REFUNDED' };
    expect(canRefund(refunded, [refunded, cash], now)).toBe(false);
    const old = { ...razorpay, payment_date: daysAgo(8) };
    expect(canRefund(old, [old], now)).toBe(false);
  });
});
