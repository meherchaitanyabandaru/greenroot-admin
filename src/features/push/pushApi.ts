import { baseApi } from '../../api/baseApi';

export type PushWindow = { sent: number; failed: number; no_device: number };

export type PushStatus = {
  configured: boolean;
  project_id?: string;
  health: 'NOT_CONFIGURED' | 'NO_TRAFFIC' | 'OK' | 'DEGRADED' | 'FAILING';
  stats: {
    active_devices: number;
    active_devices_by_platform: Record<string, number>;
    users_with_active_device: number;
    retired_devices: number;
    last_device_seen_at: string | null;
    last_24h: PushWindow;
    last_7d: PushWindow;
    last_sent_at: string | null;
    last_failed_at: string | null;
  };
  note: string;
};

export const pushApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPushStatus: builder.query<PushStatus, void>({ query: () => '/api/v1/notifications/push-status' }),
  }),
});

export const { useGetPushStatusQuery } = pushApi;

export const HEALTH: Record<PushStatus['health'], { label: string; color: 'success' | 'warning' | 'error' | 'default'; detail: string }> = {
  NOT_CONFIGURED: { label: 'Not configured', color: 'default', detail: 'Nothing is sent to phones: notifications stay in the in-app inbox only.' },
  NO_TRAFFIC: { label: 'No pushes in 24 h', color: 'default', detail: 'Configured, but no push was tried in the last 24 hours, so delivery is unproven.' },
  OK: { label: 'Delivering', color: 'success', detail: 'Pushes in the last 24 hours reached phones.' },
  DEGRADED: { label: 'Some failing', color: 'warning', detail: 'More than 1 in 10 pushes failed in the last 24 hours.' },
  FAILING: { label: 'Failing', color: 'error', detail: 'Half or more of pushes failed in the last 24 hours.' },
};
