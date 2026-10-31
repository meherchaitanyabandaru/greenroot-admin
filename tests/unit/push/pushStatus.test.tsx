import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { store } from '../../../src/app/store';
import { pushApi } from '../../../src/features/push/pushApi';
import { PushStatusPage } from '../../../src/features/push/PushStatusPage';

const stats = {
  active_devices: 4, active_devices_by_platform: { ANDROID: 3, IOS: 1 }, users_with_active_device: 3, retired_devices: 2,
  last_device_seen_at: '2026-10-31T08:00:00Z', last_24h: { sent: 8, failed: 2, no_device: 5 }, last_7d: { sent: 40, failed: 2, no_device: 9 },
  last_sent_at: '2026-10-31T08:30:00Z', last_failed_at: '2026-10-31T07:00:00Z',
};

function serve(body: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })));
  store.dispatch(pushApi.util.resetApiState());
  render(<Provider store={store}><MemoryRouter><PushStatusPage /></MemoryRouter></Provider>);
}

describe('PushStatusPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows configuration apart from delivery health, devices and success rate', async () => {
    serve({ configured: true, project_id: 'greenroot-dev', health: 'DEGRADED', stats, note: 'n.' });
    expect(await screen.findByText('Firebase service account loaded')).toBeInTheDocument();
    expect(screen.getByText('Firebase project: greenroot-dev')).toBeInTheDocument();
    expect(screen.getByText('Some failing')).toBeInTheDocument();
    expect(screen.getByText('ANDROID')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument(); // 8 of 10 tried; no-device not counted
  });

  it('not configured says nothing reaches phones and how to fix it', async () => {
    serve({ configured: false, health: 'NOT_CONFIGURED', stats: { ...stats, last_sent_at: null }, note: 'n.' });
    expect(await screen.findByText('No service account')).toBeInTheDocument();
    expect(screen.getByText('Not configured')).toBeInTheDocument();
    expect(screen.getByText(/FCM_SERVICE_ACCOUNT_JSON/)).toBeInTheDocument();
    expect(screen.getByText(/Last delivered: Never/)).toBeInTheDocument();
  });
});
