import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { store } from '../../../src/app/store';
import { CleanupJobsCard } from '../../../src/features/retention/CleanupJobsCard';
import { lastPeriods, type RetentionRule, type RetentionRun, retentionApi } from '../../../src/features/retention/retentionApi';

const rule = (over: Partial<RetentionRule>): RetentionRule => ({
  id: 1, rule_code: 'CRASH_REPORTS', category: 'App crash reports', description: 'Crash reports older than N days.', action: 'DELETE',
  period_days: 90, period_unit: 'DAYS', classification: 'RECOMMENDATION', min_period_days: 7, is_enabled: false, dry_run_only: false,
  legal_review_required: false, batch_size: 1000, updated_at: '2026-10-31T00:00:00Z', allows_manual_jobs: true,
  jobs: { date_label: 'Received on', nursery: false }, ...over,
});
const market = rule({ rule_code: 'MARKET_AD_LOCATION', category: 'Market ads: pickup location', action: 'MASK',
  jobs: { date_label: 'Ad ended', nursery: true, statuses: ['DELETED', 'ARCHIVED'] } });
const orders = rule({ rule_code: 'ORDERS_COMPLETED', category: 'Completed orders', allows_manual_jobs: false,
  jobs: { date_label: 'Order date', nursery: true, statuses: ['COMPLETED'], blocked: 'never deleted; anonymising needs legal approval' } });

const job = (over: Partial<RetentionRun>): RetentionRun => ({
  id: 41, rule_code: 'CRASH_REPORTS', mode: 'EXECUTE', trigger_source: 'JOB', status: 'QUEUED', period_days: 90, eligible: 120, held: 0, excluded: 0,
  affected: 0, failed: 0, skipped: 0, bytes: 0, started_at: '2026-10-31T10:00:00Z', range_from: '2026-08-31T18:30:00Z', range_to_excl: '2026-09-30T18:30:00Z',
  scheduled_at: '2026-10-31T20:30:00Z', reason: 'monthly clean-up', batches_done: 0, ...over,
});

function serve(runs: RetentionRun[], calls: { url: string; method: string; body?: string }[] = []) {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const req = input as Request;
    calls.push({ url: req.url, method: req.method, body: req.method === 'POST' ? await req.clone().text() : undefined });
    const body = req.url.includes('/jobs/preview') ? { preview: { eligible: 120, held: 2, excluded: 1, codes: { eligible: ['MKT-1', 'MKT-2'], held: ['MKT-7'], excluded: ['MKT-3'] } } }
      : req.url.includes('/runs') ? { runs }
        : req.url.endsWith('/cancel') ? { status: 'CANCELLED' }
          : { id: 42, scheduled_at: '2026-10-31T20:30:00Z' };
    return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
  }));
}

const show = (rules: RetentionRule[], isSuperAdmin = true) =>
  render(<Provider store={store}><CleanupJobsCard rules={rules} isSuperAdmin={isSuperAdmin} /></Provider>);

describe('lastPeriods', () => {
  it('gives the last full month and quarter in India time', () => {
    expect(lastPeriods(new Date('2026-10-31T12:00:00Z'))).toEqual({ month: ['2026-09-01', '2026-09-30'], quarter: ['2026-07-01', '2026-09-30'] });
    expect(lastPeriods(new Date('2026-01-15T00:00:00Z'))).toEqual({ month: ['2025-12-01', '2025-12-31'], quarter: ['2025-10-01', '2025-12-31'] });
    // 1 Apr 00:30 IST is still 31 Mar in UTC: India time wins.
    expect(lastPeriods(new Date('2026-03-31T19:00:00Z')).quarter).toEqual(['2026-01-01', '2026-03-31']);
  });
});

describe('CleanupJobsCard', () => {
  beforeEach(() => store.dispatch(retentionApi.util.resetApiState()));
  afterEach(() => vi.unstubAllGlobals());

  it('previews counts and codes, and queues only with the typed count and a reason', async () => {
    const calls: { url: string; method: string; body?: string }[] = [];
    serve([], calls);
    show([market]);
    await userEvent.selectOptions(screen.getByLabelText('Data'), 'MARKET_AD_LOCATION');
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'DELETED');
    await userEvent.type(screen.getByLabelText('Nursery ID (optional)'), '7');
    await userEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(await screen.findByText(/Matching: MKT-1, MKT-2/)).toBeInTheDocument();
    expect(screen.getByText(/On hold: MKT-7/)).toBeInTheDocument();
    const preview = calls.find((c) => c.url.includes('/jobs/preview'))!;
    expect(preview.url).toContain('rule=MARKET_AD_LOCATION');
    expect(preview.url).toContain('status=DELETED');
    expect(preview.url).toContain('nursery_id=7');

    const queueButton = screen.getByRole('button', { name: 'Queue job' });
    await userEvent.type(screen.getByLabelText('Type 120 to confirm'), '12');
    await userEvent.type(screen.getByLabelText(/^Reason/), 'quarterly clean-up');
    expect(queueButton).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Type 120 to confirm'), '0');
    expect(queueButton).toBeEnabled();
    await userEvent.click(queueButton);
    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/admin/retention/jobs'))).toBe(true));
    const sent = JSON.parse(calls.find((c) => c.method === 'POST')!.body!);
    expect(sent).toMatchObject({ rule_code: 'MARKET_AD_LOCATION', status: 'DELETED', nursery_id: 7, with_export: true, confirm_count: 120, reason: 'quarterly clean-up' });
    expect(sent.run_at).toBeUndefined(); // the server's default: 2:00 AM India time
  });

  it('a changed filter needs a new preview', async () => {
    serve([]);
    show([rule({})]);
    await userEvent.selectOptions(screen.getByLabelText('Data'), 'CRASH_REPORTS');
    await userEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(await screen.findByRole('button', { name: 'Queue job' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Last quarter' }));
    expect(screen.queryByRole('button', { name: 'Queue job' })).not.toBeInTheDocument();
  });

  it('orders can be previewed but never queued', async () => {
    serve([]);
    show([orders]);
    await userEvent.selectOptions(screen.getByLabelText('Data'), 'ORDERS_COMPLETED');
    expect(screen.getByText(/Preview only: never deleted/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(await screen.findByText(/Matching: MKT-1/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Queue job' })).not.toBeInTheDocument();
  });

  it('the jobs table shows progress and failure, with cancel, retry and export for a super admin', async () => {
    const calls: { url: string; method: string; body?: string }[] = [];
    serve([
      job({ id: 41 }),
      job({ id: 40, status: 'FAILED', affected: 20, failed: 10, batches_done: 2, failure_detail: 'batch 3 failed (database error 23503); earlier batches are done, retry to continue' }),
      job({ id: 39, status: 'DONE', affected: 120, batches_done: 1, has_export: true, export_ready: true, export_bytes: 8249 }),
    ], calls);
    show([rule({})]);
    expect(await screen.findByText(/batch 3 failed/)).toBeInTheDocument();
    expect(screen.getByText('20 / 120')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export (8 KB)' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith('/jobs/41/cancel'))).toBe(true));
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.getByLabelText('Data')).toHaveValue('CRASH_REPORTS');
    expect(screen.getByLabelText(/^From/)).toHaveValue('2026-09-01');
    expect(screen.getByLabelText('To (inclusive)')).toHaveValue('2026-09-30');
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });

  it('a plain admin previews but cannot queue, cancel, retry or download', async () => {
    serve([job({ id: 41 }), job({ id: 39, status: 'DONE', export_ready: true })]);
    show([rule({})], false);
    expect(await screen.findAllByText('monthly clean-up')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Export/ })).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Data'), 'CRASH_REPORTS');
    await userEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(await screen.findByText('Only a super admin can queue a clean-up job.')).toBeInTheDocument();
  });
});
