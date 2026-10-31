import { expect, test } from '@playwright/test'
import { buildSprintBrief, EMPTY_BUSINESS_CASE } from '../src/lib/sprint-brief'
import { FIT_SAMPLE } from '../src/lib/sprint-fit'

const brief = buildSprintBrief(FIT_SAMPLE, {
  company: { name: 'Example Studio', website: '', description: 'A synthetic studio.', sector: 'other', confirmed: true },
  businessCase: { ...EMPTY_BUSINESS_CASE, tasksPerWeek: 20, minutesPerTask: 60, peoplePerTask: 1, targetMinutesPerTask: 15, hourlyCost: 50 },
  submissionId: '118b04ab-d8ea-4429-960c-7d9eb6983087',
}, null, '2026-10-31T09:00:00Z')
brief.narrative.assumptions = ['Confirm the first release.']

for (const theme of ['light', 'dark'] as const) test(`${theme} brief remains readable at 320px`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.route('**/api/sprint-inquiries', route => route.fulfill({ status: 200, json: { success: true, inquiryId: 'synthetic', brief, emailDelivered: true } }))
  await page.goto('/ai-build-sprint/readiness')
  if (theme === 'dark') {
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('button', { name: 'Switch to dark mode' }).last().click()
    await page.getByRole('button', { name: 'Close menu' }).first().click()
  }
  await page.getByRole('button', { name: 'Start my assessment', exact: true }).first().click()
  await page.getByRole('radio', { name: 'An idea', exact: true }).check()
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('Test Founder')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('founder@gmail.com')
  await page.getByRole('textbox', { name: 'Role', exact: true }).fill('Founder')
  await page.getByRole('textbox', { name: 'Company name (optional)', exact: true }).fill('Example Studio')
  await page.getByRole('checkbox', { name: 'No website yet', exact: true }).check()
  const next = () => page.getByRole('button', { name: 'Continue' }).click()
  await next()
  await page.getByRole('textbox', { name: 'Description of first release', exact: true }).fill('Draft a proposal')
  await page.getByRole('textbox', { name: 'First users', exact: true }).fill('Account managers')
  await next()
  await page.getByRole('textbox', { name: 'Current process or prototype', exact: true }).fill('Drafted by hand')
  await next()
  await page.getByRole('checkbox', { name: 'Less time', exact: true }).check()
  await next()
  await page.getByRole('combobox', { name: 'Sample data and access' }).selectOption('arrange')
  await page.getByRole('combobox', { name: 'Who will own the result?' }).selectOption('yes')
  await page.getByRole('combobox', { name: 'Time to test and learn' }).selectOption('yes')
  await page.getByRole('combobox', { name: 'Specialist review' }).selectOption('standard')
  await next()
  await page.getByRole('radio', { name: 'In the next month or two' }).check()
  await page.getByRole('radio', { name: 'Approval needs a proposal' }).check()
  await next()
  await page.getByRole('textbox', { name: 'What your company does' }).fill('A synthetic studio.')
  await page.getByRole('button', { name: 'Create my brief' }).click()
  await expect(page.getByRole('heading', { name: 'Your sprint brief', exact: true })).toBeVisible()
  // Evaluate rendered text against the opaque brief surface in both themes.
  const companyHeading = page.getByRole('heading', { name: 'Example Studio', exact: true })
  const contrast = await companyHeading.evaluate(element => {
    const parse = (value: string) => (value.match(/[\d.]+/g) || []).map(Number)
    const foreground = parse(getComputedStyle(element).color)
    const surface = parse(getComputedStyle(element.closest('article')!).backgroundColor)
    const background = surface.slice(0, 3)
    const alpha = foreground[3] ?? 1
    const channel = (value: number) => { const x = value / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }
    const luminance = (rgb: number[]) => 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])
    const text = background.map((value, index) => foreground[index] * alpha + value * (1 - alpha))
    const a = luminance(text), b = luminance(background)
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  })
  expect(contrast).toBeGreaterThanOrEqual(4.5)
  const amount = page.getByText('£1,000', { exact: true })
  await expect(amount).toBeVisible()
  expect(await amount.evaluate(element => {
    const range = document.createRange()
    range.selectNodeContents(element)
    return range.getClientRects().length
  })).toBe(1)
  const confirm = page.getByRole('heading', { name: 'To confirm', exact: true }).locator('..')
  await expect(confirm.locator('li')).toHaveCount(1)
  await expect(confirm.locator('li span[aria-hidden="true"]')).toHaveCount(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
})
