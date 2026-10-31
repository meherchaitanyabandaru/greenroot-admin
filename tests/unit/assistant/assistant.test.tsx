import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { store } from '../../../src/app/store';
import { AssistantUsagePage } from '../../../src/features/assistant/AssistantUsagePage';

const usage = {
  enabled: true,
  usage: [
    { kind: 'LLM', calls_today: 12, estimated_usd_today: 0.0051, calls_month: 40, estimated_usd_month: 0.0204, input_tokens_month: 41000, output_tokens_month: 2100, audio_seconds_month: 0 },
    { kind: 'STT', calls_today: 3, estimated_usd_today: 0.0003, calls_month: 9, estimated_usd_month: 0.0011, input_tokens_month: 900, output_tokens_month: 300, audio_seconds_month: 31 },
  ],
  limits: { global_daily_usd: 0.5, global_monthly_usd: 4, user_daily_usd: 0.05, user_daily_calls: 150, user_minute_calls: 15, max_audio_seconds: 30 },
  note: "Estimates from configured prices; the provider's dashboard is the bill.",
};

const settings = { settings: { enabled: true, daily_question_limit: 5 }, server_ai_enabled: true, max_daily_question_limit: 50 };

describe('AssistantUsagePage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows spend by kind against the budget', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const body = (input as Request).url.endsWith('/settings') ? settings : usage;
      return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
    }));
    render(<Provider store={store}><MemoryRouter><AssistantUsagePage /></MemoryRouter></Provider>);
    expect(await screen.findByText('Answers (model)')).toBeInTheDocument();
    expect(screen.getByText('Speech to text')).toBeInTheDocument();
    expect(screen.getByText('AI on')).toBeInTheDocument();
    expect(screen.getByText(/\$0\.0215/)).toBeInTheDocument(); // month total, both kinds
    expect(screen.getByText(/of \$4\.0000/)).toBeInTheDocument();
    expect(screen.getByText(/15 calls a minute, 150 a day/)).toBeInTheDocument();
  });

  it('admin changes the daily question limit; out-of-range values cannot be saved', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const r = input as Request;
      const body = r.method === 'PUT' ? { settings: await r.clone().json() } : r.url.endsWith('/settings') ? settings : usage;
      return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<Provider store={store}><MemoryRouter><AssistantUsagePage /></MemoryRouter></Provider>);
    const field = await screen.findByLabelText('Questions per person per day');
    expect(field).toHaveValue(5);
    await userEvent.clear(field);
    await userEvent.type(field, '60');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await userEvent.clear(field);
    await userEvent.type(field, '8');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([r]) => (r as Request).method === 'PUT')).toBe(true));
    const put = fetchMock.mock.calls.map(([r]) => r as Request).find((r) => r.method === 'PUT')!;
    expect(put.url).toMatch(/\/admin\/assistant\/settings$/);
    expect(await put.json()).toEqual({ enabled: true, daily_question_limit: 8 });
  });
});
