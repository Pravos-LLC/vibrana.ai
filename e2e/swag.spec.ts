import { expect, test } from '@playwright/test'
import { STICKER_THEMES } from '@/src/swag-content'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { SWAG_STICKER_DOWNLOAD } from '@/src/swag-content'
import { collectErrors } from './support'

// Regression test for the sticker-pack download button: it must never be a
// next/link (the router prefetches whatever it's pointed at, including a
// 20MB zip, the moment the link enters the viewport) and clicking it must be
// a real, single browser download rather than a client-side navigation.

test('the /swag hero never requests the sticker pack zip on load', async ({ page }) => {
  const errors = collectErrors(page)
  const zipRequests: string[] = []
  page.on('request', (req) => {
    if (req.url().includes(SWAG_STICKER_DOWNLOAD.href)) zipRequests.push(req.url())
  })

  await page.goto('/swag')
  await expect(page.locator('h1').first()).toBeVisible()
  await page.waitForLoadState('networkidle')

  expect(zipRequests, 'requests for the sticker pack zip before any click').toEqual([])
  expect(errors).toEqual([])
})

test('clicking "Download the full pack" downloads the zip exactly once', async ({ page }) => {
  await page.goto('/swag')

  const link = page.getByRole('link', { name: SWAG_STICKER_DOWNLOAD.label })
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', SWAG_STICKER_DOWNLOAD.href)
  await expect(link).toHaveAttribute('download', '')

  // A native `<a download>` click is intercepted by the browser's download
  // manager below Playwright's request/response instrumentation (it never
  // shows up on page.on('request')), so `download` firing exactly once, with
  // the right URL, is the reliable signal that this is a real single browser
  // download rather than a client-side route navigation.
  const [download] = await Promise.all([page.waitForEvent('download'), link.click()])

  expect(download.url()).toBe(new URL(SWAG_STICKER_DOWNLOAD.href, page.url()).toString())
  expect(download.suggestedFilename()).toBe('vibrana-sticker-pack.zip')
})

// Verify rendered sources and payload rather than accepting an error-page download.
test('the demo ZIP contains the exact approved sticker previews', async ({ request, page }) => {
  await page.goto('/swag')
  for (const sticker of STICKER_THEMES.flatMap((theme) => theme.stickers)) {
    const image = page.getByRole('img', { name: sticker.title, exact: true })
    await expect(image).toBeVisible()
    expect(decodeURIComponent((await image.getAttribute('src')) ?? '')).toContain('/assets/swag/stickers/' + sticker.slug + '.webp')
  }
  const response = await request.get(SWAG_STICKER_DOWNLOAD.href)
  expect(response.status()).toBe(200)
  const bytes = await response.body()
  const expected = await readFile(path.join(process.cwd(), 'public', SWAG_STICKER_DOWNLOAD.href))
  expect(bytes.equals(expected)).toBe(true)
  expect(bytes.subarray(0, 4).toString('hex')).toBe('504b0304')
})
