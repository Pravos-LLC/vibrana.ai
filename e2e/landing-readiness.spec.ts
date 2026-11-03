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

/** Rendered width of the sheet and the smallest rendered text on the beat in view. */
async function measureSheet(page: Page) {
  return page.locator(PREVIEW).evaluate((fig) => {
    const layer = fig.querySelector<HTMLElement>('.origin-top-left')!
    const scale = layer.getBoundingClientRect().width / layer.offsetWidth
    let smallest = Infinity
    let smallestText = ''
    for (const el of Array.from(layer.querySelectorAll<HTMLElement>('*'))) {
      const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim())
      if (!own) continue
      const size = parseFloat(getComputedStyle(el).fontSize) * scale
      if (size < smallest) {
        smallest = size
        smallestText = el.textContent!.trim().slice(0, 40)
      }
    }
    return { sheetWidth: layer.getBoundingClientRect().width, smallest, smallestText }
  })
}

// The sheet must be legible where it sits beside the headline: 440px or more at 1280, 500px or
// more from 1440, and no text on any beat rendered under 11px.
for (const [width, minSheet] of [[1280, 440], [1440, 500]] as const) {
  test(`the report preview is legible and steps through its beats at ${width}px`, async ({ page }) => {
    await open(page, width, 'light')
    const preview = page.locator(PREVIEW)
    await expect(preview).toHaveAttribute('data-dp-mode', 'scaled')
    // Stop auto-advance first, so each check reads the beat it asked for.
    await preview.getByRole('button', { name: 'Pause the preview' }).click()
    for (const [beat, text] of [['Cover', 'Sample Company'], ['Score', 'Overall score'], ['Findings', 'Your two lowest areas']] as const) {
      await preview.getByRole('button', { name: new RegExp(beat) }).click()
      await expect(preview.getByText(text, { exact: true })).toBeVisible()
      await page.waitForTimeout(450)
      const m = await measureSheet(page)
      expect(m.sheetWidth, `sheet width at ${width}px`).toBeGreaterThanOrEqual(minSheet)
      expect(m.smallest, `smallest text on ${beat}: "${m.smallestText}"`).toBeGreaterThanOrEqual(11)
    }
    // Research on the sheet links to its source.
    await expect(preview.locator('a[href^="https://"]').first()).toBeVisible()
  })
}

test('between 1024 and 1279px the sheet sits under the headline at full size, not stacked', async ({ page }) => {
  await open(page, 1024, 'light')
  const preview = page.locator(PREVIEW)
  await expect(preview).toHaveAttribute('data-dp-mode', 'scaled')
  const box = await preview.boundingBox()
  expect(box!.height, 'one sheet, not three stacked').toBeLessThan(1100)
})

test('the assessment loop has a visible pause control', async ({ page }) => {
  await open(page, 1440, 'light')
  await expect(page.getByRole('button', { name: /^(Pause|Play) the loop$/ }).filter({ visible: true })).toHaveCount(1)
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
