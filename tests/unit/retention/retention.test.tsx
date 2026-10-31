import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { store } from '../../../src/app/store';
import { setCurrentUser } from '../../../src/features/auth/authSlice';
import { ChangeRuleDialog, RetentionPage } from '../../../src/features/retention/RetentionPage';
import { type RetentionRule, retentionApi } from '../../../src/features/retention/retentionApi';

const rule = (over: Partial<RetentionRule>): RetentionRule => ({
  rule_code: 'CRASH_REPORTS', category: 'App crash reports', description: 'Crash reports older than N days.', action: 'DELETE',
  period_days: 90, min_period_days: 7, is_enabled: false, dry_run_only: false, legal_review_required: false, batch_size: 1000,
  updated_at: '2026-10-31T00:00:00Z', ...over,
});

const gps = rule({ rule_code: 'GPS_TRAILS', category: 'GPS trails', legal_review_required: true, legal_review_note: 'CERT-In and disputes' });
const files = rule({ rule_code: 'ORPHAN_FILES', category: 'Uploaded files', action: 'REPORT', dry_run_only: true, period_days: 30,
  last_dry_run: { id: 1, rule_code: 'ORPHAN_FILES', mode: 'DRY_RUN', trigger_source: 'ADMIN', status: 'SUCCEEDED', period_days: 30,
    eligible: 12, held: 3, affected: 0, failed: 0, skipped: 0, bytes: 2_500_000, started_at: '2026-10-31T10:00:00Z' } });

function serve(rules: RetentionRule[], calls: { url: string; method: string; body?: string }[] = []) {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const req = input as Request;
    calls.push({ url: req.url, method: req.method, body: req.method === 'PUT' ? await req.clone().text() : undefined });
    const body = req.url.includes('/runs') ? { runs: [] }
      : req.method === 'PUT' ? { rule: rules[0] }
        : { rules, summary: { enabled_rules: 3, legal_review_holds: 3, failed_runs_7d: 0, accounts_deleted_30d: 1, deleted_accounts_awaiting_scrub: 0 } };
    return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
  }));
}

const signIn = (code: string) => store.dispatch(setCurrentUser({ id: 1, first_name: 'A', mobile: '9000000000', status: 'ACTIVE', roles: [{ id: 1, code, name: code }] }));

describe('RetentionPage', () => {
  beforeEach(() => store.dispatch(retentionApi.util.resetApiState()));
  afterEach(() => vi.unstubAllGlobals());

  it('shows each rule with its status, counts and size; no personal data', async () => {
    serve([gps, files]);
    signIn('SUPER_ADMIN');
    render(<Provider store={store}><MemoryRouter><RetentionPage /></MemoryRouter></Provider>);
    expect(await screen.findByText('GPS trails')).toBeInTheDocument();
    expect(screen.getByText('Legal review hold')).toBeInTheDocument();
    expect(screen.getAllByText('Report only').length).toBeGreaterThan(0);
    expect(screen.getByText('2.5 MB')).toBeInTheDocument();
    expect(screen.getByText('Legal review holds')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Change' })).toHaveLength(2);
  });

  it('a plain admin can dry run but not change rules', async () => {
    serve([gps]);
    signIn('ADMIN');
    render(<Provider store={store}><MemoryRouter><RetentionPage /></MemoryRouter></Provider>);
    expect(await screen.findByText('GPS trails')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dry run' })).toBeInTheDocument();
    expect(screen.getByText(/Only a super admin can change a rule/)).toBeInTheDocument();
  });
});

describe('ChangeRuleDialog', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('a rule on legal review hold cannot be switched on', () => {
    serve([gps]);
    render(<Provider store={store}><ChangeRuleDialog rule={gps} onClose={() => {}} /></Provider>);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('switch', { name: /Cannot be switched on while on legal review hold/ })).toBeDisabled();
  });

  it('the report-only file rule can never be switched on', () => {
    serve([files]);
    render(<Provider store={store}><ChangeRuleDialog rule={files} onClose={() => {}} /></Provider>);
    expect(screen.getByRole('switch', { name: /Report only: can never delete/ })).toBeDisabled();
  });

  it('saving needs a reason; switching on warns and sends the change', async () => {
    const calls: { url: string; method: string; body?: string }[] = [];
    serve([rule({})], calls);
    render(<Provider store={store}><ChangeRuleDialog rule={rule({})} onClose={() => {}} /></Provider>);
    const user = userEvent.setup();
    await user.click(screen.getByRole('switch', { name: /Rule on/ }));
    expect(screen.getByText(/deletes or masks real data on the next scheduled run/)).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Switch on' });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText(/Reason/), 'approved by product owner 31 Oct');
    expect(submit).toBeEnabled();
    await user.click(submit);
    await waitFor(() => expect(calls.some((c) => c.method === 'PUT')).toBe(true));
    const put = calls.find((c) => c.method === 'PUT')!;
    expect(put.url).toContain('/admin/retention/rules/CRASH_REPORTS');
    expect(JSON.parse(put.body!)).toMatchObject({ is_enabled: true, period_days: 90, reason: 'approved by product owner 31 Oct' });
  });
});
