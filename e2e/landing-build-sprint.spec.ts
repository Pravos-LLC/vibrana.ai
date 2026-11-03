import { expect, test, type Page } from '@playwright/test'
import { SPRINT_DAYS, SPRINT_HERO_REEL, SPRINT_PROBLEM, SPRINT_WORK } from '../src/ai-build-sprint-content'

// The Build Sprint page (Workshop Log rebuild): no sideways scroll at any width, the hero reel and
// the problem sequence render, the build log carries all ten days, metrics never squish, and the
// case-study toggle shows one product at a time.

async function setTheme(page: Page, theme: 'light' | 'dark') {
  if (theme === 'dark') await page.context().addCookies([{ name: 'vibrana-theme', value: 'dark', url: 'http://localhost' }])
}

/** Scroll the whole page so every scroll-linked state has run once. */
async function walk(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < height; y += 900) await page.evaluate((v) => window.scrollTo(0, v), y)
  await page.waitForTimeout(300)
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of [390, 1024, 1280, 1440]) {
    test(`${theme} ${width}px: no horizontal scroll`, async ({ page }) => {
      test.setTimeout(60_000)
      await setTheme(page, theme)
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/ai-build-sprint')
      await walk(page)
      const { scroll, inner } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }))
      expect(scroll).toBeLessThanOrEqual(inner)
    })
  }
}

test('the hero reel renders beside the headline, poster first and no video bytes before it is seen', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/ai-build-sprint')
  await expect(page.locator('h1')).toContainText('with your team in 10 days.')
  const stage = page.getByRole('region', { name: SPRINT_HERO_REEL.title })
  await expect(stage).toBeVisible()
  const video = stage.locator('video')
  await expect(video).toHaveAttribute('poster', /factory-reel-loop-poster\.[0-9a-f]{8}\.webp$/)
  await expect(video).toHaveAttribute('preload', 'none')
  await expect(video.locator('source[type="video/mp4"]')).toHaveAttribute('src', /factory-reel-loop\./)
  await expect(stage.getByText(SPRINT_HERO_REEL.caption)).toBeVisible()
  // No placeholder disc, no collage: the hero holds no <img> at all.
  await expect(page.locator('#sprint-hero img')).toHaveCount(0)
})

test('asking for sound swaps the hero loop for the full cut', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/ai-build-sprint')
  const stage = page.getByRole('region', { name: SPRINT_HERO_REEL.title })
  await stage.getByRole('button', { name: 'Sound' }).click()
  await expect(stage.locator('video source[type="video/mp4"]')).toHaveAttribute('src', /factory-reel-full\./)
})

test('the problem sequence renders its three lines, the close and a screen-reader summary', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/ai-build-sprint')
  const section = page.getByTestId('sprint-problem')
  await expect(section.getByRole('heading', { name: SPRINT_PROBLEM.heading })).toBeVisible()
  for (const line of SPRINT_PROBLEM.lines) await expect(section.getByText(line, { exact: true })).toHaveCount(1)
  await expect(section.getByText(SPRINT_PROBLEM.close, { exact: true })).toHaveCount(1)
  await expect(section.getByText(SPRINT_PROBLEM.ariaSummary)).toHaveCount(1)
  // Scroll to the start of the pinned sequence: the first scene and its caption show; at the end, the close's.
  const top = await section.locator('section').evaluate((el) => el.getBoundingClientRect().top + window.scrollY)
  const height = await section.locator('section').evaluate((el) => el.getBoundingClientRect().height)
  await page.evaluate((y) => window.scrollTo(0, y), top + 20)
  await expect(section.getByText(SPRINT_PROBLEM.visualCaptions[0]).first()).toBeVisible()
  await page.evaluate((y) => window.scrollTo(0, y), top + height - 900)
  await expect(section.getByText(SPRINT_PROBLEM.closeCaption).first()).toBeVisible()
})

test('the build log holds all ten days, the shipped stamp and the D+30 line', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/ai-build-sprint')
  const log = page.getByTestId('sprint-timeline')
  await expect(log).toHaveAttribute('data-mode', 'static')
  for (const line of SPRINT_DAYS.log) await expect(log.getByText(line.text, { exact: true })).toBeVisible()
  await expect(log.getByText(SPRINT_DAYS.shippedStamp, { exact: true })).toBeVisible()
  await expect(log.getByText(SPRINT_DAYS.afterLine.text)).toBeVisible()
})

for (const width of [390, 1440]) {
  test(`${width}px: metrics never squish and the toggle shows one product at a time`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/ai-build-sprint')
    const [first, second] = SPRINT_WORK.cards
    await expect(page.getByTestId(`sprint-work-${first.id}`)).toBeVisible()
    await expect(page.getByTestId(`sprint-work-${second.id}`)).toHaveCount(0)
    await page.getByRole('tab', { name: second.option }).click()
    await expect(page.getByTestId(`sprint-work-${second.id}`)).toBeVisible()
    await expect(page.getByTestId(`sprint-work-${first.id}`)).toHaveCount(0)
    const cells = page.locator('[data-proof-metric]')
    await expect(cells.first()).toBeVisible()
    for (const cell of await cells.all()) {
      const { width: w, clipped } = await cell.evaluate((el) => {
        const fig = el.querySelector('[data-proof-figure]') as HTMLElement
        return { width: el.getBoundingClientRect().width, clipped: fig.scrollWidth > fig.clientWidth + 1 }
      })
      expect(w).toBeGreaterThanOrEqual(160)
      expect(clipped).toBe(false)
    }
    // The product frame never scrolls sideways on a phone: it reflows to its phone crop.
    const frame = page.getByTestId(`sprint-work-${second.id}`).locator('figure').first()
    const overflow = await frame.evaluate((el) => el.scrollWidth - el.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
}

test('the fit-call anchor and the sticky bar still work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/ai-build-sprint')
  await page.locator('#sprint-hero').getByRole('link', { name: 'Book a 30-min call' }).click()
  await expect(page).toHaveURL(/#fit-call$/)
  await expect(page.locator('#fit-call')).toBeInViewport()
})
