import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PaymentIssue } from '../../../src/api/adminResources';
import { store } from '../../../src/app/store';
import { ResolvePanel } from '../../../src/features/payments/PaymentIssuesPage';

const issue: PaymentIssue = {
  id: 7,
  issue_type: 'PAID_NOT_APPLIED',
  provider: 'razorpay',
  provider_order_id: 'order_1',
  provider_payment_id: 'pay_1',
  amount: 3999,
  reason: 'subscription is paused',
  status: 'OPEN',
  created_at: '2026-10-24T10:00:00Z',
};

describe('ResolvePanel', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('needs a real note, then posts it to the resolve endpoint', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL) => Promise<Response>>(async () =>
      new Response(JSON.stringify({ issue: { ...issue, status: 'RESOLVED' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const onDone = vi.fn();
    render(
      <Provider store={store}>
        <ResolvePanel issue={issue} onDone={onDone} />
      </Provider>,
    );

    expect(screen.getByText(/Refund it in the Razorpay dashboard/)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Mark resolved' });
    await userEvent.type(screen.getByLabelText(/What did you do/), 'ok');
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/What did you do/), ' - refunded rfnd_42');
    expect(button).toBeEnabled();
    await userEvent.click(button);

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.method).toBe('POST');
    expect(request.url).toMatch(/\/api\/v1\/payment-issues\/7\/resolve$/);
    expect(await request.json()).toEqual({ note: 'ok - refunded rfnd_42' });
  });
});
