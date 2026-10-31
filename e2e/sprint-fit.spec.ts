import { test, expect, type Page, type Route } from '@playwright/test'
import { buildSprintBrief, type BriefRequest } from '../src/lib/sprint-brief'
import type { FitAnswers } from '../src/lib/sprint-fit'
import type { CompanyProfile } from '../src/lib/simulator/api'

const EVIDENCE = process.env.SPRINT_E2E_EVIDENCE_DIR
async function capture(page: Page, filename: string) {
  if (EVIDENCE) await page.screenshot({ path: `${EVIDENCE}/${filename}`, fullPage: true })
}

type InquiryPayload = { fitCheck: FitAnswers; briefRequest: BriefRequest; name: string; email: string; role: string; companyWebsite: string; resendEmail?: boolean }
const profile: CompanyProfile = {
  domain: 'studio.example.com', sector: 'professional-services', confidence: 0.9, alternatives: [],
  functionMix: { support: 0.1, sales: 0.1, marketing: 0.1, operations: 0.3, finance: 0.1, legal: 0.1, people: 0.1, software: 0.1 },
  signals: { mentionsAi: false, b2b: true }, source: 'firecrawl', title: 'Example Studio',
  summary: 'Example Studio helps professional services teams prepare client proposals.', offerings: ['Proposal services'], name: 'Example Studio',
  aiRole: null, levers: [], hqCountry: 'GB', logoUrl: null, screenshotUrl: null,
}
async function savedBrief(route: Route, emailDelivered = true) {
  const body = route.request().postDataJSON() as InquiryPayload
  const brief = buildSprintBrief(body.fitCheck, body.briefRequest, body.companyWebsite ? profile : null, '2026-10-31T08:00:00.000Z')
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, inquiryId: 'saved-sprint-inquiry', brief, emailDelivered }) })
}
async function next(page: Page) { await page.getByRole('button', { name: 'Continue', exact: false }).click() }
async function start(page: Page, type = 'An idea') {
  await page.goto('/ai-build-sprint/readiness')
  await expect(page.getByRole('heading', { name: 'Sprint summary', exact: true })).toHaveCount(0)
  if (test.info().title.startsWith('idea founders')) await capture(page, 'assessment-first-screen.png')
  await page.getByRole('radio', { name: type, exact: true }).check()
  await next(page)
  await expect(page.getByRole('heading', { name: 'About you', exact: true })).toBeVisible()
}
async function details(page: Page, website = false) {
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('Test Founder')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(website ? 'founder@studio.example.com' : 'founder@gmail.com')
  await page.getByRole('textbox', { name: 'Role', exact: true }).fill('Founder')
  await page.getByRole('textbox', { name: 'Company or project', exact: true }).fill('Example Studio')
  if (website) await page.getByRole('textbox', { name: 'Company website', exact: true }).fill('https://studio.example.com')
  else await page.getByRole('checkbox', { name: 'No website yet', exact: true }).check()
  await next(page)
}
async function buildQuestions(page: Page, options: { numbers?: boolean; noBuild?: boolean } = {}) {
  await page.getByRole('textbox', { name: 'First users', exact: true }).fill('Account managers')
  await page.getByRole('textbox', { name: 'First release', exact: true }).fill('Draft a proposal for human review')
  await next(page)
  if (options.noBuild) await page.getByRole('checkbox', { name: 'Nothing built yet', exact: true }).check()
  else await page.getByRole('textbox', { name: 'Current process or prototype', exact: true }).fill('Account managers write client proposals by hand')
  await next(page)
  await page.getByRole('radio', { name: options.numbers ? 'Less time' : 'Help me choose', exact: true }).check()
  if (options.numbers) {
    await page.getByText('Add numbers', { exact: false }).click()
    await page.getByRole('spinbutton', { name: 'Tasks per week, across the team', exact: true }).fill('20')
    await page.getByRole('spinbutton', { name: 'Minutes per person, per task', exact: true }).fill('60')
    await page.getByRole('spinbutton', { name: 'People per task', exact: true }).fill('1')
    await page.getByRole('spinbutton', { name: 'Target minutes per person, per task', exact: true }).fill('15')
    await page.getByRole('spinbutton', { name: 'Hourly cost per person', exact: true }).fill('50')
  }
  await next(page)
  await page.getByRole('combobox', { name: 'Sample data and access', exact: true }).selectOption('arrange')
  await page.getByRole('combobox', { name: 'Who will own the result?', exact: true }).selectOption('yes')
  await page.getByRole('combobox', { name: 'Time to test and learn', exact: true }).selectOption('yes')
  await page.getByRole('combobox', { name: 'Specialist review', exact: true }).selectOption('standard')
  await next(page)
  await page.getByRole('radio', { name: 'In the next month or two', exact: true }).check()
  await page.getByRole('radio', { name: 'Approval needs a proposal', exact: true }).check()
  await next(page)
  await expect(page.getByRole('heading', { name: 'Review your brief', exact: true })).toBeVisible()
}
async function review(page: Page) {
  await page.getByRole('textbox', { name: 'What your company does', exact: true }).fill('We help professional services teams prepare proposals.')
  await page.getByRole('checkbox', { name: 'This company context is correct', exact: true }).check()
}
async function completeToReview(page: Page, options: { numbers?: boolean; noBuild?: boolean; website?: boolean } = {}) {
  await start(page, options.website ? 'An existing workflow' : 'An idea')
  await details(page, options.website)
  await buildQuestions(page, options)
  await review(page)
}

test('idea founders can complete with personal email and no website before receiving a saved brief', async ({ page }) => {
  const received: InquiryPayload[] = []
  let profileRequests = 0
  await page.route('**/api/sprint-fit/profile', route => { profileRequests++; return route.fulfill({ json: { ok: false, reason: 'manual', domain: null } }) })
  await page.route('**/api/sprint-inquiries', async route => { received.push(route.request().postDataJSON()); await savedBrief(route, received.at(-1)?.resendEmail === true) })
  await start(page)
  const summary = page.getByRole('complementary').filter({ has: page.getByRole('heading', { name: 'Sprint summary', exact: true }) })
  await expect(summary).toContainText('An idea')
  await expect(summary.locator('dt')).toHaveCount(1)
  await capture(page, 'assessment-growing-summary.png')
  await expect(page.getByText('Still to shape', { exact: true })).toHaveCount(0)
  await details(page)
  await buildQuestions(page, { noBuild: true })
  await review(page)
  await expect(page.getByRole('button', { name: 'Download HTML', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Create my brief', exact: false }).click()
  await expect(page.getByRole('heading', { name: 'Your sprint brief', exact: true })).toBeVisible()
  await expect(page.getByText('Your brief is saved. Email delivery was unsuccessful.', { exact: false })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Book a call with John', exact: false })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toHaveCount(0)
  expect(profileRequests).toBe(0)
  expect(received[0]).toMatchObject({ name: 'Test Founder', email: 'founder@gmail.com', role: 'Founder', companyWebsite: '', fitCheck: { startingPoint: 'idea', current: 'Nothing built yet' } })
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download HTML', exact: true }).click()
  const download = await downloaded
  expect(download.suggestedFilename()).toBe('sprint-brief.html')
  if (EVIDENCE) await download.saveAs(`${EVIDENCE}/idea-sprint-brief.html`)
  await page.getByRole('button', { name: 'Retry email delivery', exact: true }).click()
  await expect(page.getByText('A copy of your brief has been sent to your email.', { exact: true })).toBeVisible()
  expect(received[1].briefRequest.submissionId).toBe(received[0].briefRequest.submissionId)
  expect(received[1].resendEmail).toBe(true)
})

test('company context and optional supplied figures produce a coherent brief and both downloads', async ({ page }) => {
  await page.route('**/api/sprint-fit/profile', route => route.fulfill({ json: { ok: true, profile, researchedAt: '2026-10-31T08:00:00.000Z' } }))
  await page.route('**/api/sprint-inquiries', route => savedBrief(route))
  await completeToReview(page, { website: true, numbers: true })
  await expect(page.getByRole('combobox', { name: 'Industry', exact: true })).toHaveValue('professional-services')
  await capture(page, 'assessment-company-review.png')
  await page.getByRole('button', { name: 'Create my brief', exact: false }).click()
  const document = page.getByRole('article')
  await expect(document).toContainText('Draft a proposal for human review')
  const stat = (label: string) => document.locator('dl > div').filter({ has: page.locator('dt').filter({ hasText: label }) }).locator('dd')
  await expect(stat('Current hours / week')).toHaveText('20')
  await expect(stat('Target hours / week')).toHaveText('5')
  await expect(stat('Potential capacity / week')).toHaveText('15')
  await expect(stat('Current effort cost / week')).toContainText('1,000')
  await expect(stat('Capacity value / week')).toContainText('750')
  await expect(page.getByText('A copy of your brief has been sent to your email.', { exact: true })).toBeVisible()
  await capture(page, 'assessment-enriched-brief.png')
  const html = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download HTML', exact: true }).click()
  const htmlDownload = await html
  expect(htmlDownload.suggestedFilename()).toBe('sprint-brief.html')
  if (EVIDENCE) await htmlDownload.saveAs(`${EVIDENCE}/workflow-sprint-brief.html`)
  const pdf = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click()
  const pdfDownload = await pdf
  expect(pdfDownload.suggestedFilename()).toBe('sprint-brief.pdf')
  if (EVIDENCE) await pdfDownload.saveAs(`${EVIDENCE}/workflow-sprint-brief.pdf`)
})

test('a silent guard drop cannot unlock the full brief and retry retains the submission identity', async ({ page }) => {
  const ids: string[] = []
  await page.route('**/api/sprint-inquiries', async route => {
    ids.push(route.request().postDataJSON().briefRequest.submissionId)
    if (ids.length === 1) await route.fulfill({ json: { success: true } })
    else await savedBrief(route)
  })
  await completeToReview(page)
  await page.getByRole('button', { name: 'Create my brief', exact: false }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'We could not save your brief' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Your sprint brief', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Download HTML', exact: true })).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: 'Company or project', exact: true })).toHaveValue('Example Studio')
  await page.getByRole('button', { name: 'Create my brief', exact: false }).click()
  await expect(page.getByRole('heading', { name: 'Your sprint brief', exact: true })).toBeVisible()
  expect(ids).toHaveLength(2)
  expect(ids[0]).toBe(ids[1])
})

test('pending creation locks edits; saved answers can be refined and resubmitted', async ({ page }) => {
  let release!: () => void
  const delayed = new Promise<void>(resolve => { release = resolve })
  const outcomes: string[] = []
  await page.route('**/api/sprint-inquiries', async route => {
    outcomes.push(route.request().postDataJSON().fitCheck.outcome)
    if (outcomes.length === 1) await delayed
    await savedBrief(route)
  })
  await completeToReview(page)
  await page.getByRole('button', { name: 'Create my brief', exact: false }).click()
  await expect(page.getByRole('button', { name: 'Back', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Start over', exact: true })).toBeDisabled()
  release()
  await expect(page.getByRole('heading', { name: 'Your sprint brief', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Refine my answers', exact: true }).click()
  await page.getByRole('button', { name: 'Edit First useful release', exact: true }).first().click()
  await page.getByRole('textbox', { name: 'First release', exact: true }).fill('Review a revised proposal before sending')
  for (let i = 0; i < 5; i++) await next(page)
  await page.getByRole('button', { name: 'Create my brief', exact: false }).click()
  await expect(page.getByRole('heading', { name: 'Your sprint brief', exact: true })).toBeVisible()
  expect(outcomes).toEqual(['Draft a proposal for human review', 'Review a revised proposal before sending'])
})

test('mobile keeps a collapsed growing summary available without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await start(page)
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Book a 30-min call', exact: true })).toBeHidden()
  const disclosure = page.locator('details').filter({ has: page.locator('summary').filter({ hasText: 'Sprint summary' }) })
  await expect(disclosure).not.toHaveAttribute('open', '')
  await disclosure.locator('summary').click()
  await expect(disclosure).toContainText('An idea')
  await expect(disclosure.locator('dt')).toHaveCount(1)
  await capture(page, 'assessment-mobile-summary.png')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
