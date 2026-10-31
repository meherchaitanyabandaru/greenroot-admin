import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { store } from '../../../src/app/store';
import { ArchivePage } from '../../../src/features/archive/ArchivePage';
import { archiveApi, financialYear, financialYears } from '../../../src/features/archive/archiveApi';

describe('financial year (India time, April–March)', () => {
  it('boundaries', () => {
    expect(financialYear(new Date('2027-03-31T23:59:00+05:30'))).toBe('2026-27');
    expect(financialYear(new Date('2027-04-01T00:00:00+05:30'))).toBe('2027-28');
    expect(financialYear(new Date('2027-03-31T18:45:00Z'))).toBe('2027-28'); // 00:15 IST on 1 April
    expect(financialYears(new Date('2027-05-01T00:00:00+05:30'))).toEqual(['2027-28', '2026-27', '2025-26']);
  });
});

describe('ArchivePage', () => {
  const calls: string[] = [];
  beforeEach(() => {
    calls.length = 0;
    store.dispatch(archiveApi.util.resetApiState());
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} }));
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = (input as Request).url;
      calls.push(url);
      if (url.includes('format=pdf')) {
        return new Response('%PDF-1.4', { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="greenroot-orders-FY2026-27.pdf"' } });
      }
      const body = { type: 'orders', financial_year: '2026-27', from: '2026-04-01', to: '2027-03-31', summary: { total: 1 },
        rows: [{ reference: 'ORD-20261031-0001', date: '2026-10-31', party: 'Ravi', status: 'COMPLETED', amount: 1000, paid: 1000 }],
        pagination: { page: 1, per_page: 50, total: 1, total_pages: 1 } };
      return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('lists the financial year, searches and exports, without moving anything', async () => {
    render(<Provider store={store}><MemoryRouter><ArchivePage /></MemoryRouter></Provider>);
    expect(await screen.findByText('ORD-20261031-0001')).toBeInTheDocument();
    expect(calls[0]).toMatch(/\/reports\/orders\?fy=\d{4}-\d{2}/);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Search/), 'Ravi');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(calls.some((u) => u.includes('q=Ravi'))).toBe(true));
    await user.click(screen.getByRole('button', { name: 'Export PDF' }));
    await waitFor(() => expect(calls.some((u) => u.includes('format=pdf') && u.includes('q=Ravi'))).toBe(true));
    expect(calls.every((u) => !/DELETE|archive\/move/.test(u))).toBe(true);
  });
});
