import { expect, test, type Page } from '@playwright/test'
import { SPRINT_DAYS, SPRINT_HERO_REEL, SPRINT_PROBLEM, SPRINT_SECONDARY_CTA, SPRINT_WORK } from '../src/ai-build-sprint-content'

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
  await expect(video).toHaveAttribute('poster', /build-sprint-film-loop-poster\.[0-9a-f]{8}\.webp$/)
  await expect(video).toHaveAttribute('preload', 'none')
  await expect(video.locator('source[type="video/mp4"]')).toHaveAttribute('src', /build-sprint-film-loop\./)
  // No placeholder disc, no collage: the hero holds no <img> at all.
  await expect(page.locator('#sprint-hero img')).toHaveCount(0)
})

test('asking for sound swaps the hero loop for the full cut', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/ai-build-sprint')
  const stage = page.getByRole('region', { name: SPRINT_HERO_REEL.title })
  await stage.getByRole('button', { name: 'Sound' }).click()
  await expect(stage.locator('video source[type="video/mp4"]')).toHaveAttribute('src', /build-sprint-film-full\./)
})

test('clicking the hero picture plays the full cut with sound on the first click', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/ai-build-sprint')
  const stage = page.getByRole('region', { name: SPRINT_HERO_REEL.title })
  const video = stage.locator('video')
  await expect(video).toHaveCount(1)
  const box = (await video.boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.4)
  // Still the one element: the sources swapped in place, so the click's own handler reached it.
  await expect(video).toHaveCount(1)
  await expect(video.locator('source[type="video/mp4"]')).toHaveAttribute('src', /build-sprint-film-full\./)
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentSrc), { timeout: 10_000 }).toMatch(/build-sprint-film-full\./)
  const start = await video.evaluate((v: HTMLVideoElement) => v.currentTime)
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 10_000 }).toBeGreaterThan(start + 0.5)
  expect(await video.evaluate((v: HTMLVideoElement) => ({ muted: v.muted, paused: v.paused }))).toEqual({ muted: false, paused: false })
  await expect(stage.getByText(/^Playing/)).toBeVisible()
})

for (const width of [1024, 1280, 1440]) {
  test(`${width}px: every proof-row mark fits inside its cell`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/ai-build-sprint')
    const overflows = await page.getByTestId('sprint-logo-strip').evaluate((ul) =>
      [...ul.children].flatMap((li) => {
        const cell = li.getBoundingClientRect()
        return [...li.children]
          .map((child) => child.getBoundingClientRect())
          .filter((r) => r.left < cell.left - 0.5 || r.right > cell.right + 0.5)
          .map((r) => `${li.textContent || li.querySelector('img')?.getAttribute('alt')}: ${r.width.toFixed(0)}px in ${cell.width.toFixed(0)}px`)
      }),
    )
    expect(overflows).toEqual([])
  })
}

test('both case studies are in the server HTML, not only the active tab', async ({ request }) => {
  const html = await (await request.get('/ai-build-sprint')).text()
  for (const card of SPRINT_WORK.cards) {
    expect(html).toContain(card.metricLabel)
    expect(html).toContain(card.body)
  }
})

test('the sprint timeline jumps to any day: Day 10 is one click', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/ai-build-sprint')
  const log = page.getByTestId('sprint-timeline')
  await expect(log).toBeVisible()
  const days = log.getByRole('group', { name: SPRINT_DAYS.railAria }).getByRole('button')
  await expect(days).toHaveCount(SPRINT_DAYS.log.length)
  await days.last().click()
  await expect(days.last()).toHaveAttribute('aria-pressed', 'true')
  const last = SPRINT_DAYS.steps[SPRINT_DAYS.steps.length - 1]
  await expect(log.getByRole('button', { name: new RegExp(last.title) })).toHaveAttribute('aria-current', 'true')
  await expect(log.getByText(SPRINT_DAYS.log[9].text).first()).toBeVisible()
  // Every day's line is in the HTML for crawlers and screen readers.
  for (const line of SPRINT_DAYS.log) await expect(log.getByText(line.text, { exact: false })).not.toHaveCount(0)
})

test('the problem section renders its heading, three lines, the close and a screen-reader summary', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/ai-build-sprint')
  const section = page.getByTestId('sprint-problem')
  await expect(section.getByRole('heading', { name: SPRINT_PROBLEM.heading })).toBeAttached()
  for (const line of SPRINT_PROBLEM.lines) await expect(section.getByText(line, { exact: true })).toHaveCount(1)
  await expect(section.getByText(SPRINT_PROBLEM.close, { exact: true })).toHaveCount(1)
  await expect(section.getByText(SPRINT_PROBLEM.ariaSummary)).toHaveCount(1)
})

test('the secondary CTA "Build your sprint brief" sits beside the primary in the hero', async ({ page }) => {
  await page.goto('/ai-build-sprint')
  const hero = page.locator('#sprint-hero')
  await expect(hero.getByRole('link', { name: 'Book a 30-min call' })).toBeVisible()
  await expect(hero.getByRole('link', { name: SPRINT_SECONDARY_CTA.label })).toHaveAttribute('href', SPRINT_SECONDARY_CTA.href)
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
