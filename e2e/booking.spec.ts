import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/booking/configuration', route => route.fulfill({ json: { configured: true } }));
});

test('guest books, views confirmation, and cancels without exposing credentials in the query string', async ({ page }) => {
  let status = 'confirmed';
  const start = '2026-11-02T06:00:00.000Z';
  await page.route('**/api/booking', async route => {
    const input = route.request().postDataJSON();
    if (input.action === 'availability') return route.fulfill({ json: { slots: [{ start, end: '2026-11-02T06:30:00.000Z' }] } });
    if (input.action === 'cancel') status = 'cancelled';
    return route.fulfill({ json: { id: input.id, host: 'john', start, end: '2026-11-02T06:30:00.000Z', status, meetUrl: 'https://meet.google.com/example', private: false } });
  });
  await page.goto('/book');
  await expect(page.getByRole('heading', { name: 'Book a conversation' })).toBeVisible();
  await page.locator('.booking-times button').first().click();
  await page.getByLabel('Your name').fill('Test Visitor');
  await page.getByLabel('Email address').fill('visitor@example.test');
  await page.getByRole('button', { name: 'Confirm meeting', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re booked.' })).toBeVisible();
  const url = new URL(page.url()); expect(url.search).toBe(''); expect(url.hash).toContain('token=');
  await page.getByRole('button', { name: 'Cancel meeting', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, cancel this meeting' }).click();
  await expect(page.getByRole('heading', { name: 'Your meeting is canceled.' })).toBeVisible();
});

test('private invitations stay in fragments and request bodies; small screens do not overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const invites: unknown[] = [];
  await page.route('**/api/booking', async route => {
    invites.push(route.request().postDataJSON().invite);
    expect(route.request().url()).not.toContain('invite=');
    if (route.request().postDataJSON().action === 'invitation') return route.fulfill({ json: { from: '2026-11-02', to: '2026-11-05' } });
    await route.fulfill({ json: { slots: [] } });
  });
  await page.goto('/book/john#invite=private-test-link');
  await expect(page.getByText('Private invitation', { exact: true })).toBeVisible();
  await expect(page.getByText('No times available on this date. Try another day.')).toBeVisible();
  expect(invites).toContain('private-test-link');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('host settings require sign-in and show calendar failures as errors', async ({ page }) => {
  await page.route('**/api/booking/host', route => route.fulfill({ json: { authenticated: false, configured: true } }));
  await page.goto('/book/settings');
  await expect(page.getByRole('link', { name: 'Sign in with Google', exact: true })).toBeVisible();
  await page.route('**/api/booking', route => route.fulfill({ status: 503, json: { error: 'Calendar temporarily unavailable' } }));
  await page.goto('/book/abe');
  await expect(page.locator('.booking-error[role="alert"]')).toHaveText('Calendar temporarily unavailable');
  await expect(page.getByRole('button', { name: 'Confirm meeting' })).toHaveCount(0);
});

test('a lost reservation response checks the original credential instead of starting another booking', async ({ page }) => {
  let reserved: { id: string; token: string } | undefined;
  let attempts = 0;
  const start = '2026-11-02T06:00:00.000Z';
  await page.route('**/api/booking', async route => {
    const input = route.request().postDataJSON();
    if (input.action === 'availability') return route.fulfill({ json: { slots: [{ start, end: '2026-11-02T06:30:00.000Z' }] } });
    if (input.action === 'book') { attempts++; reserved = { id: input.id, token: input.token }; return route.fulfill({ status: 503, json: { error: 'Storage response lost' } }); }
    expect({ id: input.id, token: input.token }).toEqual(reserved);
    return route.fulfill({ json: { id: input.id, host: 'john', start, end: '2026-11-02T06:30:00.000Z', status: 'confirmed', meetUrl: null, private: false } });
  });
  await page.goto('/book');
  await page.locator('.booking-times button').first().click();
  await page.getByLabel('Your name').fill('Test Visitor'); await page.getByLabel('Email address').fill('visitor@example.test');
  await page.getByRole('button', { name: 'Confirm meeting', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re booked.' })).toBeVisible();
  expect(attempts).toBe(1);
  expect(await page.evaluate(() => sessionStorage.getItem('vibrana-booking-pending'))).toBeNull();
});

test('booking management reschedules the same calendar meeting', async ({ page }) => {
  const id = '50000000-0000-4000-8000-000000000001', token = 'a'.repeat(43);
  let start = '2026-11-05T06:00:00.000Z', moves = 0;
  const next = '2026-11-06T07:00:00.000Z';
  await page.route('**/api/booking', async route => {
    const input = route.request().postDataJSON();
    if (input.action === 'availability') { expect(input.booking).toEqual({ id, token }); return route.fulfill({ json: { slots: [{ start: next, end: '2026-11-06T07:30:00.000Z' }] } }); }
    expect(input.id).toBe(id); expect(input.token).toBe(token);
    if (input.action === 'reschedule') { moves++; expect(input.start).toBe(next); start = next; }
    return route.fulfill({ json: { id, host: 'john', start, end: '2026-11-06T07:30:00.000Z', status: 'confirmed', meetUrl: null, private: false } });
  });
  await page.goto(`/book/manage#id=${id}&token=${token}`);
  await page.getByRole('button', { name: 'Choose a new time', exact: true }).click();
  await page.locator('.booking-times button').first().click();
  await page.getByRole('button', { name: 'Confirm new time', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re booked.' })).toBeVisible(); expect(moves).toBe(1);
});

test('host can inspect queued integrations and safely read a private briefing', async ({ page }) => {
  const schedule = { enabled: true, timezone: 'Asia/Makassar', weekdays: [1,2,3,4,5], public: { start: '14:00', end: '19:00' }, morning: { start: '08:00', end: '11:00' }, exceptions: {} };
  await page.route('**/api/booking/host', async route => route.fulfill({ json: { authenticated: true, host: { id: 'john', schedule, destination_connection: null, destination_calendar: null }, accounts: [], invites: [], bookings: [], integrations: { crm: true, briefing: true }, jobs: [{ id: 'job', kind: 'briefing', state: 'delivered', error_code: null, result: { briefing: '<script>untrusted visitor notes</script>', generated: true }, payload: { name: 'Test Visitor', event: 'booked' }, created_at: '2026-11-02T12:00:00Z' }] } }));
  await page.goto('/book/settings');
  await expect(page.getByRole('heading', { name: 'Meeting preparation and CRM' })).toBeVisible();
  await expect(page.locator('.booking-brief')).toHaveText('<script>untrusted visitor notes</script>');
  await expect(page.locator('.booking-brief script')).toHaveCount(0);
});

test('unconfigured booking remains useful without making failing calendar requests', async ({ page }) => {
  await page.route('**/api/booking/configuration', route => route.fulfill({ json: { configured: false } }));
  let calls = 0;
  await page.route('**/api/booking', route => { calls++; return route.fulfill({ status: 503, json: {} }); });
  await page.goto('/book');
  await expect(page.getByText('Online booking is not open yet. Please contact Vibrana to arrange a meeting.')).toBeVisible();
  expect(calls).toBe(0); await expect(page.getByRole('link', { name: 'Contact Vibrana', exact: true })).toBeVisible();
});
