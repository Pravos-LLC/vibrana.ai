import { expect, test, type Page } from '@playwright/test'
import { EU_HERO, EU_REPORT_PREVIEW, EU_TIMELINE } from '../src/eu-ai-act-readiness-content'

// /eu-ai-act-readiness (Regulatory Instrument): never scrolls sideways, and the three things the
// hero promises render: the countdown to the next date in the Act (named from the timeline data),
// the sample report preview, and the approved explainer reel.

const URL = '/eu-ai-act-readiness'
const WIDTHS = [390, 1024, 1280, 1440] as const

// The page is long (the report, the method stops); walking it takes longer than the default.
test.describe.configure({ timeout: 120_000 })

/** Walk the page so every in-view effect (callouts, bars, slabs, sticky panels) has fired. */
async function walk(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((top) => window.scrollTo(0, top), y)
    await page.waitForTimeout(50)
  }
  await page.waitForTimeout(800)
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of WIDTHS) {
    test(`no horizontal scroll at ${width}px, ${theme}`, async ({ page, context, baseURL }) => {
      if (theme === 'dark') await context.addCookies([{ name: 'vibrana-theme', value: 'dark', url: baseURL! }])
      await page.setViewportSize({ width, height: 900 })
      await page.goto(URL)
      await walk(page)
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }))
      expect(scrollWidth, `document is ${scrollWidth}px wide in a ${innerWidth}px viewport`).toBeLessThanOrEqual(innerWidth)
    })
  }
}

for (const width of [390, 1440] as const) {
  test(`countdown, report preview and reel render at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(URL)

    // Countdown: the milestone comes from the timeline data, the day count from the browser's date.
    const today = await page.evaluate(() => new Date().toISOString().slice(0, 10))
    const next = EU_TIMELINE.milestones.find((m) => m.date > today)
    const countdown = page.locator('[data-countdown]')
    await expect(countdown).toBeVisible()
    if (next) {
      await expect(countdown.locator('[data-countdown-milestone]')).toHaveText(EU_HERO.panel.nextTitle(next))
      const days = Math.ceil((Date.parse(next.date) - Date.parse(today)) / 86_400_000)
      await expect(countdown.locator('[data-countdown-days]')).toHaveText(`${days} ${EU_HERO.panel.daysLabel}`)
    }

    // The sample report: the kit's preview, with the readiness gauge from the real component.
    const report = page.getByRole('figure', { name: EU_REPORT_PREVIEW.ariaSummary })
    await expect(report).toBeVisible()
    await expect(report.getByRole('figure', { name: /Readiness score: \d+ out of 100/ })).toBeVisible()
    await expect(page.getByText(EU_REPORT_PREVIEW.sampleNote)).toBeVisible()

    // The reel: a stage with its video, poster and the caption from the deck.
    const reel = page.getByRole('region', { name: EU_HERO.reel.title })
    await reel.scrollIntoViewIfNeeded()
    await expect(reel).toBeVisible()
    const video = reel.locator('video')
    await expect(video).toHaveAttribute('poster', /\/assets\/landing\/eu-ai-act\//)
    expect(await video.locator('source').count()).toBeGreaterThan(0)
    await expect(reel.getByText(EU_HERO.reel.caption)).toBeVisible()
  })
}
