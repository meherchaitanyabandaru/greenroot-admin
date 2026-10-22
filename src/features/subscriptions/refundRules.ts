// Mirrors the API's refund rules (greenroot-api subscriptions/refund.go) so the
// Refund button only shows where a refund can work; the API still decides and
// returns its reason if not.
export const REFUND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type PaymentRow = Record<string, unknown>;

export function canRefund(p: PaymentRow, payments: PaymentRow[], now = Date.now()): boolean {
  const latestSuccess = Math.max(...payments.filter((x) => x.payment_status === 'SUCCESS').map((x) => Number(x.id)));
  const paidAt = p.payment_date ? new Date(String(p.payment_date)).getTime() : NaN;
  return (
    p.payment_status === 'SUCCESS' &&
    String(p.provider ?? '').toLowerCase() === 'razorpay' &&
    Boolean(p.provider_payment_id) &&
    Number(p.id) === latestSuccess &&
    now - paidAt <= REFUND_WINDOW_MS
  );
}
