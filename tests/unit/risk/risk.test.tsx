import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { store } from '../../../src/app/store';
import { SignalPanel } from '../../../src/features/risk/RiskPage';
import { type RiskSignal, riskActions } from '../../../src/features/risk/riskApi';

const signal = (over: Partial<RiskSignal> = {}): RiskSignal => ({
  id: 4,
  signal_code: 'HIGH_AMOUNT',
  description: 'An order total above this amount (₹)',
  entity_type: 'ORDER',
  entity_id: 9,
  entity_label: 'ORD-9',
  risk_level: 'MEDIUM',
  status: 'OPEN',
  details: { total_amount: 750000 },
  is_hold: false,
  created_at: '2026-10-30T10:00:00Z',
  notes: [],
  ...over,
});

describe('riskActions', () => {
  it('holds only orders, releases a hold, and reopens closed signals', () => {
    expect(riskActions(signal()).map((a) => a.action)).toContain('HOLD');
    expect(riskActions(signal({ entity_type: 'DRIVER' })).map((a) => a.action)).not.toContain('HOLD');
    expect(riskActions(signal({ is_hold: true })).map((a) => a.action)).toContain('RELEASE_HOLD');
    expect(riskActions(signal({ status: 'RESOLVED' })).map((a) => a.action)).toEqual(['REVIEW', 'NOTE']);
    expect(riskActions(signal({ risk_level: 'CONFIRMED_FRAUD' })).map((a) => a.action)).not.toContain('CONFIRM_FRAUD');
  });
});

describe('SignalPanel', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('needs a note before any decision, then posts the action with it', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL) => Promise<Response>>(async (input) => {
      const req = input as Request;
      const body = req.method === 'POST' ? { signal: signal({ is_hold: true, status: 'UNDER_REVIEW' }) } : { signal: signal() };
      return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<Provider store={store}><SignalPanel id={4} /></Provider>);

    const hold = await screen.findByRole('button', { name: 'Hold order' });
    expect(hold).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/Note/), 'Calling the buyer');
    expect(hold).toBeEnabled();
    await userEvent.click(hold);

    await waitFor(() => expect(fetchMock.mock.calls.some(([r]) => (r as Request).method === 'POST')).toBe(true));
    const post = fetchMock.mock.calls.map(([r]) => r as Request).find((r) => r.method === 'POST')!;
    expect(post.url).toMatch(/\/api\/v1\/admin\/risk-signals\/4\/actions$/);
    expect(await post.json()).toEqual({ action: 'HOLD', note: 'Calling the buyer' });
  });
});
