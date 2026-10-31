import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { store } from '../../../src/app/store';
import { setCurrentUser } from '../../../src/features/auth/authSlice';
import { ChangeRuleDialog, LegalHoldsCard, RetentionPage, RuleDetailsDialog } from '../../../src/features/retention/RetentionPage';
import { type RetentionRule, retentionApi } from '../../../src/features/retention/retentionApi';

const rule = (over: Partial<RetentionRule>): RetentionRule => ({
  id: 1, rule_code: 'CRASH_REPORTS', category: 'App crash reports', description: 'Crash reports older than N days.', action: 'DELETE',
  period_days: 90, period_unit: 'DAYS', classification: 'RECOMMENDATION', min_period_days: 7, is_enabled: false, dry_run_only: false, legal_review_required: false, batch_size: 1000,
  updated_at: '2026-10-31T00:00:00Z', ...over,
});

const gps = rule({ rule_code: 'GPS_TRAILS', category: 'GPS trails', legal_review_required: true, legal_review_note: 'CERT-In and disputes' });
const files = rule({ rule_code: 'ORPHAN_FILES', category: 'Uploaded files', action: 'REPORT', dry_run_only: true, period_days: 30,
  last_dry_run: { id: 1, rule_code: 'ORPHAN_FILES', mode: 'DRY_RUN', trigger_source: 'ADMIN', status: 'SUCCEEDED', period_days: 30,
    eligible: 12, held: 3, excluded: 2, affected: 0, failed: 0, skipped: 0, bytes: 2_500_000, started_at: '2026-10-31T10:00:00Z' } });

function serve(rules: RetentionRule[], calls: { url: string; method: string; body?: string }[] = []) {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const req = input as Request;
    calls.push({ url: req.url, method: req.method, body: req.method === 'PUT' || req.method === 'POST' ? await req.clone().text() : undefined });
    const body = req.url.includes('/runs') ? { runs: [] }
      : req.url.includes('/holds') ? (req.method === 'POST' ? { id: 9 } : { holds: [{ id: 7, entity_type: 'MARKET_AD', entity_id: 3, entity_code: 'MKT-7',
        reason: 'dispute with the buyer', placed_by: 'GreenRoot Admin', placed_at: '2026-10-31T10:00:00Z' }] })
        : req.url.includes('/preview') ? { preview: { eligible: ['MKT-1', 'MKT-2'], held: ['MKT-7'], excluded: ['MKT-3'] } }
          : req.url.includes('/audit-logs') ? { audit_logs: [{ id: 1, description: 'Retention rule MARKET_AD_LOCATION changed: approved by owner', user_name: 'GreenRoot Admin', changed_at: '2026-10-31T09:00:00Z' }] }
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

  it('market ad rules have their own section', async () => {
    serve([rule({ rule_code: 'MARKET_AD_LOCATION', category: 'Market ads: pickup location' }), gps]);
    signIn('SUPER_ADMIN');
    render(<Provider store={store}><MemoryRouter><RetentionPage /></MemoryRouter></Provider>);
    expect(await screen.findByText('Market ads')).toBeInTheDocument();
    expect(screen.getByText('Other data')).toBeInTheDocument();
    expect(screen.getByText('Market ads: pickup location')).toBeInTheDocument();
    expect(screen.getByText('Legal holds')).toBeInTheDocument();
  });

  it('orders and quotations have their own sections, with classification and financial-year periods', async () => {
    serve([
      rule({ rule_code: 'ORDERS_COMPLETED', category: 'Orders: completed', period_days: 8, period_unit: 'FINANCIAL_YEARS', classification: 'LEGAL_REVIEW', legal_review_required: true }),
      rule({ rule_code: 'QUOTATIONS_DRAFT', category: 'Quotations: drafts', period_days: 365 }),
    ]);
    signIn('SUPER_ADMIN');
    render(<Provider store={store}><MemoryRouter><RetentionPage /></MemoryRouter></Provider>);
    expect(await screen.findByText('Orders: completed')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Quotations')).toBeInTheDocument();
    expect(screen.getByText('8 financial years')).toBeInTheDocument();
    expect(screen.getByText('365 days')).toBeInTheDocument();
    expect(screen.getByText('Legal review required')).toBeInTheDocument();
    expect(screen.getByText('GreenRoot recommendation')).toBeInTheDocument();
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

describe('RuleDetailsDialog', () => {
  beforeEach(() => store.dispatch(retentionApi.util.resetApiState()));
  afterEach(() => vi.unstubAllGlobals());

  it('lists affected records by code and the change history with who and why', async () => {
    serve([rule({})]);
    render(<Provider store={store}><RuleDetailsDialog rule={rule({ id: 12, rule_code: 'MARKET_AD_LOCATION' })} onClose={() => {}} /></Provider>);
    expect(await screen.findByText('MKT-1, MKT-2')).toBeInTheDocument();
    expect(screen.getByText('MKT-7')).toBeInTheDocument();
    expect(screen.getByText('MKT-3')).toBeInTheDocument();
    expect(await screen.findByText(/changed: approved by owner/)).toBeInTheDocument();
    expect(screen.getAllByText('GreenRoot Admin').length).toBeGreaterThan(0);
  });
});

describe('LegalHoldsCard', () => {
  beforeEach(() => store.dispatch(retentionApi.util.resetApiState()));
  afterEach(() => vi.unstubAllGlobals());

  it('a plain admin sees holds but cannot place or release them', async () => {
    serve([]);
    render(<Provider store={store}><LegalHoldsCard isSuperAdmin={false} /></Provider>);
    expect(await screen.findByText('dispute with the buyer')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Place hold' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Release' })).not.toBeInTheDocument();
  });

  it('a super admin places a hold only with a reason', async () => {
    const calls: { url: string; method: string; body?: string }[] = [];
    serve([], calls);
    render(<Provider store={store}><LegalHoldsCard isSuperAdmin /></Provider>);
    const user = userEvent.setup();
    await screen.findByText('dispute with the buyer');
    const place = screen.getByRole('button', { name: 'Place hold' });
    await user.type(screen.getByLabelText(/^Code/), 'ORD-20161001-0001');
    expect(place).toBeDisabled();
    await user.type(screen.getByLabelText(/Reason/), 'buyer opened a dispute');
    expect(place).toBeEnabled();
    await user.click(place);
    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/admin/retention/holds'))).toBe(true));
    const post = calls.find((c) => c.method === 'POST')!;
    expect(JSON.parse(post.body!)).toEqual({ entity_type: 'ORDER', code: 'ORD-20161001-0001', reason: 'buyer opened a dispute' });
    expect(screen.getByRole('button', { name: 'Release' })).toBeInTheDocument();
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

  it('a financial-year rule is edited in financial years, and its classification can change', async () => {
    const calls: { url: string; method: string; body?: string }[] = [];
    const fy = rule({ rule_code: 'ORDERS_CANCELLED', period_days: 8, period_unit: 'FINANCIAL_YEARS', min_period_days: 1, classification: 'LEGAL_REVIEW' });
    serve([fy], calls);
    render(<Provider store={store}><ChangeRuleDialog rule={fy} onClose={() => {}} /></Provider>);
    const user = userEvent.setup();
    const period = screen.getByLabelText(/Period \(financial years, 1–50\)/);
    await user.clear(period);
    await user.type(period, '6');
    await user.selectOptions(screen.getByLabelText('Classification'), 'LEGAL_REQUIREMENT');
    await user.type(screen.getByLabelText(/Reason/), 'counsel confirmed GST s.36 period');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'PUT')).toBe(true));
    expect(JSON.parse(calls.find((c) => c.method === 'PUT')!.body!)).toMatchObject({ period_days: 6, classification: 'LEGAL_REQUIREMENT', is_enabled: false });
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
