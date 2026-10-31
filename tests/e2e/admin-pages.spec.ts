// Every admin page against the live API: no API error and no page crash.
// Needs the API on localhost:8080 with the dev admin (9000000000 / 123456).
import { expect, test } from '@playwright/test';

const PAGES = [
  '/', '/users', '/drivers', '/nurseries/applications', '/nurseries', '/top-items',
  '/plants', '/plants/categories', '/plants/suggestions', '/market/review', '/market/ads',
  '/quotations', '/orders', '/dispatches', '/sourcing-network', '/notifications', '/tracking',
  '/notifications/templates', '/sms', '/email', '/payments', '/payment-issues', '/subscriptions',
  '/subscription-plans', '/subscription-promos', '/vehicles', '/attachments',
  '/notifications/devices', '/audit', '/security-logs', '/crash-reports', '/settings',
  '/push', '/data-retention', '/archive', '/mango-ai', '/risk', '/image-policies', '/vehicle-links', '/vehicle-owners', '/market', '/sourcing-posts',
];

test('admin pages load without API errors', async ({ page }) => {
  test.setTimeout(180_000);
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`${page.url()} crashed: ${e.message}`));
  page.on('response', (r) => {
    if (r.url().includes('/api/v1/') && r.status() >= 400) {
      problems.push(`${page.url()} → ${r.request().method()} ${new URL(r.url()).pathname} ${r.status()}`);
    }
  });

  await page.goto('/login');
  await page.getByLabel('Admin mobile').fill('9000000000');
  await page.getByRole('button', { name: /send otp/i }).click();
  await page.getByLabel('OTP').fill('123456');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login/);

  for (const path of PAGES) {
    await page.goto(path);
    // Some pages poll (tracking, dashboard), so the network never goes idle.
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2500);
    await expect(page.locator('body'), path).not.toContainText(/something went wrong/i);
  }
  expect(problems, problems.join('\n')).toEqual([]);
});
