import { mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { test, expect, type Locator, type Page } from '@playwright/test'
import { buildSprintBrief, type BriefRequest } from '../../src/lib/sprint-brief'
import type { FitAnswers } from '../../src/lib/sprint-fit'

// Screenshots of the four report screens, in dark mode, with fictional sample data
// (Northwind Logistics from scripts/eu-ai-act-report/northwind.ts and an "Example Studio" brief).
// No form is submitted to a real service: the Build Sprint calls are mocked like e2e/sprint-fit.spec.ts.
const OUT = 'public/assets/feedback'
const TMP = 'test-results/feedback-report-mocks'
mkdirSync(TMP, { recursive: true })

function samples() {
  execFileSync('npx', ['tsx', 'scripts/feedback-report-mocks/samples.ts', `${TMP}/samples.json`])
  return require(`${process.cwd()}/${TMP}/samples.json`) as { readinessReport: unknown; euReport: unknown }
}

async function prepare(page: Page, storage: Record<string, unknown> = {}) {
  await page.context().addCookies([{ name: 'vibrana-theme', value: 'dark', url: test.info().project.use.baseURL! }])
  await page.addInitScript((items) => {
    for (const [key, value] of Object.entries(items)) localStorage.setItem(key, JSON.stringify({ ...(value as object), _storedAt: Date.now(), storedAt: Date.now() }))
  }, storage)
}

/**
 * A 16:10 crop anchored on one element (offset by dx/dy, `width` CSS px wide), saved as a 1200 x 750 webp.
 * Shot at 2x so the scaled image stays sharp.
 */
async function shoot(page: Page, name: string, anchor: Locator, { dx = -32, dy = -32, width = 1000 } = {}) {
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' })
  await anchor.evaluate((el) => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140, behavior: 'instant' }))
  await page.mouse.move(0, 0)
  await page.waitForTimeout(2500) // let entrance animations settle
  const box = (await anchor.boundingBox())!
  const png = `${TMP}/${name}.png`
  await page.screenshot({ path: png, clip: { x: Math.max(0, box.x + dx), y: box.y + dy, width, height: width / 1.6 } })
  execFileSync('magick', [png, '-resize', '1200x750!', '-quality', '80', '-define', 'webp:method=6', `${OUT}/report-${name}.webp`])
}

test('AI Readiness report', async ({ page }) => {
  const { readinessReport } = samples()
  await prepare(page, { assessmentReport: readinessReport })
  await page.goto('/ai-transformation/results')
  const heading = page.getByRole('heading', { name: 'Northwind Logistics' })
  await expect(heading).toBeVisible()
  await shoot(page, 'ai-readiness', heading, { dx: -330, dy: -56, width: 1180 })
})

test('EU AI Act report', async ({ page }) => {
  const { euReport } = samples()
  await prepare(page, { euAiActReport: euReport })
  await page.goto('/eu-ai-act-readiness/results')
  const heading = page.getByRole('heading', { name: 'Northwind Logistics' })
  await expect(heading).toBeVisible()
  await shoot(page, 'eu-ai-act', heading, { dx: -80, dy: -90, width: 1320 })
})

test('AI Transformation Simulator report', async ({ page }) => {
  await prepare(page)
  await page.goto('/ai-transformation/simulator')
  // The hero's sample result: the real engine and result components inside a window frame.
  const preview = page.locator('[aria-hidden="true"]').filter({ hasText: 'Sample insurer' }).first()
  await expect(preview).toBeVisible()
  // Reduced motion (playwright.config.ts) shows the org picture at month 18 straight away.
  await page.waitForTimeout(1500)
  const width = (await preview.boundingBox())!.width
  await shoot(page, 'simulator', preview, { dx: 0, dy: 0, width })
})

type InquiryPayload = { fitCheck: FitAnswers; briefRequest: BriefRequest; name: string }
test('AI Build Sprint brief', async ({ page }) => {
  await prepare(page)
  await page.route('**/api/sprint-fit/profile', (route) => route.fulfill({ json: { ok: false } }))
  await page.route('**/api/sprint-inquiries', async (route) => {
    const body = route.request().postDataJSON() as InquiryPayload
    const brief = buildSprintBrief(body.fitCheck, { ...body.briefRequest, company: { ...body.briefRequest.company, name: body.briefRequest.company.name || body.name } }, null, '2026-10-31T08:00:00.000Z')
    await route.fulfill({ json: { success: true, inquiryId: 'sample', brief, emailDelivered: true } })
  })
  const next = () => page.getByRole('button', { name: 'Continue', exact: false }).click()
  await page.goto('/ai-build-sprint/readiness')
  await page.getByRole('button', { name: 'Start my assessment', exact: true }).first().click()
  await page.getByRole('radio', { name: 'An existing workflow', exact: true }).check()
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('Sample Founder')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('founder@gmail.com')
  await page.getByRole('textbox', { name: 'Role', exact: true }).fill('Founder')
  await page.getByRole('textbox', { name: 'Company name (optional)', exact: true }).fill('Northwind Logistics')
  await page.getByRole('checkbox', { name: 'No website yet', exact: true }).check()
  await next()
  await page.getByRole('textbox', { name: 'Description of first release', exact: true }).fill('Draft a client proposal for human review')
  await page.getByRole('textbox', { name: 'First users', exact: true }).fill('Account managers')
  await next()
  await page.getByRole('textbox', { name: 'Current process or prototype', exact: true }).fill('Account managers write client proposals by hand')
  await next()
  await page.getByRole('checkbox', { name: 'Less time', exact: true }).check()
  await page.getByRole('checkbox', { name: 'More output', exact: true }).check()
  await page.getByText('Add numbers', { exact: false }).click()
  await page.getByRole('spinbutton', { name: 'Tasks per week, across the team', exact: true }).fill('20')
  await page.getByRole('spinbutton', { name: 'Minutes per person, per task', exact: true }).fill('60')
  await page.getByRole('spinbutton', { name: 'People per task', exact: true }).fill('1')
  await page.getByRole('spinbutton', { name: 'Target minutes per person, per task', exact: true }).fill('15')
  await page.getByRole('spinbutton', { name: 'Hourly cost per person', exact: true }).fill('50')
  await next()
  await page.getByRole('combobox', { name: 'Sample data and access', exact: true }).selectOption('arrange')
  await page.getByRole('combobox', { name: 'Who will own the result?', exact: true }).selectOption('yes')
  await page.getByRole('combobox', { name: 'Time to test and learn', exact: true }).selectOption('yes')
  await page.getByRole('combobox', { name: 'Specialist review', exact: true }).selectOption('standard')
  await next()
  await page.getByRole('radio', { name: 'In the next month or two', exact: true }).check()
  await page.getByRole('radio', { name: 'Approval needs a proposal', exact: true }).check()
  await next()
  await page.getByRole('textbox', { name: 'What your company does', exact: true }).fill('Northwind moves freight across Europe for retail clients.')
  await page.getByRole('button', { name: 'Create my brief', exact: false }).click()
  await expect(page.getByRole('article')).toContainText('Draft a client proposal for human review')
  await shoot(page, 'build-sprint', page.getByRole('article'), { dx: -40, dy: -24, width: 1300 })
})
