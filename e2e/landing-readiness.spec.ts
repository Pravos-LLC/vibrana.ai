import { expect, test, type Page } from '@playwright/test'

// /ai-readiness (Editorial Field Report, Readiness variant): never scrolls sideways, the sample
// report renders in both modes (scaled beats on wide screens, stacked sheets on phones), and no
// ProofMetric renders under 160px or clips its figure.

const WIDTHS = [390, 1024, 1280, 1440] as const
const PREVIEW = 'figure[aria-label^="A sample AI readiness report"]'

// The page is long (eight chapters); walking it takes longer than the default under parallel workers.
test.describe.configure({ timeout: 90_000 })

/** Walk the page so every in-view effect (preview, rail, reveals) has fired. */
async function walk(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((top) => window.scrollTo(0, top), y)
    await page.waitForTimeout(60)
  }
  await page.waitForTimeout(800)
}

async function open(page: Page, width: number, theme: 'light' | 'dark') {
  await page.setViewportSize({ width, height: 900 })
  await page.goto('/ai-readiness')
  if (theme === 'dark') {
    // The theme lives in a cookie the layout reads before paint, as the site's toggle sets it.
    await page.context().addCookies([{ name: 'vibrana-theme', value: 'dark', url: page.url() }])
    await page.reload()
  }
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of WIDTHS) {
    test(`no horizontal scroll at ${width}px, ${theme}`, async ({ page }) => {
      await open(page, width, theme)
      if (theme === 'dark') await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
      await walk(page)
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }))
      expect(scrollWidth, `document is ${scrollWidth}px wide in a ${innerWidth}px viewport`).toBeLessThanOrEqual(innerWidth)
    })
  }
}

test('the report preview steps through cover, score and findings at 1440px', async ({ page }) => {
  await open(page, 1440, 'light')
  const preview = page.locator(PREVIEW)
  await expect(preview).toBeVisible()
  await expect(preview).toHaveAttribute('data-dp-mode', 'scaled')
  await expect(preview.getByText('Sample Company')).toBeVisible()
  await preview.getByRole('button', { name: /Score/ }).click()
  await expect(preview.getByText('Overall score', { exact: true })).toBeVisible()
  // The real assessment radar loads into the score page.
  await expect(preview.locator('.recharts-polar-grid').first()).toBeVisible()
  await preview.getByRole('button', { name: /Findings/ }).click()
  await expect(preview.getByText('Your two lowest areas', { exact: true })).toBeVisible()
  await expect(preview.getByText('Talent & Capability').first()).toBeVisible()
})

test('the report preview stacks its three pages at reading size at 390px', async ({ page }) => {
  await open(page, 390, 'light')
  const preview = page.locator(PREVIEW)
  await expect(preview).toHaveAttribute('data-dp-mode', 'stacked')
  await expect(preview.locator(':scope > ol > li')).toHaveCount(3)
  for (const text of ['Sample Company', 'Overall score', 'Your two lowest areas']) {
    await expect(preview.getByText(text, { exact: true }).first()).toBeAttached()
  }
})

test('the hero keeps both calls to action with their links', async ({ page }) => {
  await open(page, 1440, 'light')
  await expect(page.getByRole('link', { name: 'Take the assessment' }).first()).toHaveAttribute('href', '/ai-transformation/assessment')
  await expect(page.getByRole('link', { name: /Book a 30-min call/ }).nth(1)).toHaveAttribute('href', /calendar\.app\.google/)
})

for (const width of [390, 1440] as const) {
  test(`every ProofMetric cell is at least 160px with its figure unclipped at ${width}px`, async ({ page }) => {
    await open(page, width, 'light')
    await walk(page)
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
