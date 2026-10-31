import { expect, test } from '@playwright/test'
import { SIM_READINESS, SIM_SECTOR_LABELS, SIM_STEPS } from '@/src/simulator-content'
import { collectErrors, db, testEmail } from './support'

// Copy comes from the content modules, so editing page copy never breaks these tests.
// Firecrawl and OpenRouter keys are empty in this suite, so a real website read ends on the
// pick-a-sector path; the profile card is driven with a stubbed /api/simulator/profile response.

const LOGO_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test.describe('Simulator entry', () => {
  test('requires a work email, then saves the visitor as a lead on the pick-a-sector path', async ({ page }) => {
    const errors = collectErrors(page)
    const email = testEmail('sim-manual')
    await page.goto('/ai-transformation/simulator')

    await page.getByLabel(SIM_STEPS.company.peopleLabel).fill('120')
    await page.getByRole('button', { name: SIM_STEPS.company.skip }).click()
    await expect(page.getByText(SIM_STEPS.company.errors.email)).toBeVisible()

    await page.getByLabel(SIM_STEPS.company.emailLabel).fill(email)
    await page.getByRole('button', { name: SIM_STEPS.company.skip }).click()
    await expect(page.getByText(SIM_STEPS.profile.manualTitle)).toBeVisible()

    // The lead exists the moment the step passes, before any result is built.
    await expect
      .poll(async () => (await db().from('assessment_leads').select('email, source, team_size').eq('email', email)).data?.length, { timeout: 15_000 })
      .toBe(1)
    const { data } = await db().from('assessment_leads').select('email, source, team_size').eq('email', email)
    expect(data![0]).toMatchObject({ email, source: 'simulator' })

    await page.getByLabel(SIM_STEPS.profile.sectorLabel).selectOption('marketing-media')
    await page.getByRole('button', { name: SIM_STEPS.profile.continue }).click()
    await page.getByRole('button', { name: SIM_STEPS.setup.submit }).click()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(errors).toEqual([])
  })

  test('shows the company logo and sector choices first, before any setup', async ({ page }) => {
    const email = testEmail('sim-profile')
    await page.route('**/logo-stub.png', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: LOGO_PNG }))
    await page.route('**/api/simulator/profile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          profile: {
            domain: 'sample235fedd93a54media.com',
            sector: 'marketing-media',
            confidence: 0.9,
            alternatives: ['software'],
            functionMix: { support: 0.1, sales: 0.2, marketing: 0.2, operations: 0.15, finance: 0.1, legal: 0.05, people: 0.05, software: 0.15 },
            signals: { mentionsAi: false, b2b: true },
            source: 'direct',
            title: 'Sample235fedd93a54',
            summary: 'Sample235fedd93a54 is an affiliate marketing platform that connects advertisers with partners.',
            offerings: ['Partner management'],
            name: 'Sample235fedd93a54',
            aiRole: 'Margins in affiliate marketing live in partner reporting and fraud checks. AI shortens both.',
            levers: ['Faster partner reporting', 'Automated fraud review'],
            hqCountry: 'GB',
            logoUrl: 'http://localhost/logo-stub.png',
            screenshotUrl: null,
          },
        }),
      }),
    )
    await page.goto('/ai-transformation/simulator')
    await page.getByLabel(SIM_STEPS.company.emailLabel).fill(email)
    await page.getByLabel(SIM_STEPS.company.urlLabel).fill('sample235fedd93a54media.com')
    await page.getByLabel(SIM_STEPS.company.peopleLabel).fill('250')
    await page.locator('form').getByRole('button', { name: SIM_STEPS.company.submit }).click()

    await expect(page.getByText('Sample235fedd93a54', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('img', { name: /sample235fedd93a54media\.com logo/ })).toBeVisible()
    await expect(page.getByRole('button', { name: SIM_SECTOR_LABELS['marketing-media'] })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText(SIM_STEPS.setup.label)).toHaveCount(0)

    await page.getByRole('button', { name: SIM_STEPS.profile.continue }).click()
    await page.getByRole('button', { name: SIM_STEPS.setup.submit }).click()
    await expect(page.getByText('Faster partner reporting')).toBeVisible()
    await expect(page.getByText('Sector picked by hand')).toHaveCount(0)
  })

  test('a readiness baseline changes the model and shows its score', async ({ page }) => {
    await page.goto('/ai-transformation/simulator')
    await page.getByLabel(SIM_STEPS.company.emailLabel).fill(testEmail('sim-readiness'))
    await page.getByLabel(SIM_STEPS.company.peopleLabel).fill('180')
    await page.getByRole('button', { name: SIM_STEPS.company.skip }).click()
    await page.getByLabel(SIM_STEPS.profile.sectorLabel).selectOption('marketing-media')
    await page.getByRole('button', { name: SIM_STEPS.profile.continue }).click()

    // Every question is on the setup step, "not sure" by default.
    for (const q of Object.values(SIM_READINESS.questions)) {
      await page.getByLabel(q.label).selectOption({ label: q.options[0].label })
    }
    await page.getByRole('button', { name: SIM_STEPS.setup.submit }).click()

    const card = page.locator('div', { hasText: SIM_READINESS.card.title }).filter({ hasText: SIM_READINESS.card.bands.broad }).last()
    await expect(card).toContainText('100')
    await expect(page.getByRole('link', { name: SIM_READINESS.card.cta })).toBeVisible()
  })
})
