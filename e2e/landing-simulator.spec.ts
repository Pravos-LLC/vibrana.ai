import { expect, test, type Page } from '@playwright/test'
import { SIM_PACES, SIM_SECTOR_LABELS, SIM_STEPS } from '@/src/simulator-content'
import { SIM_HERO, SIM_MINI } from '@/src/simulator-landing-hero-content'
import { SIM_WALKTHROUGH } from '@/src/simulator-landing-walkthrough-content'
import { STICKY_CTA_CONTENT } from '@/src/simulator-landing-cta-content'
import { collectErrors } from './support'

// The simulator landing: a play-first sandbox that never asks for an email, the scroll run that
// hands its scenario back, and a layout that never scrolls sideways. Copy comes from the content
// modules, so copy edits do not break these tests.

const URL = '/ai-transformation/simulator'
const WIDTHS = [390, 1024, 1280, 1440] as const

async function walk(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y)
    await page.waitForTimeout(40)
  }
  await page.waitForTimeout(600)
}

const sandbox = (page: Page) => page.getByRole('region', { name: SIM_MINI.label })
/** The first output's accessible range text ("$299k to $2.6M"). */
const capacity = (page: Page) => sandbox(page).locator('.sr-only').first()

for (const theme of ['light', 'dark'] as const) {
  for (const width of WIDTHS) {
    test(`no horizontal scroll at ${width}px, ${theme}`, async ({ page, context }) => {
      test.setTimeout(90_000) // a long page, walked so every in-view effect has fired
      if (theme === 'dark') await context.addCookies([{ name: 'vibrana-theme', value: 'dark', url: 'http://localhost' }])
      await page.setViewportSize({ width, height: 900 })
      await page.goto(URL)
      await walk(page)
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }))
      expect(scrollWidth, `document is ${scrollWidth}px wide in a ${innerWidth}px viewport`).toBeLessThanOrEqual(innerWidth)
    })
  }
}

test('the mini simulator answers sector, size and pace without an email', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto(URL, { waitUntil: 'networkidle' })
  // From here on, playing must not call any API (the page's own form guard has loaded by now).
  const requests: string[] = []
  page.on('request', (r) => {
    if (r.url().includes('/api/')) requests.push(r.url())
  })
  await expect(page.getByRole('heading', { level: 1 })).toContainText(SIM_HERO.title.accent)

  const box = sandbox(page)
  const start = await capacity(page).textContent()
  expect(start).toMatch(/ to /)

  // Size: the slider moves every range.
  const slider = box.getByRole('slider', { name: SIM_MINI.peopleLabel })
  await slider.focus()
  await page.keyboard.press('End')
  await expect(capacity(page)).not.toHaveText(start!)
  const big = await capacity(page).textContent()

  // Pace and sector move it again.
  await box.getByRole('button', { name: SIM_PACES.cautious.label, exact: true }).click()
  await expect(box.getByRole('button', { name: SIM_PACES.cautious.label, exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(box.getByText(SIM_MINI.paceHint.cautious)).toBeVisible()
  await expect(capacity(page)).not.toHaveText(big!)
  const cautious = await capacity(page).textContent()
  await box.getByRole('button', { name: SIM_SECTOR_LABELS.software, exact: true }).click()
  await expect(capacity(page)).not.toHaveText(cautious!)

  // Every output prints as a range.
  for (const text of await box.locator('.sr-only').allTextContents()) expect(text).toMatch(/ to /)

  // Reset returns to the sample insurer.
  await box.getByRole('button', { name: SIM_MINI.reset }).click()
  await expect(capacity(page)).toHaveText(start!)

  // No email field in the sandbox and no request to any API while playing.
  await expect(box.locator('input[type="email"]')).toHaveCount(0)
  expect(requests).toEqual([])
  expect(errors).toEqual([])
})

test('"Run it on your company" carries the sandbox into the form as editable defaults', async ({ page }) => {
  await page.goto(URL)
  const box = sandbox(page)
  const slider = box.getByRole('slider', { name: SIM_MINI.peopleLabel })
  await slider.focus()
  await page.keyboard.press('Home')
  await page.getByRole('button', { name: SIM_HERO.ctaPrimary }).first().click()
  await expect(page.getByLabel(SIM_STEPS.company.emailLabel)).toBeFocused()
  await expect(page.getByLabel(SIM_STEPS.company.peopleLabel)).toHaveValue('20')
})

test('the scroll run hands its scenario back to the sandbox', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(URL)
  await page.getByRole('button', { name: SIM_HERO.ctaSecondary }).click()
  const cautiousStep = page.getByText(SIM_WALKTHROUGH.steps[3].caption)
  await cautiousStep.scrollIntoViewIfNeeded()
  await expect(page.getByText(SIM_WALKTHROUGH.presetLabel(4))).toBeVisible()
  await page.getByRole('button', { name: SIM_WALKTHROUGH.takeOver }).click()
  await expect(sandbox(page).getByRole('button', { name: SIM_PACES.cautious.label, exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(sandbox(page)).toBeInViewport()
})

test('an untouched sandbox leaves the lead form empty and the size still required', async ({ page }) => {
  await page.goto(URL)
  await page.getByRole('button', { name: SIM_HERO.ctaPrimary }).first().click()
  await expect(page.getByLabel(SIM_STEPS.company.emailLabel)).toBeFocused()
  await expect(page.getByLabel(SIM_STEPS.company.peopleLabel)).toHaveValue('')
  await page.getByLabel(SIM_STEPS.company.emailLabel).fill('someone@example.com')
  await page.getByRole('button', { name: SIM_STEPS.company.skip }).click()
  await expect(page.getByText(SIM_STEPS.company.errors.people)).toBeVisible()
})

test('the sticky bar leaves when the visitor jumps back to the top (390px, Home)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(URL)
  const bar = page.locator('div.fixed.bottom-0').getByRole('button', { name: STICKY_CTA_CONTENT.primary })
  await page.locator('#why-it-stalls').scrollIntoViewIfNeeded()
  await expect(bar).toBeVisible()
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.keyboard.press('Home')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await expect(bar).toHaveCount(0)
})

test('the pinned run panel keeps "Try it yourself" on screen and uncovered at 1280x720', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto(URL)
  for (const step of [SIM_WALKTHROUGH.steps[1], SIM_WALKTHROUGH.steps[2], SIM_WALKTHROUGH.steps[5]]) {
    await page.getByText(step.caption).evaluate((el) => el.scrollIntoView({ block: 'center' }))
    const button = page.getByRole('button', { name: SIM_WALKTHROUGH.takeOver })
    await expect(button).toBeInViewport({ ratio: 1 })
    await page.waitForTimeout(500) // let the sticky bar finish sliding in
    const hit = await button.evaluate((el) => {
      const r = el.getBoundingClientRect()
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return !!top && (el === top || el.contains(top))
    })
    expect(hit, `"${SIM_WALKTHROUGH.takeOver}" is covered at "${step.id}"`).toBe(true)
  }
})
