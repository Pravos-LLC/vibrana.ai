import { test, expect, type Page, type Route } from '@playwright/test'
import { buildSprintBrief, type BriefRequest } from '../src/lib/sprint-brief'
import type { FitAnswers } from '../src/lib/sprint-fit'
import type { CompanyProfile } from '../src/lib/simulator/api'

// The form service boundaries are mocked below. Keep the optional browser challenge
// deterministic too, including when a developer runs against configured local services.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const callbacks = new Map<string, (value: string) => void>()
    Object.defineProperty(window, 'turnstile', { configurable: true, value: {
      render: (_element: HTMLElement, options: { callback: (value: string) => void }) => {
        const id = `test-widget-${callbacks.size}`
        callbacks.set(id, options.callback)
        setTimeout(() => options.callback('test-browser-challenge'), 0)
        return id
      },
      reset: (id: string) => { setTimeout(() => callbacks.get(id)?.('test-browser-challenge'), 0) },
      remove: (id: string) => { callbacks.delete(id) },
    } })
  })
})

const EVIDENCE = process.env.SPRINT_E2E_EVIDENCE_DIR
async function capture(page: Page, filename: string) {
  if (!EVIDENCE) return
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }))
  await page.screenshot({ path: `${EVIDENCE}/${filename}`, fullPage: true, animations: 'disabled' })
}

type InquiryPayload = { fitCheck: FitAnswers; briefRequest: BriefRequest; name: string; email: string; role: string; companyWebsite: string; resendEmail?: boolean }
const profile: CompanyProfile = {
  domain: 'studio.example.com', sector: 'real-estate', confidence: 0.9, alternatives: [],
  functionMix: { support: 0.1, sales: 0.1, marketing: 0.1, operations: 0.3, finance: 0.1, legal: 0.1, people: 0.1, software: 0.1 },
  signals: { mentionsAi: false, b2b: true }, source: 'firecrawl', title: 'Example Studio',
  summary: 'Example Studio helps property teams prepare client proposals.', offerings: ['Property advisory'], name: 'Example Studio',
  aiRole: null, levers: [], hqCountry: 'GB', logoUrl: null, screenshotUrl: null,
}
async function savedBrief(route: Route, emailDelivered = true) {
  const body = route.request().postDataJSON() as InquiryPayload
  const brief = buildSprintBrief(body.fitCheck, { ...body.briefRequest, company: { ...body.briefRequest.company, name: body.briefRequest.company.name || body.name } }, body.companyWebsite ? profile : null, '2026-10-31T08:00:00.000Z')
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, inquiryId: 'saved-sprint-inquiry', brief, emailDelivered }) })
}
async function next(page: Page) { await page.getByRole('button', { name: 'Continue', exact: false }).click() }
async function start(page: Page, type = 'An idea') {
  await page.goto('/ai-build-sprint/readiness')
  await expect(page.getByRole('button', { name: 'Start my assessment', exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Start my assessment', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Sprint summary', exact: true })).toHaveCount(0)
  if (test.info().title.startsWith('idea founders')) await capture(page, 'assessment-first-screen.png')
  await page.getByRole('radio', { name: type, exact: true }).check()
  await expect(page.getByRole('heading', { name: 'About you', exact: true })).toBeVisible()
}
async function details(page: Page, website = false, company = 'Example Studio') {
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('Test Founder')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(website ? 'founder@studio.example.com' : 'founder@gmail.com')
  await page.getByRole('textbox', { name: 'Role', exact: true }).fill('Founder')
  await page.getByRole('textbox', { name: 'Company name (optional)', exact: true }).fill(company)
  if (website) await page.getByRole('textbox', { name: 'Company website', exact: true }).fill('https://studio.example.com')
  else await page.getByRole('checkbox', { name: 'No website yet', exact: true }).check()
  await next(page)
}
async function buildQuestions(page: Page, options: { numbers?: boolean; noBuild?: boolean; other?: boolean } = {}) {
  const release = page.getByRole('textbox', { name: 'Description of first release', exact: true })
  const users = page.getByRole('textbox', { name: 'First users', exact: true })
  expect((await release.boundingBox())!.y).toBeLessThan((await users.boundingBox())!.y)
  await release.fill('Draft a proposal for human review')
  await users.fill('Account managers')
  await next(page)
  if (options.noBuild) await page.getByRole('checkbox', { name: 'Nothing built yet', exact: true }).check()
  else await page.getByRole('textbox', { name: 'Current process or prototype', exact: true }).fill('Account managers write client proposals by hand')
  await next(page)
  await page.getByRole('checkbox', { name: options.other ? 'Other' : options.numbers ? 'Less time' : 'Better quality', exact: true }).check()
  if (options.other) {
    await next(page)
    await expect(page.getByRole('alert').filter({ hasText: 'Describe the other measure of success.' })).toBeVisible()
    await page.getByRole('textbox', { name: 'Other measure of success', exact: true }).fill('Proposals include a traceable source for every recommendation')
    await capture(page, 'assessment-success-choices.png')
  }
  await page.getByRole('checkbox', { name: 'More output', exact: true }).check()
  if (options.numbers) {
    await page.getByText('Add numbers', { exact: false }).click()
    await page.getByRole('spinbutton', { name: 'Tasks per week, across the team', exact: true }).fill('20')
    await page.getByRole('spinbutton', { name: 'Minutes per person, per task', exact: true }).fill('60')
    await page.getByRole('spinbutton', { name: 'People per task', exact: true }).fill('1')
    await page.getByRole('spinbutton', { name: 'Target minutes per person, per task', exact: true }).fill('15')
    await page.getByRole('spinbutton', { name: 'Hourly cost per person', exact: true }).fill('50')
  }
  await next(page)
  const access = page.getByRole('combobox', { name: 'Sample data and access', exact: true })
  await expect(access).toHaveValue('')
  await expect(access.locator('option:checked')).toHaveText('Select')
  await expect(access.locator('option:checked')).toHaveAttribute('disabled', '')
  await access.selectOption('arrange')
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
  await expect(page.getByRole('checkbox', { name: 'This company context is correct', exact: true })).toHaveCount(0)
}
async function completeToReview(page: Page, options: { numbers?: boolean; noBuild?: boolean; website?: boolean; other?: boolean } = {}) {
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
  await details(page, false, '')
  await buildQuestions(page, { noBuild: true })
  await review(page)
  await expect(page.getByRole('button', { name: 'Download HTML', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Create my brief', exact: false }).click()
  await expect(page.getByRole('heading', { name: 'Your sprint brief', exact: true })).toBeVisible()
  await expect(page.getByText('Your brief is saved. Email delivery was unsuccessful.', { exact: false })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Book a call with John', exact: false })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toHaveCount(0)
  expect(profileRequests).toBe(0)
  expect(received[0]).toMatchObject({ name: 'Test Founder', email: 'founder@gmail.com', role: 'Founder', companyWebsite: '', briefRequest: { company: { name: '' } }, fitCheck: { startingPoint: 'idea', current: 'Nothing built yet' } })
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
  await start(page, 'An existing workflow')
  await details(page, true)
  await buildQuestions(page, { numbers: true })
  await expect(page.getByRole('textbox', { name: 'What your company does', exact: true })).toHaveValue(profile.summary!)
  await expect(page.getByRole('checkbox', { name: 'This company context is correct', exact: true })).toHaveCount(0)
  await expect(page.getByRole('combobox', { name: 'Industry', exact: true })).toHaveValue('real-estate')
  await capture(page, 'assessment-company-review.png')
  await page.getByRole('button', { name: 'Create my brief', exact: false }).click()
  const briefArticle = page.getByRole('article')
  await expect(briefArticle).toContainText('Draft a proposal for human review')
  await expect(briefArticle).toContainText('Less time')
  await expect(briefArticle).toContainText('More output')
  await expect(page.getByText('CEO and Founder, Vibrana', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Relevant case studies', exact: true })).toBeVisible()
  const relatedCase = page.locator('section[aria-labelledby="sprint-relevant-cases"] a').first()
  await expect(relatedCase).toHaveAttribute('href', '/case-studies/european-proptech-rag')
  await expect.poll(() => relatedCase.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
  const stat = (label: string) => briefArticle.locator('dl > div').filter({ has: page.locator('dt').filter({ hasText: label }) }).locator('dd')
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
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await capture(page, 'assessment-mobile-brief.png')
  await page.setViewportSize({ width: 320, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
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
  await expect(page.getByRole('textbox', { name: 'Company name (optional)', exact: true })).toHaveValue('Example Studio')
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
  await expect(page.getByRole('heading', { name: 'Creating your sprint brief', exact: true })).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(0)
  await expect.poll(() => outcomes.length).toBe(1)
  await expect(page.getByRole('listitem').filter({ hasText: 'Preparing and saving your brief' })).toHaveAttribute('data-state', 'active')
  await capture(page, 'assessment-creating-brief.png')
  await expect(page.getByRole('button', { name: 'Back', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Start over', exact: true })).toBeDisabled()
  release()
  await expect(page.getByRole('heading', { name: 'Your sprint brief', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Refine my answers', exact: true }).click()
  await page.getByRole('button', { name: 'Edit First useful release', exact: true }).first().click()
  await page.getByRole('textbox', { name: 'Description of first release', exact: true }).fill('Review a revised proposal before sending')
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


test('multiple success measures and a described Other measure persist without auto-advancing', async ({ page }) => {
  let received: InquiryPayload | undefined
  await page.route('**/api/sprint-inquiries', async route => { received = route.request().postDataJSON(); await savedBrief(route) })
  await completeToReview(page, { other: true })
  await page.getByRole('button', { name: 'Create my brief', exact: false }).click()
  await expect(page.getByRole('heading', { name: 'Your sprint brief', exact: true })).toBeVisible()
  expect(received?.fitCheck.metrics).toEqual(expect.arrayContaining(['other', 'capacity']))
  expect(received?.fitCheck.metricOther).toBe('Proposals include a traceable source for every recommendation')
  await expect(page.getByRole('article')).toContainText('Proposals include a traceable source for every recommendation')
  await expect(page.getByRole('article')).toContainText('More output')
})

test('returning to the first question allows editing without an automatic navigation loop', async ({ page }) => {
  await start(page)
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'What are you starting with?', exact: true })).toBeVisible()
  await page.getByRole('radio', { name: 'A prototype', exact: true }).check()
  // This deliberate wait exceeds the 260ms first-visit advance: Back/edit must stay put.
  await page.waitForTimeout(350)
  await expect(page.getByRole('heading', { name: 'What are you starting with?', exact: true })).toBeVisible()
  await next(page)
  await expect(page.getByRole('heading', { name: 'About you', exact: true })).toBeVisible()
})

test('late company research preserves a visitor correction', async ({ page }) => {
  let release!: () => void
  let requested = false
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/sprint-fit/profile', async route => { requested = true; await pending; await route.fulfill({ json: { ok: true, profile } }) })
  await start(page, 'An existing workflow')
  await details(page, true)
  await buildQuestions(page)
  await expect.poll(() => requested).toBe(true)
  const description = page.getByRole('textbox', { name: 'What your company does', exact: true })
  await description.fill('We provide specialist proposal reviews for independent consultancies.')
  await page.getByRole('combobox', { name: 'Industry', exact: true }).selectOption('software')
  release()
  await expect(page.getByText('Company context added', { exact: true })).toBeVisible()
  await expect(description).toHaveValue('We provide specialist proposal reviews for independent consultancies.')
  await expect(page.getByRole('combobox', { name: 'Industry', exact: true })).toHaveValue('software')
})


test('review recovers company context after an initial lookup failure', async ({ page }) => {
  let attempts = 0
  await page.route('**/api/sprint-fit/profile', async route => {
    attempts++
    await route.fulfill({ json: attempts === 1 ? { ok: false, reason: 'manual', domain: profile.domain } : { ok: true, profile } })
  })
  await start(page, 'An existing workflow')
  await details(page, true)
  await buildQuestions(page)
  await expect(page.getByRole('textbox', { name: 'What your company does', exact: true })).toHaveValue(profile.summary!)
  expect(attempts).toBe(2)
  await expect(page.getByRole('combobox', { name: 'Industry', exact: true })).toHaveValue('real-estate')
})

test('changing success measures drops hidden stale targets but preserves a remaining qualitative measure', async ({ page }) => {
  let received: InquiryPayload | undefined
  await page.route('**/api/sprint-inquiries', async route => { received = route.request().postDataJSON(); await savedBrief(route) })
  await completeToReview(page, { other: true })
  await page.getByRole('button', { name: 'Edit Success measures', exact: true }).first().click()
  await page.getByRole('checkbox', { name: 'Better quality', exact: true }).check()
  await page.getByText('Add numbers', { exact: false }).click()
  const baseline = page.getByRole('textbox', { name: 'Current baseline, if known', exact: true })
  const target = page.getByRole('textbox', { name: 'What would a good result look like?', exact: true })
  await baseline.fill('Every proposal needs manual evidence checks')
  await target.fill('Every recommendation has auditable evidence')
  await page.getByRole('checkbox', { name: 'Better quality', exact: true }).uncheck()
  await expect(baseline).toHaveValue('Every proposal needs manual evidence checks')
  await expect(target).toHaveValue('Every recommendation has auditable evidence')
  await page.getByRole('checkbox', { name: 'Other', exact: true }).uncheck()
  await page.getByRole('checkbox', { name: 'Less time', exact: true }).check()
  await expect(target).toHaveCount(0)
  for (let i = 0; i < 3; i++) await next(page)
  await page.getByRole('button', { name: 'Create my brief', exact: false }).click()
  await expect(page.getByRole('heading', { name: 'Your sprint brief', exact: true })).toBeVisible()
  expect(received?.fitCheck.baseline).toBe('')
  expect(received?.fitCheck.target).toBe('')
  await expect(page.getByRole('article')).toContainText('Less time')
  await expect(page.getByRole('article')).not.toContainText('Every recommendation has auditable evidence')
})


test('company suggestions can be corrected and an optional project name survives the saved brief', async ({ page }) => {
  let received: InquiryPayload | undefined
  await page.route('**/api/sprint-fit/profile', route => route.fulfill({ json: { ok: true, profile } }))
  await page.route('**/api/sprint-inquiries', async route => { received = route.request().postDataJSON(); await savedBrief(route) })
  await start(page)
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('Test Founder')
  const email = page.getByRole('textbox', { name: 'Email', exact: true })
  await email.fill('founder@studio.example.com')
  await email.blur()
  const company = page.getByRole('textbox', { name: 'Company name (optional)', exact: true })
  await expect(company).toHaveValue('')
  await page.getByRole('button', { name: 'Use studio.example.com', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Company website', exact: true })).toHaveValue('https://studio.example.com')
  await company.fill('Corrected Studio')
  await page.getByRole('textbox', { name: 'Project name (optional)', exact: true }).fill('Proposal Companion')
  await page.getByRole('textbox', { name: 'Role', exact: true }).fill('Founder')
  await next(page)
  await buildQuestions(page)
  await expect(page.getByRole('textbox', { name: 'Company name (optional)', exact: true })).toHaveValue('Corrected Studio')
  await expect(page.getByRole('checkbox', { name: 'I would like help shaping this', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Create my brief', exact: false }).click()
  await expect(page.getByRole('heading', { name: 'Your sprint brief', exact: true })).toBeVisible()
  expect(received?.briefRequest.company).toMatchObject({ name: 'Corrected Studio', projectName: 'Proposal Companion' })
  await expect(page.getByRole('article')).toContainText('Proposal Companion')
})

test('switching to personal email clears an uncorrected company suggestion', async ({ page }) => {
  await start(page)
  const email = page.getByRole('textbox', { name: 'Email', exact: true })
  await email.fill('founder@unknownmail.example'); await email.blur()
  const company = page.getByRole('textbox', { name: 'Company name (optional)', exact: true })
  await expect(company).toHaveValue('')
  await expect(page.getByRole('textbox', { name: 'Company website', exact: true })).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Use unknownmail.example', exact: true })).toBeVisible()
  await email.fill('founder@gmail.com'); await email.blur()
  await expect(company).toHaveValue('')
  await expect(page.getByRole('textbox', { name: 'Company website', exact: true })).toHaveValue('')
  await expect(page.getByRole('button', { name: /Use gmail/ })).toHaveCount(0)
})

test('a lookup completing after create cannot change the reviewed submission', async ({ page }) => {
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  let received: InquiryPayload | undefined
  await page.route('**/api/sprint-fit/profile', async route => { await pending; await route.fulfill({ json: { ok: true, profile } }) })
  await page.route('**/api/sprint-inquiries', async route => { received = route.request().postDataJSON(); await savedBrief(route) })
  await start(page, 'An existing workflow')
  await details(page, true)
  await buildQuestions(page)
  await page.getByRole('textbox', { name: 'What your company does', exact: true }).fill('Visitor reviewed description.')
  await page.getByRole('button', { name: 'Create my brief', exact: false }).click()
  await expect(page.getByRole('heading', { name: 'Your sprint brief', exact: true })).toBeVisible()
  release()
  expect(received?.briefRequest.company.description).toBe('Visitor reviewed description.')
  await expect(page.getByRole('article')).toContainText('Visitor reviewed description.')
})

test('changing website clears researched context if the replacement lookup fails', async ({ page }) => {
  let received: InquiryPayload | undefined
  await page.route('**/api/sprint-fit/profile', async route => {
    const body = route.request().postDataJSON()
    await route.fulfill({ json: body.website.includes('studio.example.com') ? { ok: true, profile } : { ok: false, reason: 'manual' } })
  })
  await page.route('**/api/sprint-inquiries', async route => { received = route.request().postDataJSON(); await savedBrief(route) })
  await start(page, 'An existing workflow')
  await details(page, true)
  await buildQuestions(page)
  await expect(page.getByRole('textbox', { name: 'What your company does', exact: true })).toHaveValue(profile.summary!)
  await page.getByRole('button', { name: 'Company name (optional)', exact: false }).first().click()
  await page.getByRole('textbox', { name: 'Company website', exact: true }).fill('https://replacement.example.com')
  for (let i = 0; i < 6; i++) await next(page)
  await expect(page.getByRole('textbox', { name: 'What your company does', exact: true })).toHaveValue('')
  await expect(page.getByRole('combobox', { name: 'Industry', exact: true })).toHaveValue('other')
  await page.getByRole('button', { name: 'Create my brief', exact: false }).click()
  await expect(page.getByRole('heading', { name: 'Your sprint brief', exact: true })).toBeVisible()
  expect(received?.briefRequest.company.profileDomain).toBeUndefined()
  expect(received?.briefRequest.company.researchedAt).toBeUndefined()
  expect(received?.briefRequest.company.sector).toBe('other')
})

test('revisiting unchanged email retains researched context even if a retry fails', async ({ page }) => {
  let requests = 0
  await page.route('**/api/sprint-fit/profile', async route => {
    requests++
    await route.fulfill({ json: requests === 1 ? { ok: true, profile } : { ok: false, reason: 'manual' } })
  })
  await start(page, 'An existing workflow')
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('Test Founder')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('founder@studio.example.com')
  await page.getByRole('textbox', { name: 'Role', exact: true }).fill('Founder')
  await page.getByRole('button', { name: 'Use studio.example.com', exact: true }).click()
  await next(page)
  await buildQuestions(page)
  await expect(page.getByRole('textbox', { name: 'What your company does', exact: true })).toHaveValue(profile.summary!)
  await page.getByRole('button', { name: 'Company name (optional)', exact: false }).first().click()
  const email = page.getByRole('textbox', { name: 'Email', exact: true })
  await email.focus(); await email.blur()
  for (let i = 0; i < 6; i++) await next(page)
  await expect(page.getByRole('textbox', { name: 'What your company does', exact: true })).toHaveValue(profile.summary!)
  await expect(page.getByRole('combobox', { name: 'Industry', exact: true })).toHaveValue('real-estate')
})

test('intro uses a still hero, existing logo reel and closing assessment action', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/ai-build-sprint/readiness')
  await expect(page.locator('video')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Production-ready applications in two weeks?' })).toBeVisible()
  const reel = page.locator('.logo-marquee-track')
  await expect(reel).toHaveCSS('animation-name', 'none')
  await expect(page.getByAltText('Optimise Media').first()).toBeVisible()
  const closing = page.getByRole('heading', { name: 'Ready to shape your first release?' })
  await expect(closing).toBeVisible()
  await page.getByRole('button', { name: 'Start my assessment', exact: true }).last().click()
  await expect(page.getByRole('heading', { name: 'What are you starting with?' })).toBeVisible()
  expect(await page.locator('body').evaluate(element => element.scrollWidth)).toBe(320)
})


test('logo reel can be paused and resumed with the keyboard', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/ai-build-sprint/readiness')
  const track = page.locator('.logo-marquee-track')
  await expect(track).toHaveCSS('animation-name', 'logo-marquee-slide')
  const control = page.getByRole('button', { name: 'Pause logo reel' })
  await control.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Play logo reel' })).toBeFocused()
  await expect(track).toHaveCSS('animation-play-state', 'paused')
  await page.getByRole('button', { name: 'Start my assessment' }).first().focus()
  await expect(track).toHaveCSS('animation-play-state', 'paused')
  await page.getByRole('button', { name: 'Play logo reel' }).focus()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Pause logo reel' })).toBeFocused()
  await page.getByRole('button', { name: 'Start my assessment' }).first().focus()
  await expect(track).toHaveCSS('animation-play-state', 'running')
})
