import { expect, test } from '@playwright/test'
import { collectErrors, publicStaticRoutes } from './support'

const routes = publicStaticRoutes()

test('route discovery finds the core pages', () => {
  for (const r of ['/', '/about', '/ai-transformation', '/ai-build-sprint', '/contact', '/learn']) {
    expect(routes).toContain(r)
  }
})

for (const route of routes) {
  test(`renders ${route}`, async ({ page }) => {
    const errors = collectErrors(page)
    const response = await page.goto(route)
    expect(response?.status(), `HTTP status for ${route}`).toBe(200)
    await expect(page.locator('h1').first()).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(errors, `console/page errors on ${route}`).toEqual([])
  })
}

test('every case study renders', async ({ page, request }) => {
  await page.goto('/case-studies')
  const hrefs = await page
    .locator('a[href^="/case-studies/"]')
    .evaluateAll((as) => [...new Set(as.map((a) => (a as HTMLAnchorElement).pathname))])
  const studies = hrefs.filter((h) => h.split('/').filter(Boolean).length === 2 && !h.includes('/previews/'))
  expect(studies.length, 'case studies linked from /case-studies').toBeGreaterThan(0)

  for (const href of studies) {
    const res = await request.get(href)
    expect(res.status(), href).toBe(200)
  }
  await page.goto(studies[0])
  await expect(page.locator('h1').first()).toBeVisible()
})

test('homepage header and footer links resolve', async ({ page, request }) => {
  await page.goto('/')
  const hrefs = await page
    .locator('header a[href^="/"], nav a[href^="/"], footer a[href^="/"]')
    .evaluateAll((as) => [...new Set(as.map((a) => (a as HTMLAnchorElement).pathname))])
  expect(hrefs.length).toBeGreaterThan(0)

  const broken: string[] = []
  for (const href of hrefs) {
    const res = await request.get(href, { maxRedirects: 5 })
    if (res.status() >= 400) broken.push(`${href} → ${res.status()}`)
  }
  expect(broken).toEqual([])
})

test('unknown routes return 404', async ({ request }) => {
  const res = await request.get('/this-page-does-not-exist-e2e')
  expect(res.status()).toBe(404)
})
