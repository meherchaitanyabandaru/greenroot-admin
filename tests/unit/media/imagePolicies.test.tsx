import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { store } from '../../../src/app/store';
import { PolicyForm } from '../../../src/features/media/ImagePoliciesPage';
import { type AdminImagePolicy, policyProblem, policyRisks } from '../../../src/features/media/imagePoliciesApi';

const def = { category: 'MARKET_AD', max_side: 1600, min_side: 400, quality: 82, max_bytes: 2097152, allowed_formats: ['JPEG'], is_compression_enabled: true, version: 1 };
const bounds = { max_side_min: 320, max_side_max: 4096, min_side_min: 64, quality_min: 50, quality_max: 95, max_bytes_min: 51200, max_bytes_max: 10485760, hard_max_pixels: 40000000 };
const policy: AdminImagePolicy = { ...def, version: 3, default: def, bounds };
const edit = (patch: object) => ({ ...def, change_note: 'tune for slow networks', ...patch });

describe('image policy rules', () => {
  it('refuses values outside the safe bounds and a missing reason', () => {
    expect(policyProblem(edit({}), bounds)).toBe('');
    expect(policyProblem(edit({ quality: 99 }), bounds)).toMatch(/Quality/);
    expect(policyProblem(edit({ max_side: 9000 }), bounds)).toMatch(/Longest side/);
    expect(policyProblem(edit({ min_side: 2000 }), bounds)).toMatch(/Shortest side/);
    expect(policyProblem(edit({ max_bytes: 50 * 1024 * 1024 }), bounds)).toMatch(/File size/);
    expect(policyProblem(edit({ allowed_formats: [] }), bounds)).toMatch(/format/);
    expect(policyProblem(edit({ change_note: 'x' }), bounds)).toMatch(/why/);
  });
  it('flags allowed but risky changes', () => {
    expect(policyRisks(edit({}), def)).toEqual([]);
    expect(policyRisks(edit({ quality: 60 }), def).join()).toMatch(/blocky/);
    expect(policyRisks(edit({ is_compression_enabled: false }), def).join()).toMatch(/compression off/);
    expect(policyRisks(edit({ max_side: 800 }), def).join()).toMatch(/unreadable/);
  });
});

describe('PolicyForm', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('needs a reason, confirms a risky change, then saves the edited version', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL) => Promise<Response>>(async () =>
      new Response(JSON.stringify({ policy: { ...policy, quality: 60, version: 4 } }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const onDone = vi.fn();
    render(<Provider store={store}><PolicyForm policy={policy} onDone={onDone} /></Provider>);

    const save = screen.getByRole('button', { name: 'Save as version 4' });
    expect(save).toBeDisabled();
    const quality = screen.getByLabelText('JPEG quality');
    await userEvent.clear(quality);
    await userEvent.type(quality, '60');
    await userEvent.type(screen.getByLabelText(/Why are you changing it/), 'smaller ads on 2G');
    expect(save).toBeEnabled();
    await userEvent.click(save);

    expect(await screen.findByText(/blocky/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Save anyway' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.method).toBe('PUT');
    expect(request.url).toMatch(/\/api\/v1\/admin\/image-policies\/MARKET_AD$/);
    expect(await request.json()).toMatchObject({ quality: 60, version: 3, change_note: 'smaller ads on 2G' });
  });
});
