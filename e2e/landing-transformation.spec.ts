import { expect, test, type Page } from '@playwright/test'

// /ai-transformation (Editorial Field Report): never scrolls sideways, renders its eight chapters and
// four gate cards, and the operating map draws and signs all four gates once read.

const PATH = '/ai-transformation'
const WIDTHS = [390, 768, 1024, 1280, 1440] as const
const CHAPTERS = ['problem', 'map', 'build', 'learn', 'transfer', 'proof', 'safeguards', 'start'] as const

/**
 * Walk a range of the page in one evaluate (one round trip, not one per step), so scroll-driven state
 * (the pinned map, gate ticks, in-view effects) fires without the cost of dozens of CDP calls on a
 * slow runner. Stride is 80% of the viewport; each step yields two frames.
 */
async function walk(page: Page, selector?: string) {
  await page.evaluate(async (sel) => {
    const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    const el = sel ? document.querySelector<HTMLElement>(sel) : null
    const from = el ? Math.max(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight) : 0
    const to = el ? el.getBoundingClientRect().bottom + window.scrollY : document.documentElement.scrollHeight
    const stride = Math.round(window.innerHeight * 0.8)
    for (let y = from; y <= to; y += stride) {
      window.scrollTo(0, y)
      await frame()
    }
    window.scrollTo(0, to)
    await frame()
  }, selector ?? null)
  await page.waitForTimeout(500)
}

async function setTheme(page: Page, theme: 'light' | 'dark', baseURL: string | undefined) {
  if (theme === 'dark') await page.context().addCookies([{ name: 'vibrana-theme', value: 'dark', url: baseURL! }])
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of WIDTHS) {
    test(`ai-transformation: no horizontal scroll at ${width}px, ${theme}`, async ({ page, baseURL }) => {
      await setTheme(page, theme, baseURL)
      await page.setViewportSize({ width, height: 900 })
      await page.goto(PATH)
      // scrollWidth does not depend on reveals, so no walk: the layout is final at load.
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }))
      expect(scrollWidth, `document is ${scrollWidth}px wide in a ${innerWidth}px viewport`).toBeLessThanOrEqual(innerWidth)
    })
  }
}

for (const width of [390, 1440] as const) {
  test(`ai-transformation: eight chapters, four gates, the map summary at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(PATH)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('You sign every gate.')

    for (const id of CHAPTERS) await expect(page.locator(`section#${id}`)).toHaveCount(1)
    const rail = page.getByRole('navigation', { name: 'Chapters' }).filter({ visible: true })
    await expect(rail).toHaveCount(1)

    // Four GateCards, one per phase chapter, each signed off by the owners named in the SOW.
    for (const [i, id] of ['map', 'build', 'learn', 'transfer'].entries()) {
      const chapter = page.locator(`section#${id}`)
      await expect(chapter.getByText(`Gate 0${i + 1}`, { exact: true })).toBeVisible()
      await expect(chapter.getByText('the owners named in your SOW')).toBeVisible()
      await expect(chapter.getByText('Yours from here')).toBeVisible()
    }

    await expect(page.locator('#operating-map-summary')).toHaveText(/Each phase ends at a gate you sign/)
    await expect(page.getByText('Quoted between $120,000 and $250,000')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Take the AI Readiness Assessment' })).toHaveAttribute('href', '/ai-readiness')
    await expect(page.getByRole('link', { name: 'Discuss a Transformation' })).toHaveAttribute('href', '#discuss')
  })
}

test('ai-transformation: the operating map signs all four gates once scrolled through', async ({ page }) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(PATH)
  await walk(page, '[data-operating-map]')
  // Every gate node in the wide map shows its check (drawn only once the gate is signed).
  const checks = await page
    .locator('[data-operating-map] ol.md\\:grid path')
    .evaluateAll((paths) => paths.map((p) => Number(getComputedStyle(p).opacity)))
  expect(checks).toEqual([1, 1, 1, 1])
})

test('ai-transformation: the ProofMetric cells never squish', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto(PATH)
  const cells = await page.locator('[data-proof-metric]').evaluateAll((els) =>
    els.map((el) => {
      const figure = el.querySelector<HTMLElement>('[data-proof-figure]')!
      return { width: (el as HTMLElement).offsetWidth, scroll: figure.scrollWidth, client: figure.clientWidth, text: figure.textContent }
    }),
  )
  expect(cells).toHaveLength(3)
  for (const c of cells) {
    expect(c.width, `cell for "${c.text}"`).toBeGreaterThanOrEqual(160)
    expect(c.scroll, `figure "${c.text}" is clipped`).toBeLessThanOrEqual(c.client)
  }
})
