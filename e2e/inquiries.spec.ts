import { expect, test } from '@playwright/test'
import { SPRINT_FIT_CALL_URL, SPRINT_FORM } from '@/src/ai-build-sprint-content'
import { collectErrors, db, stubRequests, testEmail } from './support'

// Copy comes from the content modules, so editing page copy never breaks these tests.

test.describe('AI Build Sprint fit-call form', () => {
  test('validates, saves the inquiry, emails, and hands off to the calendar', async ({ page }) => {
    const errors = collectErrors(page)
    const email = testEmail('sprint')

    // Successful submit navigates to the external calendar; stop it there.
    let calendarHit = false
    await page.route(`${SPRINT_FIT_CALL_URL}**`, (route) => {
      calendarHit = true
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>calendar</h1>' })
    })

    await page.goto('/ai-build-sprint?utm_source=e2e&utm_campaign=ci')
    const form = page.getByRole('form', { name: SPRINT_FORM.heading })
    await form.scrollIntoViewIfNeeded()
    const submit = form.getByRole('button', { name: SPRINT_FORM.submit })

    // Client-side validation, in the order the form checks it.
    await submit.click()
    await expect(form.getByRole('alert')).toHaveText(SPRINT_FORM.errors.contact)

    await form.getByLabel(SPRINT_FORM.labels.name).fill('E2E Tester')
    await form.getByLabel(SPRINT_FORM.labels.email).fill(email)
    await form.getByLabel(SPRINT_FORM.labels.company).fill('E2E Test Co')
    await submit.click()
    await expect(form.getByRole('alert')).toHaveText(SPRINT_FORM.errors.track)

    await form.getByLabel(SPRINT_FORM.labels.track).selectOption('workflow')
    await form.getByLabel(SPRINT_FORM.labels.outcome).fill('short')
    await submit.click()
    await expect(form.getByRole('alert')).toHaveText(SPRINT_FORM.errors.outcome)

    await form.getByLabel(SPRINT_FORM.labels.outcome).fill('Quote turnaround drops from two days to two hours.')
    await submit.click()
    await expect.poll(() => calendarHit, { timeout: 15_000 }).toBe(true)

    const { data: rows, error } = await db()
      .from('engagement_inquiries')
      .select('email, intent, track, company_name, goals, metadata')
      .eq('email', email)
    expect(error).toBeNull()
    expect(rows).toHaveLength(1)
    expect(rows![0]).toMatchObject({ intent: 'ai_build_sprint', track: 'workflow', company_name: 'E2E Test Co' })
    expect(JSON.stringify(rows![0].metadata)).toContain('e2e')

    const emails = (await stubRequests()).filter((r) => r.path.startsWith('/emails') && JSON.stringify(r.body).includes(email))
    expect(emails.length).toBeGreaterThan(0)

    expect(errors).toEqual([])
  })

  test('API rejects a filled honeypot and saves nothing', async ({ request }) => {
    const email = testEmail('sprint-bot')
    const res = await request.post('/api/sprint-inquiries', {
      data: {
        name: 'Bot',
        email,
        companyName: 'Bot Co',
        track: 'product',
        desiredOutcome: 'Anything at all, this is a bot.',
        botField: 'filled-by-a-bot',
      },
    })
    expect(res.status()).toBe(400)
    const { data } = await db().from('engagement_inquiries').select('id').eq('email', email)
    expect(data).toHaveLength(0)
  })
})

test.describe('Enterprise inquiry form (/contact)', () => {
  test('saves the inquiry and confirms', async ({ page }) => {
    const errors = collectErrors(page)
    const email = testEmail('enterprise')

    await page.goto('/contact')
    await page.getByLabel('Contact name').fill('E2E Enterprise')
    await page.getByLabel('Work email').fill(email)
    await page.getByLabel('Company', { exact: true }).fill('E2E Enterprise Co')
    await page.getByLabel('Department focus').fill('operations, finance')
    await page.getByLabel('Goals').fill('Move from scattered pilots to a company-wide operating model.')
    await page.getByRole('button', { name: /Send inquiry/ }).click()

    await expect(page.getByText('Inquiry received')).toBeVisible({ timeout: 15_000 })

    const { data: rows, error } = await db()
      .from('engagement_inquiries')
      .select('email, company_name, source, department_focus')
      .eq('email', email)
    expect(error).toBeNull()
    expect(rows).toHaveLength(1)
    expect(rows![0]).toMatchObject({ company_name: 'E2E Enterprise Co', source: 'website' })

    expect(errors).toEqual([])
  })

  test('API rejects goals that are too short', async ({ request }) => {
    const res = await request.post('/api/enterprise-inquiry', {
      data: {
        contactName: 'E2E',
        email: testEmail('enterprise-short'),
        companyName: 'Co',
        teamSize: '1-10',
        revenueBand: 'Under $1M',
        departmentFocus: 'ops',
        timeline: 'Now',
        goals: 'too short',
      },
    })
    expect(res.status()).toBe(400)
  })
})

test.describe('Spam guard', () => {
  test('whitepaper API answers a filled honeypot with success and saves nothing', async ({ request }) => {
    const email = testEmail('whitepaper-bot')
    const res = await request.post('/api/whitepaper', { data: { email, _gotcha: 'filled-by-a-bot', _ft: 'not-a-real-token' } })
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    const { data } = await db().from('whitepaper_leads').select('email').eq('email', email)
    expect(data).toHaveLength(0)
  })

  test('form token endpoint issues a signed token', async ({ request }) => {
    const res = await request.get('/api/form-token')
    expect(res.status()).toBe(200)
    expect((await res.json()).token).toMatch(/^v1\.\d+\.[\w-]+\.[\w-]+$/)
  })
})
