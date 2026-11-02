import { expect, test, type Page } from '@playwright/test'

// The landing kit gallery is the reference for the offer pages: it must never scroll sideways,
// and no ProofMetric may render narrower than 160px or clip its figure.

const WIDTHS = [390, 1024, 1280, 1440] as const

/** Walk the page so every in-view effect (callouts, pinned sections, mode switches) has fired. */
async function walk(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y)
    await page.waitForTimeout(60)
  }
  await page.waitForTimeout(800)
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of WIDTHS) {
    test(`no horizontal scroll at ${width}px, ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`/prism/landing-kit${theme === 'dark' ? '?theme=dark' : ''}`)
      await walk(page)
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }))
      expect(scrollWidth, `document is ${scrollWidth}px wide in a ${innerWidth}px viewport`).toBeLessThanOrEqual(innerWidth)
    })
  }
}

for (const width of [390, 1440] as const) {
  test(`every ProofMetric cell is at least 160px with its figure unclipped at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/prism/landing-kit')
    await walk(page)
    // Layout widths (offsetWidth), so a cell inside a scaled preview is measured at its design size.
    const cells = await page.locator('[data-proof-metric]').evaluateAll((els) =>
      els.map((el) => {
        const figure = el.querySelector<HTMLElement>('[data-proof-figure]')!
        return { width: (el as HTMLElement).offsetWidth, scroll: figure.scrollWidth, client: figure.clientWidth, text: figure.textContent }
      }),
    )
    expect(cells.length).toBeGreaterThan(0)
    for (const c of cells) {
      expect(c.width, `cell for "${c.text}"`).toBeGreaterThanOrEqual(160)
      expect(c.scroll, `figure "${c.text}" is clipped`).toBeLessThanOrEqual(c.client)
    }
  })
}
