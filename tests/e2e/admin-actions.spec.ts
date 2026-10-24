// Admin actions in the browser against the live local API: each test creates
// its own data through the API, acts in the admin UI, then checks the result
// through the API. Needs the API on localhost:8080 with mock OTP (123456).
import { expect, test, type Page } from '@playwright/test';

const API = 'http://localhost:8080/api/v1';

async function api(path: string, opts: { method?: string; token?: string; body?: unknown } = {}) {
  const res = await fetch(API + path, {
    method: opts.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${opts.method ?? 'GET'} ${path} -> ${res.status} ${JSON.stringify(json)}`);
  return json;
}

// One admin OTP per run: the API rate-limits OTPs per mobile (as it should).
let adminToken: string | undefined;
const adminApi = async () => (adminToken ??= await login('9000000000'));

async function login(mobile: string): Promise<string> {
  await api('/auth/send-otp', { method: 'POST', body: { mobile } });
  return (await api('/auth/verify-otp', { method: 'POST', body: { mobile, otp: '123456' } })).access_token;
}

/** A brand-new account, so tests never touch the dev cast. */
async function newPerson(first: string, activity: 'OWNER' | 'CUSTOMER') {
  const mobile = `9${Math.floor(100_000_000 + Math.random() * 899_999_999)}`;
  const token = await login(mobile);
  await api('/users/me', { method: 'PUT', token, body: { first_name: first, last_name: 'E2E' } });
  await api('/users/me/onboarding', { method: 'POST', token, body: { initial_activity: activity } });
  return { mobile, token };
}

async function signInAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Admin mobile').fill('9000000000');
  await page.getByRole('button', { name: /send otp/i }).click();
  await page.getByLabel('OTP').fill('123456');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe.configure({ mode: 'serial' });

let page: Page;
test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await signInAdmin(page);
});
test.afterAll(async () => page.close());

test('admin approves a new nursery application', async () => {
  const owner = await newPerson('Approve', 'OWNER');
  const name = `E2E Nursery ${owner.mobile.slice(-4)}`;
  const nursery = (await api('/nurseries', {
    method: 'POST', token: owner.token,
    body: { name, mobile: owner.mobile, address_line1: '1 Test Road', city: 'Hyderabad', state: 'Telangana', postal_code: '500001', country: 'India', latitude: 17.4, longitude: 78.4 },
  })).nursery;

  await page.goto('/nurseries/applications');
  // Row → Review drawer → Approve → confirm.
  await page.getByRole('row', { name: new RegExp(name) }).getByRole('button', { name: 'Review' }).click();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  const confirm = page.getByRole('dialog').filter({ hasText: 'Approve Nursery' });
  await confirm.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(confirm).toBeHidden();

  const admin = await adminApi();
  const after = (await api(`/nurseries/${nursery.id}`, { token: admin })).nursery;
  expect(after.status ?? after.nursery_status).toBe('APPROVED');
});

test('admin suspends a user with a reason, then reinstates them', async () => {
  const person = await newPerson('Suspend', 'CUSTOMER');
  const admin = await adminApi();
  const status = async () =>
    (await api(`/admin/users?search=${person.mobile}`, { token: admin })).users?.[0]?.status as string;

  await page.goto('/users');
  await page.getByPlaceholder(/search/i).fill(person.mobile);
  await page.getByRole('row', { name: new RegExp(person.mobile) }).getByRole('button', { name: /view details/i }).click();

  await page.getByRole('button', { name: 'Suspend User' }).click();
  await page.getByRole('dialog').getByLabel(/reason/i).fill('E2E test: suspicious activity');
  await page.getByRole('dialog').getByRole('button', { name: /^suspend$/i }).click();
  await expect.poll(status).toBe('SUSPENDED');

  await page.getByRole('button', { name: 'Reinstate User' }).click();
  await page.getByRole('dialog').getByRole('button', { name: /^reinstate$/i }).click();
  await expect.poll(status).toBe('ACTIVE');
});

test('a disputed delivery shows how it was confirmed and the reason', async () => {
  const admin = await adminApi();
  const all = (await api('/dispatches?per_page=100', { token: admin })).dispatches as Array<Record<string, unknown>>;
  const disputed = all.find((d) => d.delivery_override_reason || d.delivery_issue);
  test.skip(!disputed, 'no delivery with an override or a reported problem in this database');

  await page.goto('/dispatches');
  await page.getByPlaceholder(/search/i).fill(String(disputed!.dispatch_code));
  await page.getByRole('row', { name: new RegExp(String(disputed!.dispatch_code)) }).getByRole('button', { name: /view details/i }).click();
  await expect(page.getByText('Delivery confirmation')).toBeVisible();
  if (disputed!.delivery_override_reason) {
    await expect(page.getByText(String(disputed!.delivery_override_reason))).toBeVisible();
  }
  if (disputed!.delivery_issue) {
    await expect(page.getByText(String(disputed!.delivery_issue))).toBeVisible();
  }
});
