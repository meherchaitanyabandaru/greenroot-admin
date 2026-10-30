import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { store } from '../../../src/app/store';
import { VehicleLinksTable } from '../../../src/features/vehicles/VehicleLinks';
import type { VehicleDriverLink } from '../../../src/features/vehicles/vehiclesApi';

const link = (over: Partial<VehicleDriverLink>): VehicleDriverLink => ({
  id: 1,
  vehicle_id: 5,
  vehicle_number: 'TS09AB1234',
  vehicle_type: 'TRUCK',
  vehicle_approval_status: 'APPROVED',
  owner_name: 'Ramesh',
  driver_user_id: 40,
  driver_name: 'Raju',
  driver_mobile: '9400000000',
  driver_approval_status: 'APPROVED',
  license_expiry_date: '2030-01-01',
  status: 'PENDING',
  is_on_active_trip: false,
  created_at: '2026-10-30T10:00:00Z',
  ...over,
});

function json(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('VehicleLinksTable', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('offers only the allowed moves, keeps an on-trip link, and needs a reason to reject', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL) => Promise<Response>>(async (input) => {
      const req = input as Request;
      if (req.method === 'PUT') return json({ link: link({ status: 'REJECTED' }) });
      return json({
        links: [link({ id: 1, status: 'PENDING' }), link({ id: 2, driver_name: 'Ravi', status: 'APPROVED', is_on_active_trip: true })],
        pagination: { total: 2 },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    render(
      <Provider store={store}>
        <VehicleLinksTable vehicleId={5} />
      </Provider>,
    );

    const pendingRow = (await screen.findByText('Raju')).closest('tr')!;
    const onTripRow = screen.getByText('Ravi').closest('tr')!;
    expect(within(pendingRow).getByRole('button', { name: 'Approve' })).toBeEnabled();
    expect(within(pendingRow).queryByRole('button', { name: 'Suspend' })).toBeNull();
    expect(within(onTripRow).getByRole('button', { name: 'Remove' })).toBeDisabled();
    expect(within(onTripRow).getByRole('button', { name: 'Suspend' })).toBeEnabled();
    expect(within(onTripRow).getByText('On a trip')).toBeInTheDocument();

    await userEvent.click(within(pendingRow).getByRole('button', { name: 'Reject' }));
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/Reason/), 'RC does not match');
    await userEvent.click(confirm);

    await waitFor(() => expect(fetchMock.mock.calls.some(([r]) => (r as Request).method === 'PUT')).toBe(true));
    const put = fetchMock.mock.calls.map(([r]) => r as Request).find((r) => r.method === 'PUT')!;
    expect(put.url).toMatch(/\/api\/v1\/vehicle-drivers\/1\/status$/);
    expect(await put.json()).toEqual({ status: 'REJECTED', note: 'RC does not match' });
  });
});
